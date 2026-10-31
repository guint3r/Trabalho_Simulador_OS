// =============================================================================
//  Benchmark de Ordenação — Mergesort × Quicksort
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
//    resultados_resumo.csv   média, desvio, mínimo e máximo por algoritmo/tamanho
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

static const char* VERSAO = "1.0";

// =============================================================================
//  Algoritmos
// =============================================================================

// ---- Mergesort: divide ao meio, ordena cada metade, intercala com vetor auxiliar
static void intercalar(vector<int>& v, vector<int>& aux, int ini, int meio, int fim) {
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
    intercalar(v, aux, ini, meio, fim);
}

void mergesort(vector<int>& v) {
    vector<int> aux(v.size());
    mergesortRec(v, aux, 0, (int)v.size());
}

// ---- Quicksort: pivô = mediana de três (início, meio, fim), particionamento de Hoare.
//      Recursão só na parte menor => pilha O(log n) mesmo em entradas ruins.
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
        if (j - ini < fim - j) { quicksortRec(v, ini, j); ini = j + 1; }
        else                   { quicksortRec(v, j + 1, fim); fim = j; }
    }
}

void quicksort(vector<int>& v) {
    if (!v.empty()) quicksortRec(v, 0, (int)v.size() - 1);
}

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
    string algoritmo;
    int n;
    double media, desvio, minimo, maximo;
};

static void gerarEntrada(vector<int>& v, const string& cenario, mt19937& rng) {
    int n = (int)v.size();
    if (cenario == "repetidos") {
        uniform_int_distribution<int> d(0, 9);
        for (int& x : v) x = d(rng);
        return;
    }
    uniform_int_distribution<int> d(0, 1000000);
    for (int& x : v) x = d(rng);
    if (cenario == "ordenado") sort(v.begin(), v.end());
    else if (cenario == "inverso") sort(v.begin(), v.end(), greater<int>());
    (void)n;
}

// Vetores pequenos ordenam em microssegundos, perto da resolução do relógio.
// Por isso cada medição ordena k cópias idênticas e divide o tempo por k
// (k = 20.000 / n, mínimo 1). As cópias são feitas ANTES de ligar o cronômetro.
static int repeticoes(int n) { return max(1, 20000 / max(n, 1)); }

template <class F>
static double medirMs(F ordenar, const vector<int>& original, vector<int>& saida) {
    int k = repeticoes((int)original.size());
    vector<vector<int> > copias(k, original);
    chrono::steady_clock::time_point t0 = chrono::steady_clock::now();
    for (int r = 0; r < k; r++) ordenar(copias[r]);
    chrono::steady_clock::time_point t1 = chrono::steady_clock::now();
    saida.swap(copias[0]);
    return chrono::duration<double, milli>(t1 - t0).count() / k;
}

static Resumo resumir(const string& nome, int n, const vector<double>& t) {
    Resumo r;
    r.algoritmo = nome;
    r.n = n;
    double soma = 0;
    for (double x : t) soma += x;
    r.media = soma / t.size();
    double var = 0;
    for (double x : t) var += (x - r.media) * (x - r.media);
    r.desvio = t.size() > 1 ? sqrt(var / (t.size() - 1)) : 0.0;
    r.minimo = *min_element(t.begin(), t.end());
    r.maximo = *max_element(t.begin(), t.end());
    return r;
}

static void escreverRelatorioHtml(const Config& cfg, const vector<Resumo>& res, double totalSeg, const string& caminho);

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
    resumo << "algoritmo,n,media_ms,desvio_ms,min_ms,max_ms\n";

    int total = (int)cfg.tamanhos.size() * cfg.execucoes * 2;
    if (verboso) {
        cout << "\n  Executando " << milhar(total) << " ordenações  (cenário: " << cfg.cenario
             << ", semente: " << cfg.semente << ")\n\n";
    }

    mt19937 rng(cfg.semente);
    vector<Resumo> resultados;
    chrono::steady_clock::time_point inicio = chrono::steady_clock::now();
    char buf[256];

    for (size_t k = 0; k < cfg.tamanhos.size(); k++) {
        int n = cfg.tamanhos[k];
        if (verboso) {
            snprintf(buf, sizeof buf, "  [%d/%d] n = %-11s ", (int)k + 1, (int)cfg.tamanhos.size(), milhar(n).c_str());
            cout << buf << flush;
        }
        // aquecimento descartado (cache frio, alocação inicial)
        {
            vector<int> w(n);
            gerarEntrada(w, cfg.cenario, rng);
            vector<int> w2 = w;
            mergesort(w);
            quicksort(w2);
        }
        vector<double> tm, tq;
        chrono::steady_clock::time_point t0 = chrono::steady_clock::now();
        for (int e = 1; e <= cfg.execucoes; e++) {
            vector<int> original(n);
            gerarEntrada(original, cfg.cenario, rng);
            vector<int> a, b;  // os dois ordenam cópias da MESMA entrada
            double ms_m = medirMs(mergesort, original, a);
            double ms_q = medirMs(quicksort, original, b);
            if (!is_sorted(a.begin(), a.end()) || !is_sorted(b.begin(), b.end())) {
                cerr << "\n  ERRO: resultado não ordenado (n=" << n << ", execução " << e << ")\n";
                return 3;
            }
            tm.push_back(ms_m);
            tq.push_back(ms_q);
            snprintf(buf, sizeof buf, "mergesort,%d,%d,%.6f\nquicksort,%d,%d,%.6f\n", n, e, ms_m, n, e, ms_q);
            bruto << buf;
            if (verboso && (cfg.execucoes <= 40 || e % (cfg.execucoes / 40 + 1) == 0)) cout << "#" << flush;
        }
        double seg = chrono::duration<double>(chrono::steady_clock::now() - t0).count();
        Resumo rm = resumir("mergesort", n, tm), rq = resumir("quicksort", n, tq);
        resultados.push_back(rm);
        resultados.push_back(rq);
        for (const Resumo* r : {&rm, &rq}) {
            snprintf(buf, sizeof buf, "%s,%d,%.6f,%.6f,%.6f,%.6f\n", r->algoritmo.c_str(), n, r->media, r->desvio,
                     r->minimo, r->maximo);
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

    string pHtml = cfg.saida + "/relatorio.html";
    escreverRelatorioHtml(cfg, resultados, totalSeg, pHtml);

    ofstream log((cfg.saida + "/historico.log").c_str(), ios::app);
    snprintf(buf, sizeof buf, " | tempo total %.2f s | OK\n", totalSeg);
    log << agora() << " | tamanhos=" << listaTamanhos(cfg.tamanhos) << " | execucoes=" << cfg.execucoes
        << " | semente=" << cfg.semente << " | cenario=" << cfg.cenario << buf;

    // Tabela final
    cout << "\n  " << string(66, '-') << "\n";
    snprintf(buf, sizeof buf, "  %-11s %14s %14s    %s\n", "n", "Mergesort (ms)", "Quicksort (ms)", "Quicksort vs Mergesort");
    cout << buf << "  " << string(66, '-') << "\n";
    for (size_t i = 0; i + 1 < resultados.size(); i += 2) {
        const Resumo& m = resultados[i];
        const Resumo& q = resultados[i + 1];
        double dif = (m.media - q.media) / m.media * 100.0;
        string comp;
        if (fabs(dif) < 3) comp = "empate técnico";
        else {
            snprintf(buf, sizeof buf, "%.0f%% mais %s", fabs(dif), dif > 0 ? "rápido" : "lento");
            comp = buf;
        }
        snprintf(buf, sizeof buf, "  %-11s %14.4f %14.4f    ", milhar(m.n).c_str(), m.media, q.media);
        cout << buf << comp << "\n";
    }
    cout << "  " << string(66, '-') << "\n";
    snprintf(buf, sizeof buf, "  Tempo total: %.2f s  |  arquivos salvos em: %s/\n", totalSeg, cfg.saida.c_str());
    cout << buf;
    return 0;
}

// =============================================================================
//  Relatório HTML (sem dependências: tabela + gráfico SVG em escala log-log)
// =============================================================================

static string fmt(double v, int casas) {
    char b[64];
    snprintf(b, sizeof b, "%.*f", casas, v);
    string s = b;
    for (char& c : s) if (c == '.') c = ',';
    return s;
}

static string fmtMs(double v) { return v < 1 ? fmt(v, 4) : fmt(v, 2); }

static void escreverRelatorioHtml(const Config& cfg, const vector<Resumo>& res, double totalSeg, const string& caminho) {
    ofstream h(caminho.c_str());
    if (!h) return;

    // --- geometria do gráfico
    const double W = 760, H = 380, L = 70, R = 110, T = 20, B = 50;
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
    const char* nomes[] = {"mergesort", "quicksort"};
    const char* rotulos[] = {"Mergesort", "Quicksort"};
    for (int a = 0; a < 2; a++) {
        stringstream pts;
        double ux = 0, uy = 0, um = 0;
        for (const Resumo& r : res) if (r.algoritmo == nomes[a]) {
            ux = px(r.n); uy = py(r.media); um = r.media;
            pts << ux << "," << uy << " ";
        }
        svg << "<polyline class='s" << a << "' fill='none' stroke-width='2.5' points='" << pts.str() << "'/>";
        for (const Resumo& r : res) if (r.algoritmo == nomes[a]) {
            svg << "<circle class='p" << a << "' r='5' cx='" << px(r.n) << "' cy='" << py(r.media) << "'><title>"
                << rotulos[a] << " — n = " << milhar(r.n) << ": " << fmtMs(r.media) << " ms (± " << fmtMs(r.desvio)
                << ")</title></circle>";
        }
        svg << "<text class='rotulo' x='" << ux + 10 << "' y='" << uy + (a == 0 ? -4 : 12) << "'>" << rotulos[a]
            << " " << fmtMs(um) << " ms</text>";
    }
    svg << "</svg>";

    h << "<!doctype html><html lang='pt-BR'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>"
      << "<title>Relatório — Mergesort × Quicksort</title><style>"
      << ":root{--fundo:#fcfcfb;--cartao:#fff;--tinta:#0b0b0b;--suave:#52514e;--linha:#e3e2de;--s0:#2a78d6;--s1:#eb6834}"
      << "@media(prefers-color-scheme:dark){:root{--fundo:#1a1a19;--cartao:#232322;--tinta:#f0efec;--suave:#c3c2b7;--linha:#3a3a37;--s0:#3987e5;--s1:#d95926}}"
      << "*{box-sizing:border-box}body{margin:0;background:var(--fundo);color:var(--tinta);font:15px/1.5 system-ui,Segoe UI,Arial,sans-serif}"
      << "main{max-width:880px;margin:0 auto;padding:28px 16px 48px}h1{font-size:26px;margin:0 0 4px}h2{font-size:17px;margin:28px 0 10px}"
      << ".sub{color:var(--suave);margin:0 0 20px}.cartao{background:var(--cartao);border:1px solid var(--linha);border-radius:10px;padding:16px}"
      << ".meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}.meta div{font-size:13px;color:var(--suave)}"
      << ".meta b{display:block;font-size:17px;color:var(--tinta)}table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}"
      << "th,td{text-align:right;padding:8px 10px;border-bottom:1px solid var(--linha)}th:first-child,td:first-child{text-align:left}"
      << "th{font-size:13px;color:var(--suave);font-weight:600}.leg{display:flex;gap:18px;font-size:13px;color:var(--suave);margin-bottom:6px}"
      << ".leg i{display:inline-block;width:12px;height:12px;border-radius:50%;margin-right:6px;vertical-align:-1px}"
      << "svg{width:100%;height:auto}.grade{stroke:var(--linha)}.eixo{fill:var(--suave);font-size:12px}.rotulo{fill:var(--tinta);font-size:12px}"
      << ".s0{stroke:var(--s0)}.s1{stroke:var(--s1)}.p0{fill:var(--s0)}.p1{fill:var(--s1)}circle{stroke:var(--cartao);stroke-width:2}"
      << ".tabela{overflow-x:auto}footer{color:var(--suave);font-size:12px;margin-top:28px}</style></head><body><main>"
      << "<h1>Mergesort × Quicksort</h1><p class='sub'>Relatório gerado em " << agora() << "</p>"
      << "<div class='cartao meta'>"
      << "<div><b>" << milhar((long long)cfg.tamanhos.size() * cfg.execucoes * 2) << "</b>ordenações</div>"
      << "<div><b>" << cfg.execucoes << "</b>execuções por tamanho</div>"
      << "<div><b>" << cfg.cenario << "</b>cenário de entrada</div>"
      << "<div><b>" << cfg.semente << "</b>semente</div>"
      << "<div><b>" << fmt(totalSeg, 2) << " s</b>tempo total</div></div>"
      << "<h2>Tempo médio por tamanho</h2><div class='cartao'><div class='leg'><span><i style='background:var(--s0)'></i>Mergesort</span>"
      << "<span><i style='background:var(--s1)'></i>Quicksort</span></div>" << svg.str() << "</div>"
      << "<h2>Tabela</h2><div class='cartao tabela'><table><thead><tr><th>n</th><th>Mergesort média (ms)</th><th>desvio</th>"
      << "<th>Quicksort média (ms)</th><th>desvio</th><th>Quicksort vs Mergesort</th></tr></thead><tbody>";
    for (size_t i = 0; i + 1 < res.size(); i += 2) {
        const Resumo& m = res[i];
        const Resumo& q = res[i + 1];
        double dif = (m.media - q.media) / m.media * 100.0;
        string comp = fabs(dif) < 3 ? "empate técnico" : fmt(fabs(dif), 0) + "% mais " + (dif > 0 ? "rápido" : "lento");
        h << "<tr><td>" << milhar(m.n) << "</td><td>" << fmtMs(m.media) << "</td><td>± " << fmtMs(m.desvio) << "</td><td>"
          << fmtMs(q.media) << "</td><td>± " << fmtMs(q.desvio) << "</td><td>" << comp << "</td></tr>";
    }
    h << "</tbody></table></div><footer>Sistema: " << sistema() << " · Compilador: " << compilador()
      << " · Benchmark v" << VERSAO << " · Dados brutos em resultados_brutos.csv</footer></main></body></html>\n";
}

// =============================================================================
//  Painel administrativo (menu)
// =============================================================================

static void cabecalho(const Config& c) {
    limparTela();
    cout << "  ==================================================================\n"
         << "     BENCHMARK DE ORDENAÇÃO  ·  Mergesort × Quicksort  ·  v" << VERSAO << "\n"
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

static void menu(Config cfg) {
    while (true) {
        cabecalho(cfg);
        cout << "  [1] Executar benchmark\n"
             << "  [2] Alterar tamanhos dos vetores\n"
             << "  [3] Alterar número de execuções\n"
             << "  [4] Alterar semente aleatória\n"
             << "  [5] Alterar cenário de entrada\n"
             << "  [6] Restaurar configuração padrão do trabalho\n"
             << "  [7] Ver último resumo (CSV)\n"
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
            cout << "\n";
            mostrarArquivo(cfg.saida + "/resultados_resumo.csv", "Nenhum resultado ainda. Use a opção [1].");
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
    cout << "Benchmark de Ordenação — Mergesort × Quicksort v" << VERSAO << "\n\n"
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

    bool rodar = false, abrir = false;
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
    if (!rodar) { ajuda(); return 1; }
    int rc = executar(cfg, true);
    if (rc == 0 && abrir) abrirArquivo(cfg.saida + "/relatorio.html");
    return rc;
}
