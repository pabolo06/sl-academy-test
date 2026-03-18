# 🚀 Teste Rápido - SL Academy Platform

## ✅ Sistema Iniciado com Sucesso!

### 🌐 URLs Disponíveis

| Serviço | URL | Status |
|---------|-----|--------|
| **Frontend** | http://localhost:3000 | 🟢 Online |
| **Backend API** | http://localhost:8000 | 🟢 Online |
| **API Docs** | http://localhost:8000/docs | 🟢 Online |

---

## 🎯 Como Testar Agora

### 1. Testar o Frontend

Abra seu navegador e acesse:
```
http://localhost:3000
```

Você verá a página de login da plataforma SL Academy.

### 2. Explorar a API

Abra seu navegador e acesse:
```
http://localhost:8000/docs
```

Aqui você pode:
- Ver todos os endpoints disponíveis
- Testar cada endpoint interativamente
- Ver a documentação de cada rota

### 3. Testar Autenticação

#### Via Swagger UI (Recomendado)

1. Acesse http://localhost:8000/docs
2. Encontre o endpoint `POST /api/auth/login/medico`
3. Clique em "Try it out"
4. Insira os dados de teste:
```json
{
  "email": "medico@example.com",
  "password": "senha123"
}
```
5. Clique em "Execute"

#### Via cURL (Terminal)

```bash
curl -X POST "http://localhost:8000/api/auth/login/medico" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "medico@example.com",
    "password": "senha123"
  }'
```

#### Via PowerShell

```powershell
$body = @{
    email = "medico@example.com"
    password = "senha123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/auth/login/medico" `
  -Method Post `
  -Body $body `
  -ContentType "application/json"
```

---

## 📋 Checklist de Teste

### Backend API

- [x] ✅ Servidor iniciado
- [x] ✅ Health check respondendo
- [x] ✅ Root endpoint respondendo
- [ ] 🔄 Criar usuário de teste no Supabase
- [ ] 🔄 Testar login médico
- [ ] 🔄 Testar login gestor
- [ ] 🔄 Testar endpoints protegidos
- [ ] 🔄 Testar CRUD de tracks
- [ ] 🔄 Testar CRUD de lessons
- [ ] 🔄 Testar sistema de dúvidas

### Frontend

- [x] ✅ Servidor iniciado
- [x] ✅ Página carregando
- [ ] 🔄 Testar formulário de login
- [ ] 🔄 Testar navegação
- [ ] 🔄 Testar integração com API
- [ ] 🔄 Testar responsividade
- [ ] 🔄 Testar fluxo completo de usuário

---

## 🔑 Criar Usuários de Teste

Para testar o login, você precisa criar usuários no Supabase:

### Opção 1: Via Supabase Dashboard

1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em "Authentication" → "Users"
4. Clique em "Add user"
5. Preencha os dados:
   - Email: medico@example.com
   - Password: senha123
   - Confirm password: senha123
6. Após criar, vá em "Table Editor" → "profiles"
7. Adicione um registro com:
   - user_id: (ID do usuário criado)
   - role: medico
   - hospital_id: (ID de um hospital)

### Opção 2: Via SQL (Supabase SQL Editor)

```sql
-- Criar usuário médico
INSERT INTO auth.users (
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  'medico@example.com',
  crypt('senha123', gen_salt('bf')),
  now(),
  now(),
  now()
);

-- Criar perfil do médico
INSERT INTO profiles (
  user_id,
  email,
  role,
  hospital_id,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'medico@example.com'),
  'medico@example.com',
  'medico',
  'hospital-uuid-aqui',
  now(),
  now()
);
```

---

## 🧪 Testes Sugeridos

### 1. Fluxo de Login Completo

1. Acesse http://localhost:3000
2. Insira credenciais de teste
3. Verifique se o login funciona
4. Verifique se o cookie de sessão é criado
5. Verifique se o redirecionamento funciona

### 2. Separação de Domínios

1. Faça login como médico
2. Verifique se é redirecionado para área correta
3. Faça logout
4. Faça login como gestor
5. Verifique se é redirecionado para área de gestor

### 3. Proteção de Rotas

1. Tente acessar endpoints protegidos sem autenticação
2. Verifique se retorna 401 Unauthorized
3. Faça login
4. Tente acessar os mesmos endpoints
5. Verifique se retorna os dados

### 4. CORS

1. Abra o console do navegador (F12)
2. Faça requisições do frontend para o backend
3. Verifique se não há erros de CORS

---

## 📊 Monitoramento

### Ver Logs do Backend

Os logs estão sendo exibidos no terminal onde o backend foi iniciado.

Procure por:
- ✅ `INFO: Application startup complete.`
- ⚠️ Avisos sobre Redis ou python-magic
- ❌ Erros de conexão ou autenticação

### Ver Logs do Frontend

Os logs estão sendo exibidos no terminal onde o frontend foi iniciado.

Procure por:
- ✅ `✓ Ready in XXXms`
- ⚠️ Avisos de configuração
- ❌ Erros de compilação ou runtime

---

## 🛑 Parar os Servidores

Quando terminar os testes:

1. Vá até os terminais onde os servidores estão rodando
2. Pressione `Ctrl+C` em cada um
3. Aguarde o shutdown gracioso

Ou use os comandos:
```bash
# Listar processos
# (use a ferramenta de gerenciamento de processos do Kiro)

# Parar processos específicos
# (use o ID do processo)
```

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs nos terminais
2. Consulte [GUIA_INICIALIZACAO.md](GUIA_INICIALIZACAO.md)
3. Consulte [STATUS_TESTE_LOCALHOST.md](STATUS_TESTE_LOCALHOST.md)
4. Verifique a seção de Troubleshooting

---

## 🎉 Próximos Passos

Após os testes básicos:

1. ✅ Implementar funcionalidades faltantes
2. ✅ Adicionar mais testes automatizados
3. ✅ Melhorar a UI/UX
4. ✅ Preparar para deploy em staging
5. ✅ Documentar APIs adicionais

---

**Bons testes! 🚀**

**Sistema:** SL Academy Platform  
**Ambiente:** Development (Localhost)  
**Data:** 18/03/2026
