# Script PowerShell para iniciar o backend da SL Academy Platform

Write-Host "🚀 Iniciando SL Academy Backend..." -ForegroundColor Green
Write-Host ""

# Verificar se está no diretório correto
if (-not (Test-Path "backend/main.py")) {
    Write-Host "❌ Erro: Execute este script do diretório raiz do projeto" -ForegroundColor Red
    exit 1
}

# Navegar para o diretório backend
Set-Location backend

# Verificar se o ambiente virtual existe
if (-not (Test-Path "venv")) {
    Write-Host "📦 Criando ambiente virtual Python..." -ForegroundColor Yellow
    python -m venv venv
}

# Ativar ambiente virtual
Write-Host "🔧 Ativando ambiente virtual..." -ForegroundColor Cyan
& .\venv\Scripts\Activate.ps1

# Verificar se as dependências estão instaladas
if (-not (Test-Path "venv/installed.flag")) {
    Write-Host "📥 Instalando dependências..." -ForegroundColor Yellow
    pip install -r requirements.txt
    New-Item -Path "venv/installed.flag" -ItemType File -Force | Out-Null
}

# Verificar se o arquivo .env existe
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Arquivo .env não encontrado!" -ForegroundColor Yellow
    Write-Host "📝 Copiando .env.example para .env..." -ForegroundColor Cyan
    Copy-Item .env.example .env
    Write-Host ""
    Write-Host "⚠️  IMPORTANTE: Edite o arquivo backend/.env com suas credenciais do Supabase!" -ForegroundColor Yellow
    Write-Host "   Depois execute este script novamente."
    exit 1
}

# Verificar se Redis está rodando (opcional)
try {
    $redisTest = redis-cli ping 2>$null
    if ($redisTest -eq "PONG") {
        Write-Host "✅ Redis está rodando" -ForegroundColor Green
    }
} catch {
    Write-Host "ℹ️  Redis não está rodando (cache desabilitado)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "✅ Backend pronto!" -ForegroundColor Green
Write-Host "🌐 Iniciando servidor em http://localhost:8000" -ForegroundColor Cyan
Write-Host "📚 Documentação da API: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pressione Ctrl+C para parar o servidor" -ForegroundColor Yellow
Write-Host ""

# Iniciar servidor
python main.py
