# 🚀 Getting Started - Para Desenvolvedores

## 👋 Bem-vindo ao Projeto SL Academy!

Este guia vai te ajudar a começar a trabalhar no projeto rapidamente.

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- ✅ **Python 3.9+** - [Download](https://www.python.org/downloads/)
- ✅ **Node.js 18+** - [Download](https://nodejs.org/)
- ✅ **Git** - [Download](https://git-scm.com/)
- ✅ **VS Code** (recomendado) - [Download](https://code.visualstudio.com/)

---

## 🎯 Setup Rápido (15 minutos)

### 1. Clone o Repositório
```bash
git clone <repository-url>
cd sl-academy-platform
```

### 2. Configure o Supabase

1. Crie uma conta em https://supabase.com
2. Crie um novo projeto: "sl-academy-dev"
3. Vá em **SQL Editor** e execute as migrações na ordem:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies_fixed.sql`
   - `supabase/migrations/003_triggers.sql`
   - `supabase/migrations/004_seed_data.sql`
   - `supabase/migrations/005_performance_indexes.sql`

4. Copie suas credenciais:
   - **Project Settings** → **API**
   - Anote: Project URL, anon key, service_role key

### 3. Configure o Backend

```bash
# Windows PowerShell
.\start-backend.ps1

# Linux/macOS
./start-backend.sh
```

O script vai:
1. Criar ambiente virtual Python
2. Instalar dependências
3. Criar arquivo `backend/.env`
4. Parar e pedir para você editar o `.env`

**Edite `backend/.env`**:
```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...
SESSION_SECRET_KEY=<gerar-com-comando-abaixo>
```

**Gerar SESSION_SECRET_KEY**:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Execute novamente**:
```bash
.\start-backend.ps1  # Windows
./start-backend.sh   # Linux/macOS
```

### 4. Configure o Frontend

```bash
# Windows PowerShell (novo terminal)
.\start-frontend.ps1

# Linux/macOS (novo terminal)
./start-frontend.sh
```

O script vai:
1. Instalar dependências do Node.js
2. Criar arquivo `frontend/.env.local`
3. Parar e pedir para você editar o `.env.local`

**Edite `frontend/.env.local`**:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

**Execute novamente**:
```bash
.\start-frontend.ps1  # Windows
./start-frontend.sh   # Linux/macOS
```

### 5. Acesse a Aplicação

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

**Login de teste**:
- Email: `admin@hospital.com`
- Senha: `Admin123!`

---

## 📚 Documentação Essencial

### Para Começar
1. **[README.md](./README.md)** - Visão geral do projeto
2. **[ESTRUTURA_PROJETO.md](./ESTRUTURA_PROJETO.md)** - Estrutura de arquivos
3. **[COMMANDS.md](./COMMANDS.md)** - Comandos úteis

### Para Desenvolvimento
1. **[API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md)** - Documentação da API
2. **[.kiro/specs/sl-academy-platform/design.md](./.kiro/specs/sl-academy-platform/design.md)** - Design e arquitetura
3. **[.kiro/specs/sl-academy-platform/tasks.md](./.kiro/specs/sl-academy-platform/tasks.md)** - Tasks de implementação

### Para Deploy
1. **[DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md)** - Guia de deployment
2. **[OPERATIONS_RUNBOOK.md](./docs/OPERATIONS_RUNBOOK.md)** - Runbook operacional

---

## 🏗️ Estrutura do Projeto

```
sl-academy-platform/
├── backend/              # FastAPI backend
│   ├── api/routes/       # 11 rotas de API
│   ├── core/             # Configuração
│   ├── models/           # Modelos Pydantic
│   ├── services/         # Lógica de negócio
│   ├── middleware/       # Auth e error handling
│   ├── utils/            # Utilitários
│   └── tests/            # Testes
│
├── frontend/             # Next.js frontend
│   ├── app/              # App Router pages
│   ├── components/       # Componentes React
│   ├── lib/              # Utilitários
│   └── types/            # TypeScript types
│
├── supabase/migrations/  # Migrações SQL (5 arquivos)
├── docs/                 # Documentação técnica (20+ arquivos)
└── .kiro/specs/          # Especificações do projeto
```

---

## 🔧 Comandos Úteis

### Backend
```bash
# Ativar ambiente virtual
cd backend
.\venv\Scripts\Activate.ps1  # Windows
source venv/bin/activate      # Linux/macOS

# Rodar servidor
python main.py

# Rodar testes
pytest

# Formatar código
black .

# Lint
flake8 .
```

### Frontend
```bash
cd frontend

# Rodar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Rodar testes
npm run test

# Lint
npm run lint

# Verificar tipos
npm run type-check
```

---

## 🐛 Troubleshooting

### Backend não inicia

**Erro**: `ModuleNotFoundError`
```bash
# Reinstalar dependências
cd backend
pip install -r requirements.txt
```

**Erro**: `Connection to Supabase failed`
```bash
# Verificar credenciais no .env
# Testar conexão
python -c "from supabase import create_client; client = create_client('URL', 'KEY'); print(client.table('hospitals').select('*').limit(1).execute())"
```

### Frontend não inicia

**Erro**: `Module not found`
```bash
# Reinstalar dependências
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**Erro**: `CORS error`
```bash
# Verificar CORS_ORIGINS no backend/.env
# Deve incluir http://localhost:3000
```

### Mais problemas?

Consulte [LOCALHOST_TESTING_GUIDE.md](./LOCALHOST_TESTING_GUIDE.md) seção "Troubleshooting"

---

## 🎯 Workflow de Desenvolvimento

### 1. Criar Branch
```bash
git checkout -b feature/nome-da-feature
```

### 2. Fazer Mudanças
- Edite os arquivos necessários
- Siga os padrões de código existentes
- Adicione testes se necessário

### 3. Testar Localmente
```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm run test
npm run type-check
npm run lint
```

### 4. Commit
```bash
git add .
git commit -m "feat: descrição da mudança"
```

**Formato de commit**:
- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Mudanças na documentação
- `style:` - Formatação de código
- `refactor:` - Refatoração
- `test:` - Adicionar testes
- `chore:` - Manutenção

### 5. Push e Pull Request
```bash
git push origin feature/nome-da-feature
```

Crie Pull Request no GitHub com:
- Descrição clara das mudanças
- Screenshots se aplicável
- Referência a issues relacionadas

---

## 📖 Padrões de Código

### Backend (Python)
- **Formatação**: Black (line length 88)
- **Lint**: Flake8
- **Type hints**: Sempre que possível
- **Docstrings**: Google style
- **Imports**: Ordenados alfabeticamente

### Frontend (TypeScript)
- **Formatação**: Prettier
- **Lint**: ESLint
- **Naming**: camelCase para variáveis, PascalCase para componentes
- **Components**: Functional components com hooks
- **Types**: Sempre tipar props e retornos

---

## 🧪 Testes

### Backend
```bash
cd backend

# Rodar todos os testes
pytest

# Rodar com cobertura
pytest --cov=. --cov-report=html

# Rodar teste específico
pytest tests/test_auth.py
```

### Frontend
```bash
cd frontend

# Rodar testes unitários
npm run test

# Rodar testes E2E
npm run test:e2e

# Rodar com cobertura
npm run test:coverage
```

---

## 🔍 Debug

### Backend
```python
# Adicionar breakpoint
import pdb; pdb.set_trace()

# Ou usar debugger do VS Code
# Configuração em .vscode/launch.json
```

### Frontend
```typescript
// Console log
console.log('Debug:', variable);

// Debugger
debugger;

// React DevTools (extensão do Chrome)
```

---

## 📞 Precisa de Ajuda?

### Documentação
- [README.md](./README.md) - Visão geral
- [docs/](./docs/) - Documentação técnica
- [.kiro/specs/](./.kiro/specs/) - Especificações

### Contato
- **Slack**: #sl-academy-dev
- **Email**: dev@slacademy.com
- **Issues**: GitHub Issues

---

## 🎓 Recursos de Aprendizado

### FastAPI
- [Documentação Oficial](https://fastapi.tiangolo.com/)
- [Tutorial](https://fastapi.tiangolo.com/tutorial/)

### Next.js
- [Documentação Oficial](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)

### Supabase
- [Documentação Oficial](https://supabase.com/docs)
- [RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)

### TypeScript
- [Documentação Oficial](https://www.typescriptlang.org/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

---

## ✅ Checklist do Primeiro Dia

- [ ] Clone o repositório
- [ ] Configure Supabase
- [ ] Configure backend
- [ ] Configure frontend
- [ ] Acesse a aplicação
- [ ] Faça login
- [ ] Explore o código
- [ ] Leia a documentação
- [ ] Faça seu primeiro commit
- [ ] Apresente-se no Slack

---

**Bem-vindo à equipe! 🎉**

Se tiver qualquer dúvida, não hesite em perguntar no Slack #sl-academy-dev
