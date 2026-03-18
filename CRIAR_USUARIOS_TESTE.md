# 🔑 Como Criar Usuários de Teste

## ❌ Problema Identificado

O erro de login está ocorrendo porque:
1. ✅ O usuário existe no Supabase Auth
2. ❌ Mas NÃO existe um registro na tabela `profiles`
3. ❌ O sistema precisa do perfil para obter `role` e `hospital_id`

**Erro nos logs:**
```
Cannot coerce the result to a single JSON object
The result contains 0 rows
```

---

## ✅ Solução: Criar Usuários Completos

Você precisa criar usuários que tenham:
1. Registro na tabela `auth.users` (autenticação)
2. Registro na tabela `profiles` (dados do perfil)
3. Registro na tabela `hospitals` (hospital associado)

---

## 🚀 Método 1: Executar Script SQL (Recomendado)

### Passo 1: Acessar Supabase Dashboard

1. Acesse https://supabase.com/dashboard
2. Faça login
3. Selecione seu projeto: **joewhfllvdaygffsosor**

### Passo 2: Abrir SQL Editor

1. No menu lateral, clique em **SQL Editor**
2. Clique em **New query**

### Passo 3: Executar o Script

1. Abra o arquivo: `backend/scripts/create_test_users.sql`
2. Copie TODO o conteúdo
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (ou pressione Ctrl+Enter)

### Passo 4: Verificar Resultado

Você deve ver mensagens como:
```
Hospital criado com ID: xxx-xxx-xxx
Usuário médico criado: medico@teste.com (senha: teste123)
Usuário gestor criado: gestor@teste.com (senha: teste123)
```

E uma tabela mostrando os usuários criados.

---

## 🔐 Credenciais de Teste Criadas

### Médico
- **Email:** medico@teste.com
- **Senha:** teste123
- **Role:** medico
- **URL:** http://localhost:3000

### Gestor
- **Email:** gestor@teste.com
- **Senha:** teste123
- **Role:** gestor
- **URL:** http://localhost:3001 (se configurado)

### Hospital
- **Nome:** Hospital Teste
- **CNPJ:** 12.345.678/0001-90

---

## 🧪 Testar o Login

### Via Frontend

1. Acesse http://localhost:3000
2. Digite:
   - Email: `medico@teste.com`
   - Senha: `teste123`
3. Marque "Aceito os Termos"
4. Clique em "Entrar"

### Via API (Swagger)

1. Acesse http://localhost:8000/docs
2. Encontre `POST /api/auth/login/medico`
3. Clique em "Try it out"
4. Cole:
```json
{
  "email": "medico@teste.com",
  "password": "teste123",
  "accept_terms": true
}
```
5. Clique em "Execute"

### Via cURL

```bash
curl -X POST "http://localhost:8000/api/auth/login/medico" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "medico@teste.com",
    "password": "teste123",
    "accept_terms": true
  }'
```

---

## 🔍 Método 2: Criar Manualmente (Alternativo)

Se preferir criar manualmente:

### 1. Criar Hospital

```sql
INSERT INTO hospitals (
    id,
    name,
    cnpj,
    address,
    city,
    state,
    phone,
    email,
    active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'Hospital Teste',
    '12.345.678/0001-90',
    'Rua Teste, 123',
    'São Paulo',
    'SP',
    '(11) 1234-5678',
    'contato@hospitalteste.com.br',
    true,
    now(),
    now()
);
```

### 2. Criar Usuário via Supabase Dashboard

1. Vá em **Authentication** → **Users**
2. Clique em **Add user**
3. Preencha:
   - Email: medico@teste.com
   - Password: teste123
   - Confirm password: teste123
   - Auto Confirm User: ✅ Sim
4. Clique em **Create user**
5. Copie o **User ID** gerado

### 3. Criar Perfil

```sql
-- Substitua USER_ID_AQUI pelo ID copiado
-- Substitua HOSPITAL_ID_AQUI pelo ID do hospital

INSERT INTO profiles (
    id,
    full_name,
    role,
    hospital_id,
    consent_timestamp,
    created_at
) VALUES (
    'USER_ID_AQUI',
    'Médico Teste',
    'doctor',
    'HOSPITAL_ID_AQUI',
    now(),
    now()
);
```

---

## ⚠️ Troubleshooting

### Erro: "User profile not found"

**Causa:** Não existe registro na tabela `profiles`

**Solução:** Execute o script SQL ou crie o perfil manualmente

### Erro: "Invalid login credentials"

**Causa:** Email ou senha incorretos

**Solução:** 
- Verifique se digitou corretamente
- Verifique se o usuário existe no Supabase Auth
- Tente resetar a senha

### Erro: "Access denied for this login domain"

**Causa:** O role do usuário não corresponde ao endpoint

**Solução:**
- Use `/api/auth/login/medico` para role `medico`
- Use `/api/auth/login/gestor` para role `gestor`
- Verifique o role na tabela `profiles`

### Erro: "Cannot coerce the result to a single JSON object"

**Causa:** Query não retornou resultados (perfil não existe)

**Solução:** Crie o perfil usando o script SQL

---

## 📊 Verificar Dados no Supabase

### Ver Hospitais

1. Vá em **Table Editor** → **hospitals**
2. Verifique se existe "Hospital Teste"

### Ver Usuários

1. Vá em **Authentication** → **Users**
2. Verifique se existem os emails de teste

### Ver Perfis

1. Vá em **Table Editor** → **profiles**
2. Verifique se existem perfis com os mesmos IDs dos usuários
3. Verifique se o `role` está correto
4. Verifique se o `hospital_id` está preenchido

---

## 🎯 Próximos Passos

Após criar os usuários:

1. ✅ Testar login no frontend
2. ✅ Verificar se o cookie de sessão é criado
3. ✅ Testar navegação autenticada
4. ✅ Testar logout
5. ✅ Testar separação de domínios (médico vs gestor)

---

## 📝 Notas Importantes

- ⚠️ Estes são usuários de TESTE apenas
- ⚠️ NÃO use em produção
- ⚠️ As senhas são simples para facilitar testes
- ⚠️ Em produção, use senhas fortes e processo de registro adequado

---

**Após executar o script, tente fazer login novamente!** 🚀
