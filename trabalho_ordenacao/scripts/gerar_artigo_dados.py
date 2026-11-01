"""Calcula a estatística descritiva a partir das 20 amostras brutas e gera as figuras do artigo.
Saídas: artigo/dados_artigo.json e artigo/figuras/*.png
Uso (na pasta do projeto): python scripts/gerar_artigo_dados.py   (requer matplotlib)"""
import csv
import json
import math
import os
import statistics as st

import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.ticker import FuncFormatter

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = os.path.join(RAIZ, "resultados")
OUT = os.path.join(RAIZ, "artigo")
FIG = os.path.join(OUT, "figuras")
os.makedirs(FIG, exist_ok=True)

ALGOS = [("mergesort", "Mergesort bottom-up"), ("quicksort", "Quicksort clássico")]
CORES = {"mergesort": "#2a78d6", "quicksort": "#eb6834"}
CENARIOS = [("aleatorio", "Aleatória"), ("ordenado", "Já ordenada"), ("inverso", "Invertida"), ("repetidos", "Muitos repetidos")]

plt.rcParams.update({
    "font.family": "serif", "font.serif": ["Liberation Serif", "Times New Roman", "DejaVu Serif"],
    "font.size": 10, "axes.edgecolor": "#8a8f98", "axes.labelcolor": "#222222", "xtick.color": "#333333",
    "ytick.color": "#333333", "axes.spines.top": False, "axes.spines.right": False,
})


def br(v, casas=None):
    """Número com vírgula decimal; 3 algarismos significativos se casas não for dada."""
    if casas is None:
        casas = 2 if v == 0 else max(2, 2 - math.floor(math.log10(abs(v))))
    return f"{v:.{casas}f}".replace(".", ",")


def ler_brutos(pasta):
    amostras = {}
    with open(os.path.join(pasta, "resultados_brutos.csv")) as f:
        for r in csv.DictReader(f):
            amostras.setdefault((r["algoritmo"], int(r["n"])), []).append(float(r["tempo_ms"]))
    return amostras


def estatistica(t):
    media = st.mean(t)
    desvio = st.stdev(t)  # amostral (n - 1)
    return {
        "amostras": len(t), "media": media, "mediana": st.median(t), "desvio": desvio,
        "variancia": st.variance(t), "cv": desvio / media * 100, "maximo": max(t), "minimo": min(t),
        "q1": float(np.percentile(t, 25)), "q3": float(np.percentile(t, 75)),  # mesmos quartis do boxplot
    }


amostras = ler_brutos(RES)
NS = sorted({n for _, n in amostras})
dados = {"tamanhos": NS, "algoritmos": [{"id": a, "nome": nome} for a, nome in ALGOS], "estatistica": {},
         "amostras": {}, "cenarios": {}}
for a, _ in ALGOS:
    for n in NS:
        t = amostras[(a, n)]
        dados["estatistica"][f"{a}:{n}"] = estatistica(t)
        dados["amostras"][f"{a}:{n}"] = t

# Confere com o resumo gravado pelo programa em C++ (as duas contas têm de bater)
with open(os.path.join(RES, "resultados_resumo.csv")) as f:
    for r in csv.DictReader(f):
        e = dados["estatistica"][f"{r['algoritmo']}:{r['n']}"]
        for campo, col in [("media", "media_ms"), ("mediana", "mediana_ms"), ("desvio", "desvio_ms")]:
            assert abs(e[campo] - float(r[col])) <= 1e-5 + 1e-4 * e[campo], (r, campo)

for c, rot in CENARIOS:
    p = os.path.join(RES, f"cenario_{c}")
    if os.path.exists(os.path.join(p, "resultados_brutos.csv")):
        am = ler_brutos(p)
        dados["cenarios"][c] = {"rotulo": rot, **{a: estatistica(am[(a, 300000)]) for a, _ in ALGOS}}

with open(os.path.join(RES, "maquina.json"), encoding="utf-8") as f:
    dados["maquina"] = json.load(f)

E = lambda a, n: dados["estatistica"][f"{a}:{n}"]
rot_n = lambda n: f"{n:,}".replace(",", ".")

# ---------------------------------------------------------------- Figura 1: boxplot por tamanho
fig, eixos = plt.subplots(1, len(NS), figsize=(6.3, 2.9), dpi=300)
for ax, n in zip(eixos, NS):
    caixas = ax.boxplot([amostras[(a, n)] for a, _ in ALGOS], widths=0.55, patch_artist=True,
                        medianprops={"color": "#111111", "linewidth": 1.2},
                        flierprops={"marker": "o", "markersize": 3, "markerfacecolor": "#555555", "markeredgecolor": "none"})
    for caixa, (a, _) in zip(caixas["boxes"], ALGOS):
        caixa.set_facecolor(CORES[a]); caixa.set_alpha(0.85); caixa.set_edgecolor("#333333")
    ax.set_xticks([1, 2], ["Merge", "Quick"], fontsize=8)
    ax.set_title(f"n = {rot_n(n)}", fontsize=9)
    ax.yaxis.set_major_formatter(FuncFormatter(lambda v, _: br(v, max(0, 2 - math.floor(math.log10(abs(v)))) if v else 0)))
    ax.tick_params(axis="y", labelsize=7)
    ax.grid(axis="y", color="#e3e5e8", linewidth=0.6); ax.set_axisbelow(True)
eixos[0].set_ylabel("Tempo (ms)")
fig.tight_layout(w_pad=0.6)
fig.savefig(os.path.join(FIG, "figura1_boxplot.png")); plt.close(fig)

# ---------------------------------------------------------------- Figura 2: barras das médias (escala log)
fig, ax = plt.subplots(figsize=(6.3, 3.3), dpi=300)
larg = 0.38
for i, (a, nome) in enumerate(ALGOS):
    xs = [k + (i - 0.5) * larg for k in range(len(NS))]
    ys = [E(a, n)["media"] for n in NS]
    barras = ax.bar(xs, ys, width=larg, color=CORES[a], label=nome, edgecolor="white", linewidth=0.8)
    for x, y in zip(xs, ys):
        ax.text(x, y * 1.12, br(y), ha="center", va="bottom", fontsize=7, rotation=90)
ax.set_yscale("log")
ax.set_ylim(min(E(a, NS[0])["media"] for a, _ in ALGOS) / 3, max(E(a, NS[-1])["media"] for a, _ in ALGOS) * 20)
ax.set_xticks(range(len(NS)), [rot_n(n) for n in NS])
ax.set_xlabel("Tamanho do conjunto de dados (n)"); ax.set_ylabel("Tempo médio (ms), escala log")
ax.yaxis.set_major_formatter(FuncFormatter(lambda v, _: br(v, max(0, -math.floor(math.log10(v)))) if v else "0"))
ax.grid(axis="y", color="#e3e5e8", linewidth=0.6); ax.set_axisbelow(True)
ax.legend(frameon=False, loc="upper left")
fig.tight_layout()
fig.savefig(os.path.join(FIG, "figura2_barras_media.png")); plt.close(fig)

# ---------------------------------------------------------------- Figura 3: barras do coeficiente de variação
fig, ax = plt.subplots(figsize=(6.3, 2.9), dpi=300)
for i, (a, nome) in enumerate(ALGOS):
    xs = [k + (i - 0.5) * larg for k in range(len(NS))]
    ys = [E(a, n)["cv"] for n in NS]
    ax.bar(xs, ys, width=larg, color=CORES[a], label=nome, edgecolor="white", linewidth=0.8)
    for x, y in zip(xs, ys):
        ax.text(x, y + 0.3, br(y, 1), ha="center", va="bottom", fontsize=7)
ax.set_xticks(range(len(NS)), [rot_n(n) for n in NS])
ax.set_xlabel("Tamanho do conjunto de dados (n)"); ax.set_ylabel("Coeficiente de variação (%)")
ax.set_ylim(0, max(E(a, n)["cv"] for a, _ in ALGOS for n in NS) * 1.25)
ax.yaxis.set_major_formatter(FuncFormatter(lambda v, _: br(v, 1)))
ax.grid(axis="y", color="#e3e5e8", linewidth=0.6); ax.set_axisbelow(True)
ax.legend(frameon=False, loc="upper left", ncol=2)
fig.tight_layout()
fig.savefig(os.path.join(FIG, "figura3_barras_cv.png")); plt.close(fig)

# ---------------------------------------------------------------- Figura 4: cenários de entrada (300.000)
if len(dados["cenarios"]) == 4:
    fig, ax = plt.subplots(figsize=(6.3, 2.9), dpi=300)
    for i, (a, nome) in enumerate(ALGOS):
        xs = [k + (i - 0.5) * larg for k in range(4)]
        ys = [dados["cenarios"][c][a]["media"] for c, _ in CENARIOS]
        ax.bar(xs, ys, width=larg, color=CORES[a], label=nome, edgecolor="white", linewidth=0.8)
        for x, y in zip(xs, ys):
            ax.text(x, y + 0.4, br(y, 1), ha="center", va="bottom", fontsize=7)
    ax.set_xticks(range(4), [rot for _, rot in CENARIOS])
    ax.set_ylabel("Tempo médio (ms)")
    ax.set_ylim(0, max(dados["cenarios"][c][a]["media"] for c, _ in CENARIOS for a, _ in ALGOS) * 1.2)
    ax.grid(axis="y", color="#e3e5e8", linewidth=0.6); ax.set_axisbelow(True)
    ax.legend(frameon=False, loc="upper right")
    fig.tight_layout()
    fig.savefig(os.path.join(FIG, "figura4_cenarios.png")); plt.close(fig)

with open(os.path.join(OUT, "dados_artigo.json"), "w", encoding="utf-8") as f:
    json.dump(dados, f, ensure_ascii=False, indent=1)
print("dados e figuras gerados em", OUT)
