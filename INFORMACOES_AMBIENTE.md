# 🔧 Informações do Ambiente - SL Academy Platform

## 📦 Versões Instaladas

### Sistema Operacional
- **OS:** Windows
- **Platform:** win32
- **Shell:** bash

### Backend (Python)
- **Python:** 3.11.8
- **FastAPI:** 0.109.0
- **Uvicorn:** 0.27.0
- **Supabase:** 2.5.0
- **OpenAI:** 1.10.0
- **Pydantic:** 2.5.3
- **Pytest:** 7.4.4

### Frontend (Node.js)
- **Node.js:** v25.8.0
- **Next.js:** 16.1.6 (Turbopack)
- **React:** 18.2.0
- **TypeScript:** 5.3.3

## 🗂️ Estrutura de Arquivos Criados

```
Oslo/
├── backend/
│   ├── .venv/                    # Ambiente virtual Python
│   ├── api/                      # Rotas da API
│   ├── core/                     # Configurações core
│   ├── middleware/               # Middlewares
│   ├── models/                   # Modelos Pydantic
│   ├── services/                 # Lógica de negócio
│   ├── utils/                    # Utilitários
│   ├── tests/                    # Testes automatizados
│   ├── main.py                   # Entry point
│   ├── .env                      # Variáveis de ambiente
│   └── requirements.txt          # Dependências Python
│
├── frontend/
│   ├── node_modules/             # Dependências Node
│   ├── app/                      # Páginas Next.js
│   ├── components/               # Componentes React
│   ├── lib/                      # Bibliotecas
│   ├── public/                   # Arquivos estáticos
│   ├── .env.local                # Variáveis de ambiente
│   └── package.json              # Dependências Node
│
├── .kiro/                        # Configurações Kiro
│   └── specs/                    # Especificações
│
├── GUIA_INICIALIZACAO.md         # 📘 Guia completo
├── STATUS_TESTE_LOCALHOST.md     # 📊 Status atual
├── TESTE_RAPIDO.md               # 🚀 Guia rápido
├── INFORMACOES_AMBIENTE.md       # 🔧 Este arquivo
├── start-dev.bat                 # Script Windows
└── start-dev.sh                  # Script Unix/Mac
```

## 🌐 Portas Utilizadas

| Porta | Serviço | URL |
|-------|---------|-----|
| 3000 | Frontend (Next.js) | http://localhost:3000 |
| 3001 | Frontend Gestor (opcional) | http://localhost:3001 |
| 8000 | Backend (FastAPI) | http://localhost:8000 |
| 6379 | Redis (se habilitado) | localhost:6379 |

## 🔐 Variáveis de Ambiente Configuradas

### Backend (.env)

```env
# Supabase
SUPABASE_URL=https://joewhfllvdaygffsosor.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...

# API
API_HOST=0.0.0.0
API_PORT=8000
API_RELOAD=true

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Session
SESSION_SECRET_KEY=sl-academy-2024-secret-key-change-this-in-production

# OpenAI
OPENAI_API_KEY=sk-proj-...
AI_MODEL=gpt-4-turbo-preview

# Environment
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=INFO
```

### Frontend (.env.local)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://joewhfllvdaygffsosor.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# API
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🔌 Conexões Externas

### Supabase
- **URL:** https://joewhfllvdaygffsosor.supabase.co
- **Status:** ✅ Conectado
- **Serviços:** Database, Auth, Storage

### OpenAI
- **API:** https://api.openai.com
- **Modelo:** gpt-4-turbo-preview
- **Status:** ✅ Configurado

## ⚙️ Configurações Especiais

### Backend

1. **Redis Caching:** Desabilitado
   - Motivo: Prevenir travamentos na inicialização
   - Localização: `core/cache.py`

2. **python-magic:** Modo Fallback
   - Motivo: Biblioteca nativa não disponível no Windows
   - Localização: `utils/file_validation.py`
   - Comportamento: Usa extensão e content-type

3. **CORS:** Habilitado
   - Origins permitidas: localhost:3000, localhost:3001
   - Credentials: True
   - Methods: GET, POST, PATCH, DELETE, OPTIONS

4. **Rate Limiting:** Habilitado
   - Login: 5 tentativas / 15 min
   - Tests: 20 tentativas / 1 hora
   - Doubts: 10 tentativas / 1 hora

### Frontend

1. **Turbopack:** Habilitado
   - Compilação mais rápida
   - Hot reload otimizado

2. **Image Optimization:** Configurado
   - ⚠️ Aviso: `images.domains` deprecated
   - Recomendação: Migrar para `images.remotePatterns`

## 📝 Logs e Debugging

### Backend Logs

Localização: Terminal onde o backend foi iniciado

Níveis de log:
- INFO: Informações gerais
- WARNING: Avisos (Redis, python-magic)
- ERROR: Erros de execução
- DEBUG: Informações detalhadas (se DEBUG=true)

### Frontend Logs

Localização: Terminal onde o frontend foi iniciado

Tipos de log:
- Compilação: Erros de TypeScript/ESLint
- Runtime: Erros de execução
- Network: Requisições HTTP

### Browser Console

Abra o DevTools (F12) para ver:
- Erros de JavaScript
- Requisições de rede
- Avisos de React
- Erros de CORS

## 🧪 Testes Disponíveis

### Backend

```bash
cd backend
.venv\Scripts\activate

# Todos os testes
pytest

# Com cobertura
pytest --cov=. --cov-report=html

# Testes específicos
pytest tests/test_auth.py
pytest tests/test_preservation_dual_login.py
pytest tests/test_bug_condition_dual_login.py
```

### Frontend

```bash
cd frontend

# Testes unitários
npm test

# Testes E2E
npm run test:e2e

# Testes E2E com UI
npm run test:e2e:ui
```

## 🔒 Segurança

### Configurações de Segurança Ativas

- ✅ HTTPS-only cookies (desabilitado em dev)
- ✅ HttpOnly cookies
- ✅ SameSite=Lax
- ✅ CORS restrito
- ✅ Rate limiting
- ✅ Input validation (Pydantic)
- ✅ SQL injection protection (Supabase RLS)
- ✅ XSS protection headers
- ✅ CSRF protection

### ⚠️ Avisos de Segurança

1. **SESSION_SECRET_KEY:** Usar chave forte em produção
2. **DEBUG:** Desabilitar em produção
3. **CORS_ORIGINS:** Restringir em produção
4. **SECURE_COOKIES:** Habilitar em produção (HTTPS)

## 📊 Performance

### Backend

- **Startup time:** ~8 segundos
- **Auto-reload:** Habilitado (desenvolvimento)
- **Workers:** 1 (desenvolvimento)
- **Timeout:** 30 segundos

### Frontend

- **Startup time:** ~955ms
- **Hot reload:** Habilitado
- **Turbopack:** Habilitado
- **Build time:** ~30 segundos (produção)

## 🔄 Processos em Background

| ID | Comando | Status | PID |
|----|---------|--------|-----|
| 6 | `npm run dev` | 🟢 Running | - |
| 7 | `.venv\Scripts\python.exe main.py` | 🟢 Running | - |

## 📚 Documentação Adicional

- [Guia de Inicialização](GUIA_INICIALIZACAO.md) - Como iniciar o sistema
- [Status de Teste](STATUS_TESTE_LOCALHOST.md) - Status atual dos testes
- [Teste Rápido](TESTE_RAPIDO.md) - Guia rápido de teste
- [Backend README](backend/README.md) - Documentação do backend
- [Frontend README](frontend/README.md) - Documentação do frontend
- [Configuração de Produção](backend/CONFIGURACAO_PRODUCAO.md) - Deploy

## 🆘 Comandos de Emergência

### Parar Tudo

```bash
# Pressione Ctrl+C nos terminais
# Ou feche os terminais
```

### Reiniciar Backend

```bash
cd backend
.venv\Scripts\activate
python main.py
```

### Reiniciar Frontend

```bash
cd frontend
npm run dev
```

### Limpar Cache

```bash
# Backend
cd backend
rm -rf __pycache__
rm -rf .pytest_cache

# Frontend
cd frontend
rm -rf .next
rm -rf node_modules/.cache
```

### Reinstalar Dependências

```bash
# Backend
cd backend
pip install -r requirements.txt --force-reinstall

# Frontend
cd frontend
rm -rf node_modules
npm install
```

---

**Última atualização:** 18/03/2026 00:10  
**Ambiente:** Development (Localhost)  
**Sistema:** SL Academy Platform 🏥📚
