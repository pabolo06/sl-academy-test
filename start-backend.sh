#!/bin/bash
# Script para iniciar o backend da SL Academy Platform

set -e

echo "🚀 Iniciando SL Academy Backend..."
echo ""

# Verificar se está no diretório correto
if [ ! -f "backend/main.py" ]; then
    echo "❌ Erro: Execute este script do diretório raiz do projeto"
    exit 1
fi

# Navegar para o diretório backend
cd backend

# Verificar se o ambiente virtual existe
if [ ! -d "venv" ]; then
    echo "📦 Criando ambiente virtual Python..."
    python -m venv venv
fi

# Ativar ambiente virtual
echo "🔧 Ativando ambiente virtual..."
source venv/bin/activate

# Verificar se as dependências estão instaladas
if [ ! -f "venv/installed.flag" ]; then
    echo "📥 Instalando dependências..."
    pip install -r requirements.txt
    touch venv/installed.flag
fi

# Verificar se o arquivo .env existe
if [ ! -f ".env" ]; then
    echo "⚠️  Arquivo .env não encontrado!"
    echo "📝 Copiando .env.example para .env..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANTE: Edite o arquivo backend/.env com suas credenciais do Supabase!"
    echo "   Depois execute este script novamente."
    exit 1
fi

# Verificar se Redis está rodando (opcional)
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        echo "✅ Redis está rodando"
    else
        echo "⚠️  Redis não está rodando (cache desabilitado)"
    fi
else
    echo "ℹ️  Redis não instalado (cache desabilitado)"
fi

echo ""
echo "✅ Backend pronto!"
echo "🌐 Iniciando servidor em http://localhost:8000"
echo "📚 Documentação da API: http://localhost:8000/docs"
echo ""
echo "Pressione Ctrl+C para parar o servidor"
echo ""

# Iniciar servidor
python main.py
