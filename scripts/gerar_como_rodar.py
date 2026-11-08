"""Gera Como_rodar_PAINEL_ADM.pdf (passo a passo para rodar o painel no Windows).
Uso (na pasta do projeto): python scripts/gerar_como_rodar.py   (requer reportlab)"""
import os

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import KeepTogether, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

F = "/usr/share/fonts/truetype/dejavu/"
pdfmetrics.registerFont(TTFont("DV", F + "DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("DVB", F + "DejaVuSans-Bold.ttf"))
pdfmetrics.registerFont(TTFont("DVM", F + "DejaVuSansMono.ttf"))
pdfmetrics.registerFontFamily("DV", normal="DV", bold="DVB", italic="DV", boldItalic="DVB")

TINTA = colors.HexColor("#111111"); CINZA = colors.HexColor("#3A3F47"); LARANJA = colors.HexColor("#D9541E")
FUNDO = colors.HexColor("#F1F3F6"); LINHA = colors.HexColor("#C9CED6"); DICA = colors.HexColor("#FFF6EF")
base = ParagraphStyle("b", fontName="DV", fontSize=10.5, leading=15, textColor=TINTA)
tit = ParagraphStyle("t", parent=base, fontName="DVB", fontSize=22, leading=27)
sub = ParagraphStyle("s", parent=base, fontSize=11.5, leading=16, textColor=CINZA)
h1 = ParagraphStyle("h", parent=base, fontName="DVB", fontSize=14, leading=19, spaceBefore=12, spaceAfter=5, keepWithNext=1)
cel = ParagraphStyle("c", parent=base, fontSize=10, leading=13.5)
celb = ParagraphStyle("cb", parent=cel, fontName="DVB")
P = lambda t, s=base: Paragraph(t, s)
M = lambda t: f"<font name='DVM'>{t}</font>"

def passos(itens):
    return [Paragraph(t, base, bulletText=f"{i}.") for i, t in enumerate(itens, 1)]

def caixa(texto, fundo=DICA, borda=colors.HexColor("#F0B999")):
    t = Table([[P(texto)]], colWidths=[17 * cm])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), fundo), ("BOX", (0, 0), (-1, -1), 0.8, borda),
                           ("LEFTPADDING", (0, 0), (-1, -1), 10), ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                           ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 8)]))
    return t

def tabela(linhas, larg):
    t = Table([[P(c, celb if i == 0 else cel) for c in l] for i, l in enumerate(linhas)], colWidths=larg)
    t.setStyle(TableStyle([("GRID", (0, 0), (-1, -1), 0.5, LINHA), ("BACKGROUND", (0, 0), (-1, 0), FUNDO),
                           ("VALIGN", (0, 0), (-1, -1), "TOP"), ("TOPPADDING", (0, 0), (-1, -1), 5),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 6), ("LEFTPADDING", (0, 0), (-1, -1), 7)]))
    return t

h = []
h += [P("Como rodar o PAINEL_ADM.bat", tit),
      P("Passo a passo · trabalho Mergesort bottom-up × Quicksort", sub), Spacer(1, 6)]

h.append(P("1. Baixar e extrair", h1))
h += passos([
    "Baixe o projeto: na página do GitHub, botão verde <b>Code → Download ZIP</b> (ou use o ZIP que o grupo mandou).",
    "Antes de extrair: botão direito no ZIP → <b>Propriedades</b>. Se aparecer a caixinha <b>Desbloquear</b>, "
    "marque e dê OK (evita aviso de segurança depois).",
    "Botão direito no ZIP → <b>Extrair tudo…</b> (pode ser na Área de Trabalho).",
    f"Entre na pasta extraída: é a que tem o {M('PAINEL_ADM.bat')}.",
])
h += [Spacer(1, 5), caixa("<b>Atenção:</b> não rode o .bat de dentro do ZIP sem extrair. Ele não consegue criar arquivos ali.")]

h.append(P("2. Ter o compilador (só na primeira vez)", h1))
h.append(P("Se já tem o Dev-C++ instalado, pule para o passo 3. Se não tem:"))
h += passos([
    f"Baixe o <b>Embarcadero Dev-C++</b> em {M('github.com/Embarcadero/Dev-Cpp/releases')} "
    f"(o arquivo que termina em {M('Setup.exe')}).",
    "Instale tudo no padrão: Próximo, Próximo, Concluir. Não precisa nem abrir o Dev-C++ depois.",
])

h.append(P("3. Rodar o painel", h1))
h += passos([
    f"Dois cliques em <b>{M('PAINEL_ADM.bat')}</b>.",
    "Se aparecer <b>“O Windows protegeu o computador”</b>: clique em <b>Mais informações → Executar assim mesmo</b>.",
    f"No topo do painel, a linha <b>Compilador</b> deve mostrar um caminho terminado em {M('g++.exe')}. "
    "Se mostrar <b>NAO ENCONTRADO</b>, volte ao passo 2.",
    "Digite <b>2</b> e Enter. Na primeira vez ele compila (alguns segundos), roda as 200 ordenações (~2 s) "
    "e abre o relatório no navegador.",
])

h.append(P("4. Explorar", h1))
h.append(tabela([
    ["Opção", "O que faz"],
    ["<b>11</b>", "Tabelas detalhadas 5×5. No final, digite por exemplo <b>repetidos</b> para ver a tabela daquele tipo de entrada."],
    ["<b>3</b>", "Roda os 4 tipos de entrada (aleatória, já ordenada, invertida, muitos repetidos) e abre a pasta."],
    ["<b>1</b>", "Abre o painel do programa: mudar tamanhos, execuções, semente e tipo de entrada."],
    ["<b>10</b>", "Abre o PDF de estudo do Mergesort bottom-up."],
    ["<b>5</b>", "Abre os slides da apresentação."],
    ["<b>7</b>", "Compila de novo (use depois de mudar o código)."],
    ["<b>0</b>", "Sai do painel."],
], [2.2 * cm, 14.8 * cm]))

h.append(P("Se der problema", h1))
h.append(KeepTogether(tabela([
    ["O que aparece", "O que fazer"],
    ["A janela abre e fecha na hora", "A pasta não foi extraída. Volte ao passo 1."],
    ["Compilador ...... NAO ENCONTRADO", "Instale o Dev-C++ (passo 2), feche o painel e abra de novo."],
    ["[ERRO] A compilacao falhou", "Tire um print da mensagem na tela e mande para o grupo."],
    ["não foi possível escrever em resultados", "Algum CSV está aberto no Excel. Feche e rode de novo."],
    ["“O Windows protegeu o computador”", "Mais informações → Executar assim mesmo (ou desbloqueie o ZIP antes de extrair)."],
], [6.2 * cm, 10.8 * cm])))
h += [Spacer(1, 10), caixa(
    "<b>Os números vão sair diferentes</b> dos que estão nos slides, porque é outra máquina. O esperado é o "
    "Quicksort na frente nos tamanhos grandes. Depois de rodar, guarde a tabela da opção <b>11</b> "
    "para atualizar os slides com os números da sua máquina.", fundo=FUNDO, borda=LINHA)]

def rodape(c, d):
    c.saveState(); c.setFont("DV", 8); c.setFillColor(CINZA)
    c.drawString(2 * cm, 1.2 * cm, "Como rodar o PAINEL_ADM.bat")
    c.drawRightString(A4[0] - 2 * cm, 1.2 * cm, str(d.page)); c.restoreState()

SimpleDocTemplate(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "Como_rodar_PAINEL_ADM.pdf"), pagesize=A4, leftMargin=2 * cm,
                  rightMargin=2 * cm, topMargin=1.8 * cm, bottomMargin=1.8 * cm,
                  title="Como rodar o PAINEL_ADM.bat").build(h, onFirstPage=rodape, onLaterPages=rodape)
print("ok")
