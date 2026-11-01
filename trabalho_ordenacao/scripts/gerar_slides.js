// Gera apresentacao/slides.pptx no estilo do Canva do grupo (azul-marinho + roxo, fundo claro com círculos lilás),
// com os resultados do artigo. Lê artigo/dados_artigo.json e apresentacao/assets/*.png.
// Ordem: python scripts/gerar_artigo_dados.py → python scripts/gerar_slides_assets.py → node scripts/gerar_slides.js
// Requer: npm install pptxgenjs react-icons react react-dom sharp
const fs = require("fs");
const path = require("path");
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa");

const RAIZ = path.join(__dirname, "..");
const ASSETS = path.join(RAIZ, "apresentacao", "assets");
const SAIDA = path.join(RAIZ, "apresentacao", "slides.pptx");
const D = JSON.parse(fs.readFileSync(path.join(RAIZ, "artigo", "dados_artigo.json"), "utf8"));

// ---------------------------------------------------------------- dados
const NS = D.tamanhos;
const E = (a, n) => D.estatistica[`${a}:${n}`];
const M = (n) => E("mergesort", n);
const Q = (n) => E("quicksort", n);
const mil = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
function br(v, casas) {
  if (casas === undefined) casas = v === 0 ? 2 : Math.max(2, 2 - Math.floor(Math.log10(Math.abs(v))));
  return v.toFixed(casas).replace(".", ",");
}
const difQ = (n) => ((M(n).media - Q(n).media) / M(n).media) * 100;
const difMd = (n) => ((M(n).mediana - Q(n).mediana) / M(n).mediana) * 100;
const sobrepoe = (n) => !(M(n).q1 > Q(n).q3 || Q(n).q1 > M(n).q3);
const razoes = [];
for (let i = 1; i < NS.length; i++) for (const a of ["mergesort", "quicksort"]) razoes.push(E(a, NS[i]).media / E(a, NS[i - 1]).media);
const prev = NS.slice(1).map((n, i) => (n * Math.log2(n)) / (NS[i] * Math.log2(NS[i])));
const C = D.cenarios;
const CEN = ["aleatorio", "ordenado", "inverso", "repetidos"];
const cenDif = (c) => ((C[c].mergesort.media - C[c].quicksort.media) / C[c].mergesort.media) * 100;
const outrasDif = ["ordenado", "inverso", "repetidos"].map(cenDif);
if (![30, 300, 3000].every(sobrepoe) || sobrepoe(30000) || difQ(30000) <= 3 || difQ(300000) <= 3)
  throw new Error("Os resultados mudaram de padrão: revise os textos dos slides de resultados.");

// ---------------------------------------------------------------- tema (cores do Canva do grupo)
const THEME = {
  name: "Canva Ordenacao", headFontFace: "Arial Narrow", bodyFontFace: "Calibri",
  colors: {
    dk1: "1E2433", lt1: "FFFFFF", dk2: "142B54", lt2: "F1F0FA",
    accent1: "1F4E9C", accent2: "8A5CD6", accent3: "4B2B93", accent4: "DCDDF3",
    accent5: "E6EDF8", accent6: "ECE6F6", hlink: "1F4E9C", folHlink: "4B2B93",
  },
};
const T = THEME.colors;
const CINZA = "4A5060";

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13,333 x 7,5 pol (16:9, igual ao Canva)
pres.title = "Mergesort × Quicksort";
pres.author = "Jeferson Gomes Martins, João Vitor Gonçalves de Almeida, Juan Flor, Igor Jesus, Guilherme Silva";
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
const S = pres.SchemeColor;
const FUNDO = path.join(ASSETS, "fundo.png");

pres.defineSlideMaster({
  title: "CAPA",
  background: { path: FUNDO },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.7, y: 0.7, w: 12.2, h: 1.3, fontSize: 52, bold: true, color: S.text2,
      fontFace: THEME.headFontFace, align: "left", valign: "middle", margin: 0 }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "CANVA",
  background: { path: FUNDO },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.7, y: 0.4, w: 11.9, h: 0.95, fontSize: 40, bold: true, color: S.text2,
      fontFace: THEME.headFontFace, align: "left", valign: "middle", margin: 0 }, text: "" } },
  ],
  slideNumber: { x: 12.33, y: 7.0, w: 0.6, h: 0.3, fontSize: 12, color: CINZA, align: "right" },
});

// ---------------------------------------------------------------- componentes visuais
async function icone(Comp, cor = "FFFFFF") {
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { color: "#" + cor, size: 256 }));
  return "image/png;base64," + (await sharp(Buffer.from(svg)).png().toBuffer()).toString("base64");
}
const TXT = (o) => ({ margin: 0, isTextBox: true, valign: "top", color: S.text1, fontSize: 20, ...o });

const ESTILO = {
  lav: { fill: T.accent4, text: T.dk2 },
  merge: { fill: T.accent1, text: T.lt1 },
  quick: { fill: T.accent2, text: T.lt1 },
  pivo: { fill: T.accent3, text: T.lt1 },
};
function tile(slide, x, y, v, est, t = 0.62, fs = 20) {
  slide.addText(String(v), {
    shape: pres.shapes.ROUNDED_RECTANGLE, rectRadius: 0.1, x, y, w: t, h: t,
    fill: { color: est.fill }, line: { color: est.fill }, color: est.text, fontSize: fs, bold: true,
    align: "center", valign: "middle", margin: 0, objectName: `quadrado ${v}`,
    shadow: { type: "outer", color: "8A8FB0", blur: 3, offset: 1.5, angle: 90, opacity: 0.3 },
  });
}
// grupos de quadrados lado a lado; retorna a largura usada
function linha(slide, grupos, x, y, est, t = 0.62, gap = 0.07, gg = 0.28, fs = 20) {
  let cx = x;
  grupos.forEach((g) => {
    g.forEach((v, i) => { tile(slide, cx, y, v, typeof est === "function" ? est(v) : est, t, fs); cx += t + (i < g.length - 1 ? gap : 0); });
    cx += gg;
  });
  return cx - gg - x;
}
const larguraLinha = (grupos, t = 0.62, gap = 0.07, gg = 0.28) => {
  const n = grupos.reduce((s, g) => s + g.length, 0);
  return n * t + (n - grupos.length) * gap + (grupos.length - 1) * gg;
};
function cartao(slide, x, y, w, h, cor, nome) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.15, fill: { color: cor }, line: { color: cor }, objectName: nome });
}
function pilula(slide, x, y, w, h, runs, nome) {
  cartao(slide, x, y, w, h, T.lt2, nome);
  slide.addText(runs, TXT({ x: x + 0.3, y, w: w - 0.6, h, valign: "middle", fontSize: 20, objectName: nome + " texto" }));
}
async function dica(slide, x, y, w, h, texto) {
  cartao(slide, x, y, w, h, T.accent6, "no dia a dia");
  slide.addShape(pres.shapes.OVAL, { x: x + 0.22, y: y + 0.22, w: 0.5, h: 0.5, fill: { color: T.accent3 }, line: { color: T.accent3 }, objectName: "dica círculo" });
  slide.addImage({ data: await icone(fa.FaLightbulb), x: x + 0.34, y: y + 0.34, w: 0.26, h: 0.26, altText: "lâmpada", objectName: "dica ícone" });
  slide.addText([
    { text: "No dia a dia: ", options: { bold: true, color: S.accent3 } },
    { text: texto },
  ], TXT({ x: x + 0.9, y: y + 0.12, w: w - 1.1, h: h - 0.24, valign: "middle", fontSize: 18, objectName: "dica texto" }));
}
function marcadores(slide, itens, x, y, w, h, fs = 20) {
  slide.addText(itens.map((t, i) => ({
    text: typeof t === "string" ? t : t.text,
    options: { bullet: { indent: 18 }, breakLine: i < itens.length - 1, ...(typeof t === "string" ? {} : t.options) },
  })), TXT({ x, y, w, h, fontSize: fs, paraSpaceAfter: 12, objectName: "tópicos" }));
}
function slideCanva(titulo, secao) {
  const s = pres.addSlide({ masterName: "CANVA", sectionTitle: secao });
  s.addText(titulo, { placeholder: "title" });
  return s;
}
// título em duas cores (navy + roxo), como no Canva
const tituloDuo = (a, b) => [{ text: a, options: { color: S.text2 } }, { text: b, options: { color: S.accent3 } }];

const chartBase = () => ({
  catAxisLabelColor: T.dk1, valAxisLabelColor: T.dk1, catAxisLabelFontSize: 16, valAxisLabelFontSize: 14,
  catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt", legendFontFace: "+mn-lt", titleFontFace: "+mn-lt",
  showLegend: true, legendPos: "t", legendFontSize: 16, legendColor: T.dk1,
  valGridLine: { color: "DADCE6", size: 1 }, catGridLine: { style: "none" },
  showTitle: true, titleFontSize: 16, titleColor: T.dk1,
});

// ---------------------------------------------------------------- slides
async function main() {
  // ===== 1. Capa ==========================================================================
  pres.addSection({ title: "Abertura" });
  let s = pres.addSlide({ masterName: "CAPA", sectionTitle: "Abertura" });
  s.addText([...tituloDuo("MERGESORT", ""), { text: "   ×   ", options: { color: CINZA } }, { text: "QUICKSORT", options: { color: S.accent3 } }], { placeholder: "title" });
  s.addText("Algoritmos de ordenação: funcionamento, complexidade e desempenho", TXT({ x: 0.7, y: 2.15, w: 12, h: 0.55, fontSize: 24, bold: true, color: S.text1, objectName: "subtítulo" }));
  linha(s, [[7], [3], [9], [1], [6]], 0.9, 3.0, ESTILO.lav, 0.72, 0, 0.14, 24);
  linha(s, [[4], [8], [2], [5]], 1.33, 3.86, ESTILO.lav, 0.72, 0, 0.14, 24);
  s.addImage({ data: await icone(fa.FaArrowRight, "8A8FB0"), x: 5.45, y: 3.55, w: 0.55, h: 0.55, altText: "seta", objectName: "seta capa" });
  linha(s, [[1, 2, 3, 4, 5, 6, 7, 8, 9]], 6.35, 3.5, (v) => (v <= 4 ? ESTILO.merge : v === 5 ? ESTILO.pivo : ESTILO.quick), 0.62, 0.07, 0, 22);
  s.addText([
    { text: "Integrantes: ", options: { bold: true, color: S.text2 } },
    { text: "Jeferson Gomes Martins · João Vitor Gonçalves de Almeida · Juan Flor · Igor Jesus · Guilherme Silva" },
  ], TXT({ x: 0.7, y: 5.2, w: 10.4, h: 0.95, fontSize: 20, objectName: "integrantes" }));
  s.addText("Estrutura de Dados · Prof. Me. Marcelo Goulart Souza · Centro Universitário UNIFACVEST",
    TXT({ x: 0.7, y: 6.55, w: 10.4, h: 0.4, fontSize: 16, color: CINZA, objectName: "disciplina" }));
  s.addNotes("PESSOA 1 (0:00). Apresentar o grupo e o tema: comparamos dois algoritmos de ordenação, o Mergesort bottom-up e o Quicksort clássico, implementados em C++, medindo o tempo de 200 ordenações.");

  // ===== 2. Como comparar ================================================================
  s = slideCanva("Como comparar algoritmos de ordenação?", "Abertura");
  marcadores(s, [
    "Ordenar é organizar dados segundo uma ordem definida.",
    "Comparamos o Mergesort bottom-up e o Quicksort clássico em 5 tamanhos de entrada.",
    "Cada tamanho foi medido 20 vezes por algoritmo: 200 ordenações.",
    "Os dois algoritmos recebem os mesmos dados em cada medição.",
    "Todo resultado é conferido: o vetor tem que sair ordenado.",
  ], 0.7, 1.65, 6.3, 4.9);
  NS.forEach((n, i) => {
    const w = 1.7 + i * 0.6, y = 1.65 + i * 0.9;
    s.addText(mil(n), { shape: pres.shapes.ROUNDED_RECTANGLE, rectRadius: 0.12, x: 7.6, y, w, h: 0.7, fill: { color: T.accent4 },
      line: { color: T.accent4 }, color: S.text2, fontSize: 22, bold: true, align: "center", valign: "middle", margin: 0, objectName: `tamanho ${n}` });
  });
  s.addText("elementos", TXT({ x: 10.25, y: 1.8, w: 2.3, h: 0.4, fontSize: 18, color: CINZA, objectName: "rótulo elementos" }));
  s.addText([{ text: "× 20", options: { fontSize: 36, bold: true, color: S.accent3, breakLine: true } }, { text: "amostras cada", options: { fontSize: 18 } }],
    TXT({ x: 10.25, y: 2.4, w: 2.4, h: 1.2, objectName: "vinte amostras" }));
  s.addNotes("PESSOA 1. Explicar a ideia do experimento: cinco tamanhos, de 30 a 300 mil números, 20 medições de cada, sempre com os mesmos dados para os dois algoritmos, como dar a mesma prova para todos os alunos.");

  // ===== 3. Como medimos ===================================================================
  s = slideCanva("Como medimos", "Abertura");
  const passos = [
    "Gerar números aleatórios (semente fixa 42)",
    "Copiar os mesmos dados para os dois algoritmos",
    "Cronometrar só a ordenação (steady_clock)",
    "Conferir se ordenou (std::is_sorted)",
    "Calcular a estatística e montar os gráficos",
  ];
  passos.forEach((t, i) => {
    const y = 1.65 + i * 0.95;
    s.addText(String(i + 1), { shape: pres.shapes.OVAL, x: 0.7, y, w: 0.62, h: 0.62, fill: { color: T.accent3 }, line: { color: T.accent3 },
      color: S.background1, fontSize: 22, bold: true, align: "center", valign: "middle", margin: 0, objectName: "passo " + (i + 1) });
    s.addText(t, TXT({ x: 1.55, y: y - 0.05, w: 5.4, h: 0.72, valign: "middle", objectName: "passo texto " + (i + 1) }));
  });
  cartao(s, 7.5, 1.6, 5.1, 4.9, T.accent5, "ferramentas");
  s.addText([
    { text: "Ferramentas", options: { bold: true, fontSize: 24, color: S.text2, breakLine: true } },
    { text: " ", options: { fontSize: 8, breakLine: true } },
    { text: "Linguagem C++ (padrão C++11)", options: { bullet: { indent: 18 }, breakLine: true } },
    { text: "IDE Dev-C++ no Windows 11", options: { bullet: { indent: 18 }, breakLine: true } },
    { text: "PAINEL_ADM.bat: compila e roda tudo", options: { bullet: { indent: 18 }, breakLine: true } },
    { text: "Python + Matplotlib: estatística e gráficos", options: { bullet: { indent: 18 }, breakLine: true } },
    { text: `Medições: servidor Linux, ${D.maquina.processador}`, options: { bullet: { indent: 18 } } },
  ], TXT({ x: 7.85, y: 1.85, w: 4.5, h: 4.5, fontSize: 19, paraSpaceAfter: 8, objectName: "ferramentas texto" }));
  s.addNotes("PESSOA 1 (até 3:00). Passo a passo da medição. Para vetores pequenos, que ordenam em menos de 1 microssegundo, cada medição ordena vários vetores diferentes e divide o tempo. Se der, mostrar o PAINEL_ADM.bat rodando (opção 2) e a tabela da opção 11.");

  // ===== 4. Mergesort bottom-up =============================================================
  pres.addSection({ title: "Algoritmos" });
  s = slideCanva(tituloDuo("Mergesort Bottom-Up: ", "intercalação"), "Algoritmos");
  [["1.", "Começa com blocos de um elemento, que já estão ordenados."],
   ["2.", "Intercala blocos vizinhos: 2, 4, 8… elementos."],
   ["3.", "Continua até um único bloco cobrir o vetor."]].forEach(([n, t], i) => {
    const y = 1.7 + i * 1.12;
    s.addText(n, TXT({ x: 0.7, y, w: 0.6, h: 0.9, fontSize: 34, bold: true, color: S.text2, fontFace: THEME.headFontFace, objectName: "número " + n }));
    s.addText(t, TXT({ x: 1.3, y: y + 0.05, w: 4.1, h: 0.95, objectName: "etapa " + n }));
  });
  {
    const linhas = [
      [[7], [3], [9], [1], [6], [4], [8], [2], [5]],
      [[3, 7], [1, 9], [4, 6], [2, 8], [5]],
      [[1, 3, 7, 9], [2, 4, 6, 8], [5]],
      [[1, 2, 3, 4, 6, 7, 8, 9], [5]],
      [[1, 2, 3, 4, 5, 6, 7, 8, 9]],
    ];
    const rot = ["blocos de 1", "blocos de 2", "blocos de 4", "blocos de 8", "pronto"];
    linhas.forEach((g, i) => {
      const y = 1.6 + i * 0.86, t = 0.5, gap = 0.05, gg = i === 0 ? 0.12 : 0.22;
      const w = larguraLinha(g, t, gap, gg);
      linha(s, g, 12.6 - w, y, i === 4 ? ESTILO.merge : ESTILO.lav, t, gap, gg, 18);
      s.addText(rot[i], TXT({ x: 5.75, y: y + 0.06, w: 1.35, h: 0.4, fontSize: 16, color: CINZA, objectName: "rótulo " + rot[i] }));
    });
  }
  await dica(s, 0.7, 5.15, 4.85, 0.9, "um torneio de chaves: duplas, quartetos… até o campeão.");
  pilula(s, 0.7, 6.25, 11.9, 0.6, [
    { text: "Complexidade: ", options: { color: S.text2 } }, { text: "O(n log n)", options: { bold: true, color: S.accent1 } },
    { text: " em qualquer caso  ·  Estável  ·  Usa memória auxiliar O(n)" }], "complexidade merge");
  s.addNotes("PESSOA 2 (3:00 a 5:30). O bottom-up não divide nada: cada número já é um bloco ordenado. Em cada passada ele junta blocos vizinhos, comparando o primeiro de cada um, e a largura dobra: 2, 4, 8. Com 9 números são 4 passadas; com 300 mil, 19. Cada passada percorre tudo: n log n, sempre. Precisa de um vetor auxiliar e é estável.");

  // ===== 5. Quicksort ========================================================================
  s = slideCanva(tituloDuo("Quicksort: ", "dividir em torno de um pivô"), "Algoritmos");
  const base = [7, 3, 9, 1, 6, 4, 8, 2, 5];
  linha(s, [base], 0.7, 1.75, (v) => (v === 6 ? ESTILO.pivo : ESTILO.lav), 0.62, 0.07, 0, 20);
  s.addText("↑ pivô = elemento do meio", TXT({ x: 0.7 + 4 * 0.69 - 0.1, y: 2.45, w: 3.6, h: 0.4, fontSize: 16, bold: true, color: S.accent3, objectName: "rótulo pivô" }));
  s.addText("menores ou iguais a 6", TXT({ x: 0.7, y: 3.05, w: 3.4, h: 0.35, fontSize: 16, color: CINZA, objectName: "rótulo menores" }));
  s.addText("maiores ou iguais a 6", TXT({ x: 4.43, y: 3.05, w: 3.0, h: 0.35, fontSize: 16, color: CINZA, objectName: "rótulo maiores" }));
  linha(s, [[5, 3, 2, 1, 4], [6, 8, 9, 7]], 0.7, 3.45, ESTILO.lav, 0.62, 0.07, 0.35, 20);
  s.addText("repete em cada lado", TXT({ x: 0.7, y: 4.25, w: 3.4, h: 0.35, fontSize: 16, color: CINZA, objectName: "rótulo repete" }));
  linha(s, [[1, 2, 3, 4, 5], [6, 7, 8, 9]], 0.7, 4.65, ESTILO.quick, 0.62, 0.07, 0.35, 20);
  marcadores(s, [
    "Escolhe o pivô: o elemento do meio.",
    "Dois índices andam um em direção ao outro e trocam quem está do lado errado.",
    "Repete em cada lado até tudo ficar ordenado.",
  ], 7.9, 1.7, 4.7, 3.3);
  await dica(s, 7.9, 4.75, 4.7, 1.2, "separar provas por uma nota de corte: menores de um lado, maiores do outro.");
  pilula(s, 0.7, 6.25, 6.6, 0.6, [{ text: "Média: " }, { text: "O(n log n)", options: { bold: true, color: S.accent1 } },
    { text: "  •  pior caso: " }, { text: "O(n²)", options: { bold: true, color: S.accent3 } }], "complexidade quick");
  pilula(s, 7.5, 6.25, 5.1, 0.6, [{ text: "Ordena no próprio vetor", options: { bold: true, color: S.text2 } }], "in place");
  s.addNotes("PESSOA 3 (5:30 a 8:30). O pivô é o 6, o elemento do meio. Um índice vem da esquerda procurando quem é maior ou igual a 6, outro vem da direita procurando quem é menor ou igual, e os dois trocam. Quando se cruzam, a esquerda tem 5 3 2 1 4 e a direita 6 8 9 7. Repete em cada lado. Não usa vetor extra.");

  // ===== 6. Complexidade ====================================================================
  s = slideCanva("Complexidade e desempenho", "Algoritmos");
  const ops = NS.map((n) => ({ nlogn: n * Math.log2(n), n2: n * n }));
  s.addChart(pres.charts.LINE, [
    { name: "n log n (Merge sempre; Quick na média)", labels: NS.map(mil), values: ops.map((o) => o.nlogn) },
    { name: "n² (Quick com pivô ruim)", labels: NS.map(mil), values: ops.map((o) => o.n2) },
  ], {
    ...chartBase(), x: 0.6, y: 1.5, w: 7.2, h: 5.1, chartColors: [T.accent1, T.accent2], lineSize: 4, lineDataSymbol: "circle", lineDataSymbolSize: 10,
    valAxisLogScaleBase: 10, valAxisLabelFormatCode: "#,##0", title: "Passos de comparação (escala log)", legendFontSize: 14,
    objectName: "gráfico complexidade",
  });
  marcadores(s, [
    "Mergesort: O(n log n) no melhor, médio e pior caso.",
    "Quicksort: O(n log n) na média, mas O(n²) com pivô ruim.",
    { text: `Com 300.000 itens: n log n ≈ ${br(ops[4].nlogn / 1e6, 1)} milhões de passos; n² ≈ ${br(ops[4].n2 / 1e9, 0)} bilhões.`, options: { bold: true } },
  ], 8.1, 1.7, 4.5, 3.4);
  await dica(s, 8.1, 5.15, 4.5, 1.4, "n² é uma festa de 300 mil pessoas em que todos cumprimentam todos.");
  s.addNotes("PESSOA 3 (até 8:30). A teoria: os dois são n log n no caso médio, mas o Quicksort pode virar n ao quadrado se o pivô for sempre o menor ou o maior. Com 300 mil itens a diferença entre as curvas é de milhões contra bilhões de passos.");

  // ===== 7. Resultados ======================================================================
  pres.addSection({ title: "Resultados" });
  s = slideCanva("Resultados: tempo médio de 20 amostras", "Resultados");
  const cab = (t, al = "center") => ({ text: t, options: { bold: true, color: S.background1, fill: { color: T.dk2 }, align: al } });
  const linhasTab = [[cab("Itens", "left"), cab("Mergesort (ms)"), cab("Quicksort (ms)"), cab("Resultado")]];
  NS.forEach((n) => {
    const res = sobrepoe(n) ? "Empate técnico" : `Quick ${br(difQ(n), 0)}% mais rápido`;
    const res2 = n === 300000 ? `Quick ${br(difQ(n), 0)}% mais rápido` : res;
    const dest = n >= 30000;
    linhasTab.push([
      { text: mil(n), options: { align: "left", bold: true, color: S.text2 } },
      { text: br(M(n).media), options: { align: "center" } },
      { text: br(Q(n).media), options: { align: "center" } },
      { text: res2, options: { align: "center", bold: dest, color: dest ? S.accent3 : S.text1 } },
    ]);
  });
  s.addTable(linhasTab, {
    x: 0.7, y: 1.6, w: 8.3, colW: [1.5, 2.1, 2.1, 2.6], rowH: 0.68, fontSize: 20, fontFace: THEME.bodyFontFace, color: T.dk1,
    valign: "middle", border: { type: "solid", pt: 1, color: "C9CBE0" }, fill: { color: "FFFFFF" }, margin: [0, 0.12, 0, 0.12], objectName: "tabela médias",
  });
  cartao(s, 9.4, 1.6, 3.2, 2.35, T.accent3, "destaque 300 mil");
  s.addText([
    { text: `${br(difQ(300000), 0)}%`, options: { fontSize: 60, bold: true, color: S.background1, breakLine: true, fontFace: THEME.headFontFace } },
    { text: "Quick mais rápido com 300.000 dados", options: { fontSize: 18, color: S.background1 } },
  ], TXT({ x: 9.65, y: 1.7, w: 2.75, h: 2.15, valign: "middle", objectName: "texto destaque" }));
  cartao(s, 9.4, 4.15, 3.2, 1.95, T.accent4, "destaque empate");
  s.addText([
    { text: "Até 3.000 dados", options: { bold: true, color: S.text2, breakLine: true } },
    { text: "diferenças dentro da variação das medições", options: { fontSize: 18 } },
  ], TXT({ x: 9.65, y: 4.25, w: 2.75, h: 1.75, valign: "middle", objectName: "texto empate" }));
  s.addText("Tempos em milissegundos · mesmas entradas para os dois algoritmos", TXT({ x: 0.7, y: 6.0, w: 8.3, h: 0.4, fontSize: 16, color: CINZA, objectName: "nota tabela" }));
  s.addNotes(`PESSOA 4 (8:30 a 11:30). Até 3 mil itens os dois empatam: a diferença é menor que a variação das medições. A partir de 30 mil o Quicksort ganha sempre: ${br(difQ(30000), 1)}% em 30 mil e ${br(difQ(300000), 1)}% em 300 mil. Uma piscada de olho dura uns 100 ms; os dois ordenam 300 mil números em menos de um terço disso.`);

  // ===== 8. Estatística descritiva (300.000) =================================================
  s = slideCanva("Estatística descritiva: 300.000 dados", "Resultados");
  const cabE = (t) => ({ text: t, options: { bold: true, color: S.background1, fill: { color: T.dk2 }, align: "center" } });
  const linhaE = (nome, e) => [
    { text: nome, options: { align: "left", bold: true, color: S.text2 } },
    ...[br(e.media), br(e.mediana), br(e.desvio), br(e.variancia), br(e.cv, 1), `${br(e.maximo)} / ${br(e.minimo)}`].map((t) => ({ text: t, options: { align: "center" } })),
  ];
  s.addTable([
    [cabE("Algoritmo"), cabE("Média (ms)"), cabE("Mediana (ms)"), cabE("Desvio (ms)"), cabE("Variância (ms²)"), cabE("CV (%)"), cabE("Máx / Mín (ms)")],
    linhaE("Mergesort bottom-up", M(300000)), linhaE("Quicksort clássico", Q(300000)),
  ], {
    x: 0.7, y: 1.6, w: 11.9, colW: [2.4, 1.45, 1.6, 1.45, 1.75, 1.15, 2.1], rowH: [0.8, 0.75, 0.75], fontSize: 20, fontFace: THEME.bodyFontFace, color: T.dk1,
    valign: "middle", border: { type: "solid", pt: 1, color: "C9CBE0" }, fill: { color: "FFFFFF" }, margin: [0, 0.08, 0, 0.08], objectName: "tabela estatística",
  });
  [[`${br(difMd(300000), 0)}%`, "mediana menor no Quicksort"],
   [`${br(M(300000).cv, 0)}% e ${br(Q(300000).cv, 0)}%`, "de variação (CV): dispersão moderada"],
   ["5 tabelas", "uma por tamanho, estão no artigo"]].forEach(([v, t], i) => {
    const x = 0.7 + i * 4.05;
    cartao(s, x, 4.15, 3.8, 1.35, i === 0 ? T.accent6 : T.accent5, "estatística " + i);
    s.addText([{ text: v, options: { fontSize: 30, bold: true, color: S.accent3, breakLine: true, fontFace: THEME.headFontFace } }, { text: t, options: { fontSize: 18 } }],
      TXT({ x: x + 0.25, y: 4.2, w: 3.3, h: 1.25, valign: "middle", objectName: "estatística texto " + i }));
  });
  await dica(s, 0.7, 5.75, 11.9, 0.85, "a mediana é o aluno do meio da fila: não muda se um único aluno chegar muito atrasado.");
  s.addNotes("PESSOA 4. A tabela segue o formato pedido: média, mediana, desvio padrão, variância, coeficiente de variação e máximo e mínimo. O CV mostra a variação em porcentagem da média. As tabelas dos cinco tamanhos estão no artigo.");

  // ===== 9. Boxplot ========================================================================
  s = slideCanva("Boxplot: distribuição das 20 amostras", "Resultados");
  s.addImage({ path: path.join(ASSETS, "boxplot.png"), x: 0.55, y: 1.45, w: 12.2, h: (12.2 * 4.6) / 12.4, altText: "Boxplot dos tempos por tamanho", objectName: "boxplot" });
  pilula(s, 0.7, 6.15, 11.9, 0.7, [
    { text: "Até 3.000: ", options: { bold: true, color: S.text2 } }, { text: "caixas se sobrepõem → empate.   " },
    { text: "30.000 e 300.000: ", options: { bold: true, color: S.accent3 } }, { text: "Quick mais baixo → mais rápido." }], "leitura boxplot");
  s.addNotes("PESSOA 4 (até 11:30). Cada caixa vai do primeiro ao terceiro quartil e a linha do meio é a mediana. Onde as caixas se sobrepõem, consideramos empate. Em 30 mil as caixas se separam; em 300 mil a do Quicksort fica mais embaixo. Os pontinhos são medições atípicas, mais lentas por interferência do sistema.");

  // ===== 10. Crescimento ===================================================================
  s = slideCanva("O crescimento confirma n log n", "Resultados");
  s.addChart(pres.charts.BAR, [
    { name: "Mergesort bottom-up", labels: NS.map(mil), values: NS.map((n) => M(n).media) },
    { name: "Quicksort clássico", labels: NS.map(mil), values: NS.map((n) => Q(n).media) },
  ], {
    ...chartBase(), x: 0.6, y: 1.5, w: 7.6, h: 5.1, barDir: "col", barGrouping: "clustered", barGapWidthPct: 50,
    chartColors: [T.accent1, T.accent2], valAxisLogScaleBase: 10, valAxisLabelFormatCode: "General", valAxisMinVal: 0.0001,
    title: "Tempo médio (ms), escala log", objectName: "gráfico crescimento",
  });
  [[`×${br(Math.min(...razoes), 0)} a ×${br(Math.max(...razoes), 0)}`, "tempo medido quando os dados crescem ×10", S.accent1],
   [`×${br(Math.min(...prev), 0)} a ×${br(Math.max(...prev), 0)}`, "previsto pela fórmula n log n", S.accent3],
   ["×100", "seria um algoritmo n²", S.text1]].forEach(([v, t, cor], i) => {
    const y = 1.65 + i * 1.6;
    s.addText(v, TXT({ x: 8.6, y, w: 4.0, h: 0.75, fontSize: 40, bold: true, color: cor, fontFace: THEME.headFontFace, objectName: "valor " + i }));
    s.addText(t, TXT({ x: 8.6, y: y + 0.75, w: 4.0, h: 0.6, fontSize: 18, objectName: "rótulo " + i }));
  });
  s.addNotes("PESSOA 5 (11:30 a 14:00). Em escala log, as barras sobem em degraus quase iguais. Quando os dados crescem 10 vezes, o tempo cresceu entre 11 e 15 vezes, bem perto do que n log n prevê. Se fosse n ao quadrado, seriam 100 vezes.");

  // ===== 11. Outras entradas ================================================================
  s = slideCanva("Outros tipos de entrada (300.000 dados)", "Resultados");
  const rotCen = { aleatorio: "Aleatória", ordenado: "Já ordenada", inverso: "Invertida", repetidos: "Muitos repetidos" };
  s.addChart(pres.charts.BAR, [
    { name: "Mergesort bottom-up", labels: CEN.map((c) => rotCen[c]), values: CEN.map((c) => C[c].mergesort.media) },
    { name: "Quicksort clássico", labels: CEN.map((c) => rotCen[c]), values: CEN.map((c) => C[c].quicksort.media) },
  ], {
    ...chartBase(), x: 0.6, y: 1.5, w: 7.6, h: 5.1, barDir: "col", barGrouping: "clustered", barGapWidthPct: 50,
    chartColors: [T.accent1, T.accent2], showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0.0",
    dataLabelFontSize: 14, dataLabelColor: T.dk1, dataLabelFontFace: "+mn-lt", title: "Tempo médio (ms)", objectName: "gráfico entradas",
  });
  cartao(s, 8.6, 1.6, 4.0, 2.2, T.accent3, "destaque entradas");
  s.addText([
    { text: `${br(Math.min(...outrasDif), 0)}% a ${br(Math.max(...outrasDif), 0)}%`, options: { fontSize: 40, bold: true, color: S.background1, breakLine: true, fontFace: THEME.headFontFace } },
    { text: "Quick mais rápido com dados ordenados, invertidos ou repetidos", options: { fontSize: 17, color: S.background1 } },
  ], TXT({ x: 8.85, y: 1.7, w: 3.5, h: 2.0, valign: "middle", objectName: "texto entradas" }));
  marcadores(s, ["Em vetor já ordenado, o elemento do meio é o pivô ideal: quase nenhuma troca."], 8.6, 4.05, 4.0, 1.1, 18);
  await dica(s, 8.6, 5.3, 4.0, 1.3, "arrumar uma estante que já está quase em ordem é rápido.");
  s.addNotes("PESSOA 5. Testamos também entradas que não são aleatórias, com a opção 3 do painel. O Quicksort ganhou nas quatro. Com o vetor já ordenado, o pivô do meio divide exatamente ao meio, por isso não cai no pior caso.");

  // ===== 12. Vantagens e desvantagens ======================================================
  pres.addSection({ title: "Conclusão" });
  s = slideCanva("Vantagens e desvantagens", "Conclusão");
  [["MERGESORT", T.accent5, S.text2, [
     { text: "Tempo garantido: ", b: "O(n log n) sempre" }, { text: "Estável: ", b: "mantém a ordem dos iguais" },
     { text: "Bottom-up: ", b: "sem recursão" }, { text: "Desvantagem: ", b: "memória extra O(n) e cópias", neg: true }]],
   ["QUICKSORT", T.accent6, S.accent3, [
     { text: "Mais rápido: ", b: `até ${br(difQ(300000), 0)}% no nosso teste` }, { text: "Pouca memória: ", b: "ordena no próprio vetor" },
     { text: "Desvantagem: ", b: "O(n²) com pivô ruim", neg: true }, { text: "Desvantagem: ", b: "não é estável", neg: true }]]].forEach(([nome, fundo, cor, itens], k) => {
    const x = 0.7 + k * 6.05;
    cartao(s, x, 1.6, 5.85, 4.95, fundo, "cartão " + nome);
    s.addText(nome, TXT({ x: x + 0.4, y: 1.8, w: 5.0, h: 0.8, fontSize: 36, bold: true, color: cor, fontFace: THEME.headFontFace, objectName: "título " + nome }));
    s.addText(itens.map((it, i) => ({ text: it.text + it.b, options: { bullet: { indent: 18 }, breakLine: i < itens.length - 1, color: it.neg ? S.accent3 : S.text1 } })),
      TXT({ x: x + 0.4, y: 2.8, w: 5.1, h: 3.5, fontSize: 21, paraSpaceAfter: 14, objectName: "itens " + nome }));
  });
  s.addNotes("PESSOA 5. Resumo dos dois lados: o Mergesort garante o tempo e é estável, mas gasta memória e faz cópias, por isso foi mais lento. O Quicksort foi mais rápido e usa pouca memória, mas depende de um bom pivô e não é estável.");

  // ===== 13. Qual escolher + Obrigado =======================================================
  s = slideCanva("Qual algoritmo escolher?", "Conclusão");
  marcadores(s, [
    { text: "Quicksort: quando importa velocidade e pouca memória.", options: { bold: false } },
    "Mergesort: quando precisa de estabilidade e tempo garantido.",
    "A escolha depende de memória, estabilidade e dos dados.",
  ], 0.7, 1.7, 6.6, 2.9, 21);
  s.addText([{ text: "Curiosidade: ", options: { bold: true, color: S.accent3 } },
    { text: "um pivô mal escolhido pode transformar o Quicksort em um algoritmo quadrático." }],
    TXT({ x: 0.7, y: 4.55, w: 6.6, h: 0.95, fontSize: 19, objectName: "curiosidade" }));
  s.addText("Obrigado!", TXT({ x: 0.7, y: 5.7, w: 6.0, h: 1.0, fontSize: 54, bold: true, color: S.text2, fontFace: THEME.headFontFace, objectName: "obrigado" }));
  // placa de direção, como no Canva
  s.addShape(pres.shapes.RECTANGLE, { x: 10.0, y: 1.9, w: 0.16, h: 4.6, fill: { color: T.dk2 }, line: { color: T.dk2 }, objectName: "poste" });
  s.addText("MERGESORT", { shape: pres.shapes.PENTAGON, flipH: true, x: 7.75, y: 2.3, w: 2.25, h: 0.8, fill: { color: T.dk2 }, line: { color: T.dk2 },
    color: S.background1, fontSize: 20, bold: true, align: "center", valign: "middle", margin: 0, objectName: "placa merge" });
  s.addText("QUICKSORT", { shape: pres.shapes.PENTAGON, x: 10.16, y: 2.3, w: 2.25, h: 0.8, fill: { color: T.accent3 }, line: { color: T.accent3 },
    color: S.background1, fontSize: 20, bold: true, align: "center", valign: "middle", margin: 0, objectName: "placa quick" });
  s.addText([{ text: "garantia", options: { breakLine: true } }, { text: "e estabilidade" }], TXT({ x: 7.75, y: 3.25, w: 2.15, h: 0.8, fontSize: 17, align: "center", color: S.text2, objectName: "rótulo garantia" }));
  s.addText([{ text: "velocidade", options: { breakLine: true } }, { text: "e pouca memória" }], TXT({ x: 10.3, y: 3.25, w: 2.15, h: 0.8, fontSize: 17, align: "center", color: S.accent3, objectName: "rótulo velocidade" }));
  s.addNotes("PESSOA 5 (até 14:00). Não existe algoritmo vencedor para tudo: o Quicksort é a escolha para velocidade, o Mergesort para garantia e estabilidade. Agradecer e abrir para perguntas (14:00 a 15:00); cada um responde sobre a sua parte.");

  fs.mkdirSync(path.dirname(SAIDA), { recursive: true });
  await pres.writeFile({ fileName: SAIDA });
  await aplicarTema(SAIDA, THEME);
  console.log("Slides gerados em " + SAIDA);
}

// O pptxgenjs grava a paleta do Office no tema; aqui escrevemos as cores do Canva no theme1.xml.
async function aplicarTema(arquivo, tema) {
  const JSZip = require(require.resolve("jszip", { paths: [require.resolve("pptxgenjs")] }));
  const zip = await JSZip.loadAsync(fs.readFileSync(arquivo));
  const ordem = ["dk1", "lt1", "dk2", "lt2", "accent1", "accent2", "accent3", "accent4", "accent5", "accent6", "hlink", "folHlink"];
  const esquema = `<a:clrScheme name="${tema.name}">` + ordem.map((k) => `<a:${k}><a:srgbClr val="${tema.colors[k]}"/></a:${k}>`).join("") + "</a:clrScheme>";
  for (const n of Object.keys(zip.files).filter((f) => /^ppt\/theme\/theme\d+\.xml$/.test(f))) {
    const xml = (await zip.file(n).async("string")).replace(/<a:clrScheme [\s\S]*?<\/a:clrScheme>/, esquema);
    zip.file(n, xml);
  }
  fs.writeFileSync(arquivo, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}

main().catch((e) => { console.error(e); process.exit(1); });
