# Benchmark: Mergesort × Quicksort

Compara o tempo de execução do Mergesort e do Quicksort em C++ com vetores de
**30, 300, 3.000, 30.000 e 300.000** inteiros aleatórios, **20 execuções** por tamanho
(5 × 20 × 2 = 200 ordenações).

## Como rodar

```bash
g++ -O2 -std=c++17 benchmark.cpp -o benchmark
./benchmark            # ~2 s; gera resultados_brutos.csv e resultados_resumo.csv
python3 grafico.py     # gera grafico.png (requer matplotlib)
python3 gerar_pdf.py   # gera divisao_trabalho.pdf (requer reportlab)
```

No Windows (Dev-C++/MinGW) o mesmo comando `g++` funciona; o executável será `benchmark.exe`.

## Detalhes da medição

- Os dois algoritmos ordenam **cópias do mesmo vetor** em cada execução.
- Números entre 0 e 1.000.000, gerados com `std::mt19937` e semente fixa (42): resultados reproduzíveis.
- Tempo medido com `std::chrono::steady_clock`, só em volta da chamada de ordenação.
- Uma rodada de aquecimento por tamanho é descartada.
- `std::is_sorted` confere o resultado de cada ordenação.
- Quicksort: pivô por mediana de três + particionamento de Hoare (evita o pior caso O(n²) em vetores já ordenados).

## Arquivos

| Arquivo | Conteúdo |
|---|---|
| `benchmark.cpp` | implementação dos dois algoritmos e da medição |
| `resultados_brutos.csv` | as 200 medições individuais |
| `resultados_resumo.csv` | média, desvio padrão, mínimo e máximo por algoritmo e tamanho |
| `grafico.png` | tempo médio × n (escala log-log) |
| `divisao_trabalho.pdf` | plano da apresentação de 15 min dividido entre 5 pessoas |
