// Gera apresentacao/slides.pptx a partir dos CSVs em resultados/.
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
const ROT_CEN = { aleatorio: "Aleatório", ordenado: "Já ordenado", inverso: "Invertido", repetidos: "Muitos repetidos" };
const CEN = {};
for (const c of CENARIOS) {
  const arq = path.join(RES, `cenario_${c}`, "resultados_resumo.csv");
  if (fs.existsSync(arq)) CEN[c] = lerResumo(arq);
}

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
const razaoM = m(300000) / m(30000);
const prevNlogN = (10 * Math.log(300000)) / Math.log(30000);

// ---------------------------------------------------------------- tema
const THEME = {
  name: "Ordenacao",
  headFontFace: "Arial",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "1B1F24", lt1: "FFFFFF", dk2: "141A22", lt2: "F1F3F6",
    accent1: "2A78D6", accent2: "EB6834", accent3: "5B6573", accent4: "1BAF7A",
    accent5: "EDA100", accent6: "6250D6", hlink: "2A78D6", folHlink: "6250D6",
  },
};
const T = THEME.colors;
const MUTED_HEX = "5B6573";
const ESCURO_TXT = "C9D1DB";

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13,333 x 7,5 pol
pres.title = "Mergesort × Quicksort";
pres.author = "Grupo";
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
const C = pres.SchemeColor;
const W = 13.333;

// ---------------------------------------------------------------- layouts
pres.defineSlideMaster({
  title: "CAPA",
  background: { color: T.dk2 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.8, y: 2.55, w: 11.7, h: 1.3, fontSize: 54, bold: true, color: C.background1, fontFace: THEME.headFontFace, align: "left", valign: "middle", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: 0.8, y: 3.95, w: 11.7, h: 0.7, fontSize: 24, color: C.background2, valign: "top", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "integrantes", type: "body", x: 0.8, y: 6.05, w: 11.7, h: 0.5, fontSize: 16, color: C.background2, valign: "top", margin: 0 }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "CONTEUDO",
  background: { color: T.lt1 },
  margin: [0.5, 0.6, 0.7, 0.6],
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.35, w: 10.2, h: 0.9, fontSize: 34, bold: true, color: C.text1, fontFace: THEME.headFontFace, align: "left", valign: "middle", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "orador", type: "body", x: 10.9, y: 0.55, w: 1.85, h: 0.5, fontSize: 12, color: C.accent3, align: "right", valign: "middle", margin: 0 }, text: "" } },
    { text: { text: "Mergesort × Quicksort", options: { x: 0.6, y: 6.95, w: 6, h: 0.3, fontSize: 10, color: MUTED_HEX, margin: 0 } } },
  ],
  slideNumber: { x: 12.23, y: 6.95, w: 0.5, h: 0.3, fontSize: 10, color: MUTED_HEX, align: "right" },
});
pres.defineSlideMaster({
  title: "ESCURO",
  background: { color: T.dk2 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.35, w: 10.2, h: 0.9, fontSize: 34, bold: true, color: C.background1, fontFace: THEME.headFontFace, align: "left", valign: "middle", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "orador", type: "body", x: 10.9, y: 0.55, w: 1.85, h: 0.5, fontSize: 12, color: C.background2, align: "right", valign: "middle", margin: 0 }, text: "" } },
  ],
  slideNumber: { x: 12.23, y: 6.95, w: 0.5, h: 0.3, fontSize: 10, color: ESCURO_TXT, align: "right" },
});

// ---------------------------------------------------------------- utilidades
async function icone(Comp, corHex, px = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { color: "#" + corHex, size: px }));
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

// Círculo colorido com ícone branco (motivo visual do deck)
async function iconeCirculo(slide, Comp, x, y, d, cor, nome) {
  slide.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: cor }, line: { color: cor }, objectName: nome + " círculo" });
  const p = d * 0.27;
  slide.addImage({ data: await icone(Comp, "FFFFFF"), x: x + p, y: y + p, w: d - 2 * p, h: d - 2 * p, altText: nome, objectName: nome + " ícone" });
}

// Desenha um "vetor": grupos de células com números (motivo dos algoritmos)
const CW = 0.6, CH = 0.5, CG = 0.06, GG = 0.32;
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
        x, y, w: CW, h: CH, fill: { color: e.fill }, line: e.line ? { color: e.line, width: 2.25 } : { color: e.fill },
        color: e.text, fontSize: 16, bold: true, align: "center", valign: "middle", margin: 0,
        objectName: `${nome} ${v}`,
      });
      x += CW + (i < g.length - 1 ? CG : 0);
    });
    x += GG;
  });
}
function rotuloLinha(slide, texto, y, sub) {
  slide.addText([
    { text: texto, options: { bold: true, color: C.text1, fontSize: 14, breakLine: !!sub } },
    ...(sub ? [{ text: sub, options: { color: C.accent3, fontSize: 11 } }] : []),
  ], { x: 0.6, y: y - 0.1, w: 2.0, h: CH + 0.2, valign: "middle", margin: 0, isTextBox: true, objectName: "rótulo " + texto });
}

function cartao(slide, x, y, w, h, cor, nome) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.12, fill: { color: cor }, line: { color: cor }, objectName: nome });
}

function lista(slide, itens, x, y, w, h, extra = {}) {
  slide.addText(
    itens.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < itens.length - 1 } })),
    { x, y, w, h, fontSize: 16, color: C.text1, paraSpaceAfter: 10, valign: "top", margin: 0, isTextBox: true, ...extra }
  );
}

const PESSOA = (n) => `Pessoa ${n}`;
const VETOR = [38, 27, 43, 3, 9, 82, 10, 15];

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

// ---------------------------------------------------------------- slides
async function main() {
  // ===== 1. Capa
  pres.addSection({ title: "Abertura" });
  let s = pres.addSlide({ masterName: "CAPA", sectionTitle: "Abertura" });
  s.addText("Mergesort × Quicksort", { placeholder: "title" });
  s.addText("Quem ordena mais rápido? 200 ordenações medidas em C++", { placeholder: "body" });
  s.addText("Integrante 1  ·  Integrante 2  ·  Integrante 3  ·  Integrante 4  ·  Integrante 5", { placeholder: "integrantes" });
  {
    const x0 = 0.8;
    VETOR.forEach((v, i) => {
      s.addText(String(v), {
        shape: pres.shapes.ROUNDED_RECTANGLE, rectRadius: 0.08, x: x0 + i * (CW + CG), y: 1.2, w: CW, h: CH,
        fill: { color: "2B3440" }, line: { color: "2B3440" }, color: C.background1, fontSize: 16, bold: true,
        align: "center", valign: "middle", margin: 0, objectName: `capa vetor ${v}`,
      });
    });
    [...VETOR].sort((a, b) => a - b).forEach((v, i) => {
      const cor = i < 4 ? T.accent1 : T.accent2;
      s.addText(String(v), {
        shape: pres.shapes.ROUNDED_RECTANGLE, rectRadius: 0.08, x: x0 + i * (CW + CG), y: 1.2 + CH + 0.12, w: CW, h: CH,
        fill: { color: cor }, line: { color: cor }, color: C.background1, fontSize: 16, bold: true,
        align: "center", valign: "middle", margin: 0, objectName: `capa ordenado ${v}`,
      });
    });
  }
  s.addNotes(
    "PESSOA 1 (0:00 a 2:30, começa aqui).\n" +
      "Boa tarde. Nosso grupo comparou dois dos algoritmos de ordenação mais usados, o Mergesort e o Quicksort. " +
      "A pergunta é simples: na prática, qual ordena mais rápido? Para responder, implementamos os dois em C++ e medimos 200 ordenações."
  );

  // ===== 2. Problema
  s = pres.addSlide({ masterName: "CONTEUDO", sectionTitle: "Abertura" });
  s.addText("Por que comparar ordenações?", { placeholder: "title" });
  s.addText(PESSOA(1), { placeholder: "orador" });
  s.addText("Ordenar é uma das operações mais comuns da computação, e quase sempre é o primeiro passo de outra.", {
    x: 0.6, y: 1.6, w: 5.3, h: 1.9, fontSize: 26, bold: true, color: C.text1, valign: "top", margin: 0, isTextBox: true, objectName: "afirmação",
  });
  s.addText("A notação O mostra como o custo cresce. Só medindo dá para ver o resto: cache, memória e cópias.", {
    x: 0.6, y: 3.75, w: 5.3, h: 1.3, fontSize: 18, color: C.accent3, valign: "top", margin: 0, isTextBox: true, objectName: "complemento",
  });
  const usos = [
    [fa.FaSearch, "Busca binária", "Só funciona em dados ordenados"],
    [fa.FaDatabase, "Bancos de dados", "ORDER BY, índices e junções ordenam o tempo todo"],
    [fa.FaListOl, "Rankings e relatórios", "Notas, preços, datas, classificação de times"],
  ];
  for (let i = 0; i < usos.length; i++) {
    const y = 1.6 + i * 1.65;
    cartao(s, 6.5, y, 6.23, 1.35, T.lt2, "cartão " + usos[i][1]);
    await iconeCirculo(s, usos[i][0], 6.8, y + 0.3, 0.75, T.dk2, usos[i][1]);
    s.addText([
      { text: usos[i][1], options: { bold: true, fontSize: 18, color: C.text1, breakLine: true } },
      { text: usos[i][2], options: { fontSize: 15, color: C.accent3 } },
    ], { x: 7.8, y: y + 0.15, w: 4.7, h: 1.05, valign: "middle", margin: 0, isTextBox: true, objectName: "texto " + usos[i][1] });
  }
  s.addNotes(
    "PESSOA 1. Ordenação aparece em todo lugar: busca binária só funciona em vetor ordenado, bancos de dados ordenam para montar índices e responder ORDER BY, " +
      "e qualquer ranking é uma ordenação. Os dois algoritmos têm a mesma complexidade média, O(n log n), mas isso não diz qual é mais rápido de verdade. " +
      "Por isso medimos."
  );

  // ===== 3. Metodologia
  s = pres.addSlide({ masterName: "CONTEUDO", sectionTitle: "Abertura" });
  s.addText("Metodologia", { placeholder: "title" });
  s.addText(PESSOA(1), { placeholder: "orador" });
  const stats = [
    ["5", "tamanhos de vetor", "30 → 300.000"],
    ["20", "execuções", "por tamanho e algoritmo"],
    ["200", "ordenações", "no total"],
    ["42", "semente fixa", "mesmos dados toda vez"],
  ];
  stats.forEach(([n, rot, sub], i) => {
    const x = 0.6 + i * 3.1;
    cartao(s, x, 1.55, 2.83, 2.35, T.lt2, "estatística " + rot);
    s.addText([
      { text: n, options: { fontSize: 60, bold: true, color: C.text1, breakLine: true, fontFace: THEME.headFontFace } },
      { text: rot, options: { fontSize: 18, bold: true, color: C.text1, breakLine: true } },
      { text: sub, options: { fontSize: 14, color: C.accent3 } },
    ], { x: x + 0.3, y: 1.7, w: 2.3, h: 2.05, valign: "middle", margin: 0, isTextBox: true, objectName: "número " + rot });
  });
  const checks = [
    "Os dois algoritmos ordenam cópias da mesma entrada",
    "Compilado com g++ -O2 (C++11)",
    "Todo resultado conferido com std::is_sorted",
  ];
  for (let i = 0; i < checks.length; i++) {
    const x = 0.6 + i * 4.13;
    await iconeCirculo(s, fa.FaCheck, x, 4.45, 0.55, T.accent4, "check " + i);
    s.addText(checks[i], { x: x + 0.75, y: 4.35, w: 3.2, h: 0.75, fontSize: 16, color: C.text1, valign: "middle", margin: 0, isTextBox: true, objectName: "check texto " + i });
  }
  s.addText("Máquina do teste: Intel Xeon 2,8 GHz (troquem pela máquina de vocês ao rodar de novo)", {
    x: 0.6, y: 5.75, w: 12.1, h: 0.4, fontSize: 12, color: C.accent3, margin: 0, isTextBox: true, objectName: "máquina",
  });
  s.addNotes(
    "PESSOA 1. Testamos 5 tamanhos, de 30 a 300 mil elementos, com 20 execuções cada, para os dois algoritmos: 200 ordenações. " +
      "Os números são aleatórios, mas gerados com semente fixa 42, então qualquer um que rodar o programa recebe os mesmos dados. " +
      "Em cada execução os dois algoritmos ordenam cópias do mesmo vetor, para a comparação ser justa, e conferimos se o resultado saiu ordenado. " +
      "Agora a Pessoa 2 explica como funciona o Mergesort."
  );

  // ===== 4. Mergesort: como funciona
  pres.addSection({ title: "Mergesort" });
  s = pres.addSlide({ masterName: "CONTEUDO", sectionTitle: "Mergesort" });
  s.addText("Mergesort: dividir e intercalar", { placeholder: "title" });
  s.addText(PESSOA(2), { placeholder: "orador" });
  {
    const xc = 2.75 + 6.3 / 2;
    const neutro = { fill: T.lt2, text: C.text1 };
    const azul = { fill: T.accent1, text: C.background1 };
    const linhas = [
      ["vetor", null, [VETOR], neutro],
      ["dividir", null, [[38, 27, 43, 3], [9, 82, 10, 15]], neutro],
      ["dividir", null, [[38, 27], [43, 3], [9, 82], [10, 15]], neutro],
      ["intercalar", "pares", [[27, 38], [3, 43], [9, 82], [10, 15]], azul],
      ["intercalar", "metades", [[3, 27, 38, 43], [9, 10, 15, 82]], azul],
      ["ordenado", null, [[3, 9, 10, 15, 27, 38, 43, 82]], azul],
    ];
    linhas.forEach(([rot, sub, grupos, est], i) => {
      const y = 1.55 + i * 0.78;
      rotuloLinha(s, rot, y, sub);
      desenharVetor(s, grupos, xc, y, est, `merge linha ${i + 1}`);
    });
  }
  lista(s, [
    "Divide o vetor ao meio até sobrarem pedaços de 1 elemento",
    "Intercala dois pedaços já ordenados comparando o primeiro de cada um",
    "Usa um vetor auxiliar do mesmo tamanho",
  ], 9.55, 1.6, 3.2, 4.5);
  s.addNotes(
    "PESSOA 2 (2:30 a 5:00). O Mergesort usa dividir e conquistar. Ele corta o vetor ao meio, e corta de novo, até sobrar um elemento em cada pedaço, " +
      "e um elemento sozinho já está ordenado. Depois intercala os pedaços: compara o primeiro de cada metade, pega o menor, e repete. " +
      "Nas linhas cinza o vetor é dividido; nas azuis ele é intercalado. No código isso são as funções mergesortRec e intercalar."
  );

  // ===== 5. Mergesort: custo
  s = pres.addSlide({ masterName: "CONTEUDO", sectionTitle: "Mergesort" });
  s.addText("Mergesort: custo previsível", { placeholder: "title" });
  s.addText(PESSOA(2), { placeholder: "orador" });
  cartao(s, 0.6, 1.55, 4.6, 4.6, T.accent1, "destaque níveis");
  s.addText([
    { text: "19", options: { fontSize: 88, bold: true, color: C.background1, breakLine: true, fontFace: THEME.headFontFace } },
    { text: "níveis de divisão", options: { fontSize: 22, bold: true, color: C.background1, breakLine: true } },
    { text: "para 300.000 elementos (log de 300.000 na base 2 ≈ 18,2). Em cada nível o algoritmo percorre os n elementos: n × log n.", options: { fontSize: 15, color: C.background1 } },
  ], { x: 0.95, y: 1.8, w: 3.9, h: 4.1, valign: "middle", margin: 0, isTextBox: true, objectName: "texto níveis" });
  const custosM = [
    [fa.FaClock, "Tempo: O(n log n)", "No melhor, no médio e no pior caso"],
    [fa.FaMemory, "Memória extra: O(n)", "Vetor auxiliar: ~1,2 MB para 300.000 inteiros"],
    [fa.FaBalanceScale, "Estável", "Elementos iguais mantêm a ordem original"],
  ];
  for (let i = 0; i < custosM.length; i++) {
    const y = 1.55 + i * 1.6;
    cartao(s, 5.6, y, 7.13, 1.3, T.lt2, "cartão " + custosM[i][1]);
    await iconeCirculo(s, custosM[i][0], 5.9, y + 0.28, 0.75, T.accent1, custosM[i][1]);
    s.addText([
      { text: custosM[i][1], options: { bold: true, fontSize: 18, color: C.text1, breakLine: true } },
      { text: custosM[i][2], options: { fontSize: 15, color: C.accent3 } },
    ], { x: 6.9, y: y + 0.12, w: 5.6, h: 1.05, valign: "middle", margin: 0, isTextBox: true, objectName: "texto " + custosM[i][1] });
  }
  s.addNotes(
    "PESSOA 2. Como o vetor é cortado ao meio, o número de níveis é log de n na base 2: para 300 mil, uns 19 níveis. " +
      "Em cada nível a intercalação passa por todos os n elementos, por isso o custo é n log n, e isso vale sempre, até no pior caso. " +
      "O preço é memória: precisa de um vetor auxiliar do mesmo tamanho. E ele é estável. Agora a Pessoa 3 com o Quicksort."
  );

  // ===== 6. Quicksort: como funciona
  pres.addSection({ title: "Quicksort" });
  s = pres.addSlide({ masterName: "CONTEUDO", sectionTitle: "Quicksort" });
  s.addText("Quicksort: escolher o pivô e particionar", { placeholder: "title" });
  s.addText(PESSOA(3), { placeholder: "orador" });
  {
    const xc = 2.75 + 6.3 / 2;
    const neutro = { fill: T.lt2, text: C.text1 };
    const laranja = { fill: T.accent2, text: C.background1 };
    const linhas = [
      ["escolher pivô", "início, meio, fim", [VETOR], (v, g, i) => (v === 15 ? laranja : i === 0 || i === 3 ? { fill: T.lt1, text: C.text1, line: T.accent2 } : neutro)],
      ["particionar", "≤ 15 | ≥ 15", [[15, 10, 9, 3], [43, 82, 27, 38]], neutro],
      ["repetir", "em cada lado", [[3, 9, 10, 15], [27, 38, 43, 82]], laranja],
      ["ordenado", null, [[3, 9, 10, 15, 27, 38, 43, 82]], laranja],
    ];
    linhas.forEach(([rot, sub, grupos, est], i) => {
      const y = 1.7 + i * 1.1;
      rotuloLinha(s, rot, y, sub);
      desenharVetor(s, grupos, xc, y, est, `quick linha ${i + 1}`);
    });
  }
  lista(s, [
    "Pivô = mediana de 38, 3 e 15 (início, meio e fim) = 15",
    "Menores ou iguais ao pivô vão para a esquerda; maiores ou iguais, para a direita",
    "Trabalha no próprio vetor, sem vetor auxiliar",
  ], 9.55, 1.6, 3.2, 4.5);
  s.addNotes(
    "PESSOA 3 (5:00 a 7:30). O Quicksort também divide, mas de outro jeito. Primeiro escolhe um pivô. Nós usamos a mediana de três: " +
      "olhamos o primeiro, o do meio e o último (38, 3 e 15) e pegamos o do meio, 15. Depois particionamos: tudo que é menor vai para a esquerda, " +
      "tudo que é maior vai para a direita, trocando elementos dentro do próprio vetor. Aí repete em cada lado. Não precisa de vetor auxiliar."
  );

  // ===== 7. Quicksort: custo
  s = pres.addSlide({ masterName: "CONTEUDO", sectionTitle: "Quicksort" });
  s.addText("Quicksort: o risco do pior caso", { placeholder: "title" });
  s.addText(PESSOA(3), { placeholder: "orador" });
  const custosQ = [
    ["Caso médio", "O(n log n)"],
    ["Pior caso", "O(n²)"],
    ["Memória extra", "O(log n)"],
    ["Estável?", "Não"],
  ];
  custosQ.forEach(([rot, val], i) => {
    const x = 0.6 + (i % 2) * 3.05, y = 1.55 + Math.floor(i / 2) * 2.0;
    cartao(s, x, y, 2.8, 1.75, T.lt2, "custo " + rot);
    s.addText([
      { text: rot, options: { fontSize: 15, color: C.accent3, breakLine: true } },
      { text: val, options: { fontSize: 32, bold: true, color: C.text1, fontFace: THEME.headFontFace } },
    ], { x: x + 0.25, y: y + 0.15, w: 2.35, h: 1.45, valign: "middle", margin: 0, isTextBox: true, objectName: "valor " + rot });
  });
  s.addText("A memória extra é só a pilha da recursão, porque o algoritmo trabalha no próprio vetor.", {
    x: 0.6, y: 5.6, w: 5.85, h: 0.7, fontSize: 13, color: C.accent3, valign: "top", margin: 0, isTextBox: true, objectName: "nota memória",
  });
  cartao(s, 6.95, 1.55, 5.78, 4.75, T.dk2, "cartão pior caso");
  await iconeCirculo(s, fa.FaExclamationTriangle, 7.3, 1.85, 0.7, T.accent2, "alerta");
  const ordQ = CEN.ordenado ? CEN.ordenado["quicksort:300000"].media : null;
  s.addText([
    { text: "O pior caso", options: { fontSize: 20, bold: true, color: C.background1, breakLine: true } },
    { text: "Pivô = primeiro elemento + vetor já ordenado: cada partição separa só 1 elemento.", options: { fontSize: 16, color: C.background1, breakLine: true } },
    { text: " ", options: { fontSize: 8, breakLine: true } },
    { text: "300.000 elementos ≈ 45 bilhões de comparações, ou minutos de execução.", options: { fontSize: 16, color: C.background1, breakLine: true } },
    { text: " ", options: { fontSize: 8, breakLine: true } },
    { text: ordQ ? `Nossa defesa, a mediana de três: vetor já ordenado de 300.000 em ${ms(ordQ)} ms.` : "Nossa defesa: mediana de três.", options: { fontSize: 16, bold: true, color: C.background1 } },
  ], { x: 7.3, y: 2.75, w: 5.1, h: 3.35, valign: "top", margin: 0, isTextBox: true, objectName: "texto pior caso" });
  s.addNotes(
    "PESSOA 3. Na média o Quicksort também é n log n. Mas se o pivô for sempre o menor ou o maior elemento, cada partição separa um elemento só, " +
      "e o custo vira n ao quadrado. Isso acontece, por exemplo, se o pivô for o primeiro elemento e o vetor já estiver ordenado: com 300 mil, " +
      "seriam uns 45 bilhões de comparações. A mediana de três evita isso: no nosso teste, um vetor já ordenado de 300 mil levou poucos milissegundos. " +
      "Ele não é estável e quase não usa memória extra. Agora a Pessoa 4 mostra como medimos."
  );

  // ===== 8. Como medimos
  pres.addSection({ title: "Implementação" });
  s = pres.addSlide({ masterName: "CONTEUDO", sectionTitle: "Implementação" });
  s.addText("Como medimos", { placeholder: "title" });
  s.addText(PESSOA(4), { placeholder: "orador" });
  const passos = [
    [fa.FaRandom, "Gerar", "Vetor aleatório com semente 42"],
    [fa.FaCopy, "Copiar", "A mesma entrada para os dois algoritmos"],
    [fa.FaStopwatch, "Cronometrar", "steady_clock só em volta da ordenação"],
    [fa.FaCheckDouble, "Conferir", "std::is_sorted em todo resultado"],
    [fa.FaFileCsv, "Salvar", "CSV bruto, resumo e relatório HTML"],
  ];
  for (let i = 0; i < passos.length; i++) {
    const x = 0.6 + i * 2.48;
    await iconeCirculo(s, passos[i][0], x + 0.62, 1.6, 0.95, T.dk2, passos[i][1]);
    if (i < passos.length - 1) {
      s.addShape(pres.shapes.LINE, { x: x + 1.75, y: 2.075, w: 1.17, h: 0, line: { color: "B8BFC9", width: 1.5, endArrowType: "triangle" }, objectName: "seta " + i });
    }
    s.addText([
      { text: `${i + 1}. ${passos[i][1]}`, options: { fontSize: 17, bold: true, color: C.text1, breakLine: true } },
      { text: passos[i][2], options: { fontSize: 14, color: C.accent3 } },
    ], { x, y: 2.75, w: 2.2, h: 1.2, align: "center", valign: "top", margin: 0, isTextBox: true, objectName: "passo " + passos[i][1] });
  }
  const notas = [
    ["Aquecimento", "1 rodada descartada por tamanho, para tirar o efeito de cache frio e da primeira alocação."],
    ["Vetores pequenos", "30 elementos ordenam em menos de 1 µs. Cada medição ordena k cópias e divide o tempo por k (k = 20.000 / n)."],
  ];
  notas.forEach(([t, d], i) => {
    const x = 0.6 + i * 6.2;
    cartao(s, x, 4.45, 5.93, 1.75, T.lt2, "nota " + t);
    s.addText([
      { text: t, options: { fontSize: 17, bold: true, color: C.text1, breakLine: true } },
      { text: d, options: { fontSize: 15, color: C.text1 } },
    ], { x: x + 0.3, y: 4.6, w: 5.35, h: 1.45, valign: "middle", margin: 0, isTextBox: true, objectName: "texto nota " + t });
  });
  s.addNotes(
    "PESSOA 4 (7:30 a 10:30). Para cada execução: geramos um vetor aleatório, fazemos uma cópia para cada algoritmo, cronometramos só a chamada de ordenação " +
      "com o steady_clock do C++, conferimos se saiu ordenado e salvamos em CSV. Dois cuidados: descartamos uma rodada de aquecimento, " +
      "e para vetores pequenos, que ordenam mais rápido do que a precisão do relógio, ordenamos várias cópias e dividimos o tempo."
  );

  // ===== 9. Demo
  s = pres.addSlide({ masterName: "CONTEUDO", sectionTitle: "Implementação" });
  s.addText("Demonstração: o painel ADM", { placeholder: "title" });
  s.addText(PESSOA(4), { placeholder: "orador" });
  cartao(s, 0.6, 1.55, 7.2, 4.75, T.dk2, "terminal");
  const term = [
    "==============================================",
    " PAINEL ADM - Benchmark Mergesort x Quicksort",
    "==============================================",
    "",
    " EXECUCAO",
    "   [1] Abrir o painel do benchmark",
    "   [2] Rodar o teste padrao do trabalho",
    "   [3] Rodar os 4 cenarios",
    " RESULTADOS E APRESENTACAO",
    "   [4] Abrir relatorio (navegador)",
    "   [5] Abrir slides da apresentacao",
    " MANUTENCAO",
    "   [7] Recompilar   [8] Pasta   [9] Apagar",
    "",
    " Opcao: 2",
  ];
  s.addText(term.join("\n"), { x: 0.85, y: 1.75, w: 6.8, h: 4.35, fontFace: "Courier New", fontSize: 13, color: "D7DEE7", valign: "top", margin: 0, isTextBox: true, objectName: "texto terminal" });
  const demo = [
    ["1", "Duplo clique em PAINEL_ADM.bat"],
    ["2", "Opção [2]: roda as 200 ordenações (cerca de 2 s)"],
    ["3", "O relatório com tabela e gráfico abre no navegador"],
  ];
  demo.forEach(([n, t], i) => {
    const y = 1.6 + i * 1.05;
    s.addText(n, { shape: pres.shapes.OVAL, x: 8.25, y, w: 0.6, h: 0.6, fill: { color: T.accent2 }, line: { color: T.accent2 }, color: C.background1, fontSize: 18, bold: true, align: "center", valign: "middle", margin: 0, objectName: "número demo " + n });
    s.addText(t, { x: 9.05, y: y - 0.1, w: 3.68, h: 0.8, fontSize: 16, color: C.text1, valign: "middle", margin: 0, isTextBox: true, objectName: "passo demo " + n });
  });
  s.addText([
    { text: "Linha de comando, sem menu:", options: { fontSize: 13, color: C.accent3, breakLine: true } },
    { text: "Benchmark.exe --rodar --cenario inverso", options: { fontSize: 13, color: C.text1, fontFace: "Courier New", breakLine: true } },
    { text: " ", options: { fontSize: 6, breakLine: true } },
    { text: "Plano B: um print desta tela, se o PC da sala bloquear o .exe.", options: { fontSize: 13, color: C.accent3 } },
  ], { x: 8.25, y: 4.75, w: 4.48, h: 1.55, valign: "top", margin: 0, isTextBox: true, objectName: "linha de comando" });
  s.addNotes(
    "PESSOA 4. [Abrir PAINEL_ADM.bat] Este é o painel que fizemos. A opção 2 roda o teste completo, as 200 ordenações, em uns 2 segundos, " +
      "e abre o relatório no navegador. A opção 1 abre o painel do próprio programa, onde dá para mudar tamanhos, número de execuções, semente e o tipo de entrada. " +
      "Se o computador da sala bloquear o .exe, mostrar o print. Agora a Pessoa 5 com os resultados."
  );

  // ===== 10. Tabela
  pres.addSection({ title: "Resultados" });
  s = pres.addSlide({ masterName: "CONTEUDO", sectionTitle: "Resultados" });
  s.addText("Resultados: média de 20 execuções", { placeholder: "title" });
  s.addText(PESSOA(5), { placeholder: "orador" });
  const cab = (t, al = "right") => ({ text: t, options: { bold: true, color: C.text1, fill: { color: T.lt2 }, align: al } });
  const linhasTab = [[cab("n", "left"), cab("Mergesort (ms)"), cab("Quicksort (ms)"), cab("Quicksort vs. Mergesort")]];
  NS.forEach((n) => {
    const dest = n === 300000;
    const o = (al = "right") => ({ align: al, bold: dest, color: C.text1 });
    linhasTab.push([
      { text: milhar(n), options: o("left") },
      { text: ms(m(n)), options: o() },
      { text: ms(q(n)), options: o() },
      { text: comp(n), options: o() },
    ]);
  });
  s.addTable(linhasTab, {
    x: 0.6, y: 1.6, w: 8.2, colW: [1.6, 2.0, 2.0, 2.6], rowH: 0.62, fontSize: 16, fontFace: THEME.bodyFontFace,
    valign: "middle", border: { type: "solid", pt: 0.75, color: "D5DAE1" }, margin: [0, 0.15, 0, 0.15], objectName: "tabela resultados",
  });
  cartao(s, 9.25, 1.6, 3.48, 2.0, T.accent2, "destaque ganho");
  s.addText([
    { text: `${num(ganho(300000), 0)}%`, options: { fontSize: 54, bold: true, color: C.background1, breakLine: true, fontFace: THEME.headFontFace } },
    { text: "mais rápido o Quicksort com 300.000", options: { fontSize: 15, color: C.background1 } },
  ], { x: 9.5, y: 1.7, w: 3.0, h: 1.8, valign: "middle", margin: 0, isTextBox: true, objectName: "texto ganho" });
  cartao(s, 9.25, 3.85, 3.48, 1.65, T.lt2, "destaque tempo");
  s.addText([
    { text: "< 2 s", options: { fontSize: 40, bold: true, color: C.text1, breakLine: true, fontFace: THEME.headFontFace } },
    { text: "para as 200 ordenações", options: { fontSize: 15, color: C.accent3 } },
  ], { x: 9.5, y: 3.95, w: 3.0, h: 1.45, valign: "middle", margin: 0, isTextBox: true, objectName: "texto tempo" });
  s.addText("Vetores de 30 e 300 elementos ordenam em microssegundos; ali a diferença percentual oscila de uma rodada para outra.", {
    x: 0.6, y: 5.6, w: 8.2, h: 0.6, fontSize: 12, color: C.accent3, valign: "top", margin: 0, isTextBox: true, objectName: "nota tabela",
  });
  s.addNotes(
    `PESSOA 5 (10:30 a 13:30). Aqui estão as médias. Nos tamanhos grandes o Quicksort foi consistentemente mais rápido: ${num(ganho(300000), 0)}% em 300 mil elementos ` +
      `(${ms(q(300000))} ms contra ${ms(m(300000))} ms). Nos vetores pequenos tudo leva microssegundos e a porcentagem oscila entre rodadas, então não dá para tirar conclusão forte ali. ` +
      "O teste inteiro leva menos de 2 segundos."
  );

  // ===== 11. Gráfico
  s = pres.addSlide({ masterName: "CONTEUDO", sectionTitle: "Resultados" });
  s.addText("O crescimento confirma n log n", { placeholder: "title" });
  s.addText(PESSOA(5), { placeholder: "orador" });
  s.addChart(pres.charts.LINE, [
    { name: "Mergesort", labels: NS.map(milhar), values: NS.map(m) },
    { name: "Quicksort", labels: NS.map(milhar), values: NS.map(q) },
  ], {
    x: 0.6, y: 1.5, w: 8.1, h: 4.9, chartColors: [T.accent1, T.accent2], lineSize: 3, lineDataSymbol: "circle", lineDataSymbolSize: 9,
    valAxisLogScaleBase: 10, valAxisMinVal: 0.0001, valAxisMaxVal: 100, valAxisLabelFormatCode: "General",
    showTitle: true, title: "Tempo médio (ms), escala logarítmica", titleFontSize: 14, titleColor: T.dk1, titleFontFace: "+mn-lt",
    showLegend: true, legendPos: "t", legendFontSize: 13, legendFontFace: "+mn-lt", legendColor: T.dk1,
    catAxisTitle: "Tamanho do vetor (n)", showCatAxisTitle: true, catAxisTitleFontSize: 12, catAxisTitleColor: MUTED_HEX,
    catAxisLabelColor: MUTED_HEX, valAxisLabelColor: MUTED_HEX, catAxisLabelFontSize: 12, valAxisLabelFontSize: 12,
    catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt", catAxisTitleFontFace: "+mn-lt",
    valGridLine: { color: "E3E6EA", size: 0.75 }, catGridLine: { style: "none" },
    objectName: "gráfico crescimento",
  });
  const callouts = [
    [`${num(razaoM, 1)}×`, "mais tempo quando n cresce 10× (de 30.000 para 300.000)", T.accent1],
    [`${num(prevNlogN, 1)}×`, "é o que n log n prevê para o mesmo salto", T.dk2],
    ["100×", "seria o salto de um algoritmo O(n²)", "8A939F"],
  ];
  callouts.forEach(([v, t, cor], i) => {
    const y = 1.55 + i * 1.65;
    s.addText(v, { x: 9.1, y, w: 1.9, h: 1.3, fontSize: 40, bold: true, color: cor === "8A939F" ? C.accent3 : cor === T.accent1 ? C.accent1 : C.text1, valign: "middle", margin: 0, isTextBox: true, fontFace: THEME.headFontFace, objectName: "valor " + i });
    s.addText(t, { x: 11.05, y, w: 1.68, h: 1.3, fontSize: 13, color: C.text1, valign: "middle", margin: 0, isTextBox: true, objectName: "rótulo " + i });
  });
  s.addNotes(
    `PESSOA 5. Em escala logarítmica, as duas linhas são quase retas e paralelas: os dois crescem do mesmo jeito. Quando o vetor fica 10 vezes maior, ` +
      `de 30 mil para 300 mil, o tempo cresceu ${num(razaoM, 1)} vezes. É exatamente o que n log n prevê, ${num(prevNlogN, 1)} vezes. Um algoritmo quadrático cresceria 100 vezes.`
  );

  // ===== 12. Cenários
  if (Object.keys(CEN).length === 4) {
    s = pres.addSlide({ masterName: "CONTEUDO", sectionTitle: "Resultados" });
    s.addText("E se a entrada não for aleatória?", { placeholder: "title" });
    s.addText(PESSOA(5), { placeholder: "orador" });
    const labels = CENARIOS.map((c) => ROT_CEN[c]);
    s.addChart(pres.charts.BAR, [
      { name: "Mergesort", labels, values: CENARIOS.map((c) => CEN[c]["mergesort:300000"].media) },
      { name: "Quicksort", labels, values: CENARIOS.map((c) => CEN[c]["quicksort:300000"].media) },
    ], {
      x: 0.6, y: 1.5, w: 8.1, h: 4.9, barDir: "col", barGrouping: "clustered", barGapWidthPct: 60, chartColors: [T.accent1, T.accent2],
      showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0.0", dataLabelFontSize: 12, dataLabelColor: T.dk1, dataLabelFontFace: "+mn-lt",
      showTitle: true, title: "Tempo médio (ms) com n = 300.000", titleFontSize: 14, titleColor: T.dk1, titleFontFace: "+mn-lt",
      showLegend: true, legendPos: "t", legendFontSize: 13, legendFontFace: "+mn-lt", legendColor: T.dk1,
      catAxisLabelColor: MUTED_HEX, valAxisLabelColor: MUTED_HEX, catAxisLabelFontSize: 13, valAxisLabelFontSize: 12,
      catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt",
      valGridLine: { color: "E3E6EA", size: 0.75 }, catGridLine: { style: "none" },
      objectName: "gráfico cenários",
    });
    const rep = CEN.repetidos;
    const vezesRep = rep["mergesort:300000"].media / rep["quicksort:300000"].media;
    const vezesOrd = CEN.aleatorio["mergesort:300000"].media / CEN.ordenado["mergesort:300000"].media;
    lista(s, [
      "O Quicksort venceu nos 4 cenários",
      `Entrada já ordenada ou invertida: os dois ficam ~${num(vezesOrd, 0)}× mais rápidos (menos trocas, desvios previsíveis)`,
      `Muitos valores repetidos: Quicksort ${num(vezesRep, 1)}× mais rápido`,
      "A mediana de três evitou o pior caso nas entradas ordenadas",
    ], 9.1, 1.6, 3.63, 4.7);
    s.addNotes(
      "PESSOA 5. Também testamos entradas que não são aleatórias, usando a opção 3 do painel. O Quicksort ganhou em todas. " +
        "Com entrada já ordenada ou invertida os dois ficam bem mais rápidos, e o Quicksort não caiu no pior caso graças à mediana de três. " +
        "Com muitos valores repetidos a vantagem do Quicksort foi a maior."
    );
  }

  // ===== 13. Conclusão
  pres.addSection({ title: "Conclusão" });
  s = pres.addSlide({ masterName: "ESCURO", sectionTitle: "Conclusão" });
  s.addText("Conclusão: depende do que você precisa", { placeholder: "title" });
  s.addText(PESSOA(5), { placeholder: "orador" });
  const colunas = [
    ["Quicksort", T.accent2, fa.FaBolt, ["Mais rápido na média (~15% aqui)", "Não precisa de memória extra", "Exige um bom pivô para fugir do O(n²)"]],
    ["Mergesort", T.accent1, fa.FaShieldAlt, ["O(n log n) garantido, até no pior caso", "Estável: mantém a ordem de iguais", "Bom para listas ligadas e arquivos grandes"]],
  ];
  for (let i = 0; i < colunas.length; i++) {
    const [nome, cor, Ic, itens] = colunas[i];
    const x = 0.6 + i * 6.2;
    cartao(s, x, 1.55, 5.93, 3.1, "222B36", "coluna " + nome);
    await iconeCirculo(s, Ic, x + 0.35, 1.85, 0.75, cor, nome);
    s.addText(`Use ${nome} quando…`, { x: x + 1.3, y: 1.85, w: 4.4, h: 0.75, fontSize: 22, bold: true, color: C.background1, valign: "middle", margin: 0, isTextBox: true, objectName: "título " + nome });
    s.addText(itens.map((t, k) => ({ text: t, options: { bullet: true, breakLine: k < itens.length - 1 } })), {
      x: x + 0.35, y: 2.85, w: 5.3, h: 1.6, fontSize: 18, color: C.background1, paraSpaceAfter: 10, valign: "top", margin: 0, isTextBox: true, objectName: "itens " + nome,
    });
  }
  s.addText("Na prática o C++ usa os dois: std::sort (introsort, baseado no Quicksort) e std::stable_sort (baseado no Mergesort).", {
    x: 0.6, y: 5.0, w: 12.13, h: 0.7, fontSize: 18, color: C.background2, valign: "middle", margin: 0, isTextBox: true, objectName: "frase final",
  });
  s.addNotes(
    "PESSOA 5. Então, qual é melhor? Depende. Se o que importa é velocidade média e memória, Quicksort, que foi uns 15% mais rápido no nosso teste. " +
      "Se precisa de garantia de tempo no pior caso ou de estabilidade, Mergesort. Tanto que a biblioteca padrão do C++ oferece os dois: " +
      "std::sort é baseado no Quicksort e std::stable_sort no Mergesort."
  );

  // ===== 14. Perguntas
  s = pres.addSlide({ masterName: "ESCURO", sectionTitle: "Conclusão" });
  s.addText("Perguntas?", { x: 0.6, y: 2.5, w: 12.13, h: 1.3, fontSize: 60, bold: true, color: C.background1, fontFace: THEME.headFontFace, valign: "middle", margin: 0, isTextBox: true, objectName: "perguntas" });
  s.addText("Código, painel ADM e resultados: pasta trabalho_ordenacao  ·  PAINEL_ADM.bat", {
    x: 0.6, y: 3.9, w: 12.13, h: 0.6, fontSize: 18, color: C.background2, valign: "top", margin: 0, isTextBox: true, objectName: "onde encontrar",
  });
  [3, 9, 10, 15, 27, 38, 43, 82].forEach((v, i) => {
    const cor = i < 4 ? T.accent1 : T.accent2;
    s.addText(String(v), {
      shape: pres.shapes.ROUNDED_RECTANGLE, rectRadius: 0.08, x: 0.6 + i * (CW + CG), y: 5.5, w: CW, h: CH,
      fill: { color: cor }, line: { color: cor }, color: C.background1, fontSize: 16, bold: true, align: "center", valign: "middle", margin: 0, objectName: `final ${v}`,
    });
  });
  s.addNotes("TODOS (13:30 a 15:00). Cada um responde as perguntas sobre a própria parte. A Pessoa 5 conduz.");

  fs.mkdirSync(path.dirname(SAIDA), { recursive: true });
  await pres.writeFile({ fileName: SAIDA });
  await aplicarTema(SAIDA, THEME);
  console.log("Slides gerados em " + SAIDA);
}

main().catch((e) => { console.error(e); process.exit(1); });
