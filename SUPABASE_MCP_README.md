# Supabase MCP Integration - SL Academy Oslo

## 🚀 Quick Start

### 1. Instalar o Supabase MCP

```bash
claude mcp add --scope project --transport http supabase "https://mcp.supabase.com/mcp?project_ref=joewhfllvdaygffsosor"
```

### 2. Reiniciar o LionClaw

Feche e abra o LionClaw novamente.

### 3. Usar no LionClaw

```
@supabase query "SELECT COUNT(*) FROM users"
```

---

## 📚 Documentação

### Arquivos de Referência

1. **`SUPABASE_MCP_SETUP.md`** - Guia de instalação e conceitos
2. **`SUPABASE_MCP_EXAMPLES.md`** - 30+ exemplos práticos
3. **`backend/utils/supabase_mcp.py`** - Queries pré-definidas e templates

### Casos de Uso

#### 🔍 Análise e Relatórios
```
@supabase query "SELECT role, COUNT(*) FROM users GROUP BY role"
```

#### 📊 Progresso de Aprendizado
```
@supabase query "SELECT email, COUNT(*) as completed_tests FROM test_attempts ta JOIN users u ON ta.user_id = u.id GROUP BY u.email"
```

#### 💾 Backup de Dados
```
@supabase query "SELECT * FROM users WHERE role = 'doctor' LIMIT 100"
```

#### 🧹 Limpeza de Dados
```
@supabase delete "DELETE FROM test_attempts WHERE created_at < NOW() - INTERVAL '1 year'"
```

#### 📈 Importação de Dados
```
@supabase insert "INSERT INTO indicators (...) VALUES (...)"
```

---

## 🔐 Segurança

⚠️ O Supabase MCP tem acesso **TOTAL** ao banco de dados.

### Boas Práticas

✅ **SEMPRE:**
- Faça backup antes de deletar em massa
- Teste queries em pequenos conjuntos primeiro
- Verifique dados antes de atualizar
- Documente mudanças realizadas

❌ **NUNCA:**
- Execute deletes sem verificar dados primeiro
- Modifique users em produção sem conferir
- Ignore avisos de segurança

---

## 📖 Exemplos Rápidos

### Estatísticas da Plataforma
```
@supabase query "
SELECT
  (SELECT COUNT(*) FROM users WHERE role = 'doctor') as doctors,
  (SELECT COUNT(*) FROM users WHERE role = 'manager') as managers,
  (SELECT COUNT(*) FROM lessons WHERE deleted_at IS NULL) as lessons,
  (SELECT COUNT(*) FROM test_attempts) as tests
"
```

### Dúvidas Pendentes
```
@supabase query "SELECT id, email, text FROM doubts d JOIN users u ON d.profile_id = u.id WHERE status = 'pending'"
```

### Criar Novo Usuário
```
@supabase insert "INSERT INTO users (email, role, hospital_id) VALUES ('novo@hospital.com', 'doctor', 'joewhfllvdaygffsosor')"
```

### Progresso por Usuário
```
@supabase query "
SELECT email, COUNT(*) as completed
FROM test_attempts ta
JOIN users u ON ta.user_id = u.id
WHERE type = 'post'
GROUP BY u.email
ORDER BY completed DESC
"
```

---

## 🛠️ Estrutura do Projeto

```
Oslo/
├── SUPABASE_MCP_SETUP.md          # Guia de instalação
├── SUPABASE_MCP_EXAMPLES.md       # 30+ exemplos de uso
├── SUPABASE_MCP_README.md         # Este arquivo
├── backend/
│   └── utils/
│       └── supabase_mcp.py        # Queries pré-definidas
└── .lionclaw/
    └── SUPABASE_MCP_SETUP.md      # Documentação local
```

---

## 📋 Checklist de Integração

- [ ] Executar comando `claude mcp add` acima
- [ ] Reiniciar LionClaw
- [ ] Testar: `@supabase query "SELECT 1"`
- [ ] Ler: `SUPABASE_MCP_EXAMPLES.md`
- [ ] Usar: `backend/utils/supabase_mcp.py` para queries

---

## 🎯 Próximos Passos

### Imediatos
1. Instalar MCP
2. Testar conexão
3. Explorar dados existentes

### Curto Prazo
1. Criar backups de dados críticos
2. Limpeza de dados de teste
3. Importação de indicadores em massa

### Longo Prazo
1. Automatização de relatórios com MCP
2. Scripts de sincronização
3. Auditorias e compliance

---

## 📞 Suporte

Para problemas com o Supabase MCP:

1. Verifique `SUPABASE_MCP_EXAMPLES.md`
2. Teste queries simples primeiro
3. Verifique credenciais do Supabase
4. Consulte docs: https://supabase.com

---

## 📝 Notas

- Project Ref: `joewhfllvdaygffsosor`
- Database: PostgreSQL 14+
- Acesso: Service Role (acesso total)
- Transporte: HTTP (seguro via SSL)

---

**Última atualização:** 2026-03-26
**Status:** ✅ Pronto para instalar
