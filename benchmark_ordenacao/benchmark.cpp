// Benchmark: Mergesort x Quicksort
// Tamanhos: 30, 300, 3.000, 30.000 e 300.000 elementos, 20 execucoes cada.
// Compilar: g++ -O2 -std=c++17 benchmark.cpp -o benchmark
// Executar: ./benchmark            (gera resultados_brutos.csv e resultados_resumo.csv)

#include <algorithm>
#include <chrono>
#include <cmath>
#include <cstdio>
#include <random>
#include <vector>

using namespace std;

// ---------------- Mergesort ----------------
// Divide o vetor ao meio, ordena cada metade e intercala usando um vetor auxiliar.
static void merge(vector<int>& v, vector<int>& aux, int ini, int meio, int fim) {
    int i = ini, j = meio, k = ini;
    while (i < meio && j < fim) aux[k++] = (v[i] <= v[j]) ? v[i++] : v[j++];
    while (i < meio) aux[k++] = v[i++];
    while (j < fim) aux[k++] = v[j++];
    for (int t = ini; t < fim; t++) v[t] = aux[t];
}

static void mergesortRec(vector<int>& v, vector<int>& aux, int ini, int fim) {  // [ini, fim)
    if (fim - ini < 2) return;
    int meio = ini + (fim - ini) / 2;
    mergesortRec(v, aux, ini, meio);
    mergesortRec(v, aux, meio, fim);
    merge(v, aux, ini, meio, fim);
}

void mergesort(vector<int>& v) {
    vector<int> aux(v.size());
    mergesortRec(v, aux, 0, (int)v.size());
}

// ---------------- Quicksort ----------------
// Pivo = mediana de tres (inicio, meio, fim) para evitar o pior caso O(n^2)
// em vetores ja ordenados. Particionamento de Hoare.
static void quicksortRec(vector<int>& v, int ini, int fim) {  // [ini, fim]
    while (ini < fim) {
        int meio = ini + (fim - ini) / 2;
        int a = v[ini], b = v[meio], c = v[fim];
        int pivo = max(min(a, b), min(max(a, b), c));
        int i = ini - 1, j = fim + 1;
        while (true) {
            do i++; while (v[i] < pivo);
            do j--; while (v[j] > pivo);
            if (i >= j) break;
            swap(v[i], v[j]);
        }
        // Recursao na parte menor e laco na maior: pilha limitada a O(log n)
        if (j - ini < fim - j) { quicksortRec(v, ini, j); ini = j + 1; }
        else                   { quicksortRec(v, j + 1, fim); fim = j; }
    }
}

void quicksort(vector<int>& v) {
    if (!v.empty()) quicksortRec(v, 0, (int)v.size() - 1);
}

// ---------------- Medicao ----------------
template <class F>
double medirMs(F ordenar, vector<int>& v) {
    auto t0 = chrono::steady_clock::now();
    ordenar(v);
    auto t1 = chrono::steady_clock::now();
    return chrono::duration<double, milli>(t1 - t0).count();
}

int main() {
    const int tamanhos[] = {30, 300, 3000, 30000, 300000};
    const int EXECUCOES = 20;
    mt19937 rng(42);  // semente fixa: resultados reproduziveis

    FILE* bruto = fopen("resultados_brutos.csv", "w");
    FILE* resumo = fopen("resultados_resumo.csv", "w");
    if (!bruto || !resumo) { perror("fopen"); return 1; }
    fprintf(bruto, "algoritmo,n,execucao,tempo_ms\n");
    fprintf(resumo, "algoritmo,n,media_ms,desvio_ms,min_ms,max_ms\n");

    printf("%-10s %8s %12s %12s %12s %12s\n", "algoritmo", "n", "media(ms)", "desvio(ms)", "min(ms)", "max(ms)");
    for (int n : tamanhos) {
        vector<double> tm, tq;
        uniform_int_distribution<int> dist(0, 1000000);
        // Aquecimento (descartado): evita que a 1a medicao inclua efeitos de cache frio
        { vector<int> w(n); for (int& x : w) x = dist(rng); vector<int> w2 = w; mergesort(w); quicksort(w2); }
        for (int e = 1; e <= EXECUCOES; e++) {
            vector<int> original(n);
            for (int& x : original) x = dist(rng);

            // Os dois algoritmos ordenam exatamente a mesma entrada
            vector<int> a = original, b = original;
            double ms_m = medirMs(mergesort, a);
            double ms_q = medirMs(quicksort, b);
            if (!is_sorted(a.begin(), a.end()) || !is_sorted(b.begin(), b.end())) {
                fprintf(stderr, "ERRO: vetor nao ordenado (n=%d)\n", n);
                return 1;
            }
            tm.push_back(ms_m); tq.push_back(ms_q);
            fprintf(bruto, "mergesort,%d,%d,%.6f\n", n, e, ms_m);
            fprintf(bruto, "quicksort,%d,%d,%.6f\n", n, e, ms_q);
        }
        for (int k = 0; k < 2; k++) {
            const vector<double>& t = k == 0 ? tm : tq;
            const char* nome = k == 0 ? "mergesort" : "quicksort";
            double soma = 0; for (double x : t) soma += x;
            double media = soma / t.size(), var = 0;
            for (double x : t) var += (x - media) * (x - media);
            double desvio = sqrt(var / (t.size() - 1));
            double mn = *min_element(t.begin(), t.end()), mx = *max_element(t.begin(), t.end());
            fprintf(resumo, "%s,%d,%.6f,%.6f,%.6f,%.6f\n", nome, n, media, desvio, mn, mx);
            printf("%-10s %8d %12.4f %12.4f %12.4f %12.4f\n", nome, n, media, desvio, mn, mx);
        }
    }
    fclose(bruto); fclose(resumo);
    printf("\nTotal: %d ordenacoes. Resultados em resultados_brutos.csv e resultados_resumo.csv\n",
           (int)(sizeof(tamanhos) / sizeof(int)) * EXECUCOES * 2);
    return 0;
}
