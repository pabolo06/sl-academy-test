# Guia de Configuração para Produção - Dual Login Domain Separation

## 📋 Visão Geral

Este guia explica como configurar as URLs de frontend para os domínios de login separados (médico e gestor) em produção.

## 🔧 Configuração das URLs de Frontend

### Variáveis de Ambiente Necessárias

Adicione as seguintes variáveis ao seu arquivo `.env` de produção:

```bash
# URLs de Frontend por Domínio
DOCTOR_FRONTEND_URL=https://medico.slacademy.com
MANAGER_FRONTEND_URL=https://gestor.slacademy.com
```

### Valores por Ambiente

#### Desenvolvimento (Local)
```bash
DOCTOR_FRONTEND_URL=http://localhost:3000
MANAGER_FRONTEND_URL=http://localhost:3001
```

#### Staging
```bash
DOCTOR_FRONTEND_URL=https://medico-staging.slacademy.com
MANAGER_FRONTEND_URL=https://gestor-staging.slacademy.com
```

#### Produção
```bash
DOCTOR_FRONTEND_URL=https://medico.slacademy.com
MANAGER_FRONTEND_URL=https://gestor.slacademy.com
```

## 🚀 Como Funciona

### Fluxo de Login por Domínio

1. **Doctor Login** (`POST /api/auth/login/medico`)
   - Aceita apenas usuários com `role = "doctor"`
   - Retorna `redirect_url: "https://medico.slacademy.com"` (ou valor configurado)
   - Retorna 403 se o usuário não for doctor

2. **Manager Login** (`POST /api/auth/login/gestor`)
   - Aceita apenas usuários com `role = "manager"`
   - Retorna `redirect_url: "https://gestor.slacademy.com"` (ou valor configurado)
   - Retorna 403 se o usuário não for manager

3. **Login Original** (`POST /api/auth/login`) - Depreciado
   - Mantido para compatibilidade retroativa
   - Retorna `redirect_url` baseado no role do usuário
   - Recomenda-se migrar para os endpoints específicos

### Exemplo de Resposta

```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "doctor@hospital.com",
    "role": "doctor",
    "hospital_id": "uuid",
    "hospital_name": "Hospital ABC"
  },
  "redirect_url": "https://medico.slacademy.com"
}
```

## 🔒 Segurança

### Validação de Role por Domínio

O sistema agora valida que o role do usuário corresponde ao domínio de login:

- ✅ Doctor em `/login/medico` → Sucesso (200)
- ❌ Manager em `/login/medico` → Negado (403)
- ✅ Manager em `/login/gestor` → Sucesso (200)
- ❌ Doctor em `/login/gestor` → Negado (403)

### Middleware Atualizado

Os novos endpoints foram adicionados às rotas públicas:

```python
PUBLIC_ROUTES = [
    "/",
    "/health",
    "/docs",
    "/openapi.json",
    "/api/auth/login",
    "/api/auth/login/medico",   # NOVO
    "/api/auth/login/gestor",   # NOVO
]
```

## 📝 Atualização do Frontend

### Antes (Endpoint Único)

```typescript
// Frontend antigo - todos usavam o mesmo endpoint
const response = await fetch('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password, accept_terms: true })
});
```

### Depois (Endpoints por Domínio)

```typescript
// Frontend do médico - usa endpoint específico
const response = await fetch('/api/auth/login/medico', {
  method: 'POST',
  body: JSON.stringify({ email, password, accept_terms: true })
});

const data = await response.json();
if (data.success && data.redirect_url) {
  // Redireciona para o domínio correto
  window.location.href = data.redirect_url;
}
```

```typescript
// Frontend do gestor - usa endpoint específico
const response = await fetch('/api/auth/login/gestor', {
  method: 'POST',
  body: JSON.stringify({ email, password, accept_terms: true })
});

const data = await response.json();
if (data.success && data.redirect_url) {
  // Redireciona para o domínio correto
  window.location.href = data.redirect_url;
}
```

## 🧪 Testando a Configuração

### Teste Manual com cURL

#### Teste 1: Doctor Login
```bash
curl -X POST https://api.slacademy.com/api/auth/login/medico \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@hospital.com",
    "password": "senha123",
    "accept_terms": true
  }'
```

**Resposta esperada (sucesso):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": { ... },
  "redirect_url": "https://medico.slacademy.com"
}
```

#### Teste 2: Manager tentando login de doctor (deve falhar)
```bash
curl -X POST https://api.slacademy.com/api/auth/login/medico \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@hospital.com",
    "password": "senha123",
    "accept_terms": true
  }'
```

**Resposta esperada (erro):**
```json
{
  "detail": "Access denied for this login domain"
}
```
Status: 403 Forbidden

### Teste Automatizado

Execute a suíte de testes:

```bash
cd backend
python -m pytest tests/test_bug_condition_dual_login.py tests/test_preservation_dual_login.py -v
```

Todos os 20 testes devem passar.

## 🔄 Migração Gradual

### Fase 1: Deploy do Backend (Atual)
- ✅ Novos endpoints disponíveis
- ✅ Endpoint original mantido
- ✅ Compatibilidade retroativa garantida

### Fase 2: Atualização do Frontend (Próximo Passo)
1. Atualizar frontend do médico para usar `/api/auth/login/medico`
2. Atualizar frontend do gestor para usar `/api/auth/login/gestor`
3. Implementar redirecionamento baseado em `redirect_url`

### Fase 3: Depreciação do Endpoint Original (Futuro)
- Adicionar aviso de depreciação no endpoint `/api/auth/login`
- Monitorar uso do endpoint antigo
- Remover após migração completa (6+ meses)

## 📊 Monitoramento

### Métricas Importantes

Monitore as seguintes métricas após o deploy:

1. **Taxa de sucesso por endpoint**
   - `/api/auth/login/medico` - deve ter ~0% de 403
   - `/api/auth/login/gestor` - deve ter ~0% de 403

2. **Tentativas de acesso cruzado**
   - Manager tentando `/login/medico` - deve retornar 403
   - Doctor tentando `/login/gestor` - deve retornar 403

3. **Uso do endpoint legado**
   - `/api/auth/login` - deve diminuir gradualmente

### Logs de Auditoria

O sistema registra todos os eventos de autenticação:

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "event_type": "auth_success",
  "endpoint": "/api/auth/login/medico",
  "user_id": "uuid",
  "role": "doctor",
  "hospital_id": "uuid",
  "ip_address": "192.168.1.1"
}
```

## ⚠️ Troubleshooting

### Problema: redirect_url está null

**Causa**: Variáveis de ambiente não configuradas

**Solução**:
```bash
# Verifique se as variáveis estão definidas
echo $DOCTOR_FRONTEND_URL
echo $MANAGER_FRONTEND_URL

# Se não estiverem, adicione ao .env
export DOCTOR_FRONTEND_URL=https://medico.slacademy.com
export MANAGER_FRONTEND_URL=https://gestor.slacademy.com

# Reinicie o servidor
```

### Problema: 403 Forbidden em login válido

**Causa**: Role do usuário não corresponde ao domínio

**Solução**:
- Verifique o role do usuário no banco de dados
- Certifique-se de que doctors usam `/login/medico`
- Certifique-se de que managers usam `/login/gestor`

### Problema: CORS error no frontend

**Causa**: URLs de frontend não estão em CORS_ORIGINS

**Solução**:
```bash
# Adicione as URLs ao CORS_ORIGINS
CORS_ORIGINS=https://medico.slacademy.com,https://gestor.slacademy.com
```

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do servidor
2. Execute os testes automatizados
3. Consulte a documentação da API em `/docs`
4. Revise o arquivo `TESTE_RESULTADOS.md` para exemplos

## ✅ Checklist de Deploy

Antes de fazer deploy em produção:

- [ ] Variáveis `DOCTOR_FRONTEND_URL` e `MANAGER_FRONTEND_URL` configuradas
- [ ] Variável `CORS_ORIGINS` inclui ambas as URLs de frontend
- [ ] Testes automatizados passando (20/20)
- [ ] Frontend atualizado para usar novos endpoints
- [ ] Monitoramento configurado
- [ ] Logs de auditoria habilitados
- [ ] Documentação da API atualizada
- [ ] Equipe treinada sobre novos endpoints

---

**Última atualização**: 2024-01-15  
**Versão**: 1.0  
**Status**: Pronto para produção ✅
