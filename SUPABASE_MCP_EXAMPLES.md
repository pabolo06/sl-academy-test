# Supabase MCP - Exemplos Práticos para Oslo

## Pré-requisito

Instale o Supabase MCP primeiro:

```bash
claude mcp add --scope project --transport http supabase "https://mcp.supabase.com/mcp?project_ref=joewhfllvdaygffsosor"
```

Depois reinicie o LionClaw.

---

## 1. GERENCIAMENTO DE USUÁRIOS

### Listar todos os usuários
```
@supabase query "SELECT email, role, hospital_name, created_at FROM users ORDER BY created_at DESC"
```

### Contar usuários por role
```
@supabase query "SELECT role, COUNT(*) FROM users GROUP BY role"
```

### Criar novo usuário médico
```
@supabase insert "INSERT INTO users (email, role, hospital_id, hospital_name, created_at) VALUES ('novo.medico@hospital.com', 'doctor', 'joewhfllvdaygffsosor', 'Hospital Teste', NOW())"
```

### Alterar role de um usuário
```
@supabase update "UPDATE users SET role = 'manager' WHERE email = 'user@hospital.com'"
```

---

## 2. ANÁLISE DE PROGRESSO DE APRENDIZADO

### Progresso geral dos médicos
```
@supabase query "
SELECT
  u.email,
  COUNT(DISTINCT l.id) as total_lessons,
  COUNT(DISTINCT ta.id) as completed_tests,
  ROUND(100.0 * COUNT(DISTINCT ta.id) / NULLIF(COUNT(DISTINCT l.id), 0), 1) as completion_rate
FROM users u
LEFT JOIN lessons l ON l.deleted_at IS NULL
LEFT JOIN test_attempts ta ON ta.user_id = u.id AND ta.type = 'post'
WHERE u.role = 'doctor'
GROUP BY u.id, u.email
ORDER BY completion_rate DESC
"
```

### Performance em testes (últimos 30 dias)
```
@supabase query "
SELECT
  u.email,
  l.title as lesson,
  ta.type,
  ta.score,
  ta.completed_at
FROM test_attempts ta
JOIN users u ON ta.user_id = u.id
JOIN lessons l ON ta.lesson_id = l.id
WHERE ta.completed_at > NOW() - INTERVAL '30 days'
ORDER BY ta.completed_at DESC
"
```

### Melhoria média por usuário
```
@supabase query "
SELECT
  u.email,
  ROUND(AVG(post_test.score - pre_test.score), 1) as improvement
FROM users u
JOIN test_attempts pre_test ON u.id = pre_test.user_id AND pre_test.type = 'pre'
JOIN test_attempts post_test ON u.id = post_test.user_id AND post_test.type = 'post'
  AND pre_test.lesson_id = post_test.lesson_id
GROUP BY u.id, u.email
ORDER BY improvement DESC
"
```

---

## 3. GERENCIAMENTO DE DÚVIDAS

### Listar dúvidas pendentes
```
@supabase query "
SELECT
  d.id,
  u.email,
  l.title,
  d.text,
  d.created_at
FROM doubts d
JOIN users u ON d.profile_id = u.id
JOIN lessons l ON d.lesson_id = l.id
WHERE d.status = 'pending'
ORDER BY d.created_at ASC
"
```

### Contar dúvidas por status
```
@supabase query "SELECT status, COUNT(*) FROM doubts GROUP BY status"
```

### Marcar dúvidas antigas como respondidas (após 30 dias)
```
@supabase update "UPDATE doubts SET status = 'answered' WHERE status = 'pending' AND created_at < NOW() - INTERVAL '30 days'"
```

---

## 4. GERENCIAMENTO DE INDICADORES

### Importar indicadores em massa
```
@supabase insert "
INSERT INTO indicators (hospital_id, name, category, value, unit, reference_date)
VALUES
  ('joewhfllvdaygffsosor', 'Taxa de Ocupação', 'hospital', 85.5, '%', '2026-03-26'),
  ('joewhfllvdaygffsosor', 'Pacientes Atendidos', 'hospital', 450, 'pacientes', '2026-03-26'),
  ('joewhfllvdaygffsosor', 'Média de Permanência', 'hospital', 4.2, 'dias', '2026-03-26')
"
```

### Listar últimos indicadores por categoria
```
@supabase query "
SELECT
  name,
  category,
  value,
  unit,
  reference_date
FROM indicators
WHERE hospital_id = 'joewhfllvdaygffsosor'
ORDER BY reference_date DESC, category
LIMIT 50
"
```

### Média de indicadores por mês
```
@supabase query "
SELECT
  DATE_TRUNC('month', reference_date) as month,
  category,
  ROUND(AVG(value), 2) as avg_value
FROM indicators
WHERE hospital_id = 'joewhfllvdaygffsosor'
GROUP BY DATE_TRUNC('month', reference_date), category
ORDER BY month DESC
"
```

---

## 5. BACKUP E LIMPEZA DE DADOS

### Exportar todos os usuários para CSV
```
@supabase query "
SELECT
  id, email, role, hospital_id, hospital_name, is_focal_point, created_at
FROM users
ORDER BY created_at DESC
"
```
(Copiar resultado e salvar em CSV)

### Deletar testes antigos (> 1 ano)
```
@supabase delete "DELETE FROM test_attempts WHERE created_at < NOW() - INTERVAL '1 year'"
```

### Deletar registros soft-deleted (> 6 meses)
```
@supabase delete "DELETE FROM lessons WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '6 months'"
```

### Limpar dúvidas sem resposta (> 3 meses)
```
@supabase delete "DELETE FROM doubts WHERE status = 'pending' AND created_at < NOW() - INTERVAL '3 months'"
```

---

## 6. ESTATÍSTICAS E RELATÓRIOS

### Dashboard de plataforma
```
@supabase query "
SELECT
  (SELECT COUNT(*) FROM users WHERE role = 'doctor') as total_doctors,
  (SELECT COUNT(*) FROM users WHERE role = 'manager') as total_managers,
  (SELECT COUNT(*) FROM lessons WHERE deleted_at IS NULL) as total_lessons,
  (SELECT COUNT(*) FROM tracks WHERE deleted_at IS NULL) as total_tracks,
  (SELECT COUNT(*) FROM test_attempts) as total_tests,
  (SELECT COUNT(*) FROM doubts WHERE status = 'pending') as pending_doubts,
  (SELECT COUNT(*) FROM indicators) as total_indicators
"
```

### Usuários por hospital
```
@supabase query "
SELECT
  hospital_id,
  hospital_name,
  COUNT(*) as total_users,
  COUNT(CASE WHEN role = 'doctor' THEN 1 END) as doctors,
  COUNT(CASE WHEN role = 'manager' THEN 1 END) as managers
FROM users
GROUP BY hospital_id, hospital_name
ORDER BY total_users DESC
"
```

### Trilhas mais completadas
```
@supabase query "
SELECT
  t.title,
  COUNT(DISTINCT l.id) as total_lessons,
  COUNT(DISTINCT ta.user_id) as users_who_completed,
  ROUND(100.0 * COUNT(DISTINCT ta.user_id) / (SELECT COUNT(*) FROM users WHERE role = 'doctor'), 1) as completion_rate
FROM tracks t
LEFT JOIN lessons l ON t.id = l.track_id AND l.deleted_at IS NULL
LEFT JOIN test_attempts ta ON l.id = ta.lesson_id AND ta.type = 'post'
WHERE t.deleted_at IS NULL
GROUP BY t.id, t.title
ORDER BY completion_rate DESC
"
```

---

## ⚠️ SEGURANÇA

O Supabase MCP tem acesso **irrestrito** ao banco de dados. Use com cuidado:

✅ **SEGURO:**
- Leitura de dados para análise
- Backup de dados
- Limpeza de dados de teste
- Importação em massa de indicadores

❌ **PERIGOSO:**
- Deletar dados de produção sem backup
- Modificar usuários sem conferir
- Executar queries complexas sem testar

---

## Dicas

1. **Teste em desenvolvimento primeiro**: Antes de executar queries em produção, teste em um ambiente de teste
2. **Use LIMIT**: Adicione LIMIT ao explorar dados grandes
3. **Confirme antes de deletar**: Sempre execute a query SELECT antes de DELETE
4. **Faça backup**: Antes de limpeza em massa, exporte os dados
5. **Documente**: Anote mudanças realizadas para auditoria

---

## Próximos Passos

Após instalar o Supabase MCP, você pode:

1. ✅ Executar queries de análise
2. ✅ Importar dados em massa
3. ✅ Fazer backup de dados
4. ✅ Limpar dados de teste
5. ✅ Gerar relatórios automaticamente

Para integração completa no seu workflow, veja o arquivo:
`backend/utils/supabase_mcp.py`
