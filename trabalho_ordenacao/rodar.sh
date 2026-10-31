#!/usr/bin/env sh
# Linux/macOS: compila (se preciso) e abre o painel do benchmark.
# Uso: ./rodar.sh            -> painel interativo
#      ./rodar.sh --rodar    -> executa direto (aceita as mesmas opcoes do Benchmark.exe)
set -e
cd "$(dirname "$0")"
if [ ! -x ./benchmark ] || [ src/benchmark.cpp -nt ./benchmark ]; then
    echo "Compilando src/benchmark.cpp ..."
    g++ -O2 -std=c++11 -o benchmark src/benchmark.cpp
fi
exec ./benchmark "$@"
