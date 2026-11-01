"""Imagens usadas pelos slides (estilo do Canva do grupo): fundo com círculos lilás e boxplot.
Uso (na pasta do projeto, depois de scripts/gerar_artigo_dados.py): python scripts/gerar_slides_assets.py"""
import json
import math
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.ticker import FuncFormatter
from PIL import Image, ImageDraw, ImageFilter

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(RAIZ, "apresentacao", "assets")
os.makedirs(OUT, exist_ok=True)
MERGE, QUICK = "#1F4E9C", "#8A5CD6"

# Fundo 16:9: branco com dois círculos lilás nos cantos, como no Canva
W, H = 1920, 1080
img = Image.new("RGB", (W, H), "#FFFFFF")
d = ImageDraw.Draw(img)
d.ellipse((-260, -260, 260, 260), fill="#E4E3F5")
d.ellipse((W - 330, H - 330, W + 330, H + 330), fill="#E4E3F5")
img.save(os.path.join(OUT, "fundo.png"))

# Boxplot das 20 amostras (mesmos dados do artigo), com letra grande para projetor
D = json.load(open(os.path.join(RAIZ, "artigo", "dados_artigo.json"), encoding="utf-8"))
NS = D["tamanhos"]
br = lambda v, c: f"{v:.{c}f}".replace(".", ",")
plt.rcParams.update({"font.family": "sans-serif", "font.sans-serif": ["Carlito", "Calibri", "DejaVu Sans"], "font.size": 15,
                     "axes.spines.top": False, "axes.spines.right": False, "axes.edgecolor": "#6b7080"})
fig, eixos = plt.subplots(1, len(NS), figsize=(12.4, 4.6), dpi=200)
for ax, n in zip(eixos, NS):
    dados = [D["amostras"][f"mergesort:{n}"], D["amostras"][f"quicksort:{n}"]]
    cx = ax.boxplot(dados, widths=0.6, patch_artist=True, medianprops={"color": "#111111", "linewidth": 2},
                    whiskerprops={"color": "#333333"}, capprops={"color": "#333333"},
                    flierprops={"marker": "o", "markersize": 4, "markerfacecolor": "#555555", "markeredgecolor": "none"})
    for caixa, cor in zip(cx["boxes"], [MERGE, QUICK]):
        caixa.set_facecolor(cor); caixa.set_edgecolor("#222222")
    ax.set_xticks([1, 2], ["Merge", "Quick"], fontsize=15)
    ax.set_title(f"{n:,}".replace(",", ".") + " dados", fontsize=17, fontweight="bold", color="#142B54")
    ax.yaxis.set_major_formatter(FuncFormatter(lambda v, _: br(v, max(0, 2 - math.floor(math.log10(abs(v))))) if v else "0"))
    ax.tick_params(axis="y", labelsize=12)
    ax.grid(axis="y", color="#e3e5e8"); ax.set_axisbelow(True)
eixos[0].set_ylabel("Tempo (ms)", fontsize=15)
fig.tight_layout(w_pad=1.2)
fig.savefig(os.path.join(OUT, "boxplot.png"), transparent=True)
print("assets gerados em", OUT)
