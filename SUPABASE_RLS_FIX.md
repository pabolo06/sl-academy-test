# Fix para Erro de RLS no Supabase

## 🐛 Problema

Ao executar o arquivo `002_rls_policies.sql`, você recebe o erro:

```
ERROR: 42501: permission denied for schema auth
```

## 🔍 Causa

O erro ocorre porque o SQL estava tentando criar funções no schema `auth`:

```sql
CREATE OR REPLACE FUNCTION auth.user_hospital_id() ...
CREATE OR REPLACE FUNCTION auth.user_role() ...
CREATE OR REPLACE FUNCTION auth.is_manager() ...
```

O schema `auth` é um schema protegido do Supabase que não permite criação de funções customizadas por questões de segurança.

## ✅ Solução

Usar o schema `public` em vez do schema `auth`:

```sql
CREATE OR REPLACE FUNCTION public.user_hospital_id() ...
CREATE OR REPLACE FUNCTION public.user_role() ...
CREATE OR REPLACE FUNCTION public.is_manager() ...
```

E atualizar todas as referências nas policies:

```sql
-- Antes
USING (id = auth.user_hospital_id() ...)

-- Depois
USING (id = public.user_hospital_id() ...)
```

## 📝 Arquivo Corrigido

Criei um novo arquivo: `supabase/migrations/002_rls_policies_fixed.sql`

Este arquivo contém todas as correções necessárias.

## 🚀 Como Aplicar a Correção

### Opção 1: Usar o Arquivo Corrigido (Recomendado)

1. **Delete o arquivo antigo** (opcional):
   ```bash
   # Não é necessário deletar, apenas não execute o antigo
   ```

2. **Execute o arquivo corrigido** no SQL Editor do Supabase:
   - Abra o Supabase Dashboard
   - Vá em **SQL Editor**
   - Clique em **New Query**
   - Copie e cole o conteúdo de `002_rls_policies_fixed.sql`
   - Clique em **Run**

### Opção 2: Substituir o Arquivo Original

```bash
# Backup do arquivo original
mv supabase/migrations/002_rls_policies.sql supabase/migrations/002_rls_policies.sql.backup

# Renomear o arquivo corrigido
mv supabase/migrations/002_rls_policies_fixed.sql supabase/migrations/002_rls_policies.sql
```

## 🔄 Se Já Executou o Arquivo com Erro

Se você já tentou executar o arquivo original e recebeu erros, você pode:

1. **Limpar as policies existentes** (se houver):
   ```sql
   -- Dropar policies existentes (se criadas parcialmente)
   DROP POLICY IF EXISTS hospitals_select_policy ON hospitals;
   DROP POLICY IF EXISTS profiles_select_policy ON profiles;
   -- ... etc
   ```

2. **Executar o arquivo corrigido**

## ✅ Verificação

Após executar o arquivo corrigido, verifique se as funções foram criadas:

```sql
-- Verificar funções criadas
SELECT routine_name, routine_schema
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('user_hospital_id', 'user_role', 'is_manager');
```

Deve retornar 3 linhas:

```
routine_name       | routine_schema
-------------------+---------------
user_hospital_id   | public
user_role          | public
is_manager         | public
```

Verificar policies criadas:

```sql
-- Verificar policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

Deve retornar várias policies para cada tabela.

## 📚 Mudanças Realizadas

### Funções Helper

| Antes | Depois |
|-------|--------|
| `auth.user_hospital_id()` | `public.user_hospital_id()` |
| `auth.user_role()` | `public.user_role()` |
| `auth.is_manager()` | `public.is_manager()` |

### Referências nas Policies

Todas as 30+ referências às funções foram atualizadas de `auth.*` para `public.*`.

## 🎯 Próximos Passos

Após aplicar a correção:

1. ✅ Execute o arquivo corrigido no Supabase
2. ✅ Verifique se as funções foram criadas
3. ✅ Verifique se as policies foram criadas
4. ✅ Continue com a migração `003_triggers.sql`
5. ✅ Continue com a migração `004_seed_data.sql`
6. ✅ Continue com a migração `005_performance_indexes.sql`

## 💡 Dica

Para evitar problemas futuros, sempre use o schema `public` para funções customizadas no Supabase, a menos que você tenha permissões especiais de superusuário.

## 🆘 Ainda com Problemas?

Se ainda encontrar erros:

1. Verifique se você está usando o **SQL Editor** do Supabase Dashboard
2. Verifique se você tem permissões de **Owner** no projeto
3. Tente executar as funções uma por uma para identificar qual está falhando
4. Consulte os logs do Supabase: **Logs > Postgres Logs**
