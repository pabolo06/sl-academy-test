# 🔧 Guia de Manutenção - SL Academy Platform

## 📋 Visão Geral

Este guia fornece procedimentos de manutenção contínua para manter a plataforma SL Academy funcionando de forma confiável, segura e performática.

---

## 📅 Calendário de Manutenção

### Diário
- [ ] Verificar alertas do Sentry
- [ ] Verificar métricas de performance (p95, error rate)
- [ ] Verificar logs de erro
- [ ] Verificar status dos serviços (uptime)

### Semanal
- [ ] Revisar métricas de uso (usuários ativos, aulas completadas)
- [ ] Verificar backups (último backup bem-sucedido)
- [ ] Revisar logs de auditoria (eventos suspeitos)
- [ ] Atualizar dependências críticas (se houver CVEs)
- [ ] Revisar feedback de usuários

### Mensal
- [ ] Atualizar todas as dependências
- [ ] Revisar custos de infraestrutura
- [ ] Testar procedimentos de recovery
- [ ] Revisar e atualizar documentação
- [ ] Conduzir reunião de retrospectiva

### Trimestral
- [ ] Rotacionar todos os secrets
- [ ] Conduzir auditoria de segurança
- [ ] Revisar políticas de RLS
- [ ] Conduzir drill de incident response
- [ ] Revisar capacidade e planejar scaling
- [ ] Atualizar versões principais (Python, Node.js, etc.)

### Anual
- [ ] Renovar certificados SSL
- [ ] Revisar arquitetura completa
- [ ] Conduzir penetration testing
- [ ] Revisar e atualizar disaster recovery plan
- [ ] Revisar contratos de fornecedores

---

## 🔄 Atualização de Dependências

### Backend (Python)

#### Verificar Atualizações
```bash
cd backend
pip list --outdated
```

#### Atualizar Dependências
```bash
# Atualizar todas (cuidado!)
pip install --upgrade -r requirements.txt

# Ou atualizar uma por vez
pip install --upgrade fastapi
pip install --upgrade pydantic
```

#### Testar Após Atualização
```bash
# Rodar testes
pytest

# Verificar se API inicia
python main.py

# Testar endpoints críticos
curl http://localhost:8000/health
```

#### Atualizar requirements.txt
```bash
pip freeze > requirements.txt
```

### Frontend (Node.js)

#### Verificar Atualizações
```bash
cd frontend
npm outdated
```

#### Atualizar Dependências
```bash
# Atualizar minor/patch versions
npm update

# Atualizar major versions (cuidado!)
npm install next@latest
npm install react@latest
```

#### Testar Após Atualização
```bash
# Rodar testes
npm run test

# Build
npm run build

# Verificar tipos
npm run type-check
```

#### Atualizar package.json
```bash
# Já atualizado automaticamente pelo npm install
```

### Verificar Vulnerabilidades

#### Backend
```bash
cd backend
pip-audit
```

#### Frontend
```bash
cd frontend
npm audit

# Corrigir automaticamente
npm audit fix
```

---

## 🔐 Rotação de Secrets

### Quando Rotacionar

**Imediatamente**:
- Secret foi comprometido
- Funcionário com acesso saiu da empresa
- Suspeita de vazamento

**Regularmente (Trimestral)**:
- Todos os secrets de produção
- Como boa prática de segurança

### Procedimento de Rotação

#### 1. Session Secret

```bash
# 1. Gerar novo secret
python -c "import secrets; print(secrets.token_urlsafe(32))"

# 2. Atualizar no AWS Secrets Manager
aws secretsmanager update-secret \
  --secret-id sl-academy/production/session-secret \
  --secret-string "<novo-secret>"

# 3. Atualizar variáveis de ambiente
# Railway: Dashboard → Variables → SESSION_SECRET_KEY
# Render: Dashboard → Environment → SESSION_SECRET_KEY

# 4. Restart serviços
# Backend e Frontend

# 5. Testar login
# Fazer login e verificar se funciona
```

#### 2. Supabase Service Key

```bash
# 1. Gerar nova key no Supabase
# Dashboard → Settings → API → Reset service_role key

# 2. Atualizar no AWS Secrets Manager
aws secretsmanager update-secret \
  --secret-id sl-academy/production/supabase-service-key \
  --secret-string "<nova-key>"

# 3. Atualizar variáveis de ambiente
# Railway/Render: SUPABASE_SERVICE_KEY

# 4. Restart backend

# 5. Testar API
curl https://api.slacademy.com/health
```

#### 3. OpenAI API Key

```bash
# 1. Gerar nova key no OpenAI
# https://platform.openai.com/api-keys

# 2. Atualizar no AWS Secrets Manager
aws secretsmanager update-secret \
  --secret-id sl-academy/production/openai-key \
  --secret-string "<nova-key>"

# 3. Atualizar variáveis de ambiente
# Railway/Render: OPENAI_API_KEY

# 4. Restart backend

# 5. Testar recomendações de IA
# Fazer login e testar geração de recomendações
```

### Script Automatizado

```bash
cd backend/scripts
python rotate_secrets.py --environment production --dry-run

# Se tudo OK, executar de verdade
python rotate_secrets.py --environment production
```

---

## 📊 Monitoramento de Performance

### Métricas Chave

#### API Performance
- **p50**: < 200ms (target)
- **p95**: < 500ms (target)
- **p99**: < 1000ms (target)
- **Error Rate**: < 1% (target)

#### Frontend Performance
- **Time to Interactive**: < 3s (target)
- **First Contentful Paint**: < 1.5s (target)
- **Largest Contentful Paint**: < 2.5s (target)
- **Cumulative Layout Shift**: < 0.1 (target)

### Verificar Métricas

#### Sentry
```
1. Acesse https://sentry.io
2. Selecione projeto SL Academy
3. Vá em Performance
4. Verifique Transaction Summary
5. Identifique endpoints lentos
```

#### Lighthouse (Frontend)
```bash
# Instalar
npm install -g lighthouse

# Rodar
lighthouse https://slacademy.com --view

# Verificar scores:
# - Performance: > 90
# - Accessibility: > 90
# - Best Practices: > 90
# - SEO: > 90
```

### Otimizar Performance

#### Se API está lenta (p95 > 1000ms)

1. **Identificar endpoint lento**
   - Sentry → Performance → Transactions
   - Ordenar por p95

2. **Analisar query**
   - Supabase → Database → Query Performance
   - Identificar query lenta

3. **Adicionar índice**
   ```sql
   -- Exemplo
   CREATE INDEX idx_test_attempts_profile_lesson 
   ON test_attempts(profile_id, lesson_id);
   ```

4. **Testar melhoria**
   - Rodar query novamente
   - Verificar tempo de execução

#### Se Frontend está lento

1. **Identificar componente lento**
   - React DevTools Profiler
   - Identificar re-renders desnecessários

2. **Otimizar**
   - Usar `React.memo()` para componentes
   - Usar `useMemo()` para cálculos pesados
   - Usar `useCallback()` para funções

3. **Code splitting**
   - Lazy load componentes pesados
   ```typescript
   const HeavyComponent = lazy(() => import('./HeavyComponent'));
   ```

---

## 🔍 Análise de Logs

### Logs de Erro

#### Backend
```bash
# Railway
railway logs --tail 500 | grep ERROR

# Render
render logs --tail 500 | grep ERROR

# Filtrar por tipo
railway logs --tail 500 | grep "DatabaseError"
```

#### Frontend
```bash
# Vercel
vercel logs --follow

# Netlify
netlify logs
```

### Logs de Auditoria

```sql
-- Supabase SQL Editor

-- Eventos das últimas 24 horas
SELECT * FROM audit_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 100;

-- Falhas de autenticação
SELECT * FROM audit_logs
WHERE event_type = 'authentication_failure'
AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- Violações de RLS
SELECT * FROM audit_logs
WHERE event_type = 'rls_violation'
ORDER BY created_at DESC;

-- Tentativas de acesso cross-hospital
SELECT 
  user_id,
  event_type,
  COUNT(*) as attempts
FROM audit_logs
WHERE event_type = 'authorization_failure'
AND created_at > NOW() - INTERVAL '7 days'
GROUP BY user_id, event_type
HAVING COUNT(*) > 10
ORDER BY attempts DESC;
```

---

## 💾 Gestão de Backups

### Verificar Backups

```bash
# SSH no servidor de backend
ssh user@backend-server

# Listar backups
ls -lh /var/backups/sl-academy/

# Verificar último backup
ls -lt /var/backups/sl-academy/ | head -n 2

# Verificar tamanho
du -sh /var/backups/sl-academy/
```

### Testar Restore

**Importante**: Testar restore mensalmente!

```bash
# 1. Criar banco de teste
# Supabase: Criar projeto "sl-academy-restore-test"

# 2. Restore
cd backend/scripts
python restore_database.py \
  --backup-file=/var/backups/sl-academy/backup_latest.sql.gz \
  --target-url=<url-do-banco-teste> \
  --dry-run

# 3. Verificar integridade
python restore_database.py --verify

# 4. Testar aplicação
# Apontar backend para banco de teste
# Fazer login e testar funcionalidades

# 5. Deletar banco de teste
```

### Limpar Backups Antigos

```bash
# Manter últimos 30 dias
find /var/backups/sl-academy/ -name "backup_*.sql.gz" -mtime +30 -delete

# Ou usar script
cd backend/scripts
python cleanup_old_backups.py --days 30
```

---

## 🚨 Resposta a Incidentes

### Procedimento Padrão

1. **Detectar** (0-5 min)
   - Alerta automático ou relatório de usuário
   - Verificar Sentry e logs

2. **Triage** (5-10 min)
   - Determinar severidade (P0-P3)
   - Comunicar no Slack #incidents
   - Atribuir owner

3. **Investigar** (10-30 min)
   - Revisar logs
   - Reproduzir problema
   - Identificar causa raiz

4. **Mitigar** (30-60 min)
   - Aplicar fix temporário
   - Ou fazer rollback
   - Verificar resolução

5. **Resolver** (1-4 horas)
   - Aplicar fix permanente
   - Testar em staging
   - Deploy para produção

6. **Post-Mortem** (24 horas)
   - Documentar causa raiz
   - Identificar ações preventivas
   - Atualizar runbook

### Incidentes Comuns

#### Database Down

**Sintomas**: API retorna 500, erro de conexão

**Ações**:
1. Verificar status do Supabase: https://status.supabase.com
2. Se down: Aguardar recovery
3. Se up: Verificar credenciais e conexões
4. Considerar failover para backup

#### API Lenta

**Sintomas**: p95 > 2000ms, timeouts

**Ações**:
1. Verificar load (número de requests)
2. Identificar endpoint lento (Sentry)
3. Escalar horizontalmente (adicionar réplicas)
4. Ou otimizar query problemática

#### Frontend Não Carrega

**Sintomas**: Página em branco, erro 404

**Ações**:
1. Verificar status do Vercel/Netlify
2. Verificar último deploy
3. Fazer rollback se necessário
4. Verificar logs de build

---

## 📈 Planejamento de Capacidade

### Quando Escalar

**Sinais**:
- API p95 consistentemente > 800ms
- Error rate > 2%
- Database connections > 80% do limite
- CPU usage > 80%
- Memory usage > 80%

### Como Escalar

#### Horizontal (Adicionar Réplicas)

**Backend**:
```bash
# Railway
1. Dashboard → Settings → Scaling
2. Replicas: Aumentar para 2-5
3. Save

# Render
1. Dashboard → Settings
2. Instance Count: Aumentar para 2-5
3. Save
```

**Benefícios**:
- Maior disponibilidade
- Melhor distribuição de load
- Failover automático

#### Vertical (Aumentar Recursos)

**Backend**:
```bash
# Railway
1. Dashboard → Settings → Resources
2. CPU: 2-4 vCPU
3. RAM: 2-4 GB
4. Save

# Render
1. Dashboard → Settings
2. Instance Type: Upgrade
3. Save
```

**Benefícios**:
- Melhor performance por request
- Suporta operações mais pesadas

#### Database

**Supabase**:
```bash
1. Dashboard → Settings → Billing
2. Upgrade to Pro plan
3. Mais conexões e performance
```

---

## 🔒 Auditoria de Segurança

### Checklist Trimestral

#### Acesso
- [ ] Revisar usuários com acesso admin
- [ ] Remover acessos de ex-funcionários
- [ ] Verificar permissões de IAM (AWS)
- [ ] Revisar logs de acesso

#### Secrets
- [ ] Rotacionar todos os secrets
- [ ] Verificar secrets não utilizados
- [ ] Verificar secrets em código (git secrets)
- [ ] Atualizar documentação de secrets

#### Dependências
- [ ] Atualizar todas as dependências
- [ ] Verificar vulnerabilidades (npm audit, pip-audit)
- [ ] Revisar licenças de dependências
- [ ] Remover dependências não utilizadas

#### Infraestrutura
- [ ] Revisar regras de firewall
- [ ] Verificar certificados SSL
- [ ] Revisar políticas de RLS
- [ ] Testar backup e recovery

#### Código
- [ ] Code review de mudanças recentes
- [ ] Verificar hard-coded secrets
- [ ] Revisar logs de auditoria
- [ ] Testar fluxos de autenticação

---

## 📞 Contatos de Emergência

### Equipe
- **On-Call Primary**: +55 11 9xxxx-xxxx
- **On-Call Secondary**: +55 11 9xxxx-xxxx
- **Tech Lead**: +55 11 9xxxx-xxxx
- **CTO**: +55 11 9xxxx-xxxx

### Fornecedores
- **Supabase Support**: support@supabase.com
- **Railway Support**: help@railway.app
- **Vercel Support**: support@vercel.com
- **Sentry Support**: support@sentry.io

### Canais
- **Slack**: #incidents (emergências)
- **Slack**: #sl-academy-ops (operações)
- **Email**: ops@slacademy.com
- **PagerDuty**: https://slacademy.pagerduty.com

---

## 📚 Recursos Adicionais

- [OPERATIONS_RUNBOOK.md](./docs/OPERATIONS_RUNBOOK.md) - Runbook operacional
- [DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md) - Guia de deployment
- [BACKUP_AND_RECOVERY.md](./docs/BACKUP_AND_RECOVERY.md) - Backup e recovery
- [SECURITY_AUDIT.md](./docs/SECURITY_AUDIT.md) - Auditoria de segurança

---

**Última Atualização**: 14 de março de 2026
**Versão**: 1.0.0
**Maintainer**: DevOps Team
