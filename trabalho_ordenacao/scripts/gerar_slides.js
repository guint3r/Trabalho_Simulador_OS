// Gera apresentacao/slides.pptx a partir dos CSVs em resultados/.
// Pensado para projetor em parede branca: fundo branco, texto quase preto, fonte mínima de 20 pt.
// Requer: npm install pptxgenjs react-icons react react-dom sharp
// Uso (na pasta do projeto): node scripts/gerar_slides.js
const fs = require("fs");
const path = require("path");
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa");

const RAIZ = path.join(__dirname, "..");
const RES = path.join(RAIZ, "resultados");
const SAIDA = path.join(RAIZ, "apresentacao", "slides.pptx");

// ---------------------------------------------------------------- dados
function lerResumo(arq) {
  const linhas = fs.readFileSync(arq, "utf8").trim().split(/\r?\n/).slice(1);
  const r = {};
  for (const l of linhas) {
    const [alg, n, media, desvio] = l.split(",");
    r[`${alg}:${n}`] = { media: +media, desvio: +desvio };
  }
  return r;
}
const RESUMO = lerResumo(path.join(RES, "resultados_resumo.csv"));
const NS = [30, 300, 3000, 30000, 300000];
const CENARIOS = ["aleatorio", "ordenado", "inverso", "repetidos"];
const ROT_CEN = { aleatorio: "Aleatória", ordenado: "Já ordenada", inverso: "Invertida", repetidos: "Muitos repetidos" };
const CEN = {};
for (const c of CENARIOS) {
  const arq = path.join(RES, `cenario_${c}`, "resultados_resumo.csv");
  if (fs.existsSync(arq)) CEN[c] = lerResumo(arq);
}
const TEM_CENARIOS = Object.keys(CEN).length === 4;

const milhar = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const num = (v, casas) => v.toFixed(casas).replace(".", ",");
const ms = (v) => (v < 0.01 ? num(v, 4) : v < 1 ? num(v, 3) : num(v, 1));
const m = (n) => RESUMO[`mergesort:${n}`].media;
const q = (n) => RESUMO[`quicksort:${n}`].media;
const ganho = (n) => ((m(n) - q(n)) / m(n)) * 100;
const comp = (n) => {
  const g = ganho(n);
  return Math.abs(g) < 3 ? "empate" : `${num(Math.abs(g), 0)}% mais ${g > 0 ? "rápido" : "lento"}`;
};
const GANHO = num(ganho(300000), 0);
const razaoM = m(300000) / m(30000);
const prevNlogN = (10 * Math.log(300000)) / Math.log(30000);
const cen = (c, alg) => CEN[c][`${alg}:300000`].media;

// ---------------------------------------------------------------- tema (alto contraste)
const THEME = {
  name: "Ordenacao",
  headFontFace: "Arial",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "111111", lt1: "FFFFFF", dk2: "3A3F47", lt2: "F1F3F6",
    accent1: "1F66C2", accent2: "D9541E", accent3: "3A3F47", accent4: "13834F",
    accent5: "B27800", accent6: "5240C2", hlink: "1F66C2", folHlink: "5240C2",
  },
};
const T = THEME.colors;
const BORDA = "C9CED6";

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13,333 x 7,5 pol
pres.title = "Mergesort × Quicksort";
pres.author = "Grupo";
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
const C = pres.SchemeColor;

// ---------------------------------------------------------------- layouts
pres.defineSlideMaster({
  title: "CAPA",
  background: { color: T.lt1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.8, y: 2.75, w: 11.7, h: 1.3, fontSize: 60, bold: true, color: C.text1, fontFace: THEME.headFontFace, align: "left", valign: "middle", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: 0.8, y: 4.15, w: 11.7, h: 0.8, fontSize: 28, color: C.text2, align: "left", valign: "top", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "integrantes", type: "body", x: 0.8, y: 6.1, w: 11.7, h: 0.5, fontSize: 22, color: C.text1, align: "left", valign: "top", margin: 0 }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "CONTEUDO",
  background: { color: T.lt1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.35, w: 12.13, h: 1.0, fontSize: 40, bold: true, color: C.text1, fontFace: THEME.headFontFace, align: "left", valign: "middle", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "orador", type: "body", x: 0.6, y: 6.95, w: 4, h: 0.35, fontSize: 14, bold: true, color: C.text2, align: "left", valign: "middle", margin: 0 }, text: "" } },
  ],
  slideNumber: { x: 12.13, y: 6.95, w: 0.6, h: 0.35, fontSize: 14, color: T.dk2, align: "right" },
});

// ---------------------------------------------------------------- utilidades
async function icone(Comp, corHex, px = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { color: "#" + corHex, size: px }));
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

async function iconeCirculo(slide, Comp, x, y, d, cor, nome) {
  slide.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: cor }, line: { color: cor }, objectName: nome + " círculo" });
  const p = d * 0.27;
  slide.addImage({ data: await icone(Comp, "FFFFFF"), x: x + p, y: y + p, w: d - 2 * p, h: d - 2 * p, altText: nome, objectName: nome + " ícone" });
}

function cartao(slide, x, y, w, h, nome, opts = {}) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h, rectRadius: 0.12,
    fill: { color: opts.fill || T.lt2 }, line: { color: opts.line || BORDA, width: opts.lineW || 1 }, objectName: nome,
  });
}

// Quadro "No dia a dia": o motivo que se repete em todo slide
async function diaADia(slide, x, y, w, h, texto) {
  cartao(slide, x, y, w, h, "dia a dia", { fill: "FFF6EF", line: "F0B999", lineW: 1.25 });
  await iconeCirculo(slide, fa.FaLightbulb, x + 0.25, y + 0.25, 0.6, T.accent2, "dia a dia");
  slide.addText("No dia a dia", { x: x + 1.0, y: y + 0.25, w: w - 1.2, h: 0.6, fontSize: 20, bold: true, color: C.text1, valign: "middle", margin: 0, isTextBox: true, objectName: "dia a dia título" });
  slide.addText(texto, { x: x + 0.25, y: y + 1.0, w: w - 0.5, h: h - 1.15, fontSize: 20, color: C.text1, valign: "top", margin: 0, isTextBox: true, objectName: "dia a dia texto" });
}

// "Vetor": células com números (motivo dos algoritmos)
const CW = 0.62, CH = 0.52, CG = 0.06, GG = 0.3;
function larguraGrupos(grupos) {
  const cel = grupos.reduce((s, g) => s + g.length, 0);
  return cel * CW + (cel - grupos.length) * CG + (grupos.length - 1) * GG;
}
function desenharVetor(slide, grupos, xCentro, y, estilo, nome) {
  let x = xCentro - larguraGrupos(grupos) / 2;
  grupos.forEach((g, gi) => {
    g.forEach((v, i) => {
      const e = typeof estilo === "function" ? estilo(v, gi, i) : estilo;
      slide.addText(String(v), {
        shape: pres.shapes.ROUNDED_RECTANGLE, rectRadius: 0.08,
        x, y, w: CW, h: CH, fill: { color: e.fill }, line: { color: e.line || e.fill, width: e.line ? 2.5 : 1 },
        color: e.text, fontSize: 20, bold: true, align: "center", valign: "middle", margin: 0, objectName: `${nome} ${v}`,
      });
      x += CW + (i < g.length - 1 ? CG : 0);
    });
    x += GG;
  });
}
function rotuloLinha(slide, texto, y) {
  slide.addText(texto, { x: 0.6, y: y - 0.05, w: 2.0, h: CH + 0.1, fontSize: 20, bold: true, color: C.text1, valign: "middle", margin: 0, isTextBox: true, objectName: "rótulo " + texto });
}

const NEUTRO = { fill: T.lt2, text: T.dk1, line: BORDA };
const AZUL = { fill: T.accent1, text: T.lt1 };
const LARANJA = { fill: T.accent2, text: T.lt1 };
const VETOR = [38, 27, 43, 3, 9, 82, 10, 15];
const ORDENADO = [3, 9, 10, 15, 27, 38, 43, 82];
const PESSOA = (n) => `Pessoa ${n}  ·  Mergesort × Quicksort`;

function conteudo(secao, titulo, pessoa) {
  const s = pres.addSlide({ masterName: "CONTEUDO", sectionTitle: secao });
  s.addText(titulo, { placeholder: "title" });
  s.addText(PESSOA(pessoa), { placeholder: "orador" });
  return s;
}

// ---------------------------------------------------------------- slides
async function main() {
  // ===== 1. Capa
  pres.addSection({ title: "Abertura" });
  let s = pres.addSlide({ masterName: "CAPA", sectionTitle: "Abertura" });
  s.addText("Mergesort × Quicksort", { placeholder: "title" });
  s.addText("Quem ordena mais rápido? Medimos 200 ordenações em C++", { placeholder: "body" });
  s.addText("Juan  ·  Joao Vitor  ·  Jefferson  ·  Guilherme S  ·  Igor Jesus", { placeholder: "integrantes" });
  desenharVetor(s, [VETOR], 0.8 + larguraGrupos([VETOR]) / 2, 0.9, NEUTRO, "capa vetor");
  desenharVetor(s, [ORDENADO.slice(0, 4), ORDENADO.slice(4)], 0.8 + larguraGrupos([ORDENADO.slice(0, 4), ORDENADO.slice(4)]) / 2, 1.55, (v, g) => (g === 0 ? AZUL : LARANJA), "capa ordenado");
  s.addNotes(
    "PESSOA 1 (0:00 a 2:30). Boa tarde. Comparamos dois algoritmos de ordenação muito usados, o Mergesort e o Quicksort. " +
      "A pergunta é simples: na prática, qual ordena mais rápido? Implementamos os dois em C++ e medimos 200 ordenações."
  );

  // ===== 2. Por que ordenar
  s = conteudo("Abertura", "Ordenar é o primeiro passo de quase tudo", 1);
  const usos = [
    [fa.FaSearch, "Busca rápida", "Busca binária só funciona com os dados em ordem"],
    [fa.FaDatabase, "Bancos de dados", "Índices e ORDER BY ordenam o tempo todo"],
    [fa.FaListOl, "Rankings", "Notas, preços, tabela do campeonato"],
  ];
  for (let i = 0; i < usos.length; i++) {
    const y = 1.6 + i * 1.75;
    cartao(s, 0.6, y, 7.6, 1.5, "cartão " + usos[i][1]);
    await iconeCirculo(s, usos[i][0], 0.9, y + 0.33, 0.85, T.dk1, usos[i][1]);
    s.addText([
      { text: usos[i][1], options: { bold: true, fontSize: 24, color: C.text1, breakLine: true } },
      { text: usos[i][2], options: { fontSize: 20, color: C.text2 } },
    ], { x: 2.0, y: y + 0.12, w: 6.0, h: 1.26, valign: "middle", margin: 0, isTextBox: true, objectName: "texto " + usos[i][1] });
  }
  await diaADia(s, 8.6, 1.6, 4.13, 4.9,
    "Achar um nome na lista de chamada é rápido porque ela está em ordem alfabética. Fora de ordem, você teria que ler a lista inteira.");
  s.addNotes(
    "PESSOA 1. Ordenação aparece em todo lugar: busca binária, bancos de dados, rankings. " +
      "Os dois algoritmos têm a mesma complexidade média, n log n, mas isso não diz qual é mais rápido na prática. Por isso medimos."
  );

  // ===== 3. Metodologia
  s = conteudo("Abertura", "Como testamos: 200 ordenações", 1);
  const stats = [
    ["5", "tamanhos", "de 30 a 300.000"],
    ["20", "repetições", "por tamanho"],
    ["200", "ordenações", "no total"],
    ["42", "semente fixa", "dados iguais"],
  ];
  stats.forEach(([n, rot, sub], i) => {
    const x = 0.6 + i * 3.1;
    cartao(s, x, 1.6, 2.83, 2.5, "estatística " + rot);
    s.addText([
      { text: n, options: { fontSize: 66, bold: true, color: C.text1, breakLine: true, fontFace: THEME.headFontFace } },
      { text: rot, options: { fontSize: 22, bold: true, color: C.text1, breakLine: true } },
      { text: sub, options: { fontSize: 20, color: C.text2 } },
    ], { x: x + 0.3, y: 1.7, w: 2.3, h: 2.3, valign: "middle", margin: 0, isTextBox: true, objectName: "número " + rot });
  });
  s.addText([
    { text: "Regras iguais para os dois: ", options: { bold: true } },
    { text: "a mesma entrada, o mesmo compilador (g++ -O2) e todo resultado conferido." },
  ], { x: 0.6, y: 4.45, w: 6.4, h: 2.05, fontSize: 22, color: C.text1, valign: "top", margin: 0, isTextBox: true, objectName: "regras" });
  await diaADia(s, 7.3, 4.4, 5.43, 2.2, "Semente fixa é dar a mesma prova para todos os alunos: só assim a comparação é justa.");
  s.addNotes(
    "PESSOA 1. 5 tamanhos, de 30 a 300 mil, 20 repetições cada, para os dois algoritmos: 200 ordenações. " +
      "Os números são aleatórios, mas com semente fixa 42: quem rodar o programa recebe exatamente os mesmos dados. " +
      "Os dois ordenam cópias da mesma entrada e conferimos se saiu ordenado. Agora a Pessoa 2 com o Mergesort."
  );

  // ===== 4. Mergesort: como funciona
  pres.addSection({ title: "Mergesort" });
  s = conteudo("Mergesort", "Mergesort: divide, depois junta", 2);
  {
    const xc = 2.65 + 6.3 / 2;
    const linhas = [
      ["vetor", [VETOR], NEUTRO],
      ["dividir", [[38, 27, 43, 3], [9, 82, 10, 15]], NEUTRO],
      ["dividir", [[38, 27], [43, 3], [9, 82], [10, 15]], NEUTRO],
      ["juntar", [[27, 38], [3, 43], [9, 82], [10, 15]], AZUL],
      ["juntar", [[3, 27, 38, 43], [9, 10, 15, 82]], AZUL],
      ["pronto", [ORDENADO], AZUL],
    ];
    linhas.forEach(([rot, grupos, est], i) => {
      const y = 1.6 + i * 0.84;
      rotuloLinha(s, rot, y);
      desenharVetor(s, grupos, xc, y, est, `merge linha ${i + 1}`);
    });
  }
  await diaADia(s, 9.25, 1.6, 3.48, 4.95,
    "Arrumar um baralho: divida em montinhos de 1 carta e vá juntando dois montes já arrumados, olhando só a carta de cima de cada um.");
  s.addNotes(
    "PESSOA 2 (2:30 a 5:00). O Mergesort corta o vetor ao meio até sobrar um elemento em cada pedaço, que já está ordenado. " +
      "Depois junta os pedaços dois a dois: compara o primeiro de cada um e pega o menor. Cinza é dividir, azul é juntar. " +
      "No código: funções mergesortRec e intercalar."
  );

  // ===== 5. Mergesort: custo
  s = conteudo("Mergesort", "Mergesort: previsível e estável", 2);
  const custosM = [
    [fa.FaClock, "Sempre n log n", "300.000 itens: só 19 níveis de divisão, em qualquer caso."],
    [fa.FaMemory, "Gasta memória", "Vetor extra do mesmo tamanho: ~1,2 MB para 300.000 números."],
    [fa.FaBalanceScale, "Estável", "Itens iguais mantêm a ordem em que chegaram."],
  ];
  for (let i = 0; i < custosM.length; i++) {
    const x = 0.6 + i * 3.0;
    cartao(s, x, 1.6, 2.8, 3.95, "cartão " + custosM[i][1]);
    await iconeCirculo(s, custosM[i][0], x + 0.25, 1.85, 0.75, T.accent1, custosM[i][1]);
    s.addText([
      { text: custosM[i][1], options: { bold: true, fontSize: 24, color: C.text1, breakLine: true } },
      { text: custosM[i][2], options: { fontSize: 20, color: C.text1 } },
    ], { x: x + 0.25, y: 2.75, w: 2.35, h: 2.7, valign: "top", margin: 0, isTextBox: true, objectName: "texto " + custosM[i][1] });
  }
  await diaADia(s, 9.65, 1.6, 3.08, 4.95,
    "Memória extra: precisa de uma mesa a mais para juntar as cartas.\n\nEstável: como a fila do banco, quem chegou antes continua na frente.");
  s.addText("Resumo: nunca surpreende, mas ocupa espaço.", {
    x: 0.6, y: 5.75, w: 8.8, h: 0.8, fontSize: 24, bold: true, color: C.text1, valign: "middle", margin: 0, isTextBox: true, objectName: "resumo merge",
  });
  s.addNotes(
    "PESSOA 2. Como o vetor é cortado ao meio, são log de n níveis: para 300 mil, 19. Em cada nível passa por todos os elementos: n log n, sempre. " +
      "O preço é memória: um vetor auxiliar do mesmo tamanho. E é estável: itens iguais não trocam de ordem. Agora a Pessoa 3 com o Quicksort."
  );

  // ===== 6. Quicksort: como funciona
  pres.addSection({ title: "Quicksort" });
  s = conteudo("Quicksort", "Quicksort: escolhe um corte e separa", 3);
  {
    const xc = 2.65 + 6.3 / 2;
    const linhas = [
      ["pivô = 15", [VETOR], (v, g, i) => (v === 15 ? LARANJA : i === 0 || i === 3 ? { fill: T.lt1, text: T.dk1, line: T.accent2 } : NEUTRO)],
      ["separar", [[15, 10, 9, 3], [43, 82, 27, 38]], NEUTRO],
      ["repetir", [[3, 9, 10, 15], [27, 38, 43, 82]], LARANJA],
      ["pronto", [ORDENADO], LARANJA],
    ];
    linhas.forEach(([rot, grupos, est], i) => {
      const y = 1.7 + i * 1.05;
      rotuloLinha(s, rot, y);
      desenharVetor(s, grupos, xc, y, est, `quick linha ${i + 1}`);
    });
  }
  s.addText("Pivô = o do meio entre o 1º, o central e o último (38, 3 e 15).", {
    x: 0.6, y: 5.95, w: 8.4, h: 0.6, fontSize: 20, color: C.text1, valign: "middle", margin: 0, isTextBox: true, objectName: "nota pivô",
  });
  await diaADia(s, 9.25, 1.6, 3.48, 4.95,
    "Separar provas por uma nota de corte: menores numa pilha, maiores na outra. Depois repete em cada pilha. Tudo na mesma mesa.");
  s.addNotes(
    "PESSOA 3 (5:00 a 7:30). O Quicksort escolhe um pivô, a nota de corte. Usamos a mediana de três: entre 38, 3 e 15, o do meio é 15. " +
      "Menores vão para a esquerda, maiores para a direita, trocando dentro do próprio vetor. Depois repete em cada lado. Não precisa de vetor extra."
  );

  // ===== 7. Quicksort: risco
  s = conteudo("Quicksort", "Quicksort: o perigo é o pivô ruim", 3);
  const custosQ = [
    ["Na média", "n log n"],
    ["No pior caso", "n²"],
    ["Memória extra", "pouca"],
    ["Estável?", "Não"],
  ];
  custosQ.forEach(([rot, val], i) => {
    const x = 0.6 + (i % 2) * 3.15, y = 1.6 + Math.floor(i / 2) * 2.05;
    cartao(s, x, y, 2.95, 1.8, "custo " + rot);
    s.addText([
      { text: rot, options: { fontSize: 20, color: C.text2, breakLine: true } },
      { text: val, options: { fontSize: 36, bold: true, color: C.text1, fontFace: THEME.headFontFace } },
    ], { x: x + 0.25, y: y + 0.15, w: 2.5, h: 1.5, valign: "middle", margin: 0, isTextBox: true, objectName: "valor " + rot });
  });
  const ordQ = TEM_CENARIOS ? cen("ordenado", "quicksort") : null;
  cartao(s, 7.1, 1.6, 5.63, 3.85, "cartão pior caso", { fill: T.lt1, line: T.accent2, lineW: 2.5 });
  s.addText([
    { text: "Pivô ruim", options: { fontSize: 24, bold: true, color: C.text1, breakLine: true } },
    { text: "Se o corte é sempre a menor nota, uma pilha fica com quase tudo.", options: { fontSize: 20, color: C.text1, breakLine: true } },
    { text: " ", options: { fontSize: 10, breakLine: true } },
    { text: "Com 300.000 itens: ~45 bilhões de comparações (minutos).", options: { fontSize: 20, color: C.text1, breakLine: true } },
    { text: " ", options: { fontSize: 10, breakLine: true } },
    { text: ordQ ? `Nossa defesa, a mediana de três: vetor já ordenado em ${ms(ordQ)} ms.` : "Nossa defesa: mediana de três.", options: { fontSize: 20, bold: true, color: C.accent2 } },
  ], { x: 7.4, y: 1.8, w: 5.05, h: 3.5, valign: "top", margin: 0, isTextBox: true, objectName: "texto pior caso" });
  s.addText("Resumo: o mais rápido na média, se o corte for bem escolhido.", {
    x: 0.6, y: 5.75, w: 12.13, h: 0.7, fontSize: 24, bold: true, color: C.text1, valign: "middle", margin: 0, isTextBox: true, objectName: "resumo quick",
  });
  s.addNotes(
    "PESSOA 3. Na média é n log n. Mas se o pivô for sempre o menor ou o maior, cada separação tira um elemento só e vira n ao quadrado: " +
      "com 300 mil, uns 45 bilhões de comparações. A mediana de três evita isso: vetor já ordenado de 300 mil em poucos milissegundos. " +
      "Não é estável e quase não usa memória extra. Agora a Pessoa 4 mostra como medimos."
  );

  // ===== 8. Como medimos
  pres.addSection({ title: "Implementação" });
  s = conteudo("Implementação", "Como medimos sem enganar o relógio", 4);
  const passos = [
    [fa.FaRandom, "Gerar", "semente 42"],
    [fa.FaCopy, "Copiar", "mesma entrada"],
    [fa.FaStopwatch, "Cronometrar", "só a ordenação"],
    [fa.FaCheckDouble, "Conferir", "saiu ordenado?"],
    [fa.FaFileCsv, "Salvar", "CSV + relatório"],
  ];
  for (let i = 0; i < passos.length; i++) {
    const x = 0.6 + i * 2.48;
    await iconeCirculo(s, passos[i][0], x + 0.62, 1.6, 0.95, T.dk1, passos[i][1]);
    if (i < passos.length - 1) {
      s.addShape(pres.shapes.LINE, { x: x + 1.75, y: 2.075, w: 1.17, h: 0, line: { color: "6B7380", width: 2, endArrowType: "triangle" }, objectName: "seta " + i });
    }
    s.addText([
      { text: `${i + 1}. ${passos[i][1]}`, options: { fontSize: 22, bold: true, color: C.text1, breakLine: true } },
      { text: passos[i][2], options: { fontSize: 20, color: C.text2 } },
    ], { x: x - 0.05, y: 2.75, w: 2.3, h: 1.0, align: "center", valign: "top", margin: 0, isTextBox: true, objectName: "passo " + passos[i][1] });
  }
  await diaADia(s, 0.6, 4.2, 5.93, 2.4, "Aquecimento: a primeira volta do treino não conta. Descartamos 1 rodada por tamanho.");
  await diaADia(s, 6.8, 4.2, 5.93, 2.4, "Vetor pequeno é rápido demais para o cronômetro: cronometra 10 voltas e divide por 10.");
  s.addNotes(
    "PESSOA 4 (7:30 a 10:30). Para cada execução: gera o vetor, copia para os dois algoritmos, cronometra só a ordenação, confere e salva. " +
      "Dois cuidados: descartamos uma rodada de aquecimento, e vetores pequenos, que ordenam em menos de um microssegundo, " +
      "são ordenados várias vezes e o tempo é dividido (k cópias, k = 20.000 / n)."
  );

  // ===== 9. Demo
  s = conteudo("Implementação", "Demonstração: um clique e pronto", 4);
  cartao(s, 0.6, 1.6, 6.6, 4.95, "terminal", { fill: "F7F8FA", line: "6B7380", lineW: 1.5 });
  const term = [
    " PAINEL ADM - Mergesort x Quicksort",
    " ----------------------------------",
    " [1] Abrir o painel do benchmark",
    " [2] Rodar o teste padrao",
    " [3] Rodar os 4 cenarios",
    " [4] Abrir relatorio",
    " [5] Abrir slides",
    " [7] Compilar de novo",
    " [0] Sair",
    "",
    " Opcao: 2",
  ];
  s.addText(term.join("\n"), { x: 0.85, y: 1.8, w: 6.2, h: 4.6, fontFace: "Courier New", fontSize: 20, color: T.dk1, valign: "top", margin: 0, isTextBox: true, objectName: "texto terminal" });
  const demo = [
    ["1", "Duplo clique no PAINEL_ADM.bat"],
    ["2", "Opção 2: 200 ordenações em ~2 s"],
    ["3", "O relatório abre no navegador"],
  ];
  demo.forEach(([n, t], i) => {
    const y = 1.6 + i * 1.0;
    s.addText(n, { shape: pres.shapes.OVAL, x: 7.55, y, w: 0.65, h: 0.65, fill: { color: T.accent2 }, line: { color: T.accent2 }, color: T.lt1, fontSize: 22, bold: true, align: "center", valign: "middle", margin: 0, objectName: "número demo " + n });
    s.addText(t, { x: 8.4, y: y - 0.1, w: 4.33, h: 0.85, fontSize: 20, color: C.text1, valign: "middle", margin: 0, isTextBox: true, objectName: "passo demo " + n });
  });
  await diaADia(s, 7.55, 4.65, 5.18, 1.9, "Como uma receita: na 1ª vez o painel “prepara” (compila); depois é só servir.");
  s.addNotes(
    "PESSOA 4. [Abrir PAINEL_ADM.bat] Na primeira vez ele procura o compilador C++ e compila o código. A opção 2 roda as 200 ordenações em uns 2 segundos " +
      "e abre o relatório no navegador. A opção 1 deixa mudar tamanhos, repetições, semente e o tipo de entrada. " +
      "Plano B: se o PC da sala não tiver Dev-C++ ou MinGW, mostrar o print. Agora a Pessoa 5 com os resultados."
  );

  // ===== 10. Resultados
  pres.addSection({ title: "Resultados" });
  s = conteudo("Resultados", `Quicksort foi ${GANHO}% mais rápido`, 5);
  const cab = (t, al = "right") => ({ text: t, options: { bold: true, color: C.text1, fill: { color: T.lt2 }, align: al } });
  const linhasTab = [[cab("Itens", "left"), cab("Merge (ms)"), cab("Quick (ms)"), cab("Quick foi")]];
  NS.forEach((n) => {
    const dest = n === 300000;
    const ruido = n <= 300;
    const o = (al = "right") => ({ align: al, bold: dest, color: ruido ? C.text2 : C.text1 });
    linhasTab.push([
      { text: milhar(n), options: o("left") },
      { text: ms(m(n)), options: o() },
      { text: ms(q(n)), options: o() },
      { text: ruido ? "varia muito" : comp(n), options: o() },
    ]);
  });
  s.addTable(linhasTab, {
    x: 0.6, y: 1.6, w: 7.7, colW: [1.7, 1.9, 1.9, 2.2], rowH: 0.66, fontSize: 20, fontFace: THEME.bodyFontFace,
    valign: "middle", border: { type: "solid", pt: 1, color: BORDA }, margin: [0, 0.15, 0, 0.15], objectName: "tabela resultados",
  });
  cartao(s, 8.7, 1.6, 4.03, 2.35, "destaque ganho", { fill: T.accent2, line: T.accent2 });
  s.addText([
    { text: `${GANHO}%`, options: { fontSize: 72, bold: true, color: T.lt1, breakLine: true, fontFace: THEME.headFontFace } },
    { text: `${ms(q(300000))} ms contra ${ms(m(300000))} ms`, options: { fontSize: 20, bold: true, color: T.lt1 } },
  ], { x: 8.95, y: 1.7, w: 3.55, h: 2.15, valign: "middle", margin: 0, isTextBox: true, objectName: "texto ganho" });
  await diaADia(s, 8.7, 4.2, 4.03, 2.4, "Os dois ordenam 300.000 números em 1/3 de uma piscada de olho.");
  s.addText("30 e 300 itens levam microssegundos: ali a % muda a cada rodada.", {
    x: 0.6, y: 5.75, w: 7.7, h: 0.8, fontSize: 20, color: C.text2, valign: "top", margin: 0, isTextBox: true, objectName: "nota tabela",
  });
  s.addNotes(
    `PESSOA 5 (10:30 a 13:30). Nos tamanhos que importam o Quicksort ganhou sempre: ${GANHO}% com 300 mil itens, ` +
      `${ms(q(300000))} ms contra ${ms(m(300000))} ms. Para ter ideia, uma piscada de olho leva uns 100 ms. ` +
      "Com 30 e 300 itens tudo leva microssegundos e a porcentagem muda a cada rodada, então não tiramos conclusão dali."
  );

  // ===== 11. Crescimento
  s = conteudo("Resultados", `10× mais dados, ~${num(razaoM, 0)}× mais tempo`, 5);
  s.addChart(pres.charts.LINE, [
    { name: "Mergesort", labels: NS.map(milhar), values: NS.map(m) },
    { name: "Quicksort", labels: NS.map(milhar), values: NS.map(q) },
  ], {
    x: 0.6, y: 1.5, w: 7.6, h: 5.15, chartColors: [T.accent1, T.accent2], lineSize: 4, lineDataSymbol: "circle", lineDataSymbolSize: 11,
    valAxisLogScaleBase: 10, valAxisMinVal: 0.0001, valAxisMaxVal: 100, valAxisLabelFormatCode: "General",
    showTitle: true, title: "Tempo médio (ms), escala log", titleFontSize: 18, titleColor: T.dk1, titleFontFace: "+mn-lt",
    showLegend: true, legendPos: "t", legendFontSize: 18, legendFontFace: "+mn-lt", legendColor: T.dk1,
    catAxisLabelColor: T.dk1, valAxisLabelColor: T.dk1, catAxisLabelFontSize: 18, valAxisLabelFontSize: 16,
    catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt",
    valGridLine: { color: "D5DAE1", size: 1 }, catGridLine: { style: "none" },
    objectName: "gráfico crescimento",
  });
  const callouts = [
    [`${num(razaoM, 1)}×`, "o que medimos", C.accent1],
    [`${num(prevNlogN, 1)}×`, "o que n log n prevê", C.text1],
    ["100×", "seria um algoritmo n²", C.accent2],
  ];
  callouts.forEach(([v, t, cor], i) => {
    const y = 1.5 + i * 0.95;
    s.addText(v, { x: 8.6, y, w: 1.95, h: 0.9, fontSize: 40, bold: true, color: cor, valign: "middle", margin: 0, isTextBox: true, fontFace: THEME.headFontFace, objectName: "valor " + i });
    s.addText(t, { x: 10.6, y, w: 2.13, h: 0.9, fontSize: 20, color: C.text1, valign: "middle", margin: 0, isTextBox: true, objectName: "rótulo " + i });
  });
  await diaADia(s, 8.6, 4.4, 4.13, 2.25, "n²: festa com 300 mil pessoas, todos se cumprimentam: 45 bilhões de apertos de mão.");
  s.addNotes(
    `PESSOA 5. Na escala log as duas linhas são quase paralelas: crescem do mesmo jeito. De 30 mil para 300 mil, 10 vezes mais dados, ` +
      `o tempo cresceu ${num(razaoM, 1)} vezes. A teoria n log n prevê ${num(prevNlogN, 1)}. Um algoritmo quadrático cresceria 100 vezes: ` +
      "é como numa festa todo mundo cumprimentar todo mundo."
  );

  // ===== 12. Cenários
  if (TEM_CENARIOS) {
    s = conteudo("Resultados", "Quicksort venceu nas 4 entradas", 5);
    const labels = CENARIOS.map((c) => ROT_CEN[c]);
    s.addChart(pres.charts.BAR, [
      { name: "Mergesort", labels, values: CENARIOS.map((c) => cen(c, "mergesort")) },
      { name: "Quicksort", labels, values: CENARIOS.map((c) => cen(c, "quicksort")) },
    ], {
      x: 0.6, y: 1.5, w: 7.6, h: 5.15, barDir: "col", barGrouping: "clustered", barGapWidthPct: 55, chartColors: [T.accent1, T.accent2],
      showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0.0", dataLabelFontSize: 18, dataLabelColor: T.dk1, dataLabelFontFace: "+mn-lt", dataLabelFontBold: true,
      showTitle: true, title: "Tempo médio (ms) com 300.000 itens", titleFontSize: 18, titleColor: T.dk1, titleFontFace: "+mn-lt",
      showLegend: true, legendPos: "t", legendFontSize: 18, legendFontFace: "+mn-lt", legendColor: T.dk1,
      catAxisLabelColor: T.dk1, valAxisLabelColor: T.dk1, catAxisLabelFontSize: 16, valAxisLabelFontSize: 16,
      catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt",
      valGridLine: { color: "D5DAE1", size: 1 }, catGridLine: { style: "none" },
      objectName: "gráfico cenários",
    });
    const vezesRep = cen("repetidos", "mergesort") / cen("repetidos", "quicksort");
    const vezesOrd = cen("aleatorio", "mergesort") / cen("ordenado", "mergesort");
    cartao(s, 8.6, 1.6, 4.13, 2.25, "destaque repetidos", { fill: T.accent2, line: T.accent2 });
    s.addText([
      { text: `${num(vezesRep, 1)}×`, options: { fontSize: 60, bold: true, color: T.lt1, breakLine: true, fontFace: THEME.headFontFace } },
      { text: "mais rápido com muitos valores repetidos", options: { fontSize: 20, bold: true, color: T.lt1 } },
    ], { x: 8.85, y: 1.7, w: 3.65, h: 2.05, valign: "middle", margin: 0, isTextBox: true, objectName: "texto repetidos" });
    await diaADia(s, 8.6, 4.1, 4.13, 2.55, `Entrada já em ordem: os dois ficam ~${num(vezesOrd, 0)}× mais rápidos, como arrumar uma estante que já está quase arrumada.`);
    s.addNotes(
      "PESSOA 5. Testamos também entradas que não são aleatórias, pela opção 3 do painel. O Quicksort ganhou nas quatro. " +
        `Com muitos valores repetidos foi ${num(vezesRep, 1)} vezes mais rápido. Com a entrada já ordenada ou invertida os dois ficam bem mais rápidos, ` +
        "e o Quicksort não caiu no pior caso graças à mediana de três."
    );
  }

  // ===== 13. Conclusão
  pres.addSection({ title: "Conclusão" });
  s = conteudo("Conclusão", "Qual usar? Depende do objetivo", 5);
  const colunas = [
    ["Quicksort", T.accent2, fa.FaBolt, "Quer velocidade", [`${GANHO}% mais rápido aqui`, "Quase sem memória extra", "Precisa de um bom pivô"], "Carro esportivo: mais rápido, mas pede estrada boa."],
    ["Mergesort", T.accent1, fa.FaShieldAlt, "Quer garantia", ["n log n até no pior caso", "Estável (mantém a ordem)", "Bom para arquivos enormes"], "Ônibus no horário: nunca surpreende."],
  ];
  for (let i = 0; i < colunas.length; i++) {
    const [nome, cor, Ic, quando, itens, frase] = colunas[i];
    const x = 0.6 + i * 6.2;
    cartao(s, x, 1.6, 5.93, 4.15, "coluna " + nome, { fill: T.lt1, line: cor, lineW: 2.5 });
    await iconeCirculo(s, Ic, x + 0.3, 1.85, 0.8, cor, nome);
    s.addText([
      { text: nome, options: { fontSize: 28, bold: true, color: C.text1, breakLine: true } },
      { text: quando, options: { fontSize: 20, color: C.text2 } },
    ], { x: x + 1.3, y: 1.8, w: 4.4, h: 0.95, valign: "middle", margin: 0, isTextBox: true, objectName: "título " + nome });
    s.addText(itens.map((t, k) => ({ text: t, options: { bullet: true, breakLine: k < itens.length - 1 } })), {
      x: x + 0.35, y: 3.0, w: 5.3, h: 1.65, fontSize: 22, color: C.text1, paraSpaceAfter: 6, valign: "top", margin: 0, isTextBox: true, objectName: "itens " + nome,
    });
    s.addText(frase, { x: x + 0.35, y: 4.75, w: 5.3, h: 0.85, fontSize: 20, italic: true, color: C.text1, valign: "middle", margin: 0, isTextBox: true, objectName: "frase " + nome });
  }
  s.addText("O C++ usa os dois: std::sort (Quick) e std::stable_sort (Merge).", {
    x: 0.6, y: 5.95, w: 12.13, h: 0.7, fontSize: 22, bold: true, color: C.text1, valign: "middle", margin: 0, isTextBox: true, objectName: "frase final",
  });
  s.addNotes(
    `PESSOA 5. Qual é melhor? Depende. Se importa velocidade e memória, Quicksort: ${GANHO}% mais rápido no nosso teste, como um carro esportivo. ` +
      "Se precisa de garantia no pior caso ou de estabilidade, Mergesort: o ônibus que nunca atrasa. " +
      "Tanto que a biblioteca do C++ oferece os dois: std::sort e std::stable_sort."
  );

  // ===== 14. Perguntas
  s = pres.addSlide({ masterName: "CAPA", sectionTitle: "Conclusão" });
  s.addText("Perguntas?", { placeholder: "title" });
  s.addText(`Quick: ${GANHO}% mais rápido  ·  Merge: tempo garantido`, { placeholder: "body" });
  s.addText("Tudo na pasta trabalho_ordenacao  ·  PAINEL_ADM.bat", { placeholder: "integrantes" });
  desenharVetor(s, [ORDENADO.slice(0, 4), ORDENADO.slice(4)], 0.8 + larguraGrupos([ORDENADO.slice(0, 4), ORDENADO.slice(4)]) / 2, 1.3, (v, g) => (g === 0 ? AZUL : LARANJA), "final");
  s.addNotes("TODOS (13:30 a 15:00). Cada um responde sobre a própria parte. A Pessoa 5 conduz.");

  fs.mkdirSync(path.dirname(SAIDA), { recursive: true });
  await pres.writeFile({ fileName: SAIDA });
  await aplicarTema(SAIDA, THEME);
  console.log("Slides gerados em " + SAIDA);
}

// O pptxgenjs grava a paleta padrão do Office no tema; aqui escrevemos as cores do nosso tema
// em ppt/theme/theme1.xml para que as cores de esquema (C.accent1 etc.) saiam certas.
async function aplicarTema(arquivo, tema) {
  const JSZip = require(require.resolve("jszip", { paths: [require.resolve("pptxgenjs")] }));
  const zip = await JSZip.loadAsync(fs.readFileSync(arquivo));
  const nomes = Object.keys(zip.files).filter((f) => /^ppt\/theme\/theme\d+\.xml$/.test(f));
  const ordem = ["dk1", "lt1", "dk2", "lt2", "accent1", "accent2", "accent3", "accent4", "accent5", "accent6", "hlink", "folHlink"];
  const esquema = `<a:clrScheme name="${tema.name}">` +
    ordem.map((k) => `<a:${k}><a:srgbClr val="${tema.colors[k]}"/></a:${k}>`).join("") + "</a:clrScheme>";
  for (const n of nomes) {
    let xml = await zip.file(n).async("string");
    xml = xml.replace(/<a:clrScheme [\s\S]*?<\/a:clrScheme>/, esquema).replace(/(<a:theme [^>]*name=")[^"]*"/, `$1${tema.name}"`);
    zip.file(n, xml);
  }
  fs.writeFileSync(arquivo, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}

main().catch((e) => { console.error(e); process.exit(1); });
