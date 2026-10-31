# Trabalho: Mergesort × Quicksort

Benchmark em C++ que compara o tempo do Mergesort e do Quicksort com vetores de
**30, 300, 3.000, 30.000 e 300.000** inteiros, **20 execuções** por tamanho
(5 × 20 × 2 = 200 ordenações). Inclui painel administrativo, relatório, slides e a
divisão da apresentação de 15 minutos entre 5 pessoas.

> Esta pasta é independente do simulador de SO que está no resto do repositório.

## Começo rápido (Windows)

1. Extraia o ZIP inteiro numa pasta (não rode de dentro do ZIP).
2. Dê dois cliques em **`PAINEL_ADM.bat`**.
3. Escolha **[2]**: roda as 200 ordenações (~2 s) e abre o relatório no navegador.

Não precisa instalar nada: o `Benchmark.exe` já vem compilado (64 bits, estático).
Se o Windows mostrar "O Windows protegeu o computador", clique em *Mais informações → Executar assim mesmo*
(o aviso aparece para qualquer .exe baixado que não tem assinatura digital).

## O que tem aqui

```
trabalho_ordenacao/
├── PAINEL_ADM.bat             painel de controle (Windows) — comece por aqui
├── Benchmark.exe              programa pronto para Windows
├── rodar.sh                   o mesmo para Linux/macOS (compila e abre o painel)
├── src/benchmark.cpp          código: algoritmos, medição, menu e relatório
├── resultados/                CSVs, relatório HTML, gráfico e histórico
│   └── cenario_*/             resultados de cada cenário de entrada
├── apresentacao/
│   ├── slides.pptx            14 slides; o roteiro de cada pessoa está nas anotações
│   └── divisao_trabalho.pdf   quem fala o quê, tempos, tarefas e checklist
└── scripts/                   geradores do gráfico, do PDF e dos slides
```

## Painel ADM (`PAINEL_ADM.bat`)

| Opção | O que faz |
|---|---|
| 1 | Abre o painel do programa (configurar tamanhos, execuções, semente e cenário) |
| 2 | Roda o teste padrão do trabalho e abre o relatório |
| 3 | Roda os 4 cenários: aleatório, já ordenado, invertido e muitos repetidos |
| 4 / 5 / 6 | Abre o relatório, os slides ou o PDF da divisão |
| 7 | Recompila o `Benchmark.exe` (precisa de g++/MinGW no PATH) |
| 8 / 9 | Abre ou apaga a pasta de resultados (pede confirmação para apagar) |

## Linha de comando

```
Benchmark.exe                                  painel interativo
Benchmark.exe --rodar                          teste padrão, sem menu
Benchmark.exe --rodar --tamanhos 1000,10000 --execucoes 50 --semente 7
Benchmark.exe --rodar --cenario inverso --saida resultados\inverso --abrir
Benchmark.exe --ajuda
```

Códigos de saída: `0` ok, `1` argumento inválido, `2` erro ao gravar arquivos (CSV aberto no Excel?),
`3` falha na verificação de ordenação.

Cada execução grava em `resultados/`:

- `resultados_brutos.csv`: todas as medições individuais
- `resultados_resumo.csv`: média, desvio padrão, mínimo e máximo
- `relatorio.html`: tabela e gráfico; abre em qualquer navegador, sem internet
- `historico.log`: uma linha por execução, com a configuração usada

## Como a medição funciona

- Os dois algoritmos ordenam **cópias da mesma entrada** em cada execução.
- Números de 0 a 1.000.000 gerados com `std::mt19937` e semente fixa (42): resultados reproduzíveis.
- Tempo medido com `std::chrono::steady_clock`, só em volta da ordenação.
- Uma rodada de aquecimento por tamanho é descartada.
- Vetores pequenos ordenam mais rápido que a precisão do relógio. Por isso cada medição ordena
  k cópias e divide o tempo por k (k = 20.000 / n; para n ≥ 20.000, k = 1).
- `std::is_sorted` confere todo resultado.
- Quicksort: pivô por mediana de três + particionamento de Hoare, com recursão só no lado menor
  (pilha O(log n)).

## Compilar e regenerar

```bash
# Windows (MinGW) ou Linux
g++ -O2 -std=c++11 -static src/benchmark.cpp -o Benchmark.exe

# Gráfico, PDF e slides (depois de rodar o benchmark e os 4 cenários)
python scripts/grafico.py          # pip install matplotlib
python scripts/gerar_pdf.py        # pip install reportlab
node scripts/gerar_slides.js       # npm install pptxgenjs react-icons react react-dom sharp
```

O código usa só C++11, então também compila no Dev-C++: abra `src/benchmark.cpp`, ative `-std=c++11` em
*Ferramentas → Opções do Compilador* e compile.
