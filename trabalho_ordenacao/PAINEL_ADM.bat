@echo off
REM ==========================================================================
REM  Painel administrativo - Benchmark Mergesort x Quicksort
REM  Duplo clique para abrir. Nao vem nenhum .exe pronto: na primeira vez
REM  este painel encontra o compilador C++ instalado (Dev-C++, MinGW, MSYS2...)
REM  e compila src\benchmark.cpp em build\benchmark.exe.
REM ==========================================================================
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
chcp 65001 >nul
title Painel ADM - Benchmark Mergesort x Quicksort
color 0B

set "SRC=src\benchmark.cpp"
set "EXE=build\benchmark.exe"
call :ACHAR_COMPILADOR

:MENU
cls
echo.
echo   ==================================================================
echo      PAINEL ADM  -  Benchmark Mergesort x Quicksort
echo   ==================================================================
echo.
if defined GPP (echo   Compilador ...... !GPP!) else (echo   Compilador ...... NAO ENCONTRADO - veja a opcao 7)
if exist "%EXE%" (echo   Programa ........ compilado  [OK]) else (echo   Programa ........ ainda nao compilado - compila sozinho ao rodar)
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
echo     [7] Compilar de novo  (use depois de mudar o codigo)
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
if "%OP%"=="7" goto RECOMPILAR
if "%OP%"=="8" goto PASTA
if "%OP%"=="9" goto LIMPAR
if "%OP%"=="0" goto FIM
goto MENU

REM -------------------------------------------------------------------------
:PAINEL
call :GARANTIR_PROGRAMA
if errorlevel 1 goto MENU
"%EXE%"
goto MENU

:PADRAO
call :GARANTIR_PROGRAMA
if errorlevel 1 goto MENU
"%EXE%" --rodar --abrir
if errorlevel 1 echo. & echo   [ERRO] O benchmark terminou com erro.
echo.
pause
goto MENU

:CENARIOS
call :GARANTIR_PROGRAMA
if errorlevel 1 goto MENU
for %%C in (aleatorio ordenado inverso repetidos) do (
    echo.
    echo   ========== Cenario: %%C ==========
    "%EXE%" --rodar --cenario %%C --saida "resultados\cenario_%%C"
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

:RECOMPILAR
call :ACHAR_COMPILADOR
call :COMPILAR
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

REM =========================================================================
REM  Sub-rotinas
REM =========================================================================

REM Procura o g++: primeiro no PATH, depois nas pastas de instalacao comuns.
:ACHAR_COMPILADOR
set "GPP="
for %%G in (g++.exe) do set "GPP=%%~$PATH:G"
if defined GPP exit /b 0
for %%D in (
    "%ProgramFiles(x86)%\Embarcadero\Dev-Cpp\TDM-GCC-64\bin"
    "%ProgramFiles%\Embarcadero\Dev-Cpp\TDM-GCC-64\bin"
    "%ProgramFiles(x86)%\Dev-Cpp\MinGW64\bin"
    "%ProgramFiles%\Dev-Cpp\MinGW64\bin"
    "%ProgramFiles(x86)%\Dev-Cpp\MinGW32\bin"
    "%ProgramFiles%\CodeBlocks\MinGW\bin"
    "%ProgramFiles(x86)%\CodeBlocks\MinGW\bin"
    "C:\TDM-GCC-64\bin"
    "C:\TDM-GCC-32\bin"
    "C:\msys64\ucrt64\bin"
    "C:\msys64\mingw64\bin"
    "C:\mingw64\bin"
    "C:\MinGW\bin"
    "%LOCALAPPDATA%\Programs\mingw64\bin"
) do (
    if not defined GPP if exist "%%~D\g++.exe" set "GPP=%%~D\g++.exe"
)
exit /b 0

REM Compila so se o programa ainda nao existe.
:GARANTIR_PROGRAMA
if exist "%EXE%" exit /b 0
call :COMPILAR
if errorlevel 1 (
    echo.
    pause
    exit /b 1
)
exit /b 0

REM Compila src\benchmark.cpp em build\benchmark.exe.
:COMPILAR
if not defined GPP (
    call :SEM_COMPILADOR
    exit /b 1
)
if not exist "%SRC%" (
    echo.
    echo   [ERRO] Codigo-fonte nao encontrado: %SRC%
    exit /b 1
)
if not exist "build" mkdir "build"
for %%P in ("!GPP!") do set "PATH=%%~dpP;!PATH!"
echo.
echo   Compilando %SRC% ... (leva alguns segundos)
"!GPP!" -O2 -std=c++11 -static -o "%EXE%" "%SRC%" 2> "build\erros_compilacao.txt"
if errorlevel 1 (
    echo.
    echo   [ERRO] A compilacao falhou. Mensagens do compilador:
    echo.
    type "build\erros_compilacao.txt"
    echo.
    if exist "%EXE%" echo   A versao compilada anteriormente continua sendo usada.
    exit /b 1
)
if not exist "%EXE%" (
    echo   [ERRO] O compilador terminou mas %EXE% nao foi criado.
    exit /b 1
)
echo   [OK] Programa compilado em %EXE%
exit /b 0

:SEM_COMPILADOR
echo.
echo   [ERRO] Nenhum compilador C++ (g++) foi encontrado neste computador.
echo.
echo   Para rodar o benchmark, instale UM destes (gratuitos) e abra o painel de novo:
echo     - Dev-C++ (Embarcadero)  - ja vem com o compilador, e o mais facil
echo     - MinGW-w64 ou MSYS2     - adicione a pasta bin ao PATH
echo.
echo   Os slides, o PDF e os resultados ja gerados funcionam sem compilador
echo   (opcoes 4, 5 e 6).
echo.
set "R="
set /p "R=  Abrir a pagina de download do Dev-C++? (S/N): "
if /i "!R!"=="S" start "" "https://github.com/Embarcadero/Dev-Cpp/releases"
exit /b 0
