"""Gera apresentacao/estudo_mergesort_bottom_up.pdf: material de estudo do Mergesort bottom-up.
O código mostrado é lido de src/benchmark.cpp e os números de resultados/resultados_resumo.csv.
Uso (na pasta do projeto): python scripts/gerar_estudo.py   (requer reportlab)"""
import csv
import math
import os
import re
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (KeepTogether, Paragraph, Preformatted, SimpleDocTemplate, Spacer, Table,
                                TableStyle)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = os.path.join(RAIZ, "resultados")
SAIDA = os.path.join(RAIZ, "apresentacao", "estudo_mergesort_bottom_up.pdf")

F = "/usr/share/fonts/truetype/dejavu/"
pdfmetrics.registerFont(TTFont("DV", F + "DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("DVB", F + "DejaVuSans-Bold.ttf"))
pdfmetrics.registerFont(TTFont("DVM", F + "DejaVuSansMono.ttf"))
pdfmetrics.registerFontFamily("DV", normal="DV", bold="DVB", italic="DV", boldItalic="DVB")

TINTA = colors.HexColor("#111111"); CINZA = colors.HexColor("#3A3F47")
AZUL = colors.HexColor("#1F66C2"); LARANJA = colors.HexColor("#D9541E")
FUNDO = colors.HexColor("#F1F3F6"); LINHA = colors.HexColor("#C9CED6"); DICA = colors.HexColor("#FFF6EF")

base = ParagraphStyle("b", fontName="DV", fontSize=10, leading=14.5, textColor=TINTA)
peq = ParagraphStyle("p", parent=base, fontSize=9, leading=12.5, textColor=CINZA)
tit = ParagraphStyle("t", parent=base, fontName="DVB", fontSize=21, leading=26)
sub = ParagraphStyle("s", parent=base, fontSize=11.5, leading=16, textColor=CINZA)
h1 = ParagraphStyle("h1", parent=base, fontName="DVB", fontSize=14, leading=19, spaceBefore=14, spaceAfter=6, keepWithNext=1)
cel = ParagraphStyle("c", parent=base, fontSize=9.2, leading=12.5)
celb = ParagraphStyle("cb", parent=cel, fontName="DVB")
celm = ParagraphStyle("cm", parent=cel, fontName="DVM", fontSize=8.6)
cod = ParagraphStyle("code", fontName="DVM", fontSize=7.3, leading=10, textColor=TINTA)
P = lambda t, s=base: Paragraph(t, s)
M = lambda t: f"<font name='DVM'>{t}</font>"


def tabela(linhas, larguras, mono_cols=()):
    dados = []
    for i, l in enumerate(linhas):
        dados.append([P(c, celb if i == 0 else (celm if j in mono_cols else cel)) if isinstance(c, str) else c
                      for j, c in enumerate(l)])
    t = Table(dados, colWidths=larguras, repeatRows=1)
    st = [("VALIGN", (0, 0), (-1, -1), "TOP"), ("GRID", (0, 0), (-1, -1), 0.5, LINHA),
          ("BACKGROUND", (0, 0), (-1, 0), FUNDO), ("TOPPADDING", (0, 0), (-1, -1), 4),
          ("BOTTOMPADDING", (0, 0), (-1, -1), 5), ("LEFTPADDING", (0, 0), (-1, -1), 6)]
    t.setStyle(TableStyle(st))
    return t


def caixa(conteudo, fundo=DICA, borda=colors.HexColor("#F0B999")):
    t = Table([[conteudo]], colWidths=[17 * cm])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), fundo), ("BOX", (0, 0), (-1, -1), 0.8, borda),
                           ("LEFTPADDING", (0, 0), (-1, -1), 10), ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                           ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 9)]))
    return t


# ---------------------------------------------------------------- código real do projeto
fonte = open(os.path.join(RAIZ, "src", "benchmark.cpp"), encoding="utf-8").read()
ini = fonte.index("// ---- Mergesort BOTTOM-UP")
fim_func = re.search(r"void mergesort\(vector<int>& v\) \{.*?\n\}\n", fonte[ini:], re.S)
CODIGO = fonte[ini:ini + fim_func.end()].rstrip()


# ---------------------------------------------------------------- simulação passo a passo
def passadas(v):
    v = list(v)
    n, largura, saida = len(v), 1, []
    while largura < n:
        pares = []
        for i in range(0, n - largura, 2 * largura):
            meio, fim = i + largura, min(i + 2 * largura, n)
            pares.append((v[i:meio], v[meio:fim]))
            v[i:fim] = sorted(v[i:fim])
        blocos = [v[i:i + 2 * largura] for i in range(0, n, 2 * largura)]
        saida.append((largura, pares, blocos))
        largura *= 2
    return saida


def fmt_blocos(blocos):
    return "  ".join("[" + " ".join(map(str, b)) + "]" for b in blocos)


def fmt_pares(pares):
    return "<br/>".join(f"[{' '.join(map(str, a))}] + [{' '.join(map(str, b))}]" for a, b in pares)


# ---------------------------------------------------------------- resultados medidos
res = {}
with open(os.path.join(RES, "resultados_resumo.csv")) as f:
    for r in csv.DictReader(f):
        res[(r["algoritmo"], int(r["n"]))] = r
NS = sorted({n for _, n in res})
mil = lambda n: f"{n:,}".replace(",", ".")
ms = lambda v: (f"{v:.4f}" if v < 1 else f"{v:.2f}").replace(".", ",")

historia = []
H = historia.append
X = historia.extend

H(P("Mergesort bottom-up", tit))
H(P("Material de estudo · trabalho Mergesort × Quicksort", sub))
H(Spacer(1, 10))

# 1. Ideia
H(P("1. A ideia em um minuto", h1))
H(P("O Mergesort <b>bottom-up</b> (de baixo para cima) ordena sem dividir nada e sem recursão. Ele parte de um fato simples: "
    "<b>um bloco de 1 elemento já está ordenado</b>. Então ele intercala blocos vizinhos de 1 e forma blocos de 2; "
    "intercala blocos de 2 e forma blocos de 4; depois 8, 16… A largura do bloco dobra a cada <b>passada</b>, "
    "até um bloco cobrir o vetor inteiro."))
H(Spacer(1, 6))
H(caixa(P("<b>No dia a dia:</b> um torneio de chaves. Primeiro jogam as duplas, depois os vencedores formam quartetos, "
          "depois grupos de 8, até sobrar um campeão. Ninguém precisa “dividir” o torneio antes: ele já começa pelas duplas.")))
H(Spacer(1, 6))
H(P("<b>Intercalar</b> (merge) é juntar dois blocos já ordenados em um só: compara o primeiro de cada bloco, copia o menor "
    "para um vetor auxiliar e avança naquele bloco. Quando um bloco acaba, copia o resto do outro."))

# 2. Passo a passo
H(P("2. Passo a passo com os 8 números dos slides", h1))
EX = [38, 27, 43, 3, 9, 82, 10, 15]
linhas = [["Passo", "Largura", "Pares intercalados", "Vetor depois da passada", "Blocos"]]
linhas.append(["início", "–", "–", fmt_blocos([[x] for x in EX]), "8 de 1"])
for k, (larg, pares, blocos) in enumerate(passadas(EX), 1):
    linhas.append([str(k), str(larg), fmt_pares(pares), fmt_blocos(blocos), f"{len(blocos)} de {2 * larg}"])
H(tabela(linhas, [1.9 * cm, 1.9 * cm, 5.0 * cm, 6.2 * cm, 2.0 * cm], mono_cols=(2, 3)))
H(Spacer(1, 4))
H(P(f"São 3 passadas para 8 elementos, porque log<sub>2</sub> 8 = 3. Para 300.000 elementos são "
    f"{math.ceil(math.log2(300000))} passadas.", peq))

# 3. n não potência de 2
H(P("3. E quando o tamanho não é potência de 2?", h1))
H(P("O último bloco pode ficar menor, ou ficar sem par. O código trata os dois casos: "
    f"{M('fim = min(ini + 2*largura, n)')} corta o bloco no fim do vetor, e um bloco sem par simplesmente "
    "não é intercalado naquela passada (já está ordenado) e entra na próxima. Exemplo com 5 números:"))
H(Spacer(1, 5))
EX5 = [5, 1, 4, 2, 3]
linhas = [["Passo", "Largura", "Pares intercalados", "Vetor depois da passada", "Observação"]]
linhas.append(["início", "–", "–", fmt_blocos([[x] for x in EX5]), "5 blocos de 1"])
obs = ["o [3] fica sem par", "o [3] ainda sem par", "agora o [3] entra"]
for k, (larg, pares, blocos) in enumerate(passadas(EX5), 1):
    linhas.append([str(k), str(larg), fmt_pares(pares), fmt_blocos(blocos), obs[k - 1]])
H(tabela(linhas, [1.9 * cm, 1.9 * cm, 4.4 * cm, 5.0 * cm, 3.8 * cm], mono_cols=(2, 3)))

# 4. Código
H(P("4. O código (exatamente o que está em src/benchmark.cpp)", h1))
H(caixa(Preformatted(CODIGO, cod), fundo=FUNDO, borda=LINHA))
H(Spacer(1, 6))
H(tabela([
    ["Trecho", "O que faz"],
    [M("vector&lt;int&gt; aux(n)"), "Vetor auxiliar do mesmo tamanho: é a “mesa extra” onde a intercalação monta o resultado. Memória O(n)."],
    [M("for (largura = 1; largura &lt; n; largura *= 2)"), "Uma volta por passada: largura 1, 2, 4, 8… São ⌈log<sub>2</sub> n⌉ voltas."],
    [M("for (ini = 0; ini &lt; n - largura; ini += 2*largura)"), "Anda de par em par de blocos. A condição garante que o 2º bloco existe; se não existir, o bloco sobra."],
    [M("meio = ini + largura"), "Onde começa o 2º bloco do par."],
    [M("fim = min(ini + 2*largura, n)"), "Onde termina o 2º bloco; o min corta o último bloco no fim do vetor."],
    [M("(v[i] &lt;= v[j]) ? v[i++] : v[j++]"), "Dentro de intercalar: em empate pega o da esquerda. É isso que torna o algoritmo <b>estável</b>."],
], [6.4 * cm, 10.6 * cm]))

# 5. Comparação
H(P("5. Bottom-up, top-down e Quicksort", h1))
H(tabela([
    ["Aspecto", "Mergesort bottom-up", "Mergesort top-down", "Quicksort (nosso)"],
    ["Estratégia", "Junta blocos de 1, 2, 4, 8…", "Divide ao meio até 1, depois junta", "Escolhe pivô e separa menores/maiores"],
    ["Recursão", "Não (dois laços)", "Sim, profundidade log n", "Sim, só no lado menor: log n"],
    ["Tempo (melhor / médio / pior)", "n log n / n log n / n log n", "n log n / n log n / n log n", "n log n / n log n / n²"],
    ["Memória extra", "O(n): vetor auxiliar", "O(n) + pilha O(log n)", "O(log n): só a pilha"],
    ["Estável?", "Sim", "Sim", "Não"],
], [3.6 * cm, 4.5 * cm, 4.5 * cm, 4.4 * cm]))
H(Spacer(1, 4))
H(P("Com 8 elementos (ou qualquer potência de 2), bottom-up e top-down fazem exatamente as mesmas intercalações; "
    "só a ordem em que acontecem muda. Com outros tamanhos os blocos podem sair diferentes, mas o custo é o mesmo.", peq))

# 6. Resultados
H(P("6. O que medimos (média de 20 execuções, em ms)", h1))
linhas = [["Itens (n)", "Mergesort bottom-up", "Quicksort", "Diferença", "Mais rápido"]]
for n in NS:
    mm, qq = float(res[("mergesort", n)]["media_ms"]), float(res[("quicksort", n)]["media_ms"])
    dif = (mm - qq) / mm * 100
    venc = "empate" if abs(dif) < 3 else ("Quicksort" if dif > 0 else "Mergesort")
    linhas.append([mil(n), ms(mm), ms(qq), f"{abs(dif):.0f}%", venc])
H(tabela(linhas, [3.0 * cm, 4.0 * cm, 3.4 * cm, 3.0 * cm, 3.6 * cm]))
H(Spacer(1, 4))
H(P("Abaixo de 3.000 itens os tempos são de microssegundos e a porcentagem muda a cada rodada. "
    "Para ver as tabelas completas (média, desvio, mínimo, máximo e crescimento): PAINEL_ADM.bat, opção [11].", peq))

# 7. Perguntas
H(P("7. Perguntas que a banca pode fazer", h1))
pergs = [
    ("Qual a diferença entre bottom-up e top-down?",
     "O top-down é recursivo: divide o vetor ao meio até sobrar 1 elemento e junta na volta da recursão. "
     "O bottom-up pula a divisão: começa direto dos blocos de 1 e junta em laços, dobrando a largura."),
    ("Por que o custo é n log n?",
     "Cada passada percorre os n elementos uma vez (intercalando). Como a largura dobra, são log<sub>2</sub> n passadas. "
     "n × log n. Para 300.000: 19 passadas."),
    ("Por que precisa do vetor auxiliar?",
     "Para intercalar dois blocos sem perder valores: o resultado é montado no auxiliar e copiado de volta. "
     "É a “mesa extra” para juntar as cartas."),
    ("Ele é estável? Por quê?",
     f"Sim. Na intercalação, em caso de empate ({M('v[i] &lt;= v[j]')}) ele pega o elemento do bloco da esquerda, "
     "que veio antes. Itens iguais nunca trocam de ordem: como a fila do banco."),
    ("E se n não for potência de 2?",
     "O último bloco fica menor ou sem par. O min() corta o bloco no fim do vetor, e o bloco sem par espera a próxima passada."),
    ("Se os dois são n log n, por que o Quicksort foi mais rápido?",
     "A notação O esconde as constantes. O Mergesort copia cada elemento para o auxiliar e de volta em toda passada; "
     "o Quicksort troca elementos no próprio vetor e usa melhor a memória cache."),
    ("Quando vale mais usar o bottom-up?",
     "Quando não se quer recursão (sem risco de estourar a pilha), em listas ligadas e em ordenação de arquivos "
     "grandes em disco, que são lidos em blocos. Cada passada também é fácil de dividir entre processadores."),
]
for pq, rs in pergs:
    H(KeepTogether([P(f"<b>{pq}</b>"), P(rs), Spacer(1, 6)]))

# 8. Fontes
H(P("8. Para estudar mais", h1))
X([Paragraph(t, base, bulletText="•") for t in [
    "<b>Sedgewick &amp; Wayne, <i>Algorithms</i>, 4ª ed., seção 2.2 (Mergesort)</b>: a referência do bottom-up "
    "(classe MergeBU), com explicação e análise. Conteúdo gratuito em algs4.cs.princeton.edu/22mergesort",
    "<b>Cormen et al., <i>Algoritmos: Teoria e Prática</i> (CLRS), seção 2.3</b>: a intercalação (MERGE) e a análise n log n.",
    "<b>Wikipedia (inglês), “Merge sort”, seção “Bottom-up implementation”</b>: pseudocódigo curto.",
]])


def rodape(c, d):
    c.saveState(); c.setFont("DV", 8); c.setFillColor(CINZA)
    c.drawString(2 * cm, 1.2 * cm, "Mergesort bottom-up — material de estudo")
    c.drawRightString(A4[0] - 2 * cm, 1.2 * cm, str(d.page)); c.restoreState()


doc = SimpleDocTemplate(SAIDA, pagesize=A4, leftMargin=2 * cm, rightMargin=2 * cm, topMargin=1.8 * cm,
                        bottomMargin=1.8 * cm, title="Mergesort bottom-up — material de estudo")
doc.build(historia, onFirstPage=rodape, onLaterPages=rodape)
print("estudo gerado em " + SAIDA)
