"""Gera divisao_trabalho.pdf (plano da apresentacao para 5 pessoas). Requer reportlab."""
import csv
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
res = {}
with open("resultados_resumo.csv") as f:
    for r in csv.DictReader(f):
        res[(r["algoritmo"], int(r["n"]))] = float(r["media_ms"]), float(r["desvio_ms"])
NS = [30, 300, 3000, 30000, 300000]
fmt_n = lambda n: f"{n:,}".replace(",", ".")
def fmt_ms(v): return f"{v:.4f}".replace(".", ",") if v < 1 else f"{v:.2f}".replace(".", ",")

historia = []
H = historia.append

# ---------- Pagina 1: visao geral ----------
H(P("Mergesort × Quicksort", titulo))
H(P("Plano da apresentação — divisão do trabalho entre 5 pessoas · 15 minutos", sub))
H(Spacer(1, 10))
H(P("<b>O trabalho:</b> implementar Mergesort e Quicksort em C++, medir o tempo de cada um com vetores de "
    "<b>30, 300, 3.000, 30.000 e 300.000</b> inteiros aleatórios, <b>20 execuções por tamanho</b> "
    "(5 × 20 × 2 = <b>200 ordenações</b>) e apresentar a comparação em 15 minutos. "
    "O código já está pronto em <font name='DVM'>benchmark_ordenacao/</font>; o que falta é estudar, "
    "montar os slides e ensaiar."))
H(Spacer(1, 6))
H(P("Como preencher: escrevam o nome de cada integrante na coluna “Responsável”. "
    "Cada pessoa fala ~2,5 a 3 min e prepara os próprios slides. Os tempos já somam 15:00.", pequeno))
H(Spacer(1, 8))
H(P("Cronograma da apresentação", h1))
H(tabela([
    ["Tempo", "Bloco", "Responsável", "Slides"],
    ["0:00 – 2:30", "<b>1. Abertura, problema e metodologia</b>", "Pessoa 1: ____________", "1 – 3"],
    ["2:30 – 5:00", "<b>2. Mergesort: como funciona e complexidade</b>", "Pessoa 2: ____________", "4 – 5"],
    ["5:00 – 7:30", "<b>3. Quicksort: como funciona e complexidade</b>", "Pessoa 3: ____________", "6 – 7"],
    ["7:30 – 10:30", "<b>4. Implementação, medição e demonstração ao vivo</b>", "Pessoa 4: ____________", "8 – 9"],
    ["10:30 – 13:30", "<b>5. Resultados, análise e conclusão</b>", "Pessoa 5: ____________", "10 – 12"],
    ["13:30 – 15:00", "Perguntas (cada um responde sobre a sua parte)", "Todos", "13"],
], [2.5 * cm, 7.4 * cm, 4.6 * cm, 2.0 * cm]))
H(Spacer(1, 10))
H(P("Linha condutora (o que a plateia deve levar para casa)", h1))
historia.extend(bullets([
    "Os dois algoritmos são O(n log n) no caso médio, e as medições confirmam: a cada vez que n cresce 10×, "
    "o tempo cresce um pouco mais que 10× (o fator log n).",
    "O Quicksort foi ~15% mais rápido nos tamanhos grandes, porque troca elementos no próprio vetor "
    "(melhor uso de cache) e não precisa copiar para um vetor auxiliar.",
    "O Mergesort ganha em garantia: é O(n log n) mesmo no pior caso e é estável. O Quicksort pode cair para "
    "O(n²) com pivô ruim, e por isso usamos a mediana de três.",
    "Nos tamanhos pequenos (30 e 300) a diferença some: tudo leva microssegundos.",
]))

H(PageBreak())

# ---------- Paginas 2-3: cada pessoa ----------
H(P("O que cada pessoa faz", h1))
pessoas = [
    ("Pessoa 1 — Abertura, problema e metodologia", "0:00 – 2:30 · slides 1 a 3", TINTA, [
        "<b>Slide 1:</b> título, nomes do grupo, disciplina.",
        "<b>Slide 2:</b> o problema: por que ordenar importa e por que comparar algoritmos medindo tempo, "
        "não só pela notação O.",
        "<b>Slide 3:</b> metodologia: 5 tamanhos, 20 execuções cada, mesmos dados para os dois algoritmos, "
        "números aleatórios de 0 a 1.000.000 com semente fixa (42), compilação com <font name='DVM'>-O2</font>, "
        "máquina usada (processador, sistema operacional).",
    ], [
        "Anotar a configuração da máquina onde o teste final for rodado.",
        "Fazer o modelo visual dos slides (cores, fonte) e compartilhar com o grupo no 1º dia.",
        "Juntar os slides de todos em um arquivo só e controlar o tempo no ensaio.",
    ]),
    ("Pessoa 2 — Mergesort", "2:30 – 5:00 · slides 4 e 5", AZUL, [
        "<b>Slide 4:</b> ideia de dividir e conquistar: divide o vetor ao meio até sobrar 1 elemento e "
        "intercala (merge) as metades ordenadas. Mostrar um exemplo com 8 números desenhado passo a passo.",
        "<b>Slide 5:</b> complexidade: O(n log n) no melhor, médio e pior caso; memória extra O(n) "
        "(vetor auxiliar, ~1,2 MB para 300.000 inteiros); algoritmo estável.",
    ], [
        "Estudar as funções <font name='DVM'>merge</font> e <font name='DVM'>mergesortRec</font> em "
        "<font name='DVM'>benchmark.cpp</font>.",
        "Desenhar a árvore de divisão do exemplo (pode ser à mão e fotografar, ou no próprio slide).",
        "Preparar resposta para: “por que log n níveis?”.",
    ]),
    ("Pessoa 3 — Quicksort", "5:00 – 7:30 · slides 6 e 7", LARANJA, [
        "<b>Slide 6:</b> ideia: escolhe um pivô, separa menores à esquerda e maiores à direita "
        "(particionamento de Hoare) e repete em cada lado. Exemplo com os mesmos 8 números do slide 4.",
        "<b>Slide 7:</b> complexidade: O(n log n) no caso médio, O(n²) no pior caso; memória extra só da "
        "recursão, O(log n); não é estável. Explicar a mediana de três como defesa contra o pior caso.",
    ], [
        "Estudar <font name='DVM'>quicksortRec</font> em <font name='DVM'>benchmark.cpp</font>.",
        "Combinar com a Pessoa 2 para usar o mesmo exemplo de 8 números.",
        "Preparar resposta para: “o que acontece com um vetor já ordenado e pivô no primeiro elemento?”.",
    ]),
    ("Pessoa 4 — Implementação, medição e demo", "7:30 – 10:30 · slides 8 e 9", TINTA, [
        "<b>Slide 8:</b> como medimos: <font name='DVM'>std::chrono::steady_clock</font> em volta da chamada, "
        "uma rodada de aquecimento descartada, os dois algoritmos ordenam cópias do mesmo vetor e "
        "<font name='DVM'>std::is_sorted</font> confere o resultado.",
        "<b>Slide 9 / demo:</b> compilar e rodar <font name='DVM'>./benchmark</font> ao vivo (leva ~2 s) e "
        "mostrar a tabela aparecendo no terminal e o CSV gerado.",
    ], [
        "Garantir que o programa compila no computador da apresentação (ou levar print/vídeo de reserva).",
        "Rodar a versão final do teste e passar os CSVs para a Pessoa 5.",
        "Preparar resposta para: “por que usar a mesma entrada nos dois algoritmos?”.",
    ]),
    ("Pessoa 5 — Resultados, análise e conclusão", "10:30 – 13:30 · slides 10 a 12", TINTA, [
        "<b>Slide 10:</b> tabela de médias e desvios (a da página seguinte).",
        "<b>Slide 11:</b> o gráfico em escala log: as duas retas quase paralelas mostram o mesmo crescimento "
        "n log n; o Quicksort fica sempre um pouco abaixo nos tamanhos grandes.",
        "<b>Slide 12:</b> conclusão: quando usar cada um (Quicksort quando velocidade média importa; "
        "Mergesort quando precisa de garantia de pior caso ou estabilidade) e o que mudaríamos no teste.",
    ], [
        "Gerar o gráfico com <font name='DVM'>python3 grafico.py</font> depois do teste final.",
        "Calcular a diferença percentual em 300.000 e a razão de crescimento entre tamanhos.",
        "Montar o slide 13 (“Perguntas?”) e conduzir a rodada de perguntas.",
    ]),
]
for nome, quando, cor, fala, tarefas in pessoas:
    bloco = [P(nome, ParagraphStyle("hx", parent=h2, textColor=cor)), P(quando, pequeno), Spacer(1, 3),
             P("<b>O que apresentar</b>")] + bullets(fala) + [Spacer(1, 2), P("<b>Antes da apresentação</b>")] \
            + bullets(tarefas) + [Spacer(1, 10)]
    H(KeepTogether(bloco))

H(PageBreak())

# ---------- Pagina: resultados ----------
H(P("Resultados já medidos (para os slides 10 e 11)", h1))
H(P("Média e desvio padrão de 20 execuções, em milissegundos. Medido em um Intel Xeon 2,8 GHz; "
    "rodem de novo na máquina de vocês e atualizem os números (o padrão deve se manter).", pequeno))
H(Spacer(1, 6))
linhas = [["n", "Mergesort (ms)", "Quicksort (ms)", "Quicksort vs. Mergesort"]]
for n in NS:
    m, dm = res[("mergesort", n)]; q, dq = res[("quicksort", n)]
    dif = (m - q) / m * 100
    linhas.append([fmt_n(n), f"{fmt_ms(m)} ± {fmt_ms(dm)}", f"{fmt_ms(q)} ± {fmt_ms(dq)}",
                   (f"{abs(dif):.0f}% mais rápido" if dif >= 3 else
                    f"{abs(dif):.0f}% mais lento" if dif <= -3 else "empate técnico")])
H(tabela(linhas, [2.6 * cm, 4.4 * cm, 4.4 * cm, 5.1 * cm]))
H(Spacer(1, 10))
H(Image("grafico.png", width=16.5 * cm, height=16.5 * cm * 4.2 / 7))
H(Spacer(1, 6))
H(P("Leitura rápida: de 30.000 para 300.000 (10× mais dados) o tempo cresceu ~12×, como previsto por "
    "n log n (10 × log 300.000 / log 30.000 ≈ 12,2). Um algoritmo O(n²) cresceria 100×.", pequeno))

H(Spacer(1, 12))
H(P("Checklist do grupo", h1))
H(tabela([
    ["", "Tarefa", "Quem"],
    ["☐", "Preencher os nomes na tabela da página 1 e combinar o prazo dos slides", "Todos"],
    ["☐", "Modelo dos slides compartilhado", "Pessoa 1"],
    ["☐", "Teste final rodado, CSVs e gráfico atualizados", "Pessoas 4 e 5"],
    ["☐", "Slides de todos juntados em um arquivo", "Pessoa 1"],
    ["☐", "Ensaio completo cronometrado (meta: 13:30 sem as perguntas)", "Todos"],
    ["☐", "Demo testada no computador da apresentação + plano B (print/vídeo)", "Pessoa 4"],
], [1.0 * cm, 12.0 * cm, 3.5 * cm]))

def rodape(c, d):
    c.saveState(); c.setFont("DV", 8); c.setFillColor(CINZA)
    c.drawString(2 * cm, 1.2 * cm, "Mergesort × Quicksort — divisão do trabalho")
    c.drawRightString(A4[0] - 2 * cm, 1.2 * cm, f"{d.page}"); c.restoreState()

doc = SimpleDocTemplate("divisao_trabalho.pdf", pagesize=A4, leftMargin=2 * cm, rightMargin=2 * cm,
                        topMargin=1.8 * cm, bottomMargin=1.8 * cm, title="Divisão do trabalho — Mergesort x Quicksort")
doc.build(historia, onFirstPage=rodape, onLaterPages=rodape)
print("divisao_trabalho.pdf gerado")
