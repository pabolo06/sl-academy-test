#!/bin/bash
# Script para iniciar o ambiente de desenvolvimento da SL Academy Platform

echo "=========================================="
echo "SL Academy Platform - Inicialização"
echo "=========================================="
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Função para verificar se um comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verificar dependências
echo "Verificando dependências..."
if ! command_exists python; then
    echo -e "${RED}❌ Python não encontrado. Instale Python 3.11+${NC}"
    exit 1
fi

if ! command_exists node; then
    echo -e "${RED}❌ Node.js não encontrado. Instale Node.js 18+${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Python $(python --version)${NC}"
echo -e "${GREEN}✓ Node.js $(node --version)${NC}"
echo ""

# Backend Setup
echo "=========================================="
echo "Configurando Backend..."
echo "=========================================="

cd backend

# Verificar se o ambiente virtual existe
if [ ! -d ".venv" ]; then
    echo "Criando ambiente virtual Python..."
    python -m venv .venv
fi

# Ativar ambiente virtual
echo "Ativando ambiente virtual..."
source .venv/Scripts/activate 2>/dev/null || source .venv/bin/activate

# Instalar dependências
echo "Instalando dependências do backend..."
pip install -r requirements.txt

# Verificar arquivo .env
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Arquivo .env não encontrado. Copiando de .env.example...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Configure o arquivo backend/.env com suas credenciais!${NC}"
fi

cd ..

# Frontend Setup
echo ""
echo "=========================================="
echo "Configurando Frontend..."
echo "=========================================="

cd frontend

# Instalar dependências
if [ ! -d "node_modules" ]; then
    echo "Instalando dependências do frontend..."
    npm install
fi

# Verificar arquivo .env.local
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  Arquivo .env.local não encontrado. Copiando de .env.example...${NC}"
    cp .env.example .env.local
    echo -e "${YELLOW}⚠️  Configure o arquivo frontend/.env.local com suas credenciais!${NC}"
fi

cd ..

# Instruções finais
echo ""
echo "=========================================="
echo "Ambiente configurado com sucesso!"
echo "=========================================="
echo ""
echo "Para iniciar os servidores, abra 2 terminais:"
echo ""
echo -e "${GREEN}Terminal 1 - Backend:${NC}"
echo "  cd backend"
echo "  source .venv/Scripts/activate  # Windows Git Bash"
echo "  # ou: .venv\\Scripts\\activate  # Windows CMD"
echo "  # ou: source .venv/bin/activate  # Linux/Mac"
echo "  python main.py"
echo ""
echo -e "${GREEN}Terminal 2 - Frontend:${NC}"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "Acesse:"
echo "  - Backend API: http://localhost:8000"
echo "  - Backend Docs: http://localhost:8000/docs"
echo "  - Frontend: http://localhost:3000"
echo ""
