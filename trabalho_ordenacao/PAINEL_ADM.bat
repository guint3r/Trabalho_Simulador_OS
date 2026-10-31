@echo off
REM ==========================================================================
REM  Painel administrativo - Benchmark Mergesort x Quicksort
REM  Duplo clique para abrir. Nao precisa instalar nada para rodar o benchmark.
REM ==========================================================================
setlocal EnableExtensions
cd /d "%~dp0"
chcp 65001 >nul
title Painel ADM - Benchmark Mergesort x Quicksort
color 0B

:MENU
cls
echo.
echo   ==================================================================
echo      PAINEL ADM  -  Benchmark Mergesort x Quicksort
echo   ==================================================================
echo.
if exist "Benchmark.exe" (echo   Programa ........ Benchmark.exe  [OK]) else (echo   Programa ........ Benchmark.exe  [NAO ENCONTRADO - use a opcao 7])
if exist "resultados\resultados_resumo.csv" (echo   Resultados ...... resultados\  [OK]) else (echo   Resultados ...... ainda nao gerados)
echo.
echo   EXECUCAO
echo     [1] Abrir o painel do benchmark  (configurar tamanhos, execucoes, cenario)
echo     [2] Rodar o teste padrao do trabalho e abrir o relatorio
echo     [3] Rodar os 4 cenarios (aleatorio, ordenado, inverso, repetidos)
echo.
echo   RESULTADOS E APRESENTACAO
echo     [4] Abrir relatorio (navegador)
echo     [5] Abrir slides da apresentacao
echo     [6] Abrir divisao do trabalho (PDF)
echo.
echo   MANUTENCAO
echo     [7] Recompilar Benchmark.exe a partir do codigo  (requer g++ / MinGW)
echo     [8] Abrir pasta de resultados
echo     [9] Apagar resultados
echo     [0] Sair
echo.
set "OP="
set /p "OP=  Opcao: "

if "%OP%"=="1" goto PAINEL
if "%OP%"=="2" goto PADRAO
if "%OP%"=="3" goto CENARIOS
if "%OP%"=="4" goto RELATORIO
if "%OP%"=="5" goto SLIDES
if "%OP%"=="6" goto DIVISAO
if "%OP%"=="7" goto COMPILAR
if "%OP%"=="8" goto PASTA
if "%OP%"=="9" goto LIMPAR
if "%OP%"=="0" goto FIM
goto MENU

:CHECAR_EXE
if exist "Benchmark.exe" exit /b 0
echo.
echo   [ERRO] Benchmark.exe nao encontrado nesta pasta.
echo          Use a opcao 7 para compilar, ou baixe o ZIP do trabalho de novo.
echo.
pause
exit /b 1

:PAINEL
call :CHECAR_EXE
if errorlevel 1 goto MENU
"Benchmark.exe"
goto MENU

:PADRAO
call :CHECAR_EXE
if errorlevel 1 goto MENU
"Benchmark.exe" --rodar --abrir
if errorlevel 1 echo. & echo   [ERRO] O benchmark terminou com codigo %errorlevel%.
echo.
pause
goto MENU

:CENARIOS
call :CHECAR_EXE
if errorlevel 1 goto MENU
for %%C in (aleatorio ordenado inverso repetidos) do (
    echo.
    echo   ========== Cenario: %%C ==========
    "Benchmark.exe" --rodar --cenario %%C --saida "resultados\cenario_%%C"
)
echo.
echo   Relatorios salvos em resultados\cenario_*\relatorio.html
start "" "resultados"
pause
goto MENU

:RELATORIO
if exist "resultados\relatorio.html" (start "" "resultados\relatorio.html") else (echo. & echo   Nenhum relatorio ainda. Use a opcao 2. & pause)
goto MENU

:SLIDES
if exist "apresentacao\slides.pptx" (start "" "apresentacao\slides.pptx") else (echo. & echo   Arquivo apresentacao\slides.pptx nao encontrado. & pause)
goto MENU

:DIVISAO
if exist "apresentacao\divisao_trabalho.pdf" (start "" "apresentacao\divisao_trabalho.pdf") else (echo. & echo   Arquivo apresentacao\divisao_trabalho.pdf nao encontrado. & pause)
goto MENU

:COMPILAR
where g++ >nul 2>nul
if errorlevel 1 (
    echo.
    echo   [ERRO] g++ nao encontrado no PATH.
    echo          Instale o MinGW-w64 ou abra src\benchmark.cpp no Dev-C++ e compile por la.
    echo.
    pause
    goto MENU
)
echo.
echo   Compilando src\benchmark.cpp ...
g++ -O2 -std=c++11 -static -o Benchmark.exe src\benchmark.cpp
if errorlevel 1 (echo   [ERRO] Falha na compilacao.) else (echo   [OK] Benchmark.exe gerado.)
echo.
pause
goto MENU

:PASTA
if not exist "resultados" mkdir "resultados"
start "" "resultados"
goto MENU

:LIMPAR
echo.
set "CONF="
set /p "CONF=  Apagar TODOS os arquivos da pasta resultados? (S/N): "
if /i not "%CONF%"=="S" goto MENU
if exist "resultados" rmdir /s /q "resultados"
mkdir "resultados"
echo   [OK] Resultados apagados.
pause
goto MENU

:FIM
endlocal
exit /b 0
