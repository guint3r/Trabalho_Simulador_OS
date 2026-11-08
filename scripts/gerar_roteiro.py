"""Gera apresentacao/roteiro_de_fala.pdf (roteiro de fala e plano dos slides) e apresentacao/roteiro.json
(as falas, usadas como anotações do apresentador pelos slides). Os números vêm de artigo/dados_artigo.json.
Uso (na pasta do projeto): python scripts/gerar_roteiro.py   (requer reportlab)"""
import json
import math
import os

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import KeepTogether, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = json.load(open(os.path.join(RAIZ, "artigo", "dados_artigo.json"), encoding="utf-8"))
SAIDA_PDF = os.path.join(RAIZ, "apresentacao", "roteiro_de_fala.pdf")
SAIDA_JSON = os.path.join(RAIZ, "apresentacao", "roteiro.json")

# ---------------------------------------------------------------- grupo e apresentação
GRUPO = ["Guilherme da Silva Santos", "Jeferson Gomes Martins", "Gustavo Grobe", "Juan Flor", "Igor Jesus",
         "João Vitor Gonçalves de Almeida"]  # na ordem em que falam
CURTO = {"G": "Guilherme", "Je": "Jeferson", "Gu": "Gustavo", "Ju": "Juan", "I": "Igor", "Jo": "João Vitor"}
DATA = "13/11/2026 (Turma B)"
TOTAL_LIMITE = 15 * 60

# ---------------------------------------------------------------- números (os mesmos do artigo)
E = lambda a, n: D["estatistica"][f"{a}:{n}"]
M = lambda n: E("mergesort", n)
Q = lambda n: E("quicksort", n)
dif = lambda n: (M(n)["media"] - Q(n)["media"]) / M(n)["media"] * 100
difmd = lambda n: (M(n)["mediana"] - Q(n)["mediana"]) / M(n)["mediana"] * 100
C = D["cenarios"]
cdif = lambda c: (C[c]["mergesort"]["media"] - C[c]["quicksort"]["media"]) / C[c]["mergesort"]["media"] * 100
NS = D["tamanhos"]
razoes = [E(a, NS[i])["media"] / E(a, NS[i - 1])["media"] for i in range(1, len(NS)) for a in ("mergesort", "quicksort")]
prev = [(NS[i] * math.log2(NS[i])) / (NS[i - 1] * math.log2(NS[i - 1])) for i in range(1, len(NS))]
outras = [cdif(c) for c in ("ordenado", "inverso", "repetidos")]


def br(v, casas=1):
    return f"{v:.{casas}f}".replace(".", ",")


def pct(v):
    return br(v, 1).replace(",0", "") + "%"


P_ = lambda v: f"{round(v):d}"
passadas = math.ceil(math.log2(300000))
nlogn300 = 300000 * math.log2(300000) / 1e6

# ---------------------------------------------------------------- slides
SLIDES = [
    dict(n="1", titulo="Mergesort × Quicksort", quem="G", t=30,
         msg="Somos o grupo e vamos comparar o Mergesort bottom-up com o Quicksort clássico medindo 200 ordenações.",
         tela=["Título: MERGESORT × QUICKSORT (azul-marinho e roxo)",
               "Subtítulo: Algoritmos de ordenação: funcionamento, complexidade e desempenho",
               "Visual: quadradinhos 7 3 9 1 6 / 4 8 2 5 → seta → 1 2 3 4 5 6 7 8 9",
               "Integrantes, na ordem em que falam: " + " · ".join(GRUPO),
               "Rodapé: Estrutura de Dados · Prof. Me. Marcelo Goulart Souza · Centro Universitário UNIFACVEST"],
         fala="Boa noite, professor e colegas. Eu sou o Guilherme, e comigo estão o Jeferson, o Gustavo, o Juan, o Igor "
              "e o João Vitor. O nosso trabalho compara dois algoritmos de ordenação: o Mergesort, na versão bottom-up, "
              "e o Quicksort clássico. Implementamos os dois em C++ e medimos 200 ordenações para responder uma pergunta "
              "simples: na prática, qual ordena mais rápido? Todos nós vamos apresentar uma parte.",
         trans="Primeiro: como comparar dois algoritmos de forma justa?"),
    dict(n="2", titulo="Como comparar algoritmos de ordenação?", quem="G", t=45,
         msg="Comparação justa: os mesmos dados, cinco tamanhos e 20 medições de cada caso.",
         tela=["5 tópicos à esquerda: o que é ordenar, o que comparamos, 20 medições, mesmos dados, conferência",
               "À direita: escada 30 → 300 → 3.000 → 30.000 → 300.000 elementos, com “× 20 amostras cada”"],
         fala="Ordenar é organizar os dados segundo uma ordem, e isso está por trás de quase tudo: busca, banco de dados, "
              "ranking. Para comparar os dois algoritmos de forma justa, usamos os cinco tamanhos do enunciado, de 30 até "
              "300 mil números. Cada tamanho foi medido 20 vezes para cada algoritmo, o que dá 200 ordenações. E, em cada "
              "medição, os dois recebem exatamente os mesmos números, como uma prova igual para todos os alunos. No fim, "
              "conferimos se todo vetor saiu ordenado.",
         trans="E como medimos esse tempo na prática?"),
    dict(n="3", titulo="Como medimos", quem="G", t=45,
         msg="Medimos só a ordenação, com dados reproduzíveis, e conferimos cada resultado.",
         tela=["5 passos numerados: gerar (semente 42) → copiar → cronometrar → conferir → estatística e gráficos",
               "Cartão “Ferramentas”: C++11, Dev-C++ no Windows 11, PAINEL_ADM.bat, Python + Matplotlib, "
               "medições num servidor Linux"],
         fala="O programa segue cinco passos. Gera os números aleatórios com uma semente fixa, a 42, então quem rodar de "
              "novo recebe os mesmos dados. Copia esses dados para os dois algoritmos. Cronometra só a ordenação: gerar e "
              "copiar ficam fora do cronômetro. Confere se o vetor saiu ordenado. E, no fim, calcula a estatística e monta "
              "os gráficos. O código é em C++ e roda no Windows com o Dev-C++, pelo painel PAINEL_ADM.bat. Os números do "
              "artigo foram medidos num servidor Linux, e a estatística ficou numa planilha do Excel.",
         trans="Vou mostrar rapidinho o painel rodando. (Se o tempo estiver apertado, pular direto para o slide 4.)"),
    dict(n="D", titulo="Demonstração: o painel rodando (opcional)", quem="G", t=60, demo=True,
         msg="O programa roda de verdade: 200 ordenações em segundos e a tabela no formato do professor.",
         tela=["Sem slide próprio: tirar a apresentação da tela (Alt+Tab) e mostrar o PAINEL_ADM.bat; "
               "ver o passo a passo na seção 3"],
         fala="Este é o painel que fizemos. Com a opção 2, ele roda as 200 ordenações em uns dois segundos e abre um "
              "relatório no navegador. Com a opção 11, mostra a estatística no formato que o professor pediu, uma tabela "
              "por tamanho. Os números desta máquina podem sair diferentes dos do slide, porque é outro computador, mas o "
              "padrão é o mesmo: empate nos vetores pequenos e o Quicksort na frente nos grandes.",
         trans="Voltando aos slides: o Jeferson explica o algoritmo do nosso grupo, o Mergesort bottom-up."),
    dict(n="4", titulo="Mergesort Bottom-Up: intercalação", quem="Je", t=105,
         msg="O bottom-up não divide: junta blocos de baixo para cima, dobrando o tamanho; n log n sempre, estável, com "
             "memória extra.",
         tela=["3 etapas numeradas à esquerda",
               "Diagrama com 9 números em 5 linhas: blocos de 1 → de 2 → de 4 → de 8 → pronto",
               "Quadro “No dia a dia”: torneio de chaves",
               "Faixa embaixo: Complexidade O(n log n) em qualquer caso · Estável · Usa memória auxiliar O(n)"],
         fala="O algoritmo do nosso grupo é o Mergesort, na versão bottom-up, de baixo para cima. A versão mais conhecida, a "
              "top-down, divide o vetor ao meio várias vezes, com recursão. A bottom-up pula essa parte: ela parte da ideia "
              "de que cada número sozinho já é um bloco ordenado. Na primeira passada, junta os blocos vizinhos de dois em "
              "dois: o 7 com o 3 vira 3 e 7, o 9 com o 1 vira 1 e 9. Na segunda, junta blocos de dois e forma blocos de "
              "quatro. Depois, de oito. Com nove números são quatro passadas, e o 5, que sobrou sozinho, espera o seu par. "
              "Juntar, ou intercalar, é comparar o primeiro de cada bloco e pegar o menor. É como um torneio de chaves: "
              f"jogam as duplas, depois os quartetos, até sobrar o campeão. Como o bloco dobra a cada passada, com 300 mil "
              f"números são só {passadas} passadas, e cada uma percorre todos os elementos. Por isso o custo é n log n em "
              "qualquer caso. Ele é estável, ou seja, mantém a ordem dos elementos iguais, mas precisa de um vetor auxiliar "
              "do mesmo tamanho, e é aí que ele perde tempo.",
         trans="Agora o Gustavo mostra o outro lado: o Quicksort."),
    dict(n="5", titulo="Quicksort: dividir em torno de um pivô", quem="Gu", t=75,
         msg="O Quicksort escolhe o pivô do meio, separa menores e maiores no próprio vetor e repete em cada lado.",
         tela=["Vetor 7 3 9 1 6 4 8 2 5 com o 6 destacado (“pivô = elemento do meio”)",
               "Linha do meio: 5 3 2 1 4 | 6 8 9 7 (menores ou iguais a 6 | maiores ou iguais a 6)",
               "Linha de baixo: 1 2 3 4 5 | 6 7 8 9 (repete em cada lado)",
               "3 tópicos, quadro “No dia a dia” (nota de corte) e as faixas O(n log n) / O(n²) e “Ordena no próprio vetor”"],
         fala="O Quicksort também divide o problema, mas de outro jeito. Primeiro, escolhe um pivô. Na versão clássica que "
              "usamos, o pivô é o elemento do meio: aqui, o 6. Aí entram dois índices. Um vem da esquerda procurando quem "
              "é maior ou igual a 6, o outro vem da direita procurando quem é menor ou igual, e os dois trocam de lugar. "
              "Quando eles se cruzam, o vetor está dividido: de um lado 5, 3, 2, 1 e 4; do outro, 6, 8, 9 e 7. Depois, ele "
              "repete a mesma coisa em cada lado, até tudo ficar em ordem. É como separar provas por uma nota de corte: as "
              "menores numa pilha, as maiores na outra. A grande vantagem é que ele faz tudo no próprio vetor, sem vetor "
              "extra.",
         trans="Mas o Quicksort tem um ponto fraco, que aparece na complexidade."),
    dict(n="6", titulo="Complexidade e desempenho", quem="Gu", t=45,
         msg="Os dois são n log n na média, mas o Quicksort pode virar n² com um pivô ruim.",
         tela=["Gráfico de linhas (escala log): n log n × n², de 30 a 300.000",
               f"Destaque: com 300.000 itens, n log n ≈ {br(nlogn300)} milhões de passos; n² ≈ 90 bilhões",
               "Quadro “No dia a dia”: festa de 300 mil pessoas"],
         fala="Na teoria, o Mergesort é n log n no melhor, no médio e no pior caso. O Quicksort é n log n na média, mas, se o "
              "pivô for sempre o menor ou o maior elemento, ele vira n ao quadrado. O gráfico mostra o tamanho dessa "
              f"diferença: com 300 mil itens, n log n dá uns {br(nlogn300)} milhões de passos; n ao quadrado, 90 bilhões. "
              "É como uma festa de 300 mil pessoas em que todo mundo cumprimenta todo mundo.",
         trans="Na teoria, os dois empatam na média. E na prática? O Juan mostra os resultados."),
    dict(n="7", titulo="Resultados: tempo médio de 20 amostras", quem="Ju", t=60,
         msg=f"Empate até 3.000 itens; o Quicksort foi {pct(dif(30000))} e {pct(dif(300000))} mais rápido com 30 mil e 300 mil.",
         tela=["Tabela: Itens × Mergesort (ms) × Quicksort (ms) × Resultado",
               f"Cartão roxo: {round(dif(300000))}% — Quick mais rápido com 300.000 dados",
               "Cartão claro: Até 3.000 dados, diferenças dentro da variação das medições"],
         fala="Esta tabela mostra o tempo médio das 20 amostras, em milissegundos. Até 3 mil números, os dois algoritmos "
              "empataram: as diferenças foram menores que a variação natural das medições, e com 30 e 300 itens o "
              "Mergesort chegou a ficar um pouco na frente. A partir de 30 mil, o Quicksort passa a ganhar sempre: foi "
              f"{pct(dif(30000))} mais rápido com 30 mil e {pct(dif(300000))} mais rápido com 300 mil, com "
              f"{br(Q(300000)['media'])} milissegundos contra {br(M(300000)['media'])}. Para ter uma ideia, uma piscada de "
              "olho dura uns 100 milissegundos: os dois ordenam 300 mil números em menos de um terço disso.",
         trans="Só a média não basta: o enunciado pede a estatística completa."),
    dict(n="8", titulo="Estatística descritiva: 300.000 dados", quem="Ju", t=75,
         msg="A tabela segue o formato pedido; a mediana confirma a vantagem do Quicksort, com dispersão moderada.",
         tela=["Tabela: Algoritmo × Média × Mediana × Desvio × Variância × CV (%) × Máx/Mín",
               f"3 cartões: {round(difmd(300000))}% de mediana menor no Quicksort · CV de {round(M(300000)['cv'])}% e "
               f"{round(Q(300000)['cv'])}% · 5 tabelas no artigo",
               "Quadro “No dia a dia”: a mediana é o aluno do meio da fila"],
         fala="Esta é a tabela no formato que o professor pediu, para o maior conjunto, 300 mil dados. Além da média, "
              "calculamos a mediana, que é o valor do meio das 20 amostras: "
              f"{br(Q(300000)['mediana'])} milissegundos no Quicksort contra {br(M(300000)['mediana'])} no Mergesort, "
              f"{round(difmd(300000))}% a menos. O desvio padrão e a variância mostram o quanto os tempos se espalham, e o "
              "coeficiente de variação coloca isso em porcentagem da média: ficou em "
              f"{br(M(300000)['cv'])}% e {br(Q(300000)['cv'])}%, uma dispersão moderada. A mediana é como o aluno do meio "
              "da fila: não muda se um único aluno chegar muito atrasado. Por isso ela confirma o que a média mostrou. As "
              "tabelas dos cinco tamanhos estão no artigo e na planilha do Excel.",
         trans="O Igor mostra essas 20 amostras de outro jeito: no boxplot."),
    dict(n="9", titulo="Boxplot: distribuição das 20 amostras", quem="I", t=60,
         msg="Caixas sobrepostas significam empate; caixas separadas, diferença real.",
         tela=["Imagem com 5 boxplots (30, 300, 3.000, 30.000 e 300.000 dados), Merge em azul e Quick em roxo",
               "Faixa embaixo: Até 3.000, caixas se sobrepõem → empate · 30.000 e 300.000, Quick mais baixo → mais rápido"],
         fala="O boxplot mostra todas as 20 medições de cada caso. A caixa vai do primeiro ao terceiro quartil, ou seja, "
              "guarda a metade do meio das amostras, e a linha dentro dela é a mediana. Os pontinhos soltos são medições "
              "fora do padrão, quase sempre mais lentas por alguma interferência do sistema. Usamos uma regra simples: se "
              "as caixas dos dois algoritmos se sobrepõem, é empate. Até 3 mil itens, elas se sobrepõem. Com 30 mil, as "
              "caixas se separam, e a do Quicksort fica mais embaixo. Com 300 mil, a caixa do Quicksort continua mais baixa.",
         trans="E como esse tempo cresce quando os dados aumentam?"),
    dict(n="10", titulo="O crescimento confirma n log n", quem="I", t=45,
         msg=f"Dados ×10 → tempo ×{round(min(razoes))} a ×{round(max(razoes))}, perto do previsto por n log n.",
         tela=["Gráfico de barras (escala log): tempo médio por tamanho, Merge e Quick",
               f"Números grandes à direita: ×{round(min(razoes))} a ×{round(max(razoes))} medido · "
               f"×{round(min(prev))} a ×{round(max(prev))} previsto · ×100 seria n²"],
         fala="Neste gráfico, em escala logarítmica, as barras sobem em degraus quase iguais. Cada vez que multiplicamos os "
              f"dados por 10, o tempo cresceu entre {round(min(razoes))} e {round(max(razoes))} vezes. A fórmula n log n "
              f"prevê entre {round(min(prev))} e {round(max(prev))} vezes, então a prática bateu com a teoria. Se o "
              "algoritmo fosse n ao quadrado, cada degrau seria de 100 vezes.",
         trans="Até aqui, os números eram aleatórios. O João Vitor mostra o que acontece com outras entradas."),
    dict(n="11", titulo="Outros tipos de entrada (300.000 dados)", quem="Jo", t=45,
         msg=f"O Quicksort venceu nas 4 entradas; nas ordenadas, invertidas e repetidas, de {round(min(outras))}% a "
             f"{round(max(outras))}% mais rápido.",
         tela=["Gráfico de barras: Aleatória, Já ordenada, Invertida, Muitos repetidos",
               f"Cartão roxo: {round(min(outras))}% a {round(max(outras))}% · tópico do pivô ideal · quadro “No dia a dia” (estante)"],
         fala="Também testamos 300 mil números em quatro tipos de entrada: aleatória, já ordenada, invertida e com muitos "
              f"valores repetidos. O Quicksort venceu nas quatro, e nas três últimas foi de {round(min(outras))}% a "
              f"{round(max(outras))}% mais rápido. Num vetor já ordenado, o elemento do meio é exatamente o pivô ideal, por "
              "isso o Quicksort não caiu no pior caso. É como arrumar uma estante que já está quase em ordem.",
         trans="Juntando tudo, cada algoritmo tem vantagens e desvantagens."),
    dict(n="12", titulo="Vantagens e desvantagens", quem="Jo", t=45,
         msg="O Mergesort ganha em garantia; o Quicksort, em velocidade e memória.",
         tela=["Dois cartões: MERGESORT (azul) e QUICKSORT (lilás), com as desvantagens em roxo"],
         fala="O Mergesort tem tempo garantido, n log n sempre, é estável e, na versão bottom-up, não usa recursão. A "
              "desvantagem é a memória extra e as cópias, e foi por isso que ele ficou mais lento no nosso teste. O "
              f"Quicksort foi até {round(dif(300000))}% mais rápido e usa pouca memória, porque ordena no próprio vetor. As "
              "desvantagens são o pior caso n ao quadrado, se o pivô for ruim, e o fato de não ser estável.",
         trans="O Guilherme fecha com a nossa conclusão."),
    dict(n="13", titulo="Qual algoritmo escolher?", quem="G", t=45,
         msg="Depende do objetivo: velocidade, Quicksort; garantia e estabilidade, Mergesort.",
         tela=["3 tópicos, “Curiosidade” sobre o pivô, “Obrigado!” e a placa de direção MERGESORT ← | → QUICKSORT"],
         fala="Então, qual algoritmo escolher? Depende do objetivo. Se o que importa é velocidade e pouca memória, o "
              "Quicksort, desde que o pivô seja bem escolhido. Se é preciso garantir o tempo no pior caso ou manter a ordem "
              "dos elementos iguais, o Mergesort. Tanto que a própria biblioteca do C++ oferece os dois. E uma curiosidade: "
              "um pivô mal escolhido transforma o Quicksort num algoritmo quadrático. Obrigado pela atenção. Ficamos à "
              "disposição para perguntas.",
         trans="(fim; abrir para perguntas)"),
]

mmss = lambda s: f"{s // 60}:{s % 60:02d}"
acum = 0
for s in SLIDES:
    s["inicio"] = acum
    acum += s["t"]
    s["acum"] = acum
TOTAL = acum
por_pessoa = {}
for s in SLIDES:
    por_pessoa.setdefault(s["quem"], [0, []])
    por_pessoa[s["quem"]][0] += s["t"]
    por_pessoa[s["quem"]][1].append(s["n"])

# ---------------------------------------------------------------- roteiro.json (anotações dos slides)
notas = {}
for s in SLIDES:
    if s.get("demo"):
        continue
    notas[s["n"]] = (f"{CURTO[s['quem']].upper()} ({mmss(s['inicio'])} a {mmss(s['acum'])}, {mmss(s['t'])}). "
                     f"{s['fala']}  →  {s['trans']}")
json.dump({"integrantes": GRUPO, "notas": notas}, open(SAIDA_JSON, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

# ---------------------------------------------------------------- PDF
F = "/usr/share/fonts/truetype/liberation/"  # Liberation Sans: mesmas medidas da Arial
pdfmetrics.registerFont(TTFont("DV", F + "LiberationSans-Regular.ttf"))
pdfmetrics.registerFont(TTFont("DVB", F + "LiberationSans-Bold.ttf"))
pdfmetrics.registerFont(TTFont("DVI", F + "LiberationSans-Italic.ttf"))
pdfmetrics.registerFontFamily("DV", normal="DV", bold="DVB", italic="DVI", boldItalic="DVB")
NAVY, ROXO, CINZA = colors.HexColor("#142B54"), colors.HexColor("#4B2B93"), colors.HexColor("#4A5060")
LAV, LINHA, AZUL_CL = colors.HexColor("#F1F0FA"), colors.HexColor("#C9CBE0"), colors.HexColor("#E6EDF8")

base = ParagraphStyle("b", fontName="DV", fontSize=10, leading=14.5, textColor=colors.HexColor("#1E2433"))
peq = ParagraphStyle("p", parent=base, fontSize=8.8, leading=12, textColor=CINZA)
tit = ParagraphStyle("t", parent=base, fontName="DVB", fontSize=17, leading=22, textColor=NAVY)
h1 = ParagraphStyle("h1", parent=base, fontName="DVB", fontSize=13.5, leading=18, textColor=NAVY, spaceBefore=12, spaceAfter=6, keepWithNext=1)
h2 = ParagraphStyle("h2", parent=base, fontName="DVB", fontSize=12, leading=16, textColor=ROXO)
fala_st = ParagraphStyle("f", parent=base, fontSize=11, leading=17)
cel = ParagraphStyle("c", parent=base, fontSize=9, leading=12)
celb = ParagraphStyle("cb", parent=cel, fontName="DVB")
P = lambda t, s=base: Paragraph(t, s)
mono = lambda t: f"<font name='DV' color='#4B2B93'>{t}</font>"


def tabela(linhas, larg, zebra=True):
    t = Table([[P(c, celb if i == 0 else cel) for c in l] for i, l in enumerate(linhas)], colWidths=larg, repeatRows=1)
    st = [("GRID", (0, 0), (-1, -1), 0.5, LINHA), ("BACKGROUND", (0, 0), (-1, 0), LAV), ("VALIGN", (0, 0), (-1, -1), "TOP"),
          ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 5)]
    t.setStyle(TableStyle(st))
    return t


def caixa(conteudo, fundo=LAV, borda=LINHA, larg=17 * cm):
    t = Table([[conteudo]], colWidths=[larg])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), fundo), ("BOX", (0, 0), (-1, -1), 0.6, borda),
                           ("LEFTPADDING", (0, 0), (-1, -1), 12), ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                           ("TOPPADDING", (0, 0), (-1, -1), 9), ("BOTTOMPADDING", (0, 0), (-1, -1), 10)]))
    return t


h = []
H = h.append
H(P("Roteiro de fala e plano dos slides", tit))
H(P("<b>Tema:</b> Análise comparativa de desempenho entre os algoritmos de ordenação Mergesort bottom-up e Quicksort clássico"))
H(P("<b>Disciplina:</b> Estrutura de Dados · <b>Professor:</b> Me. Marcelo Goulart Souza · <b>Apresentação:</b> " + DATA))
H(P("<b>Grupo (na ordem em que falam):</b> " + " · ".join(GRUPO)))
H(P("<b>Instituição:</b> Centro Universitário UNIFACVEST · Ciência da Computação · Lages – SC"))
H(Spacer(1, 8))
H(P("Este roteiro diz o que está em cada slide, quem fala, o que dizer e quanto tempo. Todos os números foram copiados "
    "dos resultados do artigo (os mesmos dos slides e da planilha). Ao ensaiar, <b>não troquem valores de memória</b>: "
    "se esquecer um número, aponte para a tela."))
H(Spacer(1, 6))
H(P(f"<b>O que este plano cumpre:</b> todos os 6 integrantes apresentam; {mmss(TOTAL)} de apresentação, com 1 minuto de "
    f"demonstração opcional, mais {mmss(TOTAL_LIMITE - TOTAL)} para perguntas, dentro dos 15 minutos; os slides seguem a "
    "ordem do artigo (problema → método → algoritmos → resultados com estatística descritiva, boxplot e barras → "
    "conclusão)."))
H(Spacer(1, 6))
H(P("<b>Como foi feita a divisão:</b> pela dicção do grupo e pela importância de cada parte. O Guilherme abre, faz a "
    "demonstração e fecha. O Jeferson explica o algoritmo do grupo, o Mergesort bottom-up. O Juan apresenta os resultados "
    "e a estatística, a parte que o professor mais cobra. O Gustavo, o Igor e o João Vitor ficam com slides mais visuais, "
    "em que o desenho ajuda a explicação e a fala é mais curta. Cada um fala em blocos seguidos, sem ir e voltar."))

H(P("1. Tabela geral", h1))
linhas = [["Nº", "Título do slide", "Quem", "Tempo", "Acumulado"]]
for s in SLIDES:
    linhas.append([s["n"] if not s.get("demo") else "—", s["titulo"], CURTO[s["quem"]], mmss(s["t"]), mmss(s["acum"])])
linhas.append(["", "<b>Perguntas</b>", "Todos (o Guilherme conduz)", mmss(TOTAL_LIMITE - TOTAL), mmss(TOTAL_LIMITE)])
H(tabela(linhas, [1.1 * cm, 8.4 * cm, 3.6 * cm, 1.7 * cm, 2.2 * cm]))
H(Spacer(1, 6))
partes = []
for k, (seg, ns) in por_pessoa.items():
    sl = [n for n in ns if n != "D"]
    txt = f"{CURTO[k]} {mmss(seg)} (slides {', '.join(sl)}{' + demonstração' if 'D' in ns else ''})"
    partes.append(txt)
H(P("<b>Tempo por pessoa:</b> " + " · ".join(partes) + f". Total: {mmss(TOTAL)}."))
H(P("<b>Se atrasar:</b> cortem primeiro a demonstração (ganha 1:00) e encurtem o slide 6 para uma frase.", peq))

H(PageBreak())
H(P("2. Slides", h1))
for s in SLIDES:
    num = "Demonstração" if s.get("demo") else f"Slide {s['n']}"
    bloco = [
        caixa(P(f"<b>{num}</b>  ·  {s['titulo']}", ParagraphStyle("x", parent=h2, textColor=colors.white)),
              fundo=NAVY, borda=NAVY),
        Spacer(1, 6),
        P(f"<b>Quem fala:</b> {CURTO[s['quem']]}   ·   <b>Tempo:</b> {mmss(s['t'])} (de {mmss(s['inicio'])} a {mmss(s['acum'])})"),
        P(f"<b>Mensagem principal:</b> {s['msg']}"),
        Spacer(1, 4),
        P("<b>Na tela:</b>"),
    ] + [Paragraph(t, base, bulletText="•") for t in s["tela"]] + [
        Spacer(1, 6),
        caixa([P("<b>FALA</b>", ParagraphStyle("fl", parent=base, textColor=ROXO)), Spacer(1, 3), P(s["fala"], fala_st)]),
        Spacer(1, 4),
        P(f"<b>Transição:</b> <i>{s['trans']}</i>", peq),
        Spacer(1, 16),
    ]
    H(KeepTogether(bloco))

H(PageBreak())
H(P("3. Roteiro da demonstração (Guilherme, 1:00, opcional)", h1))
H(P("<b>Preparação</b> (antes de o professor chamar o grupo): pasta do ZIP extraída no notebook que vai no projetor; "
    "Dev-C++ instalado; o painel já compilado uma vez (opção 7); o PAINEL_ADM.bat aberto e minimizado; a janela do "
    "console com fonte grande (botão direito na barra de título → Propriedades → Fonte → 20 ou mais)."))
H(Spacer(1, 6))
H(tabela([
    ["Passo", "Tempo", "O que fazer", "O que deve aparecer", "O que dizer"],
    ["D1", "0:30", "Alt+Tab para o painel. Digitar <b>2</b> e Enter.",
     "“Executando 200 ordenações”, 5 linhas de ####, a tabela de médias e o relatório abrindo no navegador.",
     "“Com a opção 2, o painel roda as 200 ordenações em uns dois segundos e abre o relatório.”"],
    ["D2", "0:30", "Voltar ao painel, digitar <b>11</b> e Enter. Rolar até a Tabela 5.",
     "Tabelas 1 a 5 (Algoritmo × Média, Mediana, Desvio, Variância, CV, Máx/Mín) e a Tabela 6 de crescimento.",
     "“A opção 11 mostra a estatística no formato que o professor pediu. Os números desta máquina mudam, mas o padrão é "
     "o mesmo: empate nos pequenos e Quicksort na frente nos grandes.”"],
], [1.2 * cm, 1.2 * cm, 3.8 * cm, 5.0 * cm, 5.8 * cm]))
H(Spacer(1, 8))
H(P("<b>Plano B</b>", h2))
H(tabela([
    ["Falha", "O que fazer (sem parar a apresentação)"],
    ["O painel diz “Compilador NAO ENCONTRADO” ou não abre",
     "Pular a demonstração: “os números estão nos próximos slides” e seguir para o slide 4."],
    ["O navegador não abre o relatório", "Seguir direto para o passo D2."],
    ["Tela do console pequena ou cortada", "Mostrar só o passo D1 e voltar para os slides."],
    ["Estourou o tempo", "Pular a demonstração inteira (−1:00)."],
], [5.5 * cm, 11.5 * cm]))

H(P("4. Checklist", h1))
H(P("<b>Na véspera (12/11)</b>", h2))
for t in [
    "Extrair o ZIP no notebook da apresentação, abrir o PAINEL_ADM.bat e rodar as opções 7, 2 e 11 uma vez.",
    "Abrir o slides.pptx no PowerPoint: conferir os 6 nomes no slide 1 e se os títulos aparecem na fonte Arial Narrow.",
    "Ensaiar com cronômetro, na ordem e com as trocas de pessoa. Meta: 13:00. Limite: 15:00.",
    "Cada um ler a sua fala em voz alta pelo menos três vezes. Não precisa decorar palavra por palavra: decorem a "
    "mensagem principal e os números.",
    "Cada um ler as perguntas prováveis (seção 5) e responder em voz alta sem olhar.",
    "Copiar o ZIP e o slides.pptx para um pendrive.",
]:
    H(Paragraph(t, base, bulletText="☐"))
H(P("<b>30 minutos antes</b>", h2))
for t in [
    "Ligar o notebook no projetor e desligar as notificações.",
    "Abrir o slides.pptx no modo apresentação. As falas estão nas anotações do apresentador.",
    "Abrir o PAINEL_ADM.bat, deixar minimizado e aumentar a fonte do console.",
    "Combinar o sinal de tempo: quem estiver livre levanta a mão aos 10 e aos 13 minutos.",
]:
    H(Paragraph(t, base, bulletText="☐"))

H(P("5. Perguntas prováveis e respostas", h1))
H(P("Quem responde é quem apresentou o assunto. Se a pessoa travar, o Guilherme assume.", peq))
H(Spacer(1, 4))
perguntas = [
    ("Qual a diferença entre o Mergesort bottom-up e o top-down?", "Jeferson",
     "O top-down é recursivo: divide o vetor ao meio até sobrar 1 elemento e junta na volta da recursão. O bottom-up não "
     "divide: começa com blocos de 1 e junta em laços, dobrando o tamanho do bloco a cada passada. O custo é o mesmo, "
     "n log n, mas o bottom-up não usa recursão."),
    ("Por que o Mergesort é n log n?", "Jeferson",
     f"Porque o bloco dobra a cada passada, então são log de n passadas ({passadas} para 300 mil), e cada passada percorre "
     "os n elementos uma vez."),
    ("Se os dois são n log n, por que o Quicksort foi mais rápido?", "Juan",
     "A notação O esconde as constantes. O Mergesort copia todos os elementos para o vetor auxiliar e de volta a cada "
     "passada; o Quicksort só troca elementos no próprio vetor e aproveita melhor a memória cache."),
    ("Quando o Quicksort vira n²? Como vocês evitaram?", "Gustavo",
     "Quando o pivô é sempre o menor ou o maior elemento, por exemplo, o primeiro elemento num vetor já ordenado. Usamos o "
     f"elemento do meio, que num vetor ordenado é o pivô ideal: 300 mil números já ordenados levaram {br(C['ordenado']['quicksort']['media'])} ms."),
    ("O que é um algoritmo estável?", "Jeferson",
     "É o que mantém a ordem original dos elementos iguais, como a fila do banco: quem chegou antes continua na frente. O "
     "Mergesort é estável (no empate, pega o da esquerda); o Quicksort não."),
    ("Como mediram os vetores pequenos, que ordenam em menos de 1 microssegundo?", "Guilherme",
     "Cada amostra ordena k vetores diferentes (k = 20.000 ÷ n) e divide o tempo por k. Numa versão preliminar repetíamos o "
     "mesmo vetor, e os tempos saíram baixos demais, porque o processador “decora” a entrada repetida; por isso usamos "
     "vetores diferentes."),
    ("Por que 20 amostras e semente fixa?", "Guilherme",
     "As 20 amostras são do enunciado e permitem calcular a estatística. A semente fixa (42) faz o gerador produzir sempre "
     "os mesmos números, então qualquer pessoa consegue repetir o experimento."),
    ("O que é o coeficiente de variação?", "Juan",
     "É o desvio padrão dividido pela média, em porcentagem. Mostra o quanto os tempos variam em relação à média: ficou entre "
     f"{br(min(min(M(n)['cv'], Q(n)['cv']) for n in NS))}% e {br(max(max(M(n)['cv'], Q(n)['cv']) for n in NS))}%, de baixo a moderado."),
    ("Como se lê o boxplot?", "Igor",
     "A caixa vai do primeiro ao terceiro quartil (a metade do meio das amostras), a linha interna é a mediana e os pontos "
     "soltos são valores fora do padrão. Caixas que se sobrepõem indicam empate."),
    ("Por que as medições do artigo foram num servidor Linux?", "Guilherme",
     "Usamos um servidor Linux de terceiros, acessado remotamente, para ter um ambiente estável e igual para todas as "
     "medições. O mesmo programa roda no Windows pelo painel, e os números mudam de máquina para máquina, mas o padrão se "
     "mantém, como mostramos na demonstração."),
    ("Por que não fizeram o Quicksort personalizado?", "Guilherme",
     "Porque o item 3 do enunciado, que pedia o pivô personalizado, foi retirado. Comparamos o algoritmo do grupo com o "
     "Quicksort clássico, como pede o restante do enunciado."),
    ("Quanta memória o Mergesort usa a mais?", "Jeferson",
     "Um vetor auxiliar do mesmo tamanho: para 300 mil inteiros de 4 bytes, cerca de 1,2 MB."),
]
for i, (p, quem, r) in enumerate(perguntas, 1):
    H(KeepTogether([P(f"<b>{i}. {p}</b>  <font color='#4B2B93'>(responde: {quem})</font>"), P(r), Spacer(1, 7)]))


def rodape(c, d):
    c.saveState()
    c.setFont("DV", 8)
    c.setFillColor(CINZA)
    c.drawString(2 * cm, 1.2 * cm, "Roteiro de fala · Mergesort bottom-up × Quicksort clássico")
    c.drawRightString(A4[0] - 2 * cm, 1.2 * cm, f"página {d.page}")
    c.restoreState()


SimpleDocTemplate(SAIDA_PDF, pagesize=A4, leftMargin=2 * cm, rightMargin=2 * cm, topMargin=1.8 * cm, bottomMargin=1.8 * cm,
                  title="Roteiro de fala — Mergesort bottom-up × Quicksort clássico").build(h, onFirstPage=rodape, onLaterPages=rodape)
print("roteiro gerado em", SAIDA_PDF, "| total", mmss(TOTAL), "|", {CURTO[k]: mmss(v[0]) for k, v in por_pessoa.items()})
