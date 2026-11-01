// Gera artigo/artigo_ordenacao.docx a partir de artigo/dados_artigo.json (rode antes scripts/gerar_artigo_dados.py).
// Formatação pedida no trabalho: Times New Roman 12, títulos em negrito; seções Título, Resumo, Introdução,
// Material e Métodos, Resultados e Discussão e Conclusão; tabelas e figuras legendadas e discutidas.
// Uso (na pasta do projeto): node scripts/gerar_artigo.js      (requer: npm install docx)
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun, Footer, PageNumber,
  AlignmentType, WidthType, BorderStyle, LevelFormat, VerticalAlign, HeadingLevel, LineRuleType,
} = require("docx");

const RAIZ = path.join(__dirname, "..");
const ART = path.join(RAIZ, "artigo");
const D = JSON.parse(fs.readFileSync(path.join(ART, "dados_artigo.json"), "utf8"));

// ---------------------------------------------------------------- grupo
const AUTORES = ["Jeferson Gomes Martins", "João Vitor Gonçalves de Almeida", "Juan Flor", "Igor Jesus", "Guilherme Silva"];
const TITULO = "Análise comparativa de desempenho entre os algoritmos de ordenação Mergesort bottom-up e Quicksort clássico";

// ---------------------------------------------------------------- números
const NS = D.tamanhos;
const E = (a, n) => D.estatistica[`${a}:${n}`];
const M = (n) => E("mergesort", n);
const Q = (n) => E("quicksort", n);
const mil = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
function br(v, casas) {
  if (casas === undefined) casas = v === 0 ? 2 : Math.max(2, 2 - Math.floor(Math.log10(Math.abs(v))));
  return v.toFixed(casas).replace(".", ",");
}
const pct = (v) => br(v, 1).replace(",0", "") + "%";
const difQ = (n) => ((M(n).media - Q(n).media) / M(n).media) * 100;            // > 0: Quick mais rápido
const difMd = (n) => ((M(n).mediana - Q(n).mediana) / M(n).mediana) * 100;
const sobrepoe = (n) => !(M(n).q1 > Q(n).q3 || Q(n).q1 > M(n).q3);          // caixas do boxplot se sobrepõem
const razao = (a, i) => E(a, NS[i]).media / E(a, NS[i - 1]).media;
const nlogn = (n) => n * Math.log2(n);
const prev = (i) => nlogn(NS[i]) / nlogn(NS[i - 1]);
const razoes = [];
for (let i = 1; i < NS.length; i++) razoes.push(razao("mergesort", i), razao("quicksort", i));
const rMin = Math.min(...razoes), rMax = Math.max(...razoes);
const C = D.cenarios;
const cenDif = (c) => ((C[c].mergesort.media - C[c].quicksort.media) / C[c].mergesort.media) * 100;

// O texto da discussão foi escrito para este padrão de resultados. Se os dados mudarem de padrão,
// o script para aqui em vez de gerar um texto que contradiz as tabelas.
const padrao = [30, 300, 3000].every((n) => sobrepoe(n)) && difQ(30000) > 3 && !sobrepoe(30000) && difQ(300000) > 3 &&
  difMd(300000) > 3 && ["ordenado", "inverso", "repetidos", "aleatorio"].every((c) => C[c] && cenDif(c) > 0);
if (!padrao) throw new Error("Os resultados mudaram de padrão: revise o texto de Resultados e Discussão antes de gerar.");
const pequenosDif = [30, 300, 3000].map((n) => Math.abs(difQ(n)));

// ---------------------------------------------------------------- helpers de texto
const FONTE = "Times New Roman";
const TAM = 24; // 12 pt
const LARG = 9071; // largura útil A4 com margens 3/2 cm (DXA)

// Marcação simples: **negrito**, __itálico__, ~sub~, ^sup^
function runs(texto, base = {}) {
  return texto.split(/(\*\*[^*]+\*\*|__[^_]+__|~[^~]+~|\^[^^]+\^)/).filter(Boolean).map((p) => {
    const o = { font: FONTE, size: TAM, ...base };
    if (p.startsWith("**")) return new TextRun({ ...o, text: p.slice(2, -2), bold: true });
    if (p.startsWith("__")) return new TextRun({ ...o, text: p.slice(2, -2), italics: true });
    if (p.startsWith("~")) return new TextRun({ ...o, text: p.slice(1, -1), subScript: true });
    if (p.startsWith("^")) return new TextRun({ ...o, text: p.slice(1, -1), superScript: true });
    return new TextRun({ ...o, text: p });
  });
}
const par = (t, o = {}) => new Paragraph({
  alignment: AlignmentType.JUSTIFIED, spacing: { line: 360, lineRule: LineRuleType.AUTO, after: 0 }, indent: { firstLine: 709 }, ...o, children: runs(t),
});
const centro = (t, o = {}) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { line: 240, lineRule: LineRuleType.AUTO, after: 0 }, ...o, children: runs(t) });
const vazio = () => new Paragraph({ spacing: { line: 240, lineRule: LineRuleType.AUTO, after: 0 }, children: [] });
const titulo1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: runs(t.toUpperCase(), { bold: true }) });
const titulo2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: runs(t, { bold: true }) });
const passo = (t) => new Paragraph({
  numbering: { reference: "passos", level: 0 }, alignment: AlignmentType.JUSTIFIED, spacing: { line: 360, lineRule: LineRuleType.AUTO, after: 0 }, children: runs(t),
});
const legenda = (rotulo, t) => new Paragraph({
  alignment: AlignmentType.LEFT, spacing: { line: 240, lineRule: LineRuleType.AUTO, before: 240, after: 80 }, keepNext: true,
  children: [new TextRun({ text: rotulo + " ", bold: true, font: FONTE, size: TAM }), ...runs(t)],
});
const fonte = () => new Paragraph({ spacing: { line: 240, lineRule: LineRuleType.AUTO, before: 80, after: 240 }, children: runs("Fonte: Autores (2026).") });

// Variância: notação científica com expoente sobrescrito quando o valor é pequeno
function variancia(v) {
  if (v >= 0.01) return br(v);
  const e = Math.floor(Math.log10(v));
  return `${br(v / 10 ** e, 2)} × 10^${e}^`;
}

// ---------------------------------------------------------------- tabelas no padrão do exemplo do professor
const LINHA = { style: BorderStyle.SINGLE, size: 8, color: "000000" };
const NADA = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
function celula(texto, larg, o = {}) {
  return new TableCell({
    width: { size: larg, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER,
    margins: { top: 40, bottom: 40, left: 45, right: 45 },
    borders: { top: o.topo ? LINHA : NADA, bottom: o.base ? LINHA : NADA, left: NADA, right: NADA },
    rowSpan: o.rowSpan, columnSpan: o.columnSpan,
    children: [new Paragraph({
      alignment: o.esq ? AlignmentType.LEFT : AlignmentType.CENTER, spacing: { line: 240, lineRule: LineRuleType.AUTO, after: 0 },
      children: runs(texto, o.negrito ? { bold: true } : {}),
    })],
  });
}
function tabela(colunas, cab, linhas, cab2) {
  const rows = [];
  if (cab2) {
    rows.push(new TableRow({ tableHeader: true, children: cab2.map((c) => celula(c.t, c.larg, { topo: true, base: c.base, rowSpan: c.rowSpan, columnSpan: c.columnSpan, negrito: true, esq: c.esq })) }));
    rows.push(new TableRow({ tableHeader: true, children: cab.map((t, i) => celula(t, colunas[i + 1], { base: true, negrito: true })) }));
  } else {
    rows.push(new TableRow({ tableHeader: true, children: cab.map((t, i) => celula(t, colunas[i], { topo: true, base: true, negrito: true, esq: i === 0 })) }));
  }
  linhas.forEach((l, k) => rows.push(new TableRow({
    cantSplit: true,
    children: l.map((t, i) => celula(t, colunas[i], { base: k === linhas.length - 1, esq: i === 0 })),
  })));
  return new Table({
    width: { size: colunas.reduce((a, b) => a + b, 0), type: WidthType.DXA }, columnWidths: colunas, rows,
    borders: { top: NADA, bottom: NADA, left: NADA, right: NADA, insideHorizontal: NADA, insideVertical: NADA },
  });
}
const COLS = [1450, 1150, 1150, 1300, 1450, 1270, 1301];
function tabelaEstatistica(n) {
  const linhas = D.algoritmos.map((a) => {
    const e = E(a.id, n);
    return [a.nome, br(e.media), br(e.mediana), br(e.desvio), variancia(e.variancia), br(e.cv, 1), `${br(e.maximo)} / ${br(e.minimo)}`];
  });
  const cab2 = [
    { t: "Algoritmo", larg: COLS[0], rowSpan: 2, base: true, esq: true },
    { t: "Variáveis", larg: COLS.slice(1).reduce((a, b) => a + b, 0), columnSpan: 6 },
  ];
  return tabela(COLS, ["Média (ms)", "Mediana (ms)", "Desvio Padrão (ms)", "Variância (ms^2^)", "Coeficiente de Variação (%)", "Máximo / Mínimo (ms)"], linhas, cab2);
}

function figura(arquivo) {
  const buf = fs.readFileSync(path.join(ART, "figuras", arquivo));
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20); // cabeçalho PNG
  const larg = 600;
  return new Paragraph({
    alignment: AlignmentType.CENTER, keepNext: true, spacing: { line: 240, lineRule: LineRuleType.AUTO, after: 0 },
    children: [new ImageRun({ type: "png", data: buf, transformation: { width: larg, height: Math.round((larg * h) / w) },
      altText: { title: arquivo, description: arquivo, name: arquivo } })],
  });
}

// ---------------------------------------------------------------- conteúdo
const corpo = [];
const add = (...x) => corpo.push(...x);
const mq = D.maquina;

// Cabeçalho
add(centro("CENTRO UNIVERSITÁRIO UNIFACVEST"), centro("DEPARTAMENTO DE CIÊNCIA DA COMPUTAÇÃO"),
  centro("DISCIPLINA DE ESTRUTURA DE DADOS"), centro("PROFESSOR: Me. MARCELO GOULART SOUZA"), vazio(), vazio());
add(centro(`**${TITULO.toUpperCase()}**`), vazio());
AUTORES.forEach((a) => add(centro(a)));
add(vazio());

// Resumo
add(centro("**RESUMO**", { spacing: { line: 240, lineRule: LineRuleType.AUTO, before: 120, after: 120 } }));
add(new Paragraph({
  alignment: AlignmentType.JUSTIFIED, spacing: { line: 240, lineRule: LineRuleType.AUTO, after: 120 },
  children: runs(
    "Neste trabalho, comparamos o desempenho de dois algoritmos de ordenação por comparação: o Mergesort na versão __bottom-up__ " +
    "(iterativa) e o Quicksort clássico, com pivô no elemento central, ambos implementados em C++. Cada algoritmo ordenou " +
    "conjuntos de 30, 300, 3.000, 30.000 e 300.000 números inteiros aleatórios, com 20 amostras para cada tamanho, totalizando " +
    "200 ordenações. Em cada amostra, os dois algoritmos receberam exatamente os mesmos dados, e conferimos se todos os " +
    "resultados saíram ordenados. Resumimos os tempos por estatística descritiva (média, mediana, desvio padrão, variância, " +
    "coeficiente de variação, máximo e mínimo) e os ilustramos com __boxplots__ e gráficos de barras. Nos " +
    `conjuntos de até 3.000 elementos os tempos ficaram na casa dos microssegundos e as diferenças entre os algoritmos ` +
    `(de ${pct(Math.min(...pequenosDif))} a ${pct(Math.max(...pequenosDif))}) ficaram dentro da variação das amostras, caracterizando empate técnico. ` +
    `A partir de 30.000 elementos o Quicksort clássico foi mais rápido, com tempo médio ${pct(difQ(30000))} e ${pct(difQ(300000))} menor ` +
    "para 30.000 e 300.000 elementos, respectivamente. O crescimento do tempo dos dois algoritmos acompanhou a previsão " +
    `teórica O(n log n): a cada vez que a entrada foi multiplicada por 10, o tempo médio cresceu entre ${br(rMin, 1)} e ${br(rMax, 1)} vezes. ` +
    "Testes complementares com entradas já ordenadas, invertidas e com muitos valores repetidos mantiveram a vantagem do " +
    "Quicksort. Concluímos que o Quicksort clássico é a melhor escolha quando se busca menor tempo médio e pouco uso de " +
    "memória, enquanto o Mergesort __bottom-up__ é preferível quando são exigidos estabilidade e tempo garantido no pior caso."
  ),
}));
add(new Paragraph({
  alignment: AlignmentType.JUSTIFIED, spacing: { line: 240, lineRule: LineRuleType.AUTO, after: 120 },
  children: runs("**Palavras-chave:** Algoritmos de ordenação. Mergesort. Quicksort. Análise de desempenho. Estatística descritiva."),
}));

// 1 Introdução
add(titulo1("1 Introdução"));
add(par(
  "Ordenar é dispor um conjunto de elementos segundo uma relação de ordem, como a ordem crescente de números. Trata-se de " +
  "uma das operações mais frequentes da computação, pois muitas outras dependem dela: a busca binária só funciona em dados " +
  "ordenados, bancos de dados ordenam registros para montar índices e relatórios, e listas classificadas aparecem em " +
  "praticamente todo sistema (KNUTH, 1998). Para algoritmos que ordenam apenas comparando pares de elementos, o melhor " +
  "desempenho possível no caso geral é proporcional a n log n comparações, em que n é a quantidade de elementos " +
  "(CORMEN et al., 2012). O Mergesort e o Quicksort atingem essa ordem de grandeza no caso médio, mas por caminhos diferentes, " +
  "o que justifica compará-los na prática."
));
add(titulo2("1.1 Mergesort bottom-up"));
add(par(
  "O Mergesort segue a estratégia de divisão e conquista e tem como operação central a intercalação (__merge__): dados dois " +
  "blocos já ordenados, compara-se o primeiro elemento de cada um, copia-se o menor para um vetor auxiliar e avança-se naquele " +
  "bloco, até que os dois se esgotem (CORMEN et al., 2012). Na versão recursiva tradicional, chamada __top-down__, o vetor é " +
  "dividido ao meio repetidamente até restarem blocos de um elemento, que são intercalados na volta da recursão. A versão " +
  "__bottom-up__, estudada neste trabalho, dispensa a divisão e a recursão: parte do fato de que cada elemento isolado já é um " +
  "bloco ordenado e intercala blocos vizinhos de largura 1, depois 2, 4, 8 e assim por diante, dobrando a largura a cada " +
  "passada até que um único bloco cubra todo o vetor (SEDGEWICK; WAYNE, 2011)."
));
add(par(
  "Como a largura dobra a cada passada, são necessárias log~2~ n passadas (arredondado para cima), e cada uma percorre os n elementos, o que resulta " +
  "em tempo O(n log n) no melhor, no médio e no pior caso. Entre os pontos positivos estão o tempo garantido, independente da " +
  "disposição dos dados; a estabilidade, isto é, elementos iguais mantêm a ordem relativa original; e, na versão __bottom-up__, a " +
  "ausência de recursão, o que elimina o risco de estouro de pilha e facilita o uso em listas ligadas e na ordenação de arquivos " +
  "grandes. Entre os pontos negativos estão o consumo de memória auxiliar proporcional à entrada, O(n), e o custo das cópias " +
  "entre o vetor original e o auxiliar, que aumenta o tempo constante de cada passada."
));
add(titulo2("1.2 Quicksort clássico"));
add(par(
  "O Quicksort, proposto por Hoare (1962), também usa divisão e conquista, mas faz o trabalho pesado antes da recursão. Escolhe-se " +
  "um elemento chamado pivô e o vetor é particionado: elementos menores que o pivô ficam à esquerda e maiores à direita. Em " +
  "seguida, cada parte é ordenada recursivamente. Na versão clássica utilizada neste trabalho, o pivô é o elemento central do " +
  "trecho e dois índices percorrem o vetor em sentidos opostos, trocando os pares de elementos que estão do lado errado até se " +
  "cruzarem (ZIVIANI, 2011)."
));
add(par(
  "Seus pontos positivos são a ordenação no próprio vetor (__in-place__), sem vetor auxiliar, com memória extra apenas para a " +
  "pilha de recursão, tipicamente O(log n), e o excelente desempenho prático no caso médio, O(n log n), favorecido pelo acesso " +
  "sequencial à memória e pelo pequeno número de movimentações. Os pontos negativos são o pior caso O(n^2^), que ocorre quando o " +
  "pivô escolhido é repetidamente o menor ou o maior elemento do trecho; a falta de estabilidade; e a dependência da recursão. " +
  "Por isso, a escolha do pivô é decisiva para o desempenho do algoritmo (SEDGEWICK; WAYNE, 2011)."
));
add(titulo2("1.3 Objetivo"));
add(par(
  "Nosso objetivo é comparar experimentalmente o tempo de execução do Mergesort __bottom-up__ e do Quicksort clássico " +
  "em conjuntos de 30 a 300.000 números, analisando os resultados por meio de estatística descritiva, __boxplots__ e gráficos " +
  "de barras, e relacionando o comportamento observado com a teoria de cada algoritmo."
));

// 2 Material e Métodos
add(titulo1("2 Material e Métodos"));
add(titulo2("2.1 Ferramentas e ambiente"));
add(par(
  "Implementamos os dois algoritmos na linguagem C++ (padrão C++11), em um único programa de medição. O projeto foi preparado " +
  "para ser compilado e executado no Windows 11 com a IDE Embarcadero Dev-C++: o script PAINEL_ADM.bat localiza o compilador " +
  "g++ (TDM-GCC) da IDE, compila o código e executa os testes por meio de um menu. Para as medições apresentadas neste " +
  `artigo, usamos um ${mq.local || "computador"}, com processador ${mq.processador}, ${mq.memoria} e sistema ${mq.sistema}, ` +
  `com o compilador ${mq.compilador}. Gravamos os tempos de cada amostra em arquivos CSV e os organizamos em uma planilha do ` +
  "Microsoft Excel (planilha_resultados.xlsx, que acompanha este trabalho), na qual calculamos a estatística descritiva com as " +
  "funções MÉDIA, MED, DESVPAD, VAR, MÁXIMO e MÍNIMO. Os gráficos foram feitos em Python 3 com a biblioteca Matplotlib, e " +
  "conferimos os valores da planilha com os calculados em Python e pelo próprio programa em C++, sem nenhuma divergência."
));
add(titulo2("2.2 Implementação"));
add(par(
  "No Mergesort __bottom-up__, usamos dois laços: o externo controla a largura dos blocos (1, 2, 4, 8, ...) e o interno " +
  "percorre o vetor intercalando cada par de blocos vizinhos com o auxílio de um vetor auxiliar do mesmo tamanho. Quando o tamanho " +
  "do vetor não é potência de 2, o último bloco é menor ou fica sem par e é intercalado em uma passada posterior. Já o Quicksort " +
  "clássico ficou recursivo, com pivô igual ao elemento central do trecho e particionamento por dois índices que " +
  "avançam um em direção ao outro, trocando os elementos fora de lugar."
));
add(titulo2("2.3 Procedimento experimental"));
add(par("Seguimos os passos abaixo:", { indent: { firstLine: 709 } }));
[
  "Definimos os cinco tamanhos de conjunto exigidos: 30, 300, 3.000, 30.000 e 300.000 números inteiros.",
  "Para cada tamanho, coletamos 20 amostras de tempo de cada algoritmo, totalizando 200 ordenações.",
  "Geramos os números aleatoriamente entre 0 e 1.000.000 com o gerador Mersenne Twister (std::mt19937), com semente fixa 42, o que permite reproduzir exatamente os mesmos dados.",
  "Em cada amostra, os dois algoritmos ordenaram cópias dos mesmos vetores, garantindo uma comparação justa.",
  "Antes das amostras de cada tamanho, fizemos uma execução de aquecimento, descartada, para reduzir efeitos de memória cache e de alocação inicial.",
  "Medimos o tempo com o relógio monotônico std::chrono::steady_clock, envolvendo apenas a chamada de ordenação; a geração e a cópia dos dados ficaram fora da medição.",
  "Como vetores pequenos são ordenados em frações de microssegundo, abaixo da precisão confiável do relógio, cada amostra ordenou k vetores aleatórios diferentes (k = 20.000 / n; k = 1 para n ≥ 20.000) e registrou o tempo médio por vetor.",
  "Após cada ordenação, verificamos o resultado com std::is_sorted; não houve nenhuma falha.",
  "Gravamos os tempos em CSV e os organizamos na planilha do Excel, onde calculamos a estatística descritiva; em seguida, elaboramos os __boxplots__ e os gráficos de barras.",
].forEach((t) => add(passo(t)));
add(par(
  "Um cuidado que só percebemos durante os testes foi a forma de medir os vetores pequenos. Em uma versão preliminar, repetíamos " +
  "k vezes o mesmo vetor, e os tempos de 30 e 300 elementos ficaram artificialmente baixos: o crescimento de 300 para 3.000 " +
  "elementos passou de 40 vezes, muito acima das cerca de 14 vezes previstas pela teoria. Isso acontece porque, ao ordenar " +
  "repetidamente a mesma entrada, o processador aprende o padrão das comparações (previsão de desvios) e executa mais rápido do " +
  "que faria com dados novos. Por isso, passamos a usar k vetores diferentes em cada amostra, o que trouxe os resultados para " +
  "perto da previsão teórica, como mostra a Tabela 6."
));
add(titulo2("2.4 Estatística descritiva"));
add(par(
  "Para cada algoritmo e tamanho, calculamos: a média aritmética; a mediana, valor central das 20 amostras ordenadas; o " +
  "desvio padrão amostral, com divisor n − 1; a variância amostral, quadrado do desvio padrão, expressa em ms^2^; o coeficiente " +
  "de variação, dado por CV = (desvio padrão ÷ média) × 100, que mede a dispersão relativa em porcentagem; e os valores máximo e " +
  "mínimo. No Excel, o desvio padrão e a variância amostrais correspondem às funções DESVPAD e VAR. Nos __boxplots__, a caixa vai do primeiro ao terceiro quartil, a linha interna marca a mediana e os pontos isolados " +
  "indicam valores atípicos. Neste trabalho, consideramos que há diferença consistente entre os algoritmos quando as caixas " +
  "(intervalos interquartis) não se sobrepõem."
));

// 3 Resultados e Discussão
add(titulo1("3 Resultados e Discussão"));
add(par(
  "As Tabelas 1 a 5 apresentam a estatística descritiva dos tempos de execução para cada tamanho de conjunto. A Tabela 6 resume o " +
  "crescimento do tempo médio entre tamanhos consecutivos, e as Figuras 1 a 4 ilustram a distribuição das amostras, as médias, a " +
  "variabilidade relativa e o comportamento em outros tipos de entrada. Os dados brutos das 200 amostras e as fórmulas " +
  "utilizadas estão na planilha que acompanha o trabalho, nas abas Dados, Estatística e Crescimento."
));
const ganhoM = (n) => -difQ(n); // > 0: Merge mais rápido
const textoTab = {
  30: `Conforme a Tabela 1, com o conjunto de 30 dados os dois algoritmos ordenaram cada vetor em menos de um microssegundo: ` +
    `média de ${br(M(30).media)} ms para o Mergesort __bottom-up__ e ${br(Q(30).media)} ms para o Quicksort clássico. A média do ` +
    `Mergesort foi ${pct(Math.abs(difQ(30)))} ${ganhoM(30) > 0 ? "menor" : "maior"}, mas essa diferença é da mesma ordem dos ` +
    `coeficientes de variação (${br(M(30).cv, 1)}% e ${br(Q(30).cv, 1)}%) e as caixas do __boxplot__ se sobrepõem (Figura 1), ` +
    "o que caracteriza empate técnico. Com tão poucos elementos, o custo é dominado por operações fixas, como a chamada da função " +
    "e a alocação do vetor auxiliar do Mergesort, e não pelo número de comparações.",
  300: `A Tabela 2 mostra o mesmo comportamento para 300 dados: ${br(M(300).media)} ms em média para o Mergesort __bottom-up__ ` +
    `e ${br(Q(300).media)} ms para o Quicksort clássico, diferença de ${pct(Math.abs(difQ(300)))}. As medianas ` +
    `(${br(M(300).mediana)} ms e ${br(Q(300).mediana)} ms) confirmam a proximidade, e a baixa dispersão ` +
    `(CV de ${br(M(300).cv, 1)}% e ${br(Q(300).cv, 1)}%) indica medições estáveis. Também neste tamanho não há diferença consistente ` +
    "entre os algoritmos.",
  3000: `Para 3.000 dados (Tabela 3), as médias foram ${br(M(3000).media)} ms (Mergesort __bottom-up__) e ${br(Q(3000).media)} ms ` +
    `(Quicksort clássico), uma diferença de apenas ${pct(Math.abs(difQ(3000)))}. É o ponto em que o Quicksort começa a se aproximar ` +
    "e a ultrapassar o Mergesort, mas as caixas ainda se sobrepõem. O Quicksort apresentou maior variabilidade " +
    `(CV de ${br(Q(3000).cv, 1)}% contra ${br(M(3000).cv, 1)}%), coerente com o fato de que a qualidade de cada partição depende ` +
    "dos valores sorteados, enquanto o Mergesort executa sempre a mesma sequência de passadas.",
  30000: `Com 30.000 dados (Tabela 4) surge uma diferença consistente: o Quicksort clássico teve média de ${br(Q(30000).media)} ms ` +
    `e mediana de ${br(Q(30000).mediana)} ms, contra ${br(M(30000).media)} ms e ${br(M(30000).mediana)} ms do Mergesort ` +
    `__bottom-up__, ou seja, foi ${pct(difQ(30000))} mais rápido na média. Os intervalos interquartis não se sobrepõem: 75% das ` +
    `amostras do Quicksort ficaram abaixo de ${br(Q(30000).q3)} ms, enquanto 75% das amostras do Mergesort ficaram acima de ` +
    `${br(M(30000).q1)} ms. A partir deste tamanho, o vetor de trabalho deixa de caber nos níveis mais rápidos da memória cache, e passa a ` +
    "pesar o fato de o Mergesort copiar todos os elementos para o vetor auxiliar e de volta em cada passada, enquanto o Quicksort " +
    "apenas troca elementos no próprio vetor.",
  300000: `A Tabela 5 apresenta o maior conjunto, com 300.000 dados. O Quicksort clássico manteve a vantagem, com média de ` +
    `${br(Q(300000).media)} ms e mediana de ${br(Q(300000).mediana)} ms, contra ${br(M(300000).media)} ms e ` +
    `${br(M(300000).mediana)} ms do Mergesort __bottom-up__: tempos ${pct(difQ(300000))} menores na média e ` +
    `${pct(difMd(300000))} menores na mediana. Neste tamanho a dispersão foi maior para os dois algoritmos ` +
    `(CV de ${br(M(300000).cv, 1)}% e ${br(Q(300000).cv, 1)}%), pois cada ordenação dura dezenas de milissegundos e fica mais ` +
    "exposta a interferências do sistema operacional, como outros processos e o escalonamento do processador. " +
    (sobrepoe(300000) ? "Por isso, as caixas se sobrepõem parcialmente, mas tanto a média quanto a mediana e o mínimo favorecem o Quicksort. " : "") +
    "Execuções adicionais de verificação mantiveram o mesmo padrão.",
};
NS.forEach((n, i) => {
  add(par(`A Tabela ${i + 1} ilustra a estatística descritiva dos dados obtidos com ${mil(n)} números.`, { keepNext: true, keepLines: true }));
  add(legenda(`Tabela ${i + 1}.`, `Estatística descritiva dos algoritmos de ordenação com o conjunto de ${mil(n)} dados.`));
  add(tabelaEstatistica(n), fonte());
  add(par(textoTab[n]));
});

// Tabela 6: crescimento
const linhasCres = NS.slice(1).map((n, k) => {
  const i = k + 1;
  return [`${mil(NS[i - 1])} → ${mil(n)}`, `${br(prev(i), 1)}×`, `${br(razao("mergesort", i), 1)}×`, `${br(razao("quicksort", i), 1)}×`];
});
add(par("A Tabela 6 ilustra quantas vezes o tempo médio cresceu a cada vez que o conjunto de dados foi multiplicado por 10, comparado com o crescimento previsto pela teoria.", { keepNext: true, keepLines: true }));
add(legenda("Tabela 6.", "Crescimento do tempo médio a cada vez que o conjunto de dados é multiplicado por 10."));
add(tabela([2600, 2157, 2157, 2157], ["Tamanhos", "Previsto por n log n", "Mergesort bottom-up", "Quicksort clássico"], linhasCres), fonte());
add(par(
  "A Tabela 6 relaciona os resultados com a teoria. Se o tempo fosse proporcional a n log n, multiplicar a entrada por 10 deveria " +
  `multiplicar o tempo pelos valores da coluna "Previsto", entre ${br(prev(NS.length - 1), 1)} e ${br(prev(1), 1)} vezes. Os valores medidos ` +
  `ficaram entre ${br(rMin, 1)} e ${br(rMax, 1)} vezes, muito próximos do previsto, o que confirma experimentalmente o comportamento ` +
  "O(n log n) dos dois algoritmos com dados aleatórios. Um algoritmo quadrático, como o Insertionsort no caso médio, teria o tempo " +
  "multiplicado por cerca de 100 a cada salto, o que tornaria inviável ordenar 300.000 elementos nas mesmas condições."
));

// Figuras
add(legenda("Figura 1.", "__Boxplot__ dos tempos de execução das 20 amostras de cada algoritmo, por tamanho do conjunto de dados."));
add(figura("figura1_boxplot.png"), fonte());
add(par(
  "A Figura 1 mostra a distribuição completa das 20 amostras. Para 30, 300 e 3.000 dados as caixas dos dois algoritmos se " +
  "sobrepõem, confirmando o empate técnico discutido nas Tabelas 1 a 3. Em 30.000 dados as caixas ficam separadas, com o Quicksort " +
  "clássico claramente abaixo, e em 300.000 a mediana e a caixa do Quicksort continuam deslocadas para tempos menores. Os pontos " +
  "isolados são amostras atípicas, em geral mais lentas, provocadas por interferências momentâneas do sistema; por isso a mediana, " +
  "menos sensível a esses valores, é uma referência importante ao lado da média."
));
add(legenda("Figura 2.", "Tempo médio de execução por tamanho do conjunto de dados (escala logarítmica)."));
add(figura("figura2_barras_media.png"), fonte());
add(par(
  "Na Figura 2, as médias aparecem em escala logarítmica, necessária porque os tempos variam de frações de microssegundo a dezenas " +
  "de milissegundos. As barras crescem em degraus quase iguais a cada tamanho, reflexo do crescimento n log n visto na Tabela 6. " +
  "Nos três menores tamanhos as barras dos dois algoritmos praticamente se igualam, e nos dois maiores a barra do Quicksort clássico " +
  "fica visivelmente abaixo da do Mergesort __bottom-up__."
));
add(legenda("Figura 3.", "Coeficiente de variação dos tempos de execução por tamanho do conjunto de dados."));
add(figura("figura3_barras_cv.png"), fonte());
const cvs = [];
NS.forEach((n) => cvs.push(M(n).cv, Q(n).cv));
add(par(
  `A Figura 3 compara a variabilidade relativa das medições. Todos os coeficientes de variação ficaram entre ${br(Math.min(...cvs), 1)}% ` +
  `e ${br(Math.max(...cvs), 1)}%, valores baixos a moderados, o que indica que 20 amostras foram suficientes para caracterizar cada caso. ` +
  "Nos tamanhos pequenos o Quicksort variou mais que o Mergesort, pois o equilíbrio das partições depende dos valores sorteados, " +
  "enquanto o Mergesort repete sempre o mesmo padrão de intercalações. Nos tamanhos maiores a variação dos dois aumenta e se " +
  "aproxima, porque passa a predominar a interferência do ambiente de execução sobre ordenações mais longas."
));
add(legenda("Figura 4.", "Tempo médio com 300.000 dados em diferentes tipos de entrada."));
add(figura("figura4_cenarios.png"), fonte());
add(par(
  "Como complemento, a Figura 4 apresenta testes com 300.000 dados em quatro tipos de entrada, com as mesmas 20 amostras por caso. " +
  `Com dados aleatórios repete-se a vantagem de ${pct(cenDif("aleatorio"))} do Quicksort. Com dados já ordenados ou em ordem inversa, ` +
  `os dois algoritmos ficaram bem mais rápidos, e a vantagem do Quicksort clássico subiu para ${pct(cenDif("ordenado"))} e ` +
  `${pct(cenDif("inverso"))}: nesses casos o elemento central é exatamente a mediana do trecho, o pivô ideal, e quase nenhuma troca ` +
  "é necessária. Esse resultado mostra que a escolha do pivô central evita o pior caso O(n^2^) em entradas ordenadas, que ocorreria " +
  `se o pivô fosse o primeiro ou o último elemento. Com muitos valores repetidos (apenas 10 valores distintos) o Quicksort também foi ` +
  `${pct(cenDif("repetidos"))} mais rápido, pois o particionamento por dois índices distribui os elementos iguais ao pivô entre os dois lados.`
));

// 4 Conclusão
add(titulo1("4 Conclusão"));
add(par(
  "Comparamos o Mergesort __bottom-up__ e o Quicksort clássico em 200 ordenações de 30 a 300.000 números, com a mesma " +
  "entrada para os dois algoritmos e tratamento por estatística descritiva. Para conjuntos de até 3.000 elementos os algoritmos " +
  "empataram tecnicamente, com diferenças menores que a variação natural das medições. A partir de 30.000 elementos o Quicksort " +
  `clássico foi consistentemente mais rápido, com tempo médio ${pct(difQ(30000))} menor em 30.000 dados e ${pct(difQ(300000))} menor ` +
  "em 300.000 dados, vantagem que se manteve e até aumentou em entradas ordenadas, invertidas e com valores repetidos."
));
add(par(
  "O crescimento do tempo dos dois algoritmos acompanhou de perto a previsão O(n log n), confirmando na prática a análise teórica. " +
  "A diferença entre eles, portanto, não está na ordem de complexidade, mas nas constantes: o Mergesort copia todos os elementos " +
  "para um vetor auxiliar a cada passada, enquanto o Quicksort reorganiza o próprio vetor. Para o grupo, esse foi o principal " +
  "aprendizado: a notação O mostra como o tempo cresce, mas não decide sozinha qual algoritmo é mais rápido. Detalhes de " +
  "implementação, como as cópias de memória e a escolha do pivô, fazem diferença real, e a própria forma de medir precisa de " +
  "cuidado para não produzir números enganosos, como vimos com os vetores pequenos."
));
add(par(
  "Concluímos que o Quicksort clássico é a escolha mais indicada quando o objetivo é o menor tempo médio com pouco uso de memória, " +
  "desde que o pivô seja bem escolhido, como o elemento central usado neste trabalho. Já o Mergesort __bottom-up__ é preferível " +
  "quando é necessário garantir tempo O(n log n) mesmo no pior caso, manter a estabilidade da ordenação ou evitar recursão. Como " +
  "trabalho futuro, pretendemos repetir o experimento em outros computadores e incluir algoritmos quadráticos, como o Insertionsort, " +
  "para evidenciar a diferença entre as classes de complexidade."
));

// Referências
add(titulo1("Referências"));
[
  "CORMEN, T. H.; LEISERSON, C. E.; RIVEST, R. L.; STEIN, C. **Algoritmos**: teoria e prática. 3. ed. Rio de Janeiro: Elsevier, 2012.",
  "HOARE, C. A. R. Quicksort. **The Computer Journal**, v. 5, n. 1, p. 10-16, 1962.",
  "KNUTH, D. E. **The art of computer programming**: sorting and searching. 2. ed. Reading: Addison-Wesley, 1998. v. 3.",
  "SEDGEWICK, R.; WAYNE, K. **Algorithms**. 4. ed. Boston: Addison-Wesley, 2011.",
  "ZIVIANI, N. **Projeto de algoritmos**: com implementações em Pascal e C. 3. ed. São Paulo: Cengage Learning, 2011.",
].forEach((t) => add(new Paragraph({ alignment: AlignmentType.LEFT, spacing: { line: 240, lineRule: LineRuleType.AUTO, after: 200 }, children: runs(t) })));

// ---------------------------------------------------------------- documento
const doc = new Document({
  creator: AUTORES.join(", "), title: TITULO, description: "Trabalho Final – Estrutura de Dados",
  styles: {
    default: { document: { run: { font: FONTE, size: TAM }, paragraph: { spacing: { line: 360, lineRule: LineRuleType.AUTO } } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: FONTE, size: TAM, bold: true, color: "000000" },
        paragraph: { spacing: { before: 360, after: 120, line: 360, lineRule: LineRuleType.AUTO }, keepNext: true, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: FONTE, size: TAM, bold: true, color: "000000" },
        paragraph: { spacing: { before: 240, after: 60, line: 360, lineRule: LineRuleType.AUTO }, keepNext: true, outlineLevel: 1 } },
    ],
  },
  numbering: {
    config: [{ reference: "passos", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1)", alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 1069, hanging: 360 } }, run: { font: FONTE, size: TAM } } }] }],
  },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1701, left: 1701, right: 1134, bottom: 1134 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT,
      children: [new TextRun({ children: [PageNumber.CURRENT], font: FONTE, size: TAM })] })] }) },
    children: corpo,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  const saida = path.join(ART, "artigo_ordenacao.docx");
  fs.writeFileSync(saida, buf);
  console.log("artigo gerado em " + saida);
});
