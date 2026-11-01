# Trabalho: Mergesort bottom-up × Quicksort

Benchmark em C++ que compara o tempo do **Mergesort bottom-up** (iterativo, sem recursão) e do Quicksort com vetores de
**30, 300, 3.000, 30.000 e 300.000** inteiros, **20 execuções** por tamanho
(5 × 20 × 2 = 200 ordenações). Inclui painel administrativo, relatório, slides e a
divisão da apresentação de 15 minutos entre 5 pessoas.

> Esta pasta é independente do simulador de SO que está no resto do repositório.

## Começo rápido (Windows)

1. Extraia o ZIP inteiro numa pasta (não rode de dentro do ZIP).
2. Dê dois cliques em **`PAINEL_ADM.bat`**.
3. Escolha **[2]**: na primeira vez ele compila o código (alguns segundos), depois roda as
   200 ordenações (~2 s) e abre o relatório no navegador.

O projeto **não traz nenhum `.exe` pronto**. O painel procura um compilador C++ (`g++`) já instalado
e compila `src/benchmark.cpp` em `build/benchmark.exe`. Ele procura no PATH e nas pastas padrão do
Dev-C++ (Embarcadero e Orwell), TDM-GCC, Code::Blocks, MSYS2 e MinGW. Se não achar, explica o que
instalar. O mais fácil é o **Dev-C++**, que já vem com o compilador.

Slides, PDF e os resultados já incluídos abrem sem compilador (opções 4, 5 e 6).

## O que tem aqui

```
trabalho_ordenacao/
├── PAINEL_ADM.bat             painel de controle (Windows): compila e roda tudo
├── rodar.sh                   o mesmo para Linux/macOS (compila e abre o painel)
├── src/benchmark.cpp          código: algoritmos, medição, menu e relatório
├── build/                     criada na 1ª execução: programa compilado e erros de compilação
├── resultados/                CSVs, relatório HTML, gráfico e histórico
│   └── cenario_*/             resultados de cada cenário de entrada
├── apresentacao/
│   ├── slides.pptx            14 slides; o roteiro de cada pessoa está nas anotações
│   ├── estudo_mergesort_bottom_up.pdf   material de estudo do bottom-up
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
| 7 | Compila de novo (use depois de mudar o código) |
| 8 / 9 | Abre ou apaga a pasta de resultados (pede confirmação para apagar) |
| 10 | Abre o material de estudo do Mergesort bottom-up (PDF) |
| 11 | Mostra os resultados em tabelas detalhadas 5×5: média, desvio, mínimo e máximo de cada algoritmo, comparação e crescimento |

## Linha de comando

Depois que o painel compilou o programa uma vez:

```
build\benchmark.exe                                  painel interativo
build\benchmark.exe --rodar                          teste padrão, sem menu
build\benchmark.exe --rodar --tamanhos 1000,10000 --execucoes 50 --semente 7
build\benchmark.exe --rodar --cenario inverso --saida resultados\inverso --abrir
build\benchmark.exe --tabela                         tabelas detalhadas da pasta resultados
build\benchmark.exe --ajuda
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
- Mergesort bottom-up: blocos de 1, 2, 4, 8… intercalados em dois laços (⌈log₂ n⌉ passadas).
- Quicksort: pivô por mediana de três + particionamento de Hoare, com recursão só no lado menor
  (pilha O(log n)).

## Artigo (entrega final)

`artigo/artigo_ordenacao.docx` e `artigo/artigo_ordenacao.pdf`: Título, Resumo, Introdução, Material e Métodos,
Resultados e Discussão (6 tabelas e 4 figuras legendadas) e Conclusão, em Times New Roman 12.
Para o PDF sair com a Times New Roman exata, abra o `.docx` no Word e use *Salvar como → PDF*.

```bash
python scripts/gerar_artigo_dados.py   # estatística descritiva + figuras (boxplot e barras)
node scripts/gerar_artigo.js           # monta o .docx (npm install docx)
```

## Compilar e regenerar

```bash
# Windows (MinGW) ou Linux
g++ -O2 -std=c++11 -static src/benchmark.cpp -o build/benchmark.exe

# Gráfico, PDF e slides (depois de rodar o benchmark e os 4 cenários)
python scripts/grafico.py          # pip install matplotlib
python scripts/gerar_pdf.py        # pip install reportlab
python scripts/gerar_estudo.py     # pip install reportlab
node scripts/gerar_slides.js       # npm install pptxgenjs react-icons react react-dom sharp
```

O código usa só C++11, então também compila no Dev-C++: abra `src/benchmark.cpp`, ative `-std=c++11` em
*Ferramentas → Opções do Compilador* e compile.
