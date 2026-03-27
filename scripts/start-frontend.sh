#!/bin/bash
# Script para iniciar o frontend da SL Academy Platform

set -e

echo "🚀 Iniciando SL Academy Frontend..."
echo ""

# Verificar se está no diretório correto
if [ ! -f "frontend/package.json" ]; then
    echo "❌ Erro: Execute este script do diretório raiz do projeto"
    exit 1
fi

# Navegar para o diretório frontend
cd frontend

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências do Node.js..."
    npm install
fi

# Verificar se o arquivo .env.local existe
if [ ! -f ".env.local" ]; then
    echo "⚠️  Arquivo .env.local não encontrado!"
    echo "📝 Copiando .env.example para .env.local..."
    cp .env.example .env.local
    echo ""
    echo "⚠️  IMPORTANTE: Edite o arquivo frontend/.env.local com suas credenciais!"
    echo "   Depois execute este script novamente."
    exit 1
fi

echo ""
echo "✅ Frontend pronto!"
echo "🌐 Iniciando servidor em http://localhost:3000"
echo ""
echo "Pressione Ctrl+C para parar o servidor"
echo ""

# Iniciar servidor
npm run dev
