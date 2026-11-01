// =============================================================================
//  Benchmark de Ordenação — Mergesort bottom-up × Quicksort clássico
//  Painel administrativo + modo linha de comando
//
//  No Windows, o PAINEL_ADM.bat compila e roda este arquivo sozinho.
//
//  Uso do programa compilado:
//    benchmark                       abre o painel (menu interativo)
//    benchmark --rodar [opções]      executa direto, sem menu (para scripts)
//    benchmark --ajuda               mostra todas as opções
//
//  Compilar à mão (MinGW, Dev-C++ ou Linux):
//    g++ -O2 -std=c++11 -static src/benchmark.cpp -o build/benchmark.exe
//
//  Saídas (pasta "resultados" por padrão):
//    resultados_brutos.csv   todas as medições individuais
//    resultados_resumo.csv   média, mediana, desvio, variância, CV, mínimo e máximo
//    relatorio.html          relatório com tabela e gráfico (abre no navegador)
//    historico.log           uma linha por execução do benchmark
// =============================================================================

#ifdef _WIN32
#ifndef NOMINMAX
#define NOMINMAX
#endif
#include <direct.h>
#include <windows.h>
#else
#include <sys/stat.h>
#endif

#include <algorithm>
#include <chrono>
#include <cmath>
#include <cstdio>
#include <cstdlib>
#include <ctime>
#include <fstream>
#include <iostream>
#include <random>
#include <sstream>
#include <string>
#include <vector>

using namespace std;

static const char* VERSAO = "3.0";

// =============================================================================
//  Algoritmos
// =============================================================================

// ---- Mergesort BOTTOM-UP (iterativo, sem recursão)
//      Começa com blocos de 1 elemento (já ordenados) e intercala blocos vizinhos:
//      largura 1 -> blocos de 2, largura 2 -> blocos de 4, ... até cobrir o vetor.
//      São ceil(log2 n) passadas; cada passada percorre os n elementos: O(n log n).

// Intercala v[ini..meio) e v[meio..fim), os dois já ordenados, usando aux.
static void intercalar(vector<int>& v, vector<int>& aux, int ini, int meio, int fim) {
    int i = ini, j = meio, k = ini;
    while (i < meio && j < fim) aux[k++] = (v[i] <= v[j]) ? v[i++] : v[j++];
    while (i < meio) aux[k++] = v[i++];
    while (j < fim) aux[k++] = v[j++];
    for (int t = ini; t < fim; t++) v[t] = aux[t];
}

void mergesort(vector<int>& v) {
    int n = (int)v.size();
    vector<int> aux(n);
    for (int largura = 1; largura < n; largura *= 2) {          // 1, 2, 4, 8, ...
        for (int ini = 0; ini < n - largura; ini += 2 * largura) {  // pares de blocos vizinhos
            int meio = ini + largura;                               // início do 2º bloco
            int fim = min(ini + 2 * largura, n);                    // o último bloco pode ser menor
            intercalar(v, aux, ini, meio, fim);
        }
        // Um bloco que sobra sem par já está ordenado e entra na próxima passada.
    }
}

// ---- Quicksort CLÁSSICO (como visto em aula): pivô = elemento do meio do trecho.
//      Dois índices andam um em direção ao outro: i para em quem é >= pivô,
//      j para em quem é <= pivô, e os dois são trocados. Quando se cruzam,
//      o trecho está dividido em "menores" (esq..j) e "maiores" (i..dir).
static void quickRec(vector<int>& v, int esq, int dir) {
    int i = esq, j = dir;
    int pivo = v[esq + (dir - esq) / 2];
    while (i <= j) {
        while (v[i] < pivo) i++;
        while (v[j] > pivo) j--;
        if (i <= j) { swap(v[i], v[j]); i++; j--; }
    }
    if (esq < j) quickRec(v, esq, j);  // ordena o lado dos menores
    if (i < dir) quickRec(v, i, dir);  // ordena o lado dos maiores
}

void quicksort(vector<int>& v) {
    if (v.size() > 1) quickRec(v, 0, (int)v.size() - 1);
}

// ---- Algoritmos comparados (a ordem aqui é a ordem das tabelas e gráficos)
struct Algoritmo {
    const char* id;    // nome no CSV
    const char* nome;  // nome nas tabelas
    void (*ordenar)(vector<int>&);
};
static const Algoritmo ALGOS[] = {
    {"mergesort", "Mergesort bottom-up", mergesort},
    {"quicksort", "Quicksort clássico", quicksort},
};
static const int NALG = (int)(sizeof(ALGOS) / sizeof(ALGOS[0]));

// =============================================================================
//  Configuração
// =============================================================================

struct Config {
    vector<int> tamanhos;
    int execucoes;
    unsigned semente;
    string cenario;  // aleatorio | ordenado | inverso | repetidos
    string saida;    // pasta de saída
};

static Config configPadrao() {
    Config c;
    c.tamanhos = {30, 300, 3000, 30000, 300000};
    c.execucoes = 20;
    c.semente = 42;
    c.cenario = "aleatorio";
    c.saida = "resultados";
    return c;
}

static const char* CENARIOS[] = {"aleatorio", "ordenado", "inverso", "repetidos"};
static const char* DESC_CENARIOS[] = {
    "números aleatórios de 0 a 1.000.000 (padrão do trabalho)",
    "vetor já em ordem crescente",
    "vetor em ordem decrescente",
    "só 10 valores distintos (muitos repetidos)"};

static bool cenarioValido(const string& s) {
    for (const char* c : CENARIOS) if (s == c) return true;
    return false;
}

static string milhar(long long n) {  // 300000 -> "300.000"
    string s = to_string(n), r;
    int cont = 0;
    for (int i = (int)s.size() - 1; i >= 0; i--) {
        r.insert(r.begin(), s[i]);
        if (++cont % 3 == 0 && i > 0 && s[i - 1] != '-') r.insert(r.begin(), '.');
    }
    return r;
}

static string listaTamanhos(const vector<int>& t) {
    string s;
    for (size_t i = 0; i < t.size(); i++) s += (i ? ", " : "") + milhar(t[i]);
    return s;
}

static bool lerTamanhos(const string& texto, vector<int>& out, string& erro) {
    vector<int> r;
    string limpo;
    for (char ch : texto) limpo += (ch == ';' || ch == ' ') ? ',' : ch;
    stringstream ss(limpo);
    string item;
    while (getline(ss, item, ',')) {
        string dig;
        for (char ch : item) if (ch != '.' && ch != '_') dig += ch;  // aceita "300.000"
        if (dig.empty()) continue;
        for (char ch : dig) if (ch < '0' || ch > '9') { erro = "valor inválido: \"" + item + "\""; return false; }
        if (dig.size() > 9) { erro = "valor grande demais: " + item; return false; }
        long long n = atoll(dig.c_str());
        if (n < 1 || n > 50000000) { erro = "cada tamanho deve estar entre 1 e 50.000.000"; return false; }
        r.push_back((int)n);
    }
    if (r.empty()) { erro = "informe ao menos um tamanho"; return false; }
    sort(r.begin(), r.end());
    r.erase(unique(r.begin(), r.end()), r.end());
    out = r;
    return true;
}

// =============================================================================
//  Utilidades de sistema
// =============================================================================

static void criarPasta(const string& p) {
#ifdef _WIN32
    _mkdir(p.c_str());
#else
    mkdir(p.c_str(), 0755);
#endif
}

static string agora() {
    time_t t = time(nullptr);
    char buf[32];
    strftime(buf, sizeof buf, "%Y-%m-%d %H:%M:%S", localtime(&t));
    return buf;
}

static string sistema() {
#ifdef _WIN32
    return "Windows";
#elif __APPLE__
    return "macOS";
#else
    return "Linux";
#endif
}

static string compilador() {
#if defined(__clang__)
    return "Clang " __clang_version__;
#elif defined(__GNUC__)
    return string("GCC ") + __VERSION__;
#elif defined(_MSC_VER)
    return "MSVC " + to_string(_MSC_VER);
#else
    return "desconhecido";
#endif
}

static void abrirArquivo(const string& caminho) {
#ifdef _WIN32
    string cmd = "start \"\" \"" + caminho + "\"";
#elif __APPLE__
    string cmd = "open \"" + caminho + "\"";
#else
    string cmd = "xdg-open \"" + caminho + "\" >/dev/null 2>&1 &";
#endif
    if (system(cmd.c_str()) != 0) cout << "  Não foi possível abrir automaticamente. Abra manualmente: " << caminho << "\n";
}

static void limparTela() {
#ifdef _WIN32
    system("cls");
#else
    cout << "\033[2J\033[H";
#endif
}

static string lerLinha(const string& prompt) {
    cout << prompt;
    string s;
    if (!getline(cin, s)) exit(0);  // fim da entrada (ex.: janela fechada)
    while (!s.empty() && (s.back() == '\r' || s.back() == ' ')) s.pop_back();
    while (!s.empty() && s[0] == ' ') s.erase(0, 1);
    return s;
}

static void pausar() { lerLinha("\n  Pressione ENTER para voltar ao menu..."); }

// =============================================================================
//  Benchmark
// =============================================================================

struct Resumo {
    int alg;  // índice em ALGOS
    int n;
    double media, mediana, desvio, variancia, cv, minimo, maximo;
};

static void gerarEntrada(vector<int>& v, const string& cenario, mt19937& rng) {
    if (cenario == "repetidos") {
        uniform_int_distribution<int> d(0, 9);
        for (int& x : v) x = d(rng);
        return;
    }
    uniform_int_distribution<int> d(0, 1000000);
    for (int& x : v) x = d(rng);
    if (cenario == "ordenado") sort(v.begin(), v.end());
    else if (cenario == "inverso") sort(v.begin(), v.end(), greater<int>());
}

// Vetores pequenos ordenam em microssegundos, perto da resolução do relógio.
// Por isso cada amostra ordena k vetores aleatórios DIFERENTES (k = 20.000 / n,
// mínimo 1) e divide o tempo por k. Vetores diferentes evitam que o processador
// "decore" o caminho de uma entrada repetida. As cópias são feitas ANTES de
// ligar o cronômetro, e os dois algoritmos recebem exatamente os mesmos vetores.
static int repeticoes(int n) { return max(1, 20000 / max(n, 1)); }

static double medirMs(void (*ordenar)(vector<int>&), const vector<vector<int> >& entradas, bool& ok) {
    vector<vector<int> > copias = entradas;
    chrono::steady_clock::time_point t0 = chrono::steady_clock::now();
    for (size_t r = 0; r < copias.size(); r++) ordenar(copias[r]);
    chrono::steady_clock::time_point t1 = chrono::steady_clock::now();
    ok = true;
    for (const vector<int>& c : copias) ok = ok && is_sorted(c.begin(), c.end());
    return chrono::duration<double, milli>(t1 - t0).count() / copias.size();
}

// Estatística descritiva das amostras (desvio e variância amostrais, divisor n-1).
static Resumo resumir(int alg, int n, vector<double> t) {
    Resumo r;
    r.alg = alg;
    r.n = n;
    double soma = 0;
    for (double x : t) soma += x;
    r.media = soma / t.size();
    double sq = 0;
    for (double x : t) sq += (x - r.media) * (x - r.media);
    r.variancia = t.size() > 1 ? sq / (t.size() - 1) : 0.0;
    r.desvio = sqrt(r.variancia);
    r.cv = r.media > 0 ? r.desvio / r.media * 100.0 : 0.0;
    sort(t.begin(), t.end());
    size_t m = t.size();
    r.mediana = m % 2 ? t[m / 2] : (t[m / 2 - 1] + t[m / 2]) / 2.0;
    r.minimo = t.front();
    r.maximo = t.back();
    return r;
}

// ---- Formatação (vírgula decimal, 3 algarismos significativos em valores pequenos)
static string virgula(string s) {
    for (char& c : s) if (c == '.') c = ',';
    return s;
}
static string fmt(double v, int casas) {
    char b[64];
    snprintf(b, sizeof b, "%.*f", casas, v);
    return virgula(b);
}
static string fmtMs(double v) {
    if (v <= 0) return "0";
    int casas = max(2, 2 - (int)floor(log10(v)));
    return fmt(v, min(casas, 8));
}
static string fmtVar(double v) {  // variância (ms²): notação científica quando é muito pequena
    if (v <= 0) return "0";
    if (v >= 0.01) return fmtMs(v);
    char b[64];
    snprintf(b, sizeof b, "%.2e", v);
    return virgula(b);
}

static void escreverRelatorioHtml(const Config& cfg, const vector<Resumo>& res, double totalSeg, const string& caminho);
static void imprimirTabela(const string& titulo, const vector<string>& cab, const vector<vector<string> >& linhas);

// Executa o benchmark completo. Retorna 0 se tudo certo.
static int executar(const Config& cfg, bool verboso) {
    criarPasta(cfg.saida);
    string pBruto = cfg.saida + "/resultados_brutos.csv";
    string pResumo = cfg.saida + "/resultados_resumo.csv";
    ofstream bruto(pBruto.c_str()), resumo(pResumo.c_str());
    if (!bruto || !resumo) {
        cerr << "  ERRO: não foi possível escrever em \"" << cfg.saida << "\". O arquivo está aberto no Excel?\n";
        return 2;
    }
    bruto << "algoritmo,n,execucao,tempo_ms\n";
    resumo << "algoritmo,n,media_ms,mediana_ms,desvio_ms,variancia_ms2,cv_pct,min_ms,max_ms\n";

    int total = (int)cfg.tamanhos.size() * cfg.execucoes * NALG;
    if (verboso) {
        cout << "\n  Executando " << milhar(total) << " ordenações  (" << NALG << " algoritmos, cenário: " << cfg.cenario
             << ", semente: " << cfg.semente << ")\n\n";
    }

    mt19937 rng(cfg.semente);
    vector<Resumo> resultados;  // por tamanho, na ordem de ALGOS
    chrono::steady_clock::time_point inicio = chrono::steady_clock::now();
    char buf[512];

    for (size_t k = 0; k < cfg.tamanhos.size(); k++) {
        int n = cfg.tamanhos[k];
        if (verboso) {
            snprintf(buf, sizeof buf, "  [%d/%d] n = %-11s ", (int)k + 1, (int)cfg.tamanhos.size(), milhar(n).c_str());
            cout << buf << flush;
        }
        {   // aquecimento descartado (cache frio, alocação inicial)
            vector<int> w(n);
            gerarEntrada(w, cfg.cenario, rng);
            for (int a = 0; a < NALG; a++) { vector<int> c = w; ALGOS[a].ordenar(c); }
        }
        vector<vector<double> > tempos(NALG);
        chrono::steady_clock::time_point t0 = chrono::steady_clock::now();
        for (int e = 1; e <= cfg.execucoes; e++) {
            vector<vector<int> > entradas(repeticoes(n), vector<int>(n));
            for (vector<int>& v : entradas) gerarEntrada(v, cfg.cenario, rng);  // as MESMAS entradas para todos
            for (int a = 0; a < NALG; a++) {
                bool ok;
                double ms = medirMs(ALGOS[a].ordenar, entradas, ok);
                if (!ok) {
                    cerr << "\n  ERRO: " << ALGOS[a].nome << " não ordenou (n=" << n << ", execução " << e << ")\n";
                    return 3;
                }
                tempos[a].push_back(ms);
                snprintf(buf, sizeof buf, "%s,%d,%d,%.6f\n", ALGOS[a].id, n, e, ms);
                bruto << buf;
            }
            if (verboso && (cfg.execucoes <= 40 || e % (cfg.execucoes / 40 + 1) == 0)) cout << "#" << flush;
        }
        double seg = chrono::duration<double>(chrono::steady_clock::now() - t0).count();
        for (int a = 0; a < NALG; a++) {
            Resumo r = resumir(a, n, tempos[a]);
            resultados.push_back(r);
            snprintf(buf, sizeof buf, "%s,%d,%.6f,%.6f,%.6f,%.6e,%.4f,%.6f,%.6f\n", ALGOS[a].id, n, r.media, r.mediana,
                     r.desvio, r.variancia, r.cv, r.minimo, r.maximo);
            resumo << buf;
        }
        if (verboso) {
            snprintf(buf, sizeof buf, "  ok (%.1f s)\n", seg);
            cout << buf;
        }
    }
    bruto.close();
    resumo.close();
    double totalSeg = chrono::duration<double>(chrono::steady_clock::now() - inicio).count();

    escreverRelatorioHtml(cfg, resultados, totalSeg, cfg.saida + "/relatorio.html");

    ofstream log((cfg.saida + "/historico.log").c_str(), ios::app);
    snprintf(buf, sizeof buf, " | tempo total %.2f s | OK\n", totalSeg);
    log << agora() << " | tamanhos=" << listaTamanhos(cfg.tamanhos) << " | execucoes=" << cfg.execucoes
        << " | semente=" << cfg.semente << " | cenario=" << cfg.cenario << buf;

    // Tabela final: média de cada algoritmo e o mais rápido
    cout << "\n  Tempo médio (ms)\n";
    vector<string> cab = {"Itens (n)"};
    for (int a = 0; a < NALG; a++) cab.push_back(ALGOS[a].nome);
    cab.push_back("Mais rápido");
    vector<vector<string> > linhas;
    for (size_t i = 0; i + NALG <= resultados.size(); i += NALG) {
        int melhor = 0;
        for (int a = 1; a < NALG; a++) if (resultados[i + a].media < resultados[i + melhor].media) melhor = a;
        vector<string> l = {milhar(resultados[i].n)};
        for (int a = 0; a < NALG; a++) l.push_back(fmtMs(resultados[i + a].media));
        l.push_back(ALGOS[melhor].nome);
        linhas.push_back(l);
    }
    imprimirTabela("", cab, linhas);
    snprintf(buf, sizeof buf, "  Tempo total: %.2f s  |  arquivos salvos em: %s/\n", totalSeg, cfg.saida.c_str());
    cout << buf << "  Estatística completa por tamanho: opção [7] do painel ou --tabela\n";
    return 0;
}

// =============================================================================
//  Relatório HTML (sem dependências: tabela + gráfico SVG em escala log-log)
// =============================================================================

static void escreverRelatorioHtml(const Config& cfg, const vector<Resumo>& res, double totalSeg, const string& caminho) {
    ofstream h(caminho.c_str());
    if (!h) return;

    const double W = 760, H = 380, L = 70, R = 30, T = 20, B = 50;
    double xmin = 1e18, xmax = 0, ymin = 1e18, ymax = 0;
    for (const Resumo& r : res) {
        xmin = min(xmin, (double)r.n); xmax = max(xmax, (double)r.n);
        double y = max(r.media, 1e-6);
        ymin = min(ymin, y); ymax = max(ymax, y);
    }
    double lx0 = floor(log10(xmin)), lx1 = ceil(log10(xmax));
    double ly0 = floor(log10(ymin)), ly1 = ceil(log10(ymax));
    if (lx1 - lx0 < 1) { lx0 -= 0.5; lx1 += 0.5; }
    if (ly1 - ly0 < 1) { ly0 -= 0.5; ly1 += 0.5; }
    auto px = [&](double n) { return L + (log10(n) - lx0) / (lx1 - lx0) * (W - L - R); };
    auto py = [&](double ms) { return T + (ly1 - log10(max(ms, 1e-6))) / (ly1 - ly0) * (H - T - B); };

    stringstream svg;
    svg << "<svg viewBox='0 0 " << W << " " << H << "' role='img' aria-label='Tempo médio por tamanho do vetor'>";
    for (int e = (int)ceil(ly0); e <= (int)floor(ly1); e++) {
        double y = py(pow(10.0, e));
        svg << "<line class='grade' x1='" << L << "' x2='" << W - R << "' y1='" << y << "' y2='" << y << "'/>";
        string rot = e >= 0 ? milhar((long long)pow(10.0, e)) : fmt(pow(10.0, e), -e);
        svg << "<text class='eixo' x='" << L - 8 << "' y='" << y + 4 << "' text-anchor='end'>" << rot << "</text>";
    }
    for (int n : cfg.tamanhos) {
        double x = px(n);
        svg << "<line class='grade' x1='" << x << "' x2='" << x << "' y1='" << T << "' y2='" << H - B << "'/>";
        svg << "<text class='eixo' x='" << x << "' y='" << H - B + 18 << "' text-anchor='middle'>" << milhar(n) << "</text>";
    }
    svg << "<text class='eixo' x='" << (L + W - R) / 2 << "' y='" << H - 8 << "' text-anchor='middle'>tamanho do vetor (n), escala log</text>";
    svg << "<text class='eixo' transform='translate(16 " << (T + H - B) / 2 << ") rotate(-90)' text-anchor='middle'>tempo médio (ms), escala log</text>";
    for (int a = 0; a < NALG; a++) {
        stringstream pts;
        for (const Resumo& r : res) if (r.alg == a) pts << px(r.n) << "," << py(r.media) << " ";
        svg << "<polyline class='s" << a << "' fill='none' stroke-width='2.5' points='" << pts.str() << "'/>";
        for (const Resumo& r : res) if (r.alg == a) {
            svg << "<circle class='p" << a << "' r='5' cx='" << px(r.n) << "' cy='" << py(r.media) << "'><title>"
                << ALGOS[a].nome << " — n = " << milhar(r.n) << ": " << fmtMs(r.media) << " ms (± " << fmtMs(r.desvio)
                << ")</title></circle>";
        }
    }
    svg << "</svg>";

    h << "<!doctype html><html lang='pt-BR'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>"
      << "<title>Relatório — algoritmos de ordenação</title><style>"
      << ":root{--fundo:#fcfcfb;--cartao:#fff;--tinta:#0b0b0b;--suave:#52514e;--linha:#e3e2de;--s0:#2a78d6;--s1:#eb6834;--s2:#1baf7a}"
      << "@media(prefers-color-scheme:dark){:root{--fundo:#1a1a19;--cartao:#232322;--tinta:#f0efec;--suave:#c3c2b7;--linha:#3a3a37;--s0:#3987e5;--s1:#d95926;--s2:#199e70}}"
      << "*{box-sizing:border-box}body{margin:0;background:var(--fundo);color:var(--tinta);font:15px/1.5 system-ui,Segoe UI,Arial,sans-serif}"
      << "main{max-width:960px;margin:0 auto;padding:28px 16px 48px}h1{font-size:26px;margin:0 0 4px}h2{font-size:17px;margin:28px 0 10px}"
      << ".sub{color:var(--suave);margin:0 0 20px}.cartao{background:var(--cartao);border:1px solid var(--linha);border-radius:10px;padding:16px}"
      << ".meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}.meta div{font-size:13px;color:var(--suave)}"
      << ".meta b{display:block;font-size:17px;color:var(--tinta)}table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}"
      << "th,td{text-align:right;padding:7px 9px;border-bottom:1px solid var(--linha)}th:first-child,td:first-child{text-align:left}"
      << "th{font-size:13px;color:var(--suave);font-weight:600}caption{text-align:left;font-weight:600;padding:0 0 8px}"
      << ".leg{display:flex;flex-wrap:wrap;gap:18px;font-size:13px;color:var(--suave);margin-bottom:6px}"
      << ".leg i{display:inline-block;width:12px;height:12px;border-radius:50%;margin-right:6px;vertical-align:-1px}"
      << "svg{width:100%;height:auto}.grade{stroke:var(--linha)}.eixo{fill:var(--suave);font-size:12px}"
      << ".s0{stroke:var(--s0)}.s1{stroke:var(--s1)}.s2{stroke:var(--s2)}.p0{fill:var(--s0)}.p1{fill:var(--s1)}.p2{fill:var(--s2)}"
      << "circle{stroke:var(--cartao);stroke-width:2}.tabela{overflow-x:auto;margin-bottom:14px}footer{color:var(--suave);font-size:12px;margin-top:28px}</style></head><body><main>"
      << "<h1>Algoritmos de ordenação</h1><p class='sub'>Mergesort bottom-up × Quicksort clássico · gerado em "
      << agora() << "</p><div class='cartao meta'>"
      << "<div><b>" << milhar((long long)cfg.tamanhos.size() * cfg.execucoes * NALG) << "</b>ordenações</div>"
      << "<div><b>" << cfg.execucoes << "</b>execuções por tamanho</div>"
      << "<div><b>" << cfg.cenario << "</b>cenário de entrada</div>"
      << "<div><b>" << cfg.semente << "</b>semente</div>"
      << "<div><b>" << fmt(totalSeg, 2) << " s</b>tempo total</div></div>"
      << "<h2>Tempo médio por tamanho</h2><div class='cartao'><div class='leg'>";
    for (int a = 0; a < NALG; a++) h << "<span><i style='background:var(--s" << a << ")'></i>" << ALGOS[a].nome << "</span>";
    h << "</div>" << svg.str() << "</div><h2>Estatística descritiva (ms)</h2>";
    for (size_t i = 0; i + NALG <= res.size(); i += NALG) {
        h << "<div class='cartao tabela'><table><caption>Conjunto de " << milhar(res[i].n) << " dados</caption><thead><tr>"
          << "<th>Algoritmo</th><th>Média</th><th>Mediana</th><th>Desvio padrão</th><th>Variância (ms²)</th>"
          << "<th>CV (%)</th><th>Máximo / Mínimo</th></tr></thead><tbody>";
        for (int a = 0; a < NALG; a++) {
            const Resumo& r = res[i + a];
            h << "<tr><td>" << ALGOS[a].nome << "</td><td>" << fmtMs(r.media) << "</td><td>" << fmtMs(r.mediana) << "</td><td>"
              << fmtMs(r.desvio) << "</td><td>" << fmtVar(r.variancia) << "</td><td>" << fmt(r.cv, 1) << "</td><td>"
              << fmtMs(r.maximo) << " / " << fmtMs(r.minimo) << "</td></tr>";
        }
        h << "</tbody></table></div>";
    }
    h << "<footer>Sistema: " << sistema() << " · Compilador: " << compilador() << " · Benchmark v" << VERSAO
      << " · Dados brutos em resultados_brutos.csv</footer></main></body></html>\n";
}

// =============================================================================
//  Painel administrativo (menu)
// =============================================================================

static void cabecalho(const Config& c) {
    limparTela();
    cout << "  ==================================================================\n"
         << "     BENCHMARK DE ORDENAÇÃO  ·  Mergesort bottom-up × Quicksort clássico  ·  v" << VERSAO << "\n"
         << "     Painel administrativo\n"
         << "  ==================================================================\n\n"
         << "  Configuração atual\n"
         << "    Tamanhos .......... " << listaTamanhos(c.tamanhos) << "\n"
         << "    Execuções ......... " << c.execucoes << " por tamanho  (" << milhar((long long)c.tamanhos.size() * c.execucoes * 2)
         << " ordenações no total)\n"
         << "    Semente ........... " << c.semente << "\n"
         << "    Cenário ........... " << c.cenario << "\n"
         << "    Pasta de saída .... " << c.saida << "\n\n";
}

static void mostrarArquivo(const string& caminho, const string& vazio) {
    ifstream f(caminho.c_str());
    if (!f) { cout << "  " << vazio << "\n"; return; }
    string linha;
    while (getline(f, linha)) cout << "  " << linha << "\n";
}

// ---- Tabelas detalhadas (lidas de resultados_resumo.csv), no formato pedido no trabalho
static size_t larguraTela(const string& s) {  // conta caracteres, não bytes (UTF-8)
    size_t n = 0;
    for (unsigned char c : s) if ((c & 0xC0) != 0x80) n++;
    return n;
}

static void imprimirTabela(const string& titulo, const vector<string>& cab, const vector<vector<string> >& linhas) {
    vector<size_t> w(cab.size());
    for (size_t c = 0; c < cab.size(); c++) {
        w[c] = larguraTela(cab[c]);
        for (const vector<string>& l : linhas) w[c] = max(w[c], larguraTela(l[c]));
    }
    string sep = "  +";
    for (size_t c = 0; c < w.size(); c++) sep += string(w[c] + 2, '-') + "+";
    auto linha = [&](const vector<string>& l) {
        string r = "  |";
        for (size_t c = 0; c < l.size(); c++) {
            string pad(w[c] - larguraTela(l[c]), ' ');
            r += " " + (c == 0 ? l[c] + pad : pad + l[c]) + " |";  // 1ª coluna à esquerda, números à direita
        }
        return r;
    };
    cout << "\n  " << titulo << (titulo.empty() ? "" : "\n") << sep << "\n" << linha(cab) << "\n" << sep << "\n";
    for (const vector<string>& l : linhas) cout << linha(l) << "\n";
    cout << sep << "\n";
}

static bool lerResumoCsv(const string& pasta, vector<Resumo>& res) {
    ifstream f((pasta + "/resultados_resumo.csv").c_str());
    if (!f) return false;
    string linha;
    getline(f, linha);  // cabeçalho
    while (getline(f, linha)) {
        if (!linha.empty() && linha.back() == '\r') linha.pop_back();
        stringstream ss(linha);
        string campo;
        vector<string> c;
        while (getline(ss, campo, ',')) c.push_back(campo);
        if (c.size() < 9) continue;
        Resumo r;
        r.alg = -1;
        for (int a = 0; a < NALG; a++) if (c[0] == ALGOS[a].id) r.alg = a;
        if (r.alg < 0) continue;
        r.n = atoi(c[1].c_str());
        r.media = atof(c[2].c_str()); r.mediana = atof(c[3].c_str()); r.desvio = atof(c[4].c_str());
        r.variancia = atof(c[5].c_str()); r.cv = atof(c[6].c_str());
        r.minimo = atof(c[7].c_str()); r.maximo = atof(c[8].c_str());
        res.push_back(r);
    }
    return !res.empty() && res.size() % NALG == 0;
}

static int mostrarTabelas(const string& pasta) {
    vector<Resumo> res;
    if (!lerResumoCsv(pasta, res)) {
        cout << "\n  Nenhum resultado em \"" << pasta << "\" (ou resultados de uma versão antiga). Rode o benchmark primeiro.\n";
        return 1;
    }
    cout << "\n  ESTATÍSTICA DESCRITIVA  (pasta: " << pasta << ", tempos em milissegundos)\n";
    int num = 1;
    for (size_t i = 0; i + NALG <= res.size(); i += NALG, num++) {
        vector<vector<string> > l;
        for (int a = 0; a < NALG; a++) {
            const Resumo& r = res[i + a];
            l.push_back({ALGOS[r.alg].nome, fmtMs(r.media), fmtMs(r.mediana), fmtMs(r.desvio), fmtVar(r.variancia),
                         fmt(r.cv, 1), fmtMs(r.maximo) + " / " + fmtMs(r.minimo)});
        }
        imprimirTabela("Tabela " + to_string(num) + ". Estatística descritiva com o conjunto de " + milhar(res[i].n) + " dados.",
                       {"Algoritmo", "Média", "Mediana", "Desvio", "Variância (ms²)", "CV (%)", "Máx / Mín"}, l);
    }
    vector<vector<string> > cres;
    auto nlogn = [](int n) { return n * log2((double)max(2, n)); };
    for (size_t i = 0; i + NALG <= res.size(); i += NALG) {
        vector<string> l = {milhar(res[i].n)};
        if (i == 0) { for (int a = 0; a <= NALG; a++) l.push_back("-"); }
        else {
            l.push_back(fmt(nlogn(res[i].n) / nlogn(res[i - NALG].n), 1) + "x");
            for (int a = 0; a < NALG; a++) l.push_back(fmt(res[i + a].media / res[i - NALG + a].media, 1) + "x");
        }
        cres.push_back(l);
    }
    vector<string> cabC = {"Itens (n)", "Previsto n log n"};
    for (int a = 0; a < NALG; a++) cabC.push_back(ALGOS[a].nome);
    imprimirTabela("Tabela " + to_string(num) + ". Crescimento do tempo médio em relação ao tamanho anterior.", cabC, cres);
    cout << "\n  Leitura: CV (coeficiente de variação) = desvio / média. Abaixo de 3.000 itens os tempos são\n"
         << "  de microssegundos e variam mais. \"Previsto\" é o crescimento esperado por n log n.\n";
    return 0;
}

static void menu(Config cfg) {
    while (true) {
        cabecalho(cfg);
        cout << "  [1] Executar benchmark\n"
             << "  [2] Alterar tamanhos dos vetores\n"
             << "  [3] Alterar número de execuções\n"
             << "  [4] Alterar semente aleatória\n"
             << "  [5] Alterar cenário de entrada\n"
             << "  [6] Restaurar configuração padrão do trabalho\n"
             << "  [7] Ver estatística descritiva (tabelas detalhadas)\n"
             << "  [8] Abrir relatório no navegador\n"
             << "  [9] Ver histórico de execuções\n"
             << "  [0] Sair\n\n";
        string op = lerLinha("  Opção: ");

        if (op == "1") {
            long long maior = *max_element(cfg.tamanhos.begin(), cfg.tamanhos.end());
            if (maior >= 5000000 || (long long)cfg.execucoes * maior >= 200000000LL) {
                string c = lerLinha("\n  Atenção: essa configuração pode levar vários minutos. Continuar? (s/n): ");
                if (c != "s" && c != "S") continue;
            }
            int rc = executar(cfg, true);
            if (rc == 0) {
                string c = lerLinha("\n  Abrir o relatório no navegador? (s/n): ");
                if (c == "s" || c == "S") abrirArquivo(cfg.saida + "/relatorio.html");
                else pausar();
            } else pausar();
        } else if (op == "2") {
            cout << "\n  Digite os tamanhos separados por vírgula (ex.: 30, 300, 3000)\n";
            string s = lerLinha("  Tamanhos (ENTER mantém o atual): ");
            if (s.empty()) continue;
            vector<int> t;
            string erro;
            if (lerTamanhos(s, t, erro)) cfg.tamanhos = t;
            else { cout << "  Inválido: " << erro << "\n"; pausar(); }
        } else if (op == "3") {
            string s = lerLinha("\n  Execuções por tamanho (1 a 1000): ");
            int v = atoi(s.c_str());
            if (v >= 1 && v <= 1000) cfg.execucoes = v;
            else if (!s.empty()) { cout << "  Inválido: use um número entre 1 e 1000.\n"; pausar(); }
        } else if (op == "4") {
            string s = lerLinha("\n  Semente (número inteiro, mesma semente = mesmos dados): ");
            bool ok = !s.empty() && s.size() <= 9 && s.find_first_not_of("0123456789") == string::npos;
            if (ok) cfg.semente = (unsigned)atol(s.c_str());
            else if (!s.empty()) { cout << "  Inválido.\n"; pausar(); }
        } else if (op == "5") {
            cout << "\n";
            for (int i = 0; i < 4; i++) cout << "  [" << i + 1 << "] " << CENARIOS[i] << " — " << DESC_CENARIOS[i] << "\n";
            string s = lerLinha("\n  Cenário: ");
            int v = atoi(s.c_str());
            if (v >= 1 && v <= 4) cfg.cenario = CENARIOS[v - 1];
        } else if (op == "6") {
            string saida = cfg.saida;
            cfg = configPadrao();
            cfg.saida = saida;
        } else if (op == "7") {
            mostrarTabelas(cfg.saida);
            pausar();
        } else if (op == "8") {
            ifstream f((cfg.saida + "/relatorio.html").c_str());
            if (f) abrirArquivo(cfg.saida + "/relatorio.html");
            else { cout << "\n  Nenhum relatório ainda. Use a opção [1].\n"; pausar(); }
        } else if (op == "9") {
            cout << "\n";
            mostrarArquivo(cfg.saida + "/historico.log", "Histórico vazio.");
            pausar();
        } else if (op == "0" || op == "q" || op == "sair") {
            return;
        }
    }
}

// =============================================================================
//  Linha de comando
// =============================================================================

static void ajuda() {
    cout << "Benchmark de Ordenação — Mergesort bottom-up × Quicksort clássico v" << VERSAO << "\n\n"
         << "Uso:\n"
         << "  benchmark                    abre o painel administrativo\n"
         << "  benchmark --rodar [opções]   executa sem menu\n\n"
         << "Opções:\n"
         << "  --tamanhos LISTA    ex.: 30,300,3000          (padrão: 30,300,3000,30000,300000)\n"
         << "  --execucoes N       execuções por tamanho     (padrão: 20)\n"
         << "  --semente N         semente aleatória         (padrão: 42)\n"
         << "  --cenario NOME      aleatorio | ordenado | inverso | repetidos\n"
         << "  --saida PASTA       pasta dos resultados      (padrão: resultados)\n"
         << "  --abrir             abre o relatório no navegador ao terminar\n"
         << "  --tabela            mostra a estatística descritiva da pasta em tabelas\n"
         << "  --ajuda             mostra esta mensagem\n"
         << "  --versao            mostra a versão\n\n"
         << "Códigos de saída: 0 ok, 1 argumento inválido, 2 erro de escrita, 3 falha na verificação.\n";
}

int main(int argc, char** argv) {
#ifdef _WIN32
    SetConsoleOutputCP(CP_UTF8);
    SetConsoleCP(CP_UTF8);
    SetConsoleTitleA("Benchmark de Ordenacao - Painel");
#endif
    ios::sync_with_stdio(true);
    Config cfg = configPadrao();
    if (argc == 1) {
        menu(cfg);
        return 0;
    }

    bool rodar = false, abrir = false, tabela = false;
    for (int i = 1; i < argc; i++) {
        string a = argv[i];
        auto valor = [&](const char* nome) -> string {
            if (i + 1 >= argc) { cerr << "Falta o valor de " << nome << "\n"; exit(1); }
            return argv[++i];
        };
        if (a == "--ajuda" || a == "-h" || a == "--help" || a == "/?") { ajuda(); return 0; }
        else if (a == "--versao" || a == "--version") { cout << VERSAO << "\n"; return 0; }
        else if (a == "--rodar") rodar = true;
        else if (a == "--abrir") abrir = true;
        else if (a == "--tabela") tabela = true;
        else if (a == "--tamanhos") {
            string erro;
            if (!lerTamanhos(valor("--tamanhos"), cfg.tamanhos, erro)) { cerr << "--tamanhos: " << erro << "\n"; return 1; }
        } else if (a == "--execucoes") {
            int v = atoi(valor("--execucoes").c_str());
            if (v < 1 || v > 1000) { cerr << "--execucoes deve estar entre 1 e 1000\n"; return 1; }
            cfg.execucoes = v;
        } else if (a == "--semente") cfg.semente = (unsigned)atol(valor("--semente").c_str());
        else if (a == "--cenario") {
            cfg.cenario = valor("--cenario");
            if (!cenarioValido(cfg.cenario)) { cerr << "--cenario inválido: " << cfg.cenario << "\n"; return 1; }
        } else if (a == "--saida") cfg.saida = valor("--saida");
        else { cerr << "Opção desconhecida: " << a << "  (use --ajuda)\n"; return 1; }
    }
    if (tabela && !rodar) return mostrarTabelas(cfg.saida);
    if (!rodar) { ajuda(); return 1; }
    int rc = executar(cfg, true);
    if (rc == 0 && abrir) abrirArquivo(cfg.saida + "/relatorio.html");
    return rc;
}
