"""Gera apresentacao/divisao_trabalho.pdf (plano da apresentacao para 5 pessoas). Requer reportlab.
Uso (na pasta do projeto): python scripts/gerar_pdf.py"""
import csv
import os
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (Image, KeepTogether, PageBreak, Paragraph, SimpleDocTemplate,
                                Spacer, Table, TableStyle)

F = "/usr/share/fonts/truetype/dejavu/"
pdfmetrics.registerFont(TTFont("DV", F + "DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("DVB", F + "DejaVuSans-Bold.ttf"))
pdfmetrics.registerFont(TTFont("DVM", F + "DejaVuSansMono.ttf"))
pdfmetrics.registerFontFamily("DV", normal="DV", bold="DVB", italic="DV", boldItalic="DVB")

AZUL = colors.HexColor("#2a78d6"); LARANJA = colors.HexColor("#eb6834")
TINTA = colors.HexColor("#1f1f1d"); CINZA = colors.HexColor("#52514e")
FUNDO = colors.HexColor("#f3f2ee"); LINHA = colors.HexColor("#dcdad3")

base = ParagraphStyle("b", fontName="DV", fontSize=9.6, leading=13.4, textColor=TINTA, alignment=TA_LEFT)
pequeno = ParagraphStyle("p", parent=base, fontSize=8.6, leading=11.6, textColor=CINZA)
titulo = ParagraphStyle("t", parent=base, fontName="DVB", fontSize=20, leading=25)
sub = ParagraphStyle("s", parent=base, fontSize=11, leading=15, textColor=CINZA)
h1 = ParagraphStyle("h1", parent=base, fontName="DVB", fontSize=13.5, leading=18, spaceBefore=10, spaceAfter=5)
h2 = ParagraphStyle("h2", parent=base, fontName="DVB", fontSize=11, leading=14.5, textColor=AZUL)
cel = ParagraphStyle("c", parent=base, fontSize=8.8, leading=12)
celb = ParagraphStyle("cb", parent=cel, fontName="DVB")

P = lambda t, s=base: Paragraph(t, s)

def bullets(itens, s=base):
    return [Paragraph(i, s, bulletText="•") for i in itens]

def tabela(linhas, larguras, cab=True, zebra=True):
    t = Table([[c if not isinstance(c, str) else P(c, celb if (cab and i == 0) else cel) for c in l]
               for i, l in enumerate(linhas)], colWidths=larguras, repeatRows=1 if cab else 0)
    st = [("VALIGN", (0, 0), (-1, -1), "TOP"), ("LINEBELOW", (0, 0), (-1, -1), 0.4, LINHA),
          ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4)]
    if cab: st += [("LINEBELOW", (0, 0), (-1, 0), 1, TINTA)]
    if zebra: st += [("BACKGROUND", (0, i), (-1, i), FUNDO) for i in range(2, len(linhas), 2)]
    t.setStyle(TableStyle(st)); return t

# ---------- dados medidos ----------
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = os.path.join(RAIZ, "resultados")
res = {}
with open(os.path.join(RES, "resultados_resumo.csv")) as f:
    for r in csv.DictReader(f):
        res[(r["algoritmo"], int(r["n"]))] = float(r["media_ms"]), float(r["desvio_ms"])
NS = [30, 300, 3000, 30000, 300000]
fmt_n = lambda n: f"{n:,}".replace(",", ".")
def fmt_ms(v): return f"{v:.4f}".replace(".", ",") if v < 1 else f"{v:.2f}".replace(".", ",")

historia = []
H = historia.append

# ---------- Pagina 1: visao geral ----------
H(P("Mergesort bottom-up × Quicksort", titulo))
H(P("Plano da apresentação — divisão do trabalho entre 5 pessoas · 15 minutos", sub))
H(Spacer(1, 10))
H(P("<b>O trabalho:</b> implementar Mergesort e Quicksort em C++, medir o tempo de cada um com vetores de "
    "<b>30, 300, 3.000, 30.000 e 300.000</b> inteiros aleatórios, <b>20 execuções por tamanho</b> "
    "(5 × 20 × 2 = <b>200 ordenações</b>) e apresentar a comparação em 15 minutos. "
    "Já está tudo pronto na pasta <font name='DVM'>trabalho_ordenacao/</font>: o código C++, o painel <font name='DVM'>PAINEL_ADM.bat</font> (compila e roda tudo; precisa do Dev-C++ ou MinGW) e os slides (<font name='DVM'>apresentacao/slides.pptx</font>, com o roteiro de cada um nas anotações). "
    "O que falta é estudar a sua parte, colocar os nomes e ensaiar."))
H(Spacer(1, 6))
H(P("Como preencher: escrevam o nome de cada integrante na coluna “Responsável”. "
    "Cada pessoa fala ~2,5 a 3 min e prepara os próprios slides. Os tempos já somam 15:00.", pequeno))
H(Spacer(1, 8))
H(P("Cronograma da apresentação", h1))
H(tabela([
    ["Tempo", "Bloco", "Responsável", "Slides"],
    ["0:00 – 3:00", "<b>1. Abertura, como comparar e como medimos</b>", "Pessoa 1: ____________", "1 – 3"],
    ["3:00 – 5:30", "<b>2. Mergesort bottom-up</b>", "Pessoa 2: ____________", "4"],
    ["5:30 – 8:30", "<b>3. Quicksort clássico e complexidade</b>", "Pessoa 3: ____________", "5 – 6"],
    ["8:30 – 11:30", "<b>4. Resultados, estatística descritiva e boxplot</b>", "Pessoa 4: ____________", "7 – 9"],
    ["11:30 – 14:00", "<b>5. Crescimento, outras entradas e conclusão</b>", "Pessoa 5: ____________", "10 – 13"],
    ["14:00 – 15:00", "Perguntas (cada um responde sobre a sua parte)", "Todos", "13"],
], [2.5 * cm, 7.4 * cm, 4.6 * cm, 2.0 * cm]))
H(Spacer(1, 10))
H(P("Linha condutora (o que a plateia deve levar para casa)", h1))
historia.extend(bullets([
    "Até 3.000 dados os dois algoritmos empatam: as diferenças ficam dentro da variação das medições.",
    "Com 30.000 e 300.000 dados o Quicksort clássico foi cerca de 9% e 15% mais rápido, porque troca elementos "
    "no próprio vetor, enquanto o Mergesort copia tudo para um vetor auxiliar a cada passada.",
    "Quando os dados crescem 10×, o tempo cresceu de 11× a 15×: o comportamento n log n previsto pela teoria.",
    "O Mergesort ganha em garantia (O(n log n) sempre) e estabilidade; o Quicksort depende do pivô, e o pivô do "
    "meio evitou o pior caso em vetores já ordenados.",
]))

H(PageBreak())

# ---------- Paginas 2-3: cada pessoa ----------
H(P("O que cada pessoa faz", h1))
pessoas = [
    ("Pessoa 1 — Abertura, como comparar e como medimos", "0:00 – 3:00 · slides 1 a 3", TINTA, [
        "<b>Slide 1:</b> apresentar o grupo e o tema: Mergesort bottom-up × Quicksort clássico em C++.",
        "<b>Slide 2:</b> 5 tamanhos (30 a 300.000), 20 amostras cada, mesmos dados para os dois: 200 ordenações.",
        "<b>Slide 3:</b> passo a passo da medição e ferramentas (C++, Dev-C++, PAINEL_ADM.bat, Python).",
    ], [
        "Testar o <font name='DVM'>PAINEL_ADM.bat</font> no computador da apresentação (opções [2] e [11]) e levar um print de reserva.",
        "Controlar o tempo no ensaio (cada bloco tem horário de início na tabela da página 1).",
    ]),
    ("Pessoa 2 — Mergesort bottom-up", "3:00 – 5:30 · slide 4", AZUL, [
        "<b>Slide 4:</b> blocos de 1 já estão ordenados; intercala blocos vizinhos de 2, 4, 8… Com 9 números são "
        "4 passadas; com 300.000, 19. Custo n log n sempre, estável, usa vetor auxiliar.",
    ], [
        "Ler o material de estudo <font name='DVM'>apresentacao/estudo_mergesort_bottom_up.pdf</font> (painel, opção [10]).",
        "Preparar resposta para: “qual a diferença entre bottom-up e top-down?”.",
    ]),
    ("Pessoa 3 — Quicksort clássico e complexidade", "5:30 – 8:30 · slides 5 e 6", LARANJA, [
        "<b>Slide 5:</b> pivô = elemento do meio (6); dois índices trocam quem está do lado errado; resulta em "
        "[5 3 2 1 4] e [6 8 9 7]; repete em cada lado.",
        "<b>Slide 6:</b> n log n contra n²: com 300.000 itens, milhões contra bilhões de passos.",
    ], [
        "Estudar a função <font name='DVM'>quickRec</font> em <font name='DVM'>src/benchmark.cpp</font>.",
        "Preparar resposta para: “o que acontece se o pivô for sempre o menor elemento?”.",
    ]),
    ("Pessoa 4 — Resultados, estatística e boxplot", "8:30 – 11:30 · slides 7 a 9", TINTA, [
        "<b>Slide 7:</b> tabela de médias: empate até 3.000; Quick mais rápido em 30.000 e 300.000.",
        "<b>Slide 8:</b> estatística descritiva de 300.000: média, mediana, desvio, variância, CV e máximo/mínimo.",
        "<b>Slide 9:</b> boxplot: caixas sobrepostas = empate; caixas separadas = diferença real.",
    ], [
        "Saber explicar mediana, desvio padrão, coeficiente de variação e quartis (está no artigo, seção 2.4).",
        "Se o grupo rodar no próprio PC antes, comentar se os números de lá seguem o mesmo padrão.",
    ]),
    ("Pessoa 5 — Crescimento, outras entradas e conclusão", "11:30 – 14:00 · slides 10 a 13", LARANJA, [
        "<b>Slide 10:</b> dados ×10 → tempo ×11 a ×15, perto do previsto por n log n; n² seria ×100.",
        "<b>Slide 11:</b> com entradas ordenadas, invertidas ou repetidas o Quick foi 45% a 55% mais rápido.",
        "<b>Slides 12 e 13:</b> vantagens e desvantagens, qual escolher, agradecimento e perguntas.",
    ], [
        "Conduzir a rodada de perguntas (14:00 a 15:00).",
        "Ler a Conclusão do artigo.",
    ]),
]
for nome, quando, cor, fala, tarefas in pessoas:
    bloco = [P(nome, ParagraphStyle("hx", parent=h2, textColor=cor)), P(quando, pequeno), Spacer(1, 3),
             P("<b>O que apresentar</b>")] + bullets(fala) + [Spacer(1, 2), P("<b>Antes da apresentação</b>")] \
            + bullets(tarefas) + [Spacer(1, 10)]
    H(KeepTogether(bloco))

H(PageBreak())

# ---------- Pagina: resultados ----------
H(P("Resultados já medidos (slides 7 a 10)", h1))
H(P("Média e desvio padrão de 20 execuções, em milissegundos. Medido em um Intel Xeon 2,8 GHz; "
    "rodem de novo na máquina de vocês (PAINEL_ADM.bat, opção [2]). Os números mudam, o padrão se mantém.", pequeno))
H(Spacer(1, 6))
linhas = [["n", "Mergesort bottom-up (ms)", "Quicksort clássico (ms)", "Quicksort vs. Mergesort"]]
for n in NS:
    m, dm = res[("mergesort", n)]; q, dq = res[("quicksort", n)]
    dif = (m - q) / m * 100
    linhas.append([fmt_n(n), f"{fmt_ms(m)} ± {fmt_ms(dm)}", f"{fmt_ms(q)} ± {fmt_ms(dq)}",
                   (f"{abs(dif):.0f}% mais rápido" if dif >= 3 else
                    f"{abs(dif):.0f}% mais lento" if dif <= -3 else "empate técnico")])
H(tabela(linhas, [2.6 * cm, 4.4 * cm, 4.4 * cm, 5.1 * cm]))
H(Spacer(1, 10))
H(Image(os.path.join(RES, "grafico.png"), width=16.5 * cm, height=16.5 * cm * 4.2 / 7))
H(Spacer(1, 6))
H(P("Leitura rápida: de 30.000 para 300.000 (10× mais dados) o tempo cresceu de 11× a 12×, perto do previsto por "
    "n log n (10 × log 300.000 / log 30.000 ≈ 12,2). Um algoritmo O(n²) cresceria 100×.", pequeno))

H(Spacer(1, 12))
H(P("Checklist do grupo", h1))
H(tabela([
    ["", "Tarefa", "Quem"],
    ["☐", "Preencher os nomes na tabela da página 1 e combinar o prazo dos slides", "Todos"],
    ["☐", "Conferir os nomes no slide 1 e no artigo", "Pessoa 1"],
    ["☐", "Teste final rodado, CSVs e gráfico atualizados", "Pessoas 4 e 5"],
    ["☐", "Cada um leu as anotações do apresentador dos seus slides", "Todos"],
    ["☐", "Ensaio completo cronometrado (meta: 13:30 sem as perguntas)", "Todos"],
    ["☐", "Demo testada no computador da apresentação + plano B (print/vídeo)", "Pessoa 4"],
], [1.0 * cm, 12.0 * cm, 3.5 * cm]))

def rodape(c, d):
    c.saveState(); c.setFont("DV", 8); c.setFillColor(CINZA)
    c.drawString(2 * cm, 1.2 * cm, "Mergesort × Quicksort — divisão do trabalho")
    c.drawRightString(A4[0] - 2 * cm, 1.2 * cm, f"{d.page}"); c.restoreState()

doc = SimpleDocTemplate(os.path.join(RAIZ, "apresentacao", "divisao_trabalho.pdf"), pagesize=A4, leftMargin=2 * cm, rightMargin=2 * cm,
                        topMargin=1.8 * cm, bottomMargin=1.8 * cm, title="Divisão do trabalho — Mergesort x Quicksort")
doc.build(historia, onFirstPage=rodape, onLaterPages=rodape)
print("divisao_trabalho.pdf gerado")
