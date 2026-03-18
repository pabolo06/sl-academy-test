-- ============================================================================
-- Script para Corrigir Políticas RLS da Tabela Questions
-- ============================================================================
-- Este script remove referências à coluna deleted_at que não existe em questions
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================================================

-- 1. Verificar políticas RLS existentes na tabela questions
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'questions';

-- 2. Verificar se a coluna deleted_at existe na tabela questions
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'questions' 
ORDER BY ordinal_position;

-- 3. Se houver políticas que referenciam deleted_at, elas precisam ser recriadas
-- Primeiro, vamos desabilitar RLS temporariamente para diagnóstico
-- (NÃO FAÇA ISSO EM PRODUÇÃO sem backup!)

-- Comentário: Se você encontrar políticas com "deleted_at IS NULL" ou similar,
-- elas precisam ser removidas e recriadas sem essa condição.

-- Exemplo de como remover uma política problemática:
-- DROP POLICY IF EXISTS "policy_name" ON questions;

-- Exemplo de como criar uma política correta (sem deleted_at):
-- CREATE POLICY "questions_select_policy" ON questions
--     FOR SELECT
--     USING (
--         lesson_id IN (
--             SELECT l.id FROM lessons l
--             JOIN tracks t ON l.track_id = t.id
--             WHERE t.hospital_id = auth.uid()::uuid
--         )
--     );

-- ============================================================================
-- DIAGNÓSTICO: Execute as queries acima primeiro para ver o estado atual
-- ============================================================================

-- 4. Verificar views que possam referenciar deleted_at
SELECT 
    table_schema,
    table_name,
    view_definition
FROM information_schema.views
WHERE view_definition LIKE '%questions%'
  AND view_definition LIKE '%deleted_at%';

-- 5. Verificar triggers que possam referenciar deleted_at
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'questions';

-- ============================================================================
-- SOLUÇÃO TEMPORÁRIA: Se você não conseguir identificar a política problemática,
-- pode desabilitar RLS temporariamente (APENAS PARA DESENVOLVIMENTO!)
-- ============================================================================

-- ATENÇÃO: Isso remove a segurança! Use apenas para testes locais!
-- ALTER TABLE questions DISABLE ROW LEVEL SECURITY;

-- Para reabilitar depois:
-- ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================

/*
O erro "Could not find the 'deleted_at' column of 'questions' in the schema cache"
geralmente indica que:

1. Uma política RLS está tentando filtrar por deleted_at
2. Uma view está tentando acessar deleted_at
3. Um trigger está tentando usar deleted_at

A tabela questions NÃO deve ter deleted_at porque:
- Questions são dados de configuração, não dados de usuário
- Elas devem ser permanentemente deletadas ou mantidas
- Soft delete não faz sentido para questões de teste

Se você precisar de soft delete para questions, adicione a coluna:

ALTER TABLE questions ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

Mas isso não é recomendado. É melhor corrigir as políticas RLS.
*/
