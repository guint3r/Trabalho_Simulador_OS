"""Gera artigo/planilha_resultados.xlsx: as 200 medições e a estatística descritiva calculada com fórmulas do Excel.
Lê resultados/resultados_brutos.csv e resultados/cenario_*/resultados_brutos.csv.
Uso (na pasta do projeto): python scripts/gerar_planilha.py   (requer openpyxl)"""
import csv
import os

from openpyxl import Workbook
from openpyxl.chart import BarChart, Reference
from openpyxl.comments import Comment
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter as col

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = os.path.join(RAIZ, "resultados")
SAIDA = os.path.join(RAIZ, "artigo", "planilha_resultados.xlsx")

ALGOS = [("mergesort", "Mergesort bottom-up"), ("quicksort", "Quicksort clássico")]
CENARIOS = [("aleatorio", "Aleatória"), ("ordenado", "Já ordenada"), ("inverso", "Invertida"), ("repetidos", "Muitos repetidos")]
AMOSTRAS = 20


def ler(pasta):
    d = {}
    with open(os.path.join(pasta, "resultados_brutos.csv")) as f:
        for r in csv.DictReader(f):
            d.setdefault((r["algoritmo"], int(r["n"])), []).append(float(r["tempo_ms"]))
    return d


brutos = ler(RES)
NS = sorted({n for _, n in brutos})

# ---------------------------------------------------------------- estilos
F = "Times New Roman"
fonte = lambda **k: Font(name=F, size=11, **k)
AZUL = fonte(color="0000FF")             # dado medido (entrada)
NEGRITO = fonte(bold=True)
TITULO = Font(name=F, size=14, bold=True)
CAB_FILL = PatternFill("solid", fgColor="DCDDF3")
fina = Side(style="thin", color="000000")
BORDA_CAB = Border(top=fina, bottom=fina)
BORDA_FIM = Border(bottom=fina)
CENTRO = Alignment(horizontal="center", vertical="center", wrap_text=True)
FMT_MS = "0.000000"


def cabecalho(ws, linha, coluna, textos):
    for i, t in enumerate(textos):
        c = ws.cell(linha, coluna + i, t)
        c.font, c.fill, c.alignment, c.border = NEGRITO, CAB_FILL, CENTRO, BORDA_CAB


def fonte_autores(ws, linha, coluna=1):
    ws.cell(linha, coluna, "Fonte: Autores (2026).").font = fonte(italic=True)


wb = Workbook()

# ---------------------------------------------------------------- Leia-me
ws = wb.active
ws.title = "Leia-me"
ws.column_dimensions["A"].width = 110
linhas = [
    ("Planilha de resultados — Mergesort bottom-up × Quicksort clássico", TITULO),
    ("Trabalho Final – Estrutura de Dados · Prof. Me. Marcelo Goulart Souza · Centro Universitário UNIFACVEST", fonte()),
    ("Autores: Jeferson Gomes Martins, João Vitor Gonçalves de Almeida, Juan Flor, Igor Jesus, Guilherme Silva", fonte()),
    ("", fonte()),
    ("Abas", NEGRITO),
    ("Dados: as 200 medições (20 amostras × 5 tamanhos × 2 algoritmos), em milissegundos.", fonte()),
    ("Estatística: Tabelas 1 a 5 do artigo — média, mediana, desvio padrão, variância, coeficiente de variação, máximo e mínimo.", fonte()),
    ("Crescimento: Tabela 6 do artigo — quanto o tempo médio cresce quando o conjunto é multiplicado por 10, comparado com n log n.", fonte()),
    ("Cenários: 20 amostras com 300.000 dados em entradas aleatória, já ordenada, invertida e com muitos repetidos (Figura 4).", fonte()),
    ("Gráficos: tempo médio por tamanho (escala logarítmica) e coeficiente de variação.", fonte()),
    ("", fonte()),
    ("Convenções", NEGRITO),
    ("Números em azul = valores medidos pelo programa (entrada). Números em preto = fórmulas do Excel, que recalculam se um dado mudar.", fonte()),
    ("Desvio padrão e variância são amostrais (funções DESVPAD e VAR, divisor n − 1). Coeficiente de variação = desvio padrão ÷ média.", fonte()),
    ("Origem dos dados: programa src/benchmark.cpp (arquivo resultados/resultados_brutos.csv), semente 42, compilado com g++ -O2.", fonte()),
]
for i, (t, f) in enumerate(linhas, 1):
    c = ws.cell(i, 1, t)
    c.font = f
    c.alignment = Alignment(wrap_text=True, vertical="top")

# ---------------------------------------------------------------- Dados
wd = wb.create_sheet("Dados")
wd["A1"] = "Tempos de execução das 20 amostras (ms)"
wd["A1"].font = TITULO
LIN0 = 5  # primeira linha de amostras
coluna_de = {}  # (algoritmo, n) -> letra da coluna em Dados
c0 = 2
for a, nome in ALGOS:
    wd.merge_cells(start_row=3, start_column=c0, end_row=3, end_column=c0 + len(NS) - 1)
    cab = wd.cell(3, c0, nome)
    cab.font, cab.fill, cab.alignment = NEGRITO, CAB_FILL, CENTRO
    for k, n in enumerate(NS):
        coluna_de[(a, n)] = col(c0 + k)
        cel = wd.cell(4, c0 + k, n)
        cel.number_format = "#,##0"
        cel.font, cel.fill, cel.alignment, cel.border = NEGRITO, CAB_FILL, CENTRO, BORDA_CAB
        for i, v in enumerate(brutos[(a, n)]):
            x = wd.cell(LIN0 + i, c0 + k, v)
            x.font, x.number_format = AZUL, FMT_MS
        wd.column_dimensions[col(c0 + k)].width = 13
    c0 += len(NS)
wd.cell(3, 1, "").fill = CAB_FILL
a4 = wd.cell(4, 1, "Amostra")
a4.font, a4.fill, a4.alignment, a4.border = NEGRITO, CAB_FILL, CENTRO, BORDA_CAB
for i in range(AMOSTRAS):
    wd.cell(LIN0 + i, 1, i + 1).font = fonte()
    wd.cell(LIN0 + i, 1).alignment = CENTRO
LINF = LIN0 + AMOSTRAS - 1
for cc in range(1, c0):
    wd.cell(LINF, cc).border = BORDA_FIM
wd.cell(4, 1).comment = Comment("Cada linha é uma amostra. Linha 4 = tamanho do conjunto (n).", "Autores")
wd.column_dimensions["A"].width = 10
wd.freeze_panes = "B5"
fonte_autores(wd, LINF + 2)
faixa = lambda a, n: f"Dados!${coluna_de[(a, n)]}${LIN0}:${coluna_de[(a, n)]}${LINF}"

# ---------------------------------------------------------------- Estatística (Tabelas 1 a 5)
we = wb.create_sheet("Estatística")
we["A1"] = "Estatística descritiva dos algoritmos de ordenação"
we["A1"].font = TITULO
larguras = [24, 13, 13, 14, 15, 15, 13, 13]
for i, w in enumerate(larguras, 1):
    we.column_dimensions[col(i)].width = w
CAB_E = ["Algoritmo", "Média (ms)", "Mediana (ms)", "Desvio Padrão (ms)", "Variância (ms²)", "Coeficiente de Variação (%)",
         "Máximo (ms)", "Mínimo (ms)"]
linha = 3
celula_media = {}  # (algoritmo, n) -> referência da média, usada nos gráficos
for t, n in enumerate(NS, 1):
    we.cell(linha, 1, f"Tabela {t}. Estatística descritiva dos algoritmos de ordenação com o conjunto de "
                      f"{n:,} dados.".replace(",", ".")).font = NEGRITO
    cabecalho(we, linha + 1, 1, CAB_E)
    we.row_dimensions[linha + 1].height = 45
    for k, (a, nome) in enumerate(ALGOS):
        r = linha + 2 + k
        fx = faixa(a, n)
        we.cell(r, 1, nome).font = fonte()
        formulas = [f"=AVERAGE({fx})", f"=MEDIAN({fx})", f"=STDEV({fx})", f"=VAR({fx})", f"=D{r}/B{r}",
                    f"=MAX({fx})", f"=MIN({fx})"]
        for j, fm in enumerate(formulas, 2):
            c = we.cell(r, j, fm)
            c.font, c.alignment = fonte(), Alignment(horizontal="center")
            c.number_format = FMT_MS
        we.cell(r, 5).number_format = "0.000E+00" if n <= 3000 else "0.0000"
        we.cell(r, 6).number_format = "0.0%"
        celula_media[(a, n)] = f"'Estatística'!$B${r}"
        if k == len(ALGOS) - 1:
            for j in range(1, 9):
                we.cell(r, j).border = BORDA_FIM
    fonte_autores(we, linha + 2 + len(ALGOS))
    linha += 6

# ---------------------------------------------------------------- Crescimento (Tabela 6)
wc = wb.create_sheet("Crescimento")
wc["A1"] = "Tabela 6. Crescimento do tempo médio a cada vez que o conjunto de dados é multiplicado por 10."
wc["A1"].font = NEGRITO
for i, w in enumerate([22, 14, 22, 22, 22], 1):
    wc.column_dimensions[col(i)].width = w
cabecalho(wc, 3, 1, ["Tamanhos", "n", "Previsto por n log n", "Mergesort bottom-up", "Quicksort clássico"])
for i, n in enumerate(NS):
    r = 4 + i
    wc.cell(r, 1, f"{NS[i - 1]:,} → {n:,}".replace(",", ".") if i else f"{n:,}".replace(",", ".")).font = fonte()
    cn = wc.cell(r, 2, n)
    cn.font, cn.number_format = AZUL, "#,##0"
    if i:
        f_prev = f"=(B{r}*LOG(B{r},2))/(B{r - 1}*LOG(B{r - 1},2))"
        f_m = f"=AVERAGE({faixa('mergesort', n)})/AVERAGE({faixa('mergesort', NS[i - 1])})"
        f_q = f"=AVERAGE({faixa('quicksort', n)})/AVERAGE({faixa('quicksort', NS[i - 1])})"
        for j, fm in enumerate([f_prev, f_m, f_q], 3):
            c = wc.cell(r, j, fm)
            c.font, c.number_format, c.alignment = fonte(), '0.0"×"', Alignment(horizontal="center")
    else:
        for j in range(3, 6):
            wc.cell(r, j, "–").alignment = Alignment(horizontal="center")
for j in range(1, 6):
    wc.cell(4 + len(NS) - 1, j).border = BORDA_FIM
fonte_autores(wc, 5 + len(NS))
wc.cell(7 + len(NS), 1, "Leitura: valores medidos próximos do previsto indicam comportamento O(n log n); "
                        "um algoritmo O(n²) cresceria cerca de 100× a cada linha.").font = fonte(italic=True)

# ---------------------------------------------------------------- Cenários (Figura 4)
cen = {c: ler(os.path.join(RES, f"cenario_{c}")) for c, _ in CENARIOS if os.path.exists(os.path.join(RES, f"cenario_{c}"))}
if len(cen) == 4:
    wn = wb.create_sheet("Cenários")
    wn["A1"] = "Tempos com 300.000 dados em diferentes tipos de entrada (ms)"
    wn["A1"].font = TITULO
    colc = {}
    c0 = 2
    for a, nome in ALGOS:
        wn.merge_cells(start_row=3, start_column=c0, end_row=3, end_column=c0 + 3)
        cab = wn.cell(3, c0, nome)
        cab.font, cab.fill, cab.alignment = NEGRITO, CAB_FILL, CENTRO
        for k, (c, rot) in enumerate(CENARIOS):
            colc[(a, c)] = col(c0 + k)
            h = wn.cell(4, c0 + k, rot)
            h.font, h.fill, h.alignment, h.border = NEGRITO, CAB_FILL, CENTRO, BORDA_CAB
            wn.column_dimensions[col(c0 + k)].width = 14
            for i, v in enumerate(cen[c][(a, 300000)]):
                x = wn.cell(5 + i, c0 + k, v)
                x.font, x.number_format = AZUL, FMT_MS
        c0 += 4
    a4 = wn.cell(4, 1, "Amostra")
    a4.font, a4.fill, a4.alignment, a4.border = NEGRITO, CAB_FILL, CENTRO, BORDA_CAB
    wn.cell(3, 1).fill = CAB_FILL
    for i in range(AMOSTRAS):
        wn.cell(5 + i, 1, i + 1).alignment = CENTRO
    wn.column_dimensions["A"].width = 26
    r = 5 + AMOSTRAS
    for j in range(1, c0):
        wn.cell(r - 1, j).border = BORDA_FIM
    rotulos = [("Média (ms)", "AVERAGE", FMT_MS), ("Mediana (ms)", "MEDIAN", FMT_MS), ("Desvio Padrão (ms)", "STDEV", FMT_MS)]
    for k, (rot, fn, fmt) in enumerate(rotulos):
        wn.cell(r + k, 1, rot).font = NEGRITO
        for (a, c), letra in colc.items():
            x = wn.cell(r + k, wn[f"{letra}4"].column, f"={fn}({letra}5:{letra}{4 + AMOSTRAS})")
            x.font, x.number_format = fonte(), fmt
    rq = r + len(rotulos)
    wn.cell(rq, 1, "Quicksort mais rápido (%)").font = NEGRITO
    for c, _ in CENARIOS:
        lm, lq = colc[("mergesort", c)], colc[("quicksort", c)]
        x = wn.cell(rq, wn[f"{lq}4"].column, f"=1-{lq}{r}/{lm}{r}")
        x.font, x.number_format = NEGRITO, "0.0%"
    fonte_autores(wn, rq + 2)

# ---------------------------------------------------------------- Gráficos
wg = wb.create_sheet("Gráficos")
wg["A1"] = "Resumo para os gráficos (fórmulas ligadas à aba Dados)"
wg["A1"].font = TITULO
cabecalho(wg, 3, 1, ["n", "Mergesort bottom-up (ms)", "Quicksort clássico (ms)", "CV Mergesort", "CV Quicksort"])
for i, w in enumerate([12, 24, 24, 16, 16], 1):
    wg.column_dimensions[col(i)].width = w
for i, n in enumerate(NS):
    r = 4 + i
    cn = wg.cell(r, 1, f"{n:,}".replace(",", "."))
    cn.font, cn.alignment = fonte(), CENTRO
    for j, a in enumerate(["mergesort", "quicksort"]):
        x = wg.cell(r, 2 + j, f"=AVERAGE({faixa(a, n)})")
        x.font, x.number_format = fonte(), FMT_MS
        y = wg.cell(r, 4 + j, f"=STDEV({faixa(a, n)})/AVERAGE({faixa(a, n)})")
        y.font, y.number_format = fonte(), "0.0%"
ult = 3 + len(NS)

g1 = BarChart()
g1.type, g1.grouping = "col", "clustered"
g1.title = "Tempo médio por tamanho (ms, escala log)"
g1.y_axis.title, g1.x_axis.title = "Tempo médio (ms)", "Tamanho do conjunto (n)"
g1.y_axis.scaling.logBase = 10
g1.add_data(Reference(wg, min_col=2, max_col=3, min_row=3, max_row=ult), titles_from_data=True)
g1.set_categories(Reference(wg, min_col=1, min_row=4, max_row=ult))
g1.height, g1.width = 9, 18
g1.series[0].graphicalProperties.solidFill = "1F4E9C"
g1.series[1].graphicalProperties.solidFill = "8A5CD6"
wg.add_chart(g1, "G3")

g2 = BarChart()
g2.type, g2.grouping = "col", "clustered"
g2.title = "Coeficiente de variação por tamanho"
g2.y_axis.title, g2.x_axis.title = "CV", "Tamanho do conjunto (n)"
g2.y_axis.number_format = "0%"
g2.add_data(Reference(wg, min_col=4, max_col=5, min_row=3, max_row=ult), titles_from_data=True)
g2.set_categories(Reference(wg, min_col=1, min_row=4, max_row=ult))
g2.height, g2.width = 9, 18
g2.series[0].graphicalProperties.solidFill = "1F4E9C"
g2.series[1].graphicalProperties.solidFill = "8A5CD6"
wg.add_chart(g2, "G23")
fonte_autores(wg, ult + 2)

os.makedirs(os.path.dirname(SAIDA), exist_ok=True)
wb.save(SAIDA)
print("planilha gerada em", SAIDA)
