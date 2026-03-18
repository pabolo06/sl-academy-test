# 📁 Estrutura do Projeto - SL Academy Platform

## 🎯 Visão Geral

Projeto otimizado e organizado com documentação consolidada e arquivos desnecessários removidos.

## 📂 Estrutura de Diretórios

```
sl-academy-platform/
├── 📄 Documentação Principal (Raiz)
│   ├── README.md                      # Documentação principal do projeto
│   ├── INICIO_RAPIDO.md               # Guia rápido (3 passos)
│   ├── COMO_RODAR_NA_WEB.md          # Guia completo passo a passo
│   ├── COMMANDS.md                    # Referência de comandos
│   ├── COMANDOS_PRONTOS.md           # Comandos para copiar/colar
│   ├── LOCALHOST_TESTING_GUIDE.md    # Guia de testes
│   ├── TESTING_CHECKLIST.md          # Checklist de testes
│   ├── SUPABASE_RLS_FIX.md          # Fix importante para RLS
│   └── ESTRUTURA_PROJETO.md          # Este arquivo
│
├── 🚀 Scripts de Inicialização
│   ├── start-backend.ps1             # Inicia backend (Windows)
│   ├── start-backend.sh              # Inicia backend (Linux/macOS)
│   ├── start-frontend.ps1            # Inicia frontend (Windows)
│   └── start-frontend.sh             # Inicia frontend (Linux/macOS)
│
├── 🔧 Backend (Python/FastAPI)
│   ├── api/routes/                   # Rotas da API (11 arquivos)
│   ├── core/                         # Config, database, cache, monitoring
│   ├── models/                       # Modelos Pydantic
│   ├── services/                     # Lógica de negócio
│   ├── middleware/                   # Auth e error handling
│   ├── utils/                        # Utilitários
│   ├── scripts/                      # Scripts de manutenção
│   ├── tests/                        # Testes
│   ├── docs/                         # Docs específicas do backend
│   ├── .env.example                  # Template de configuração
│   ├── .env.development              # Config de desenvolvimento
│   ├── .env.staging                  # Config de staging
│   ├── .env.production               # Config de produção
│   ├── main.py                       # Entry point
│   └── requirements.txt              # Dependências Python
│
├── 🎨 Frontend (Next.js/TypeScript)
│   ├── app/                          # App Router pages
│   │   ├── login/                    # Página de login
│   │   ├── dashboard/                # Dashboard do médico
│   │   ├── tracks/                   # Trilhas
│   │   ├── lessons/                  # Aulas
│   │   ├── doubts/                   # Dúvidas
│   │   ├── manager/                  # Área do gestor
│   │   ├── privacy/                  # Política de privacidade
│   │   └── terms/                    # Termos de serviço
│   ├── components/                   # Componentes React (30+ arquivos)
│   ├── lib/                          # Utilitários e hooks
│   ├── types/                        # TypeScript types
│   ├── public/                       # Assets estáticos
│   ├── .env.example                  # Template de configuração
│   ├── .env.development              # Config de desenvolvimento
│   ├── .env.staging                  # Config de staging
│   ├── .env.production               # Config de produção
│   ├── package.json                  # Dependências Node.js
│   ├── next.config.mjs               # Config do Next.js
│   ├── tailwind.config.ts            # Config do Tailwind
│   └── tsconfig.json                 # Config do TypeScript
│
├── 🗄️ Supabase (Database)
│   └── migrations/                   # Migrações SQL (5 arquivos)
│       ├── 001_initial_schema.sql
│       ├── 002_rls_policies_fixed.sql  ⚠️ Use este (não o 002_rls_policies.sql)
│       ├── 003_triggers.sql
│       ├── 004_seed_data.sql
│       └── 005_performance_indexes.sql
│
├── 📚 Documentação Técnica (docs/)
│   ├── ENVIRONMENT_VARIABLES.md      # Variáveis de ambiente
│   ├── DATABASE_MIGRATIONS.md        # Guia de migrações
│   ├── SECURITY_AUDIT.md            # Auditoria de segurança
│   ├── PERFORMANCE_TESTING.md       # Testes de performance
│   ├── QUERY_OPTIMIZATION.md        # Otimização de queries
│   ├── CACHING_STRATEGY.md          # Estratégia de cache
│   ├── VIDEO_DELIVERY_OPTIMIZATION.md # Otimização de vídeo
│   ├── CDN_CONFIGURATION.md         # Configuração de CDN
│   ├── CI_CD_PIPELINE.md            # Pipeline CI/CD
│   ├── MONITORING_AND_ALERTING.md   # Monitoramento
│   ├── BACKUP_AND_RECOVERY.md       # Backup e recovery
│   ├── SECRETS_MANAGEMENT.md        # Gestão de secrets
│   └── *_QUICKSTART.md              # Guias rápidos
│
├── 🔐 CI/CD (.github/workflows/)
│   ├── ci.yml                        # Pipeline de testes
│   └── security-scan.yml             # Scan de segurança
│
└── 📋 Especificações (.kiro/specs/sl-academy-platform/)
    ├── requirements.md               # Requisitos do projeto
    ├── design.md                     # Design e arquitetura
    ├── tasks.md                      # Tarefas de implementação
    └── .config.kiro                  # Configuração do spec
```

## 📊 Estatísticas do Projeto

### Backend
- **Rotas**: 11 arquivos de rotas
- **Modelos**: 5 arquivos de modelos
- **Serviços**: 3 serviços principais
- **Middleware**: 3 middlewares
- **Utilitários**: 7 utilitários
- **Scripts**: 6 scripts de manutenção
- **Testes**: 7 arquivos de teste

### Frontend
- **Páginas**: 15+ páginas
- **Componentes**: 30+ componentes React
- **Hooks**: 5+ hooks customizados
- **Types**: Tipagem completa TypeScript

### Database
- **Migrações**: 5 arquivos SQL
- **Tabelas**: 8 tabelas principais
- **Policies**: 30+ RLS policies
- **Triggers**: 5 triggers
- **Índices**: 20 índices de performance

### Documentação
- **Guias de Início**: 6 arquivos
- **Docs Técnicas**: 15 arquivos
- **Specs**: 3 documentos principais

## 🗑️ Arquivos Removidos (Otimização)

### Raiz
- ❌ ENV_README.md (consolidado em COMO_RODAR_NA_WEB.md)
- ❌ QUICKSTART.md (duplicado, mantido INICIO_RAPIDO.md)
- ❌ PROJECT_STATUS.md (info em tasks.md)
- ❌ README_TESTING.md (consolidado em LOCALHOST_TESTING_GUIDE.md)
- ❌ QUICK_START.md (duplicado)
- ❌ python_paths.txt (temporário)

### Backend
- ❌ __pycache__/ (cache Python)
- ❌ venv_new/ (ambiente virtual duplicado)

### Docs
- ❌ discovery-notes.md (temporário)
- ❌ implementation-plan.md (info em tasks.md)
- ❌ buildsaas.md (não relevante)
- ❌ PROJECT_REVIEW.md (temporário)
- ❌ TASK_*.md (14 arquivos - info consolidada nos docs principais)

### Backend/docs
- ❌ TASK_27.1_SUMMARY.md (info nos docs principais)
- ❌ TASK_28.1_SUMMARY.md (info nos docs principais)
- ❌ TASK_28.3_SUMMARY.md (info nos docs principais)
- ❌ TASK_28.5_CONSENT_MANAGEMENT.md (duplicado)

**Total removido**: 26 arquivos desnecessários

## 📝 Arquivos de Configuração

### Backend (.env)
```bash
backend/.env.example      # ✅ Template (commitar)
backend/.env.development  # ✅ Dev defaults (commitar)
backend/.env.staging      # ✅ Staging template (commitar)
backend/.env.production   # ✅ Prod template (commitar)
backend/.env              # ❌ Config ativa (NÃO commitar)
```

### Frontend (.env.local)
```bash
frontend/.env.example      # ✅ Template (commitar)
frontend/.env.development  # ✅ Dev defaults (commitar)
frontend/.env.staging      # ✅ Staging template (commitar)
frontend/.env.production   # ✅ Prod template (commitar)
frontend/.env.local        # ❌ Config ativa (NÃO commitar)
```

## 🎯 Guias Recomendados por Situação

### Primeira vez configurando o projeto
→ **INICIO_RAPIDO.md** (3 passos, 15 minutos)

### Precisa de instruções detalhadas
→ **COMO_RODAR_NA_WEB.md** (guia completo passo a passo)

### Precisa de comandos específicos
→ **COMMANDS.md** (referência rápida)
→ **COMANDOS_PRONTOS.md** (copiar e colar)

### Testando funcionalidades
→ **LOCALHOST_TESTING_GUIDE.md** (guia de testes)
→ **TESTING_CHECKLIST.md** (checklist)

### Problemas com RLS no Supabase
→ **SUPABASE_RLS_FIX.md** (solução para erro de permissão)

### Configurando ambientes
→ **docs/ENVIRONMENT_VARIABLES.md** (todas as variáveis)
→ **docs/ENVIRONMENT_SETUP_QUICKSTART.md** (setup rápido)

### Deploy e produção
→ **docs/CI_CD_PIPELINE.md** (pipeline)
→ **docs/SECRETS_MANAGEMENT.md** (secrets)
→ **docs/BACKUP_AND_RECOVERY.md** (backup)

### Performance e otimização
→ **docs/PERFORMANCE_TESTING.md** (testes)
→ **docs/QUERY_OPTIMIZATION.md** (queries)
→ **docs/CACHING_STRATEGY.md** (cache)

## 🔒 Segurança

### Arquivos que NUNCA devem ser commitados
- ❌ `backend/.env`
- ❌ `frontend/.env.local`
- ❌ Qualquer arquivo com credenciais reais
- ❌ `venv/` (ambiente virtual)
- ❌ `node_modules/` (dependências)
- ❌ `__pycache__/` (cache Python)
- ❌ `.next/` (build Next.js)

### Arquivos que DEVEM ser commitados
- ✅ `.env.example` (templates)
- ✅ `.env.development` (defaults de dev)
- ✅ `.env.staging` (template de staging)
- ✅ `.env.production` (template de prod)
- ✅ Todos os arquivos de código
- ✅ Toda a documentação

## 🚀 Próximos Passos

1. Siga o **INICIO_RAPIDO.md** para configurar o projeto
2. Execute os scripts `start-backend.ps1` e `start-frontend.ps1`
3. Acesse http://localhost:3000
4. Consulte **TESTING_CHECKLIST.md** para testar funcionalidades
5. Veja **docs/** para documentação técnica detalhada

## 📞 Suporte

- Problemas de configuração → COMO_RODAR_NA_WEB.md
- Problemas de RLS → SUPABASE_RLS_FIX.md
- Comandos → COMMANDS.md ou COMANDOS_PRONTOS.md
- Testes → LOCALHOST_TESTING_GUIDE.md
- Documentação técnica → docs/

---

**Projeto otimizado e pronto para uso! 🎉**
