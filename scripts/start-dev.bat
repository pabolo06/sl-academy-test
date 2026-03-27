@echo off
REM Script para iniciar o ambiente de desenvolvimento da SL Academy Platform (Windows)

echo ==========================================
echo SL Academy Platform - Inicializacao
echo ==========================================
echo.

REM Verificar Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Python nao encontrado. Instale Python 3.11+
    exit /b 1
)

REM Verificar Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao encontrado. Instale Node.js 18+
    exit /b 1
)

echo [OK] Python instalado
echo [OK] Node.js instalado
echo.

REM Backend Setup
echo ==========================================
echo Configurando Backend...
echo ==========================================

cd backend

REM Verificar se o ambiente virtual existe
if not exist ".venv" (
    echo Criando ambiente virtual Python...
    python -m venv .venv
)

REM Ativar ambiente virtual
echo Ativando ambiente virtual...
call .venv\Scripts\activate.bat

REM Instalar dependências
echo Instalando dependencias do backend...
pip install -r requirements.txt

REM Verificar arquivo .env
if not exist ".env" (
    echo [AVISO] Arquivo .env nao encontrado. Copiando de .env.example...
    copy .env.example .env
    echo [AVISO] Configure o arquivo backend\.env com suas credenciais!
)

cd ..

REM Frontend Setup
echo.
echo ==========================================
echo Configurando Frontend...
echo ==========================================

cd frontend

REM Instalar dependências
if not exist "node_modules" (
    echo Instalando dependencias do frontend...
    call npm install
)

REM Verificar arquivo .env.local
if not exist ".env.local" (
    echo [AVISO] Arquivo .env.local nao encontrado. Copiando de .env.example...
    copy .env.example .env.local
    echo [AVISO] Configure o arquivo frontend\.env.local com suas credenciais!
)

cd ..

REM Instruções finais
echo.
echo ==========================================
echo Ambiente configurado com sucesso!
echo ==========================================
echo.
echo Para iniciar os servidores, abra 2 terminais:
echo.
echo Terminal 1 - Backend:
echo   cd backend
echo   .venv\Scripts\activate
echo   python main.py
echo.
echo Terminal 2 - Frontend:
echo   cd frontend
echo   npm run dev
echo.
echo Acesse:
echo   - Backend API: http://localhost:8000
echo   - Backend Docs: http://localhost:8000/docs
echo   - Frontend: http://localhost:3000
echo.

pause
