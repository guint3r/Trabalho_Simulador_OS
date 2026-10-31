"""Gera resultados/grafico.png a partir de resultados/resultados_resumo.csv (requer matplotlib).
Uso (na pasta do projeto): python scripts/grafico.py"""
import csv
import os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.ticker

CORES = {"mergesort": "#2a78d6", "quicksort": "#eb6834"}
dados = {}
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = os.path.join(RAIZ, "resultados")
with open(os.path.join(RES, "resultados_resumo.csv")) as f:
    for linha in csv.DictReader(f):
        dados.setdefault(linha["algoritmo"], []).append(
            (int(linha["n"]), float(linha["media_ms"]), float(linha["desvio_ms"])))

fig, ax = plt.subplots(figsize=(7, 4.2), dpi=200)
for nome, pts in dados.items():
    ns = [p[0] for p in pts]; med = [p[1] for p in pts]; dp = [p[2] for p in pts]
    ax.plot(ns, med, color=CORES[nome], lw=2, marker="o", ms=6, label="Mergesort bottom-up" if nome == "mergesort" else "Quicksort")
    ax.annotate(f"{med[-1]:.1f} ms", (ns[-1], med[-1]), xytext=(8, -4 if nome == "quicksort" else 4),
                textcoords="offset points", color="#52514e", fontsize=9)
ax.set_xscale("log"); ax.set_yscale("log")
ax.set_xlabel("Tamanho do vetor (n)", color="#52514e")
ax.set_ylabel("Tempo médio (ms) — escala log", color="#52514e")
ax.set_title("Mergesort bottom-up x Quicksort — média de 20 execuções", loc="left", fontsize=11)
ax.set_xticks([30, 300, 3000, 30000, 300000], ["30", "300", "3.000", "30.000", "300.000"])
ax.set_xlim(20, 900000)
ax.yaxis.set_major_formatter(matplotlib.ticker.FuncFormatter(lambda v, _: f"{v:g}"))
ax.grid(True, which="major", color="#e6e5e1", lw=0.8)
for s in ("top", "right"): ax.spines[s].set_visible(False)
for s in ("left", "bottom"): ax.spines[s].set_color("#b5b4ad")
ax.tick_params(colors="#52514e")
ax.legend(frameon=False, loc="upper left")
fig.tight_layout()
fig.savefig(os.path.join(RES, "grafico.png"))
print("grafico.png gerado")
