# Guia de Inicialização - SL Academy Platform

## ✅ Pré-requisitos Instalados

- ✅ Python 3.11.8
- ✅ Node.js v25.8.0
- ✅ Dependências do Backend instaladas
- ✅ Dependências do Frontend instaladas

## 🚀 Como Iniciar o Sistema

### Opção 1: Inicialização Automática (Recomendado)

Execute o script de inicialização:

**Windows (PowerShell/CMD):**
```bash
start-dev.bat
```

**Windows (Git Bash) / Linux / Mac:**
```bash
bash start-dev.sh
```

### Opção 2: Inicialização Manual

Você precisará de **2 terminais** abertos simultaneamente:

#### Terminal 1 - Backend API

```bash
cd backend
.venv\Scripts\activate          # Windows CMD
# ou: .venv\Scripts\Activate.ps1  # Windows PowerShell
# ou: source .venv/Scripts/activate  # Windows Git Bash
# ou: source .venv/bin/activate  # Linux/Mac

python main.py
```

O backend estará rodando em: **http://localhost:8000**

#### Terminal 2 - Frontend

```bash
cd frontend
npm run dev
```

O frontend estará rodando em: **http://localhost:3000**

## 🌐 URLs de Acesso

Após iniciar ambos os servidores:

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Frontend (Médico)** | http://localhost:3000 | Interface para médicos |
| **Frontend (Gestor)** | http://localhost:3001 | Interface para gestores (se configurado) |
| **Backend API** | http://localhost:8000 | API REST |
| **API Docs (Swagger)** | http://localhost:8000/docs | Documentação interativa da API |
| **API Docs (ReDoc)** | http://localhost:8000/redoc | Documentação alternativa |
| **Health Check** | http://localhost:8000/health | Status do backend |

## 🔐 Configuração de Ambiente

### Backend (.env)

O arquivo `backend/.env` já está configurado com:
- ✅ Supabase URL e Keys
- ✅ Configurações de API
- ✅ CORS habilitado para localhost:3000 e localhost:3001
- ✅ OpenAI API Key
- ✅ Session Secret Key

### Frontend (.env.local)

O arquivo `frontend/.env.local` já está configurado com:
- ✅ Supabase URL e Anon Key
- ✅ API URL apontando para http://localhost:8000

## 🧪 Testando o Sistema

### 1. Verificar Backend

Abra o navegador e acesse:
```
http://localhost:8000/health
```

Você deve ver:
```json
{
  "status": "healthy",
  "environment": "development",
  "version": "1.0.0"
}
```

### 2. Verificar API Docs

Acesse a documentação interativa:
```
http://localhost:8000/docs
```

Aqui você pode testar todos os endpoints da API.

### 3. Verificar Frontend

Acesse:
```
http://localhost:3000
```

Você deve ver a página de login da plataforma.

## 🔍 Endpoints Principais para Teste

### Autenticação

**Login (Médico):**
```
POST http://localhost:8000/api/auth/login/medico
Content-Type: application/json

{
  "email": "medico@example.com",
  "password": "senha123"
}
```

**Login (Gestor):**
```
POST http://localhost:8000/api/auth/login/gestor
Content-Type: application/json

{
  "email": "gestor@example.com",
  "password": "senha123"
}
```

### Health Check
```
GET http://localhost:8000/health
```

### Listar Tracks (requer autenticação)
```
GET http://localhost:8000/api/tracks
Cookie: session=<session_cookie>
```

## 🛠️ Comandos Úteis

### Backend

```bash
# Ativar ambiente virtual
cd backend
.venv\Scripts\activate  # Windows

# Rodar testes
pytest

# Rodar testes com cobertura
pytest --cov=. --cov-report=html

# Formatar código
black .

# Verificar linting
flake8 .

# Type checking
mypy .
```

### Frontend

```bash
cd frontend

# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar produção
npm start

# Testes unitários
npm test

# Testes E2E
npm run test:e2e

# Linting
npm run lint

# Type checking
npm run type-check
```

## ⚠️ Troubleshooting

### Backend não inicia

1. Verifique se o ambiente virtual está ativado
2. Verifique se todas as dependências estão instaladas: `pip list`
3. Verifique o arquivo `.env` no diretório backend
4. Verifique se a porta 8000 não está em uso

### Frontend não inicia

1. Verifique se as dependências estão instaladas: `npm list`
2. Verifique o arquivo `.env.local` no diretório frontend
3. Verifique se a porta 3000 não está em uso
4. Tente limpar o cache: `rm -rf .next` e `npm run dev`

### Erro de CORS

Verifique se o backend está configurado para aceitar requisições do frontend:
- Backend `.env`: `CORS_ORIGINS=http://localhost:3000,http://localhost:3001`

### Erro de Conexão com Supabase

Verifique se as credenciais do Supabase estão corretas em ambos os arquivos `.env`:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY` (apenas backend)

## 📝 Próximos Passos

1. ✅ Ambiente configurado
2. ✅ Servidores iniciados
3. 🔄 Testar login com usuários de teste
4. 🔄 Explorar a documentação da API
5. 🔄 Testar funcionalidades principais
6. 🔄 Verificar logs de erro (se houver)

## 🎯 Funcionalidades Implementadas

- ✅ Sistema de autenticação dual (médico/gestor)
- ✅ Separação de domínios por role
- ✅ Gestão de sessões com cookies seguros
- ✅ CORS configurado
- ✅ Rate limiting
- ✅ Validação de dados
- ✅ Documentação automática da API
- ✅ Testes automatizados

## 📚 Documentação Adicional

- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)
- [Configuração de Produção](backend/CONFIGURACAO_PRODUCAO.md)
- [Especificações](. kiro/specs/)

---

**Desenvolvido para SL Academy Platform** 🏥📚
