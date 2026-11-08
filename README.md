# Mergesort bottom-up × Quicksort clássico

Trabalho Final de **Estrutura de Dados**, com o Prof. Me. Marcelo Goulart Souza
(Centro Universitário UNIFACVEST · Ciência da Computação · Lages – SC).

O trabalho compara o tempo de execução do **Mergesort bottom-up** (iterativo, sem recursão) e do
**Quicksort clássico** (pivô no elemento do meio) com vetores de **30, 300, 3.000, 30.000 e 300.000**
inteiros, com **20 amostras** por tamanho (5 × 20 × 2 = 200 ordenações). A comparação usa estatística
descritiva, boxplot e gráficos de barras.

**Grupo, na ordem da apresentação:** Guilherme da Silva Santos · Jeferson Gomes Martins · Gustavo Grobe ·
Juan Flor · Igor Jesus · João Vitor Gonçalves de Almeida

> Esta branch (`trabalho-ordenacao`) tem só este trabalho. O simulador de SO está na branch `main`.

## Entregas

| O quê | Arquivo |
|---|---|
| Artigo (PDF entregue) | [artigo/artigo_ordenacao.pdf](artigo/artigo_ordenacao.pdf) |
| Artigo editável (Word) | [artigo/artigo_ordenacao.docx](artigo/artigo_ordenacao.docx) |
| Planilha com as 200 medições e a estatística | [artigo/planilha_resultados.xlsx](artigo/planilha_resultados.xlsx) |
| Slides da apresentação (13) | [apresentacao/slides.pptx](apresentacao/slides.pptx) |
| Roteiro de fala (quem fala, o que dizer, tempos, perguntas) | [apresentacao/roteiro_de_fala.pdf](apresentacao/roteiro_de_fala.pdf) |
| Material de estudo do Mergesort bottom-up | [apresentacao/estudo_mergesort_bottom_up.pdf](apresentacao/estudo_mergesort_bottom_up.pdf) |
| Passo a passo para rodar o painel no Windows | [Como_rodar_PAINEL_ADM.pdf](Como_rodar_PAINEL_ADM.pdf) |

Para abrir um arquivo daqui, clique nele e depois no botão **Download raw file** (a setinha no canto direito).

## Baixar tudo

No topo desta página: botão verde **Code → Download ZIP**. O ZIP vem com tudo desta branch, sempre
atualizado.

## Rodar no Windows

1. Extraia o ZIP inteiro numa pasta. Não rode de dentro do ZIP.
2. Instale o **Dev-C++** (Embarcadero), que já vem com o compilador. Só precisa na primeira vez.
3. Dê dois cliques em **`PAINEL_ADM.bat`** e escolha **[2]**. Na primeira vez ele compila o código
   (alguns segundos), depois roda as 200 ordenações (~2 s) e abre o relatório no navegador.

O projeto não traz nenhum `.exe` pronto. O painel procura o compilador `g++` no PATH e nas pastas padrão
do Dev-C++, TDM-GCC, Code::Blocks, MSYS2 e MinGW, e compila `src/benchmark.cpp` em `build/benchmark.exe`.
Os detalhes e o que fazer se der erro estão em [Como_rodar_PAINEL_ADM.pdf](Como_rodar_PAINEL_ADM.pdf).

| Opção do painel | O que faz |
|---|---|
| 1 | Abre o painel do programa (tamanhos, execuções, semente e tipo de entrada) |
| 2 | Roda o teste padrão do trabalho e abre o relatório |
| 3 | Roda 4 tipos de entrada: aleatória, já ordenada, invertida e com muitos repetidos |
| 4 / 5 / 6 | Abre o relatório, os slides ou o roteiro de fala |
| 7 | Compila de novo (use depois de mudar o código) |
| 8 / 9 | Abre ou apaga a pasta de resultados |
| 10 | Abre o material de estudo do Mergesort bottom-up |
| 11 | Mostra a estatística descritiva, uma tabela por tamanho, no formato do enunciado |

No Linux ou no macOS: `./rodar.sh` compila e abre o mesmo painel.

## Estrutura

```
├── PAINEL_ADM.bat              painel do Windows: compila e roda tudo
├── rodar.sh                    o mesmo para Linux/macOS
├── Como_rodar_PAINEL_ADM.pdf   passo a passo para rodar no Windows
├── src/benchmark.cpp           os dois algoritmos, a medição, o menu e o relatório (C++11)
├── resultados/                 medições usadas no artigo (CSV), relatório HTML e cenários
├── artigo/                     artigo (PDF e Word), planilha, figuras e dados consolidados
├── apresentacao/               slides, roteiro de fala, material de estudo e imagens dos slides
└── scripts/                    geradores do artigo, da planilha, dos slides e dos PDFs
```

## Como a medição funciona

- Os dois algoritmos ordenam cópias dos **mesmos vetores** em cada amostra.
- Números de 0 a 1.000.000 gerados com `std::mt19937` e semente fixa 42, então os resultados são reproduzíveis.
- O tempo é medido com `std::chrono::steady_clock`, só em volta da ordenação. Uma rodada de aquecimento por tamanho é descartada.
- Vetores pequenos ordenam mais rápido que a precisão do relógio. Por isso, cada amostra ordena k vetores
  aleatórios **diferentes** e divide o tempo por k (k = 20.000 / n; para n ≥ 20.000, k = 1). Repetir o mesmo vetor
  deixava os tempos baixos demais, porque o processador "decora" a entrada.
- `std::is_sorted` confere todo resultado.
- **Mergesort bottom-up:** intercala blocos de 1, 2, 4, 8… em dois laços (⌈log₂ n⌉ passadas).
- **Quicksort clássico:** pivô = elemento do meio do trecho. Dois índices andam um em direção ao outro, trocando
  os elementos fora de lugar, e há recursão nos dois lados.
- **Estatística por algoritmo e tamanho:** média, mediana, desvio padrão, variância, coeficiente de variação,
  máximo e mínimo.

Linha de comando, depois que o painel compilou o programa uma vez:

```
build\benchmark.exe --rodar                          teste padrão, sem menu
build\benchmark.exe --rodar --cenario inverso --saida resultados\inverso
build\benchmark.exe --tabela                         estatística descritiva da pasta resultados
build\benchmark.exe --ajuda
```

## Regenerar os arquivos

Depois de medir de novo (opções 2 e 3 do painel), rode na pasta do projeto:

```bash
python scripts/gerar_artigo_dados.py    # estatística + figuras do artigo        (pip install matplotlib)
python scripts/gerar_planilha.py        # planilha Excel com fórmulas              (pip install openpyxl)
node   scripts/gerar_artigo.js          # artigo .docx                             (npm install docx)
python scripts/gerar_roteiro.py         # roteiro de fala + falas dos slides       (pip install reportlab)
python scripts/gerar_slides_assets.py   # fundo e boxplot dos slides
node   scripts/gerar_slides.js          # slides .pptx  (npm install pptxgenjs react-icons react react-dom sharp)
python scripts/gerar_estudo.py          # material de estudo
python scripts/gerar_como_rodar.py      # passo a passo do painel
```

Para o PDF do artigo, abra o `.docx` no Word e use *Salvar como → PDF*.

O código usa só C++11 e também compila no Dev-C++: abra `src/benchmark.cpp`, ative `-std=c++11` em
*Ferramentas → Opções do Compilador* e compile.
