# 🔧 Operations Runbook - SL Academy Platform

## 📋 Overview

Este runbook contém procedimentos operacionais para manter a plataforma SL Academy funcionando de forma confiável e segura.

---

## 🎯 Responsabilidades da Equipe de Ops

### Diárias
- ✅ Verificar alertas do Sentry
- ✅ Verificar métricas de performance
- ✅ Verificar logs de erro
- ✅ Verificar status dos serviços

### Semanais
- ✅ Revisar métricas de uso
- ✅ Verificar backups
- ✅ Atualizar dependências (se necessário)
- ✅ Revisar logs de auditoria

### Mensais
- ✅ Revisar custos de infraestrutura
- ✅ Testar procedimentos de recovery
- ✅ Revisar e atualizar documentação
- ✅ Conduzir drill de incident response

### Trimestrais
- ✅ Rotacionar secrets
- ✅ Revisar políticas de segurança
- ✅ Conduzir auditoria de segurança
- ✅ Revisar capacidade e scaling

---

## 📊 Monitoramento e Alertas

### Sentry (Error Tracking)

#### Acessar Dashboard
```
URL: https://sentry.io/organizations/sl-academy
```

#### Alertas Configurados

1. **Error Rate > 5%**
   - **Severidade**: High
   - **Ação**: Investigar imediatamente
   - **Canais**: Slack #alerts, Email

2. **API p95 > 1000ms**
   - **Severidade**: Medium
   - **Ação**: Investigar em 1 hora
   - **Canais**: Slack #alerts

3. **Database Connection Errors**
   - **Severidade**: Critical
   - **Ação**: Investigar imediatamente
   - **Canais**: Slack #alerts, Email, PagerDuty

#### Responder a Alertas

1. **Acknowledge** o alerta no Sentry
2. Verificar logs detalhados
3. Identificar causa raiz
4. Aplicar fix ou mitigação
5. Documentar no incident log
6. **Resolve** o alerta

### Métricas de Performance

#### Targets (SLA)

| Métrica | Target | Alerta |
|---------|--------|--------|
| API p50 | < 200ms | > 300ms |
| API p95 | < 500ms | > 1000ms |
| API p99 | < 1000ms | > 2000ms |
| Uptime | > 99.9% | < 99.5% |
| Error Rate | < 1% | > 5% |

#### Verificar Métricas

```bash
# Via Sentry
1. Acesse Sentry Dashboard
2. Vá em Performance
3. Verifique Transaction Summary

# Via Logs
railway logs --tail 100  # ou render logs
```

---

## 🚨 Incident Response

### Severidade de Incidents

| Nível | Descrição | Tempo de Resposta | Exemplo |
|-------|-----------|-------------------|---------|
| **P0 - Critical** | Sistema completamente indisponível | 15 minutos | Database down, API down |
| **P1 - High** | Funcionalidade crítica indisponível | 1 hora | Login não funciona, vídeos não carregam |
| **P2 - Medium** | Funcionalidade não-crítica afetada | 4 horas | Dashboard lento, importação falha |
| **P3 - Low** | Problema menor ou cosmético | 1 dia | Typo, layout issue |

### Procedimento de Incident Response

#### 1. Detecção
- Alerta automático (Sentry, monitoring)
- Relatório de usuário
- Descoberta proativa

#### 2. Triage (5 minutos)
```bash
# Verificar status dos serviços
curl https://api.slacademy.com/health
curl https://slacademy.com

# Verificar Sentry
# Verificar logs
railway logs --tail 100
```

#### 3. Comunicação
```bash
# Slack #incidents
"🚨 INCIDENT: [Título]
Severidade: P[0-3]
Status: Investigating
ETA: [tempo estimado]
Owner: @[seu-nome]"
```

#### 4. Investigação
- Revisar logs
- Revisar métricas
- Reproduzir problema
- Identificar causa raiz

#### 5. Mitigação
- Aplicar fix temporário se necessário
- Rollback se apropriado
- Escalar recursos se necessário

#### 6. Resolução
- Aplicar fix permanente
- Testar em staging
- Deploy para produção
- Verificar resolução

#### 7. Post-Mortem
- Documentar causa raiz
- Documentar timeline
- Identificar ações preventivas
- Atualizar runbook

---

## 🔄 Backup e Recovery

### Backup Automático

#### Verificar Status
```bash
# SSH no servidor de backend
ssh user@backend-server

# Verificar últimos backups
ls -lh /var/backups/sl-academy/

# Verificar cron job
crontab -l | grep backup
```

#### Backup Manual
```bash
cd backend/scripts
python backup_database.py

# Backup é salvo em:
# /var/backups/sl-academy/backup_YYYYMMDD_HHMMSS.sql.gz
```

### Recovery Procedures

#### Restore Completo

```bash
# 1. Listar backups disponíveis
cd backend/scripts
python restore_database.py --list

# 2. Dry run (testar sem aplicar)
python restore_database.py \
  --backup-file=/var/backups/sl-academy/backup_20240314_020000.sql.gz \
  --dry-run

# 3. Restore real
python restore_database.py \
  --backup-file=/var/backups/sl-academy/backup_20240314_020000.sql.gz

# 4. Verificar integridade
python restore_database.py --verify
```

#### Restore Parcial (Tabela Específica)

```bash
# 1. Extrair backup
gunzip -c backup_20240314_020000.sql.gz > backup.sql

# 2. Extrair tabela específica
pg_restore -t profiles backup.sql > profiles.sql

# 3. Aplicar no Supabase
# Copie o conteúdo de profiles.sql
# Cole no Supabase SQL Editor
# Execute
```

### Disaster Recovery

#### Cenário: Database Corrompido

1. **Parar aplicação**
   ```bash
   # Railway/Render: Pause service
   ```

2. **Criar novo projeto Supabase**
   ```bash
   # Supabase Dashboard → New Project
   ```

3. **Restore backup**
   ```bash
   python restore_database.py \
     --backup-file=<último-backup-bom> \
     --target-url=<novo-supabase-url>
   ```

4. **Atualizar variáveis de ambiente**
   ```bash
   # Railway/Render: Update SUPABASE_URL
   ```

5. **Restart aplicação**
   ```bash
   # Railway/Render: Resume service
   ```

6. **Verificar funcionamento**
   ```bash
   curl https://api.slacademy.com/health
   ```

---

## 🔐 Secrets Management

### Rotação de Secrets

#### Quando Rotacionar

- **Trimestralmente**: Todos os secrets
- **Imediatamente**: Se comprometido
- **Após saída de funcionário**: Secrets que ele tinha acesso

#### Procedimento de Rotação

##### 1. Session Secret

```bash
# 1. Gerar novo secret
python -c "import secrets; print(secrets.token_urlsafe(32))"

# 2. Atualizar no AWS Secrets Manager
aws secretsmanager update-secret \
  --secret-id sl-academy/production/session-secret \
  --secret-string "<novo-secret>"

# 3. Atualizar variáveis de ambiente
# Railway/Render: Update SESSION_SECRET_KEY

# 4. Restart serviços
# Backend e Frontend

# 5. Verificar funcionamento
# Fazer login e testar
```

##### 2. Supabase Service Key

```bash
# 1. Gerar nova key no Supabase
# Dashboard → Settings → API → Reset service_role key

# 2. Atualizar no AWS Secrets Manager
aws secretsmanager update-secret \
  --secret-id sl-academy/production/supabase-service-key \
  --secret-string "<nova-key>"

# 3. Atualizar variáveis de ambiente
# Railway/Render: Update SUPABASE_SERVICE_KEY

# 4. Restart backend

# 5. Verificar funcionamento
curl https://api.slacademy.com/health
```

##### 3. OpenAI API Key

```bash
# 1. Gerar nova key no OpenAI
# https://platform.openai.com/api-keys

# 2. Atualizar no AWS Secrets Manager
aws secretsmanager update-secret \
  --secret-id sl-academy/production/openai-key \
  --secret-string "<nova-key>"

# 3. Atualizar variáveis de ambiente
# Railway/Render: Update OPENAI_API_KEY

# 4. Restart backend

# 5. Verificar funcionamento
# Testar geração de recomendações
```

### Script de Rotação Automática

```bash
# Usar script existente
cd backend/scripts
python rotate_secrets.py --environment production

# Verifica e rotaciona secrets que expiram em 7 dias
```

---

## 🔍 Troubleshooting Common Issues

### Issue: High Error Rate

#### Sintomas
- Sentry alerta: Error rate > 5%
- Usuários reportam erros

#### Diagnóstico
```bash
# 1. Verificar logs
railway logs --tail 500 | grep ERROR

# 2. Verificar Sentry
# Identificar erro mais frequente

# 3. Verificar métricas
# Sentry → Performance
```

#### Soluções Comuns

**Database Connection Errors**
```bash
# Verificar conexões no Supabase
# Dashboard → Database → Connection pooling

# Aumentar pool size se necessário
# Ou escalar plano Supabase
```

**Rate Limit Errors**
```bash
# Verificar se rate limits estão muito baixos
# Ajustar em backend/core/config.py
# Ou identificar abuso e bloquear IP
```

**Memory Errors**
```bash
# Verificar uso de memória
# Railway/Render → Metrics

# Aumentar RAM se necessário
# Ou otimizar código
```

---

### Issue: Slow API Response

#### Sintomas
- Sentry alerta: API p95 > 1000ms
- Usuários reportam lentidão

#### Diagnóstico
```bash
# 1. Verificar métricas de performance
# Sentry → Performance → Transactions

# 2. Identificar endpoints lentos

# 3. Verificar queries lentas
# Supabase → Database → Query Performance
```

#### Soluções Comuns

**Slow Queries**
```bash
# 1. Identificar query lenta
# Supabase → Database → Query Performance

# 2. Adicionar índice
# Ver docs/QUERY_OPTIMIZATION.md

# 3. Otimizar query
# Usar JOINs ao invés de múltiplas queries
```

**Cache Miss**
```bash
# 1. Verificar cache hit rate
# Logs do Redis (se configurado)

# 2. Aumentar TTL se apropriado
# backend/core/cache.py

# 3. Warm cache após deploy
cd backend/scripts
python warm_cache.py
```

**High Load**
```bash
# 1. Verificar número de requests
# Sentry → Performance

# 2. Escalar horizontalmente
# Railway/Render → Scaling → Add replica

# 3. Implementar rate limiting mais agressivo
```

---

### Issue: Database Connection Failures

#### Sintomas
- Erro: "Could not connect to database"
- API retorna 500

#### Diagnóstico
```bash
# 1. Verificar status do Supabase
# https://status.supabase.com

# 2. Verificar credenciais
railway variables | grep SUPABASE

# 3. Testar conexão
python -c "from supabase import create_client; client = create_client('URL', 'KEY'); print(client.table('hospitals').select('*').limit(1).execute())"
```

#### Soluções

**Supabase Down**
```bash
# Aguardar recovery do Supabase
# Monitorar https://status.supabase.com
```

**Credenciais Inválidas**
```bash
# 1. Verificar credenciais no Supabase Dashboard
# Settings → API

# 2. Atualizar variáveis de ambiente
railway variables set SUPABASE_URL=<url>
railway variables set SUPABASE_SERVICE_KEY=<key>

# 3. Restart
railway restart
```

**Connection Pool Exhausted**
```bash
# 1. Aumentar pool size no Supabase
# Dashboard → Database → Connection pooling

# 2. Ou escalar plano Supabase
```

---

## 📈 Scaling Procedures

### Horizontal Scaling (Add Replicas)

#### Backend
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

#### Verificar Load Balancing
```bash
# Fazer múltiplas requests
for i in {1..10}; do
  curl -I https://api.slacademy.com/health
done

# Verificar se diferentes instâncias respondem
```

### Vertical Scaling (Increase Resources)

#### Backend
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

#### Database
```bash
# Supabase
1. Dashboard → Settings → Billing
2. Upgrade to Pro plan
3. Mais conexões e performance
```

---

## 🔄 Deployment Procedures

### Deploy Backend

```bash
# 1. Merge PR para main
git checkout main
git pull origin main

# 2. Railway/Render faz deploy automático

# 3. Monitorar logs
railway logs --tail 100

# 4. Verificar health
curl https://api.slacademy.com/health

# 5. Verificar Sentry
# Verificar se não há novos erros
```

### Deploy Frontend

```bash
# 1. Merge PR para main
git checkout main
git pull origin main

# 2. Vercel/Netlify faz deploy automático

# 3. Verificar preview
# Vercel envia link de preview

# 4. Promote to production
# Vercel Dashboard → Promote

# 5. Verificar site
curl https://slacademy.com
```

### Rollback

Ver [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) seção "Rollback Procedures"

---

## 📝 Logging e Auditoria

### Acessar Logs

#### Backend Logs
```bash
# Railway
railway logs --tail 500

# Render
render logs --tail 500

# Filtrar por erro
railway logs --tail 500 | grep ERROR
```

#### Frontend Logs
```bash
# Vercel
vercel logs

# Netlify
netlify logs
```

#### Database Logs
```bash
# Supabase Dashboard → Logs
# Filtrar por tipo: API, Database, Auth
```

### Audit Logs

#### Acessar Audit Logs
```bash
# Supabase SQL Editor
SELECT * FROM audit_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 100;
```

#### Eventos Auditados
- Login attempts (success/failure)
- Authorization failures
- RLS violations
- File uploads
- Indicator imports
- Cross-hospital access attempts

#### Investigar Evento Suspeito
```bash
# Buscar por usuário
SELECT * FROM audit_logs
WHERE user_id = '<uuid>'
ORDER BY created_at DESC;

# Buscar por tipo de evento
SELECT * FROM audit_logs
WHERE event_type = 'authorization_failure'
AND created_at > NOW() - INTERVAL '7 days';

# Buscar tentativas de acesso cross-hospital
SELECT * FROM audit_logs
WHERE event_type = 'rls_violation'
ORDER BY created_at DESC;
```

---

## 📞 Escalation Procedures

### On-Call Rotation

| Dia | Primary | Secondary |
|-----|---------|-----------|
| Segunda | Dev 1 | Dev 2 |
| Terça | Dev 2 | Dev 3 |
| Quarta | Dev 3 | Dev 1 |
| Quinta | Dev 1 | Dev 2 |
| Sexta | Dev 2 | Dev 3 |
| Sábado | Dev 3 | Dev 1 |
| Domingo | Dev 1 | Dev 2 |

### Escalation Path

1. **Primary On-Call** (15 min response)
2. **Secondary On-Call** (30 min response)
3. **Tech Lead** (1 hour response)
4. **CTO** (Critical only)

### Contact Information

```
Primary On-Call: +55 11 9xxxx-xxxx
Secondary On-Call: +55 11 9xxxx-xxxx
Tech Lead: +55 11 9xxxx-xxxx
CTO: +55 11 9xxxx-xxxx

Slack: #incidents
PagerDuty: https://slacademy.pagerduty.com
```

---

## 📚 Additional Resources

- [API Documentation](./API_DOCUMENTATION.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Backup and Recovery](./BACKUP_AND_RECOVERY.md)
- [Security Audit](./SECURITY_AUDIT.md)
- [Performance Testing](./PERFORMANCE_TESTING.md)

---

**Última Atualização:** 14 de março de 2026
**Versão:** 1.0.0
**Maintainer:** DevOps Team
