# Script PowerShell para iniciar o frontend da SL Academy Platform

Write-Host "🚀 Iniciando SL Academy Frontend..." -ForegroundColor Green
Write-Host ""

# Verificar se está no diretório correto
if (-not (Test-Path "frontend/package.json")) {
    Write-Host "❌ Erro: Execute este script do diretório raiz do projeto" -ForegroundColor Red
    exit 1
}

# Navegar para o diretório frontend
Set-Location frontend

# Verificar se node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependências do Node.js..." -ForegroundColor Yellow
    npm install
}

# Verificar se o arquivo .env.local existe
if (-not (Test-Path ".env.local")) {
    Write-Host "⚠️  Arquivo .env.local não encontrado!" -ForegroundColor Yellow
    Write-Host "📝 Copiando .env.example para .env.local..." -ForegroundColor Cyan
    Copy-Item .env.example .env.local
    Write-Host ""
    Write-Host "⚠️  IMPORTANTE: Edite o arquivo frontend/.env.local com suas credenciais!" -ForegroundColor Yellow
    Write-Host "   Depois execute este script novamente."
    exit 1
}

Write-Host ""
Write-Host "✅ Frontend pronto!" -ForegroundColor Green
Write-Host "🌐 Iniciando servidor em http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pressione Ctrl+C para parar o servidor" -ForegroundColor Yellow
Write-Host ""

# Iniciar servidor
npm run dev
