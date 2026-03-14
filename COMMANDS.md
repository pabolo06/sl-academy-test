# 🛠️ Comandos Úteis - SL Academy Platform

Referência rápida de comandos para desenvolvimento.

## 🐍 Backend (FastAPI)

### Setup Inicial
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

### Desenvolvimento
```bash
# Iniciar servidor de desenvolvimento
python main.py

# Ou com uvicorn diretamente
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Iniciar em modo debug
uvicorn main:app --reload --log-level debug
```

### Testes
```bash
# Rodar todos os testes
pytest

# Rodar com cobertura
pytest --cov=. --cov-report=html

# Rodar testes específicos
pytest tests/test_auth.py

# Rodar com verbose
pytest -v
```

### Code Quality
```bash
# Formatar código
black .

# Verificar formatação sem modificar
black --check .

# Lint
flake8 .

# Type checking
mypy .
```

### Dependências
```bash
# Adicionar nova dependência
pip install nome-do-pacote
pip freeze > requirements.txt

# Atualizar dependências
pip install --upgrade -r requirements.txt
```

## ⚛️ Frontend (Next.js)

### Setup Inicial
```bash
cd frontend
npm install
cp .env.example .env.local
```

### Desenvolvimento
```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Iniciar em porta específica
npm run dev -- -p 3001

# Iniciar com turbo
npm run dev --turbo
```

### Build e Produção
```bash
# Build para produção
npm run build

# Iniciar servidor de produção
npm start

# Analisar bundle
npm run build -- --analyze
```

### Testes
```bash
# Type checking
npm run type-check

# Lint
npm run lint

# Lint e fix
npm run lint -- --fix
```

### Dependências
```bash
# Adicionar dependência
npm install nome-do-pacote

# Adicionar dependência de desenvolvimento
npm install -D nome-do-pacote

# Atualizar dependências
npm update

# Verificar dependências desatualizadas
npm outdated
```

## 🗄️ Database (Supabase)

### Migrations
```bash
# Aplicar migrations via CLI
cd supabase
supabase db push

# Criar nova migration
supabase migration new nome_da_migration

# Reset database (cuidado!)
supabase db reset
```

### Queries Úteis
```sql
-- Ver todas as tabelas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Ver políticas RLS
SELECT * FROM pg_policies;

-- Ver triggers
SELECT * FROM information_schema.triggers;

-- Contar registros por tabela
SELECT 
  schemaname,
  tablename,
  (SELECT COUNT(*) FROM public.hospitals) as hospitals,
  (SELECT COUNT(*) FROM public.profiles) as profiles,
  (SELECT COUNT(*) FROM public.tracks) as tracks,
  (SELECT COUNT(*) FROM public.lessons) as lessons;

-- Ver usuários
SELECT * FROM auth.users;

-- Ver perfis
SELECT * FROM profiles;
```

## 🔧 Git

### Workflow Básico
```bash
# Verificar status
git status

# Adicionar arquivos
git add .

# Commit
git commit -m "feat: descrição da feature"

# Push
git push origin main

# Pull
git pull origin main
```

### Branches
```bash
# Criar e mudar para nova branch
git checkout -b feature/nome-da-feature

# Listar branches
git branch -a

# Mudar de branch
git checkout main

# Deletar branch local
git branch -d feature/nome-da-feature

# Deletar branch remota
git push origin --delete feature/nome-da-feature
```

### Commits Semânticos
```bash
# Feature
git commit -m "feat: adiciona endpoint de login"

# Fix
git commit -m "fix: corrige validação de email"

# Docs
git commit -m "docs: atualiza README com instruções"

# Style
git commit -m "style: formata código com black"

# Refactor
git commit -m "refactor: reorganiza estrutura de pastas"

# Test
git commit -m "test: adiciona testes para autenticação"

# Chore
git commit -m "chore: atualiza dependências"
```

## 🐳 Docker (Futuro)

### Build e Run
```bash
# Build backend
docker build -t sl-academy-backend ./backend

# Build frontend
docker build -t sl-academy-frontend ./frontend

# Run backend
docker run -p 8000:8000 sl-academy-backend

# Run frontend
docker run -p 3000:3000 sl-academy-frontend

# Docker Compose (quando implementado)
docker-compose up
docker-compose down
docker-compose logs -f
```

## 📊 Monitoramento

### Logs
```bash
# Backend logs
tail -f logs/backend.log

# Frontend logs (development)
# Logs aparecem no terminal onde npm run dev está rodando

# Supabase logs
# Acessar via dashboard do Supabase
```

### Performance
```bash
# Backend - verificar endpoints lentos
# Acessar http://localhost:8000/docs e testar endpoints

# Frontend - Lighthouse
# Abrir DevTools > Lighthouse > Generate Report

# Frontend - Bundle analyzer
npm run build -- --analyze
```

## 🧪 Testing

### Backend
```bash
# Rodar testes unitários
pytest tests/unit/

# Rodar testes de integração
pytest tests/integration/

# Rodar testes com marcadores
pytest -m "auth"

# Rodar testes em paralelo
pytest -n auto
```

### Frontend
```bash
# Rodar testes (quando implementados)
npm test

# Rodar testes em watch mode
npm test -- --watch

# Rodar testes com cobertura
npm test -- --coverage
```

### E2E (Playwright - quando implementado)
```bash
# Instalar Playwright
npx playwright install

# Rodar testes E2E
npx playwright test

# Rodar em modo UI
npx playwright test --ui

# Rodar teste específico
npx playwright test tests/e2e/login.spec.ts
```

## 🔍 Debug

### Backend
```bash
# Iniciar com debugger
python -m pdb main.py

# Ou usar VS Code debugger
# Criar .vscode/launch.json e usar F5
```

### Frontend
```bash
# Debug no browser
# Abrir DevTools (F12) e usar breakpoints

# Debug no VS Code
# Usar extensão "Debugger for Chrome"
```

## 📦 Deploy (Futuro)

### Vercel (Frontend)
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy para produção
vercel --prod
```

### Railway/Render (Backend)
```bash
# Seguir instruções específicas da plataforma
# Configurar variáveis de ambiente
# Conectar repositório Git
```

## 🔐 Segurança

### Verificar Vulnerabilidades
```bash
# Backend
pip-audit

# Frontend
npm audit

# Fix vulnerabilidades automáticas
npm audit fix
```

### Gerar Secrets
```bash
# Gerar chave de 32 caracteres para SESSION_SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Ou
openssl rand -base64 32
```

## 📝 Documentação

### Gerar Docs da API
```bash
# Backend - já disponível em /docs
# Acessar http://localhost:8000/docs

# Exportar OpenAPI schema
curl http://localhost:8000/openapi.json > openapi.json
```

### Gerar Docs do Frontend
```bash
# TypeDoc (quando implementado)
npx typedoc --out docs src/
```

## 🎯 Tasks do Projeto

### Ver Tasks
```bash
# Ver arquivo de tasks
cat .kiro/specs/sl-academy-platform/tasks.md

# Ver status do projeto
cat PROJECT_STATUS.md
```

### Marcar Task como Completa
```bash
# Editar .kiro/specs/sl-academy-platform/tasks.md
# Mudar [ ] para [x] na task completada
```

## 💡 Dicas Úteis

### Limpar Cache
```bash
# Backend
find . -type d -name __pycache__ -exec rm -r {} +
find . -type f -name "*.pyc" -delete

# Frontend
rm -rf .next
rm -rf node_modules
npm install
```

### Resetar Ambiente
```bash
# Backend
deactivate  # Desativar venv
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend
rm -rf node_modules package-lock.json
npm install
```

### Verificar Portas em Uso
```bash
# Windows
netstat -ano | findstr :8000
netstat -ano | findstr :3000

# macOS/Linux
lsof -i :8000
lsof -i :3000

# Matar processo
# Windows: taskkill /PID <PID> /F
# macOS/Linux: kill -9 <PID>
```

---

**💡 Dica:** Salve este arquivo nos seus favoritos para referência rápida!
