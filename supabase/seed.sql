-- ============================================================================
-- SL Academy Platform - Seed Script
-- Cria o primeiro hospital e configura o usuário manager inicial
--
-- INSTRUÇÕES:
-- 1. Primeiro crie o usuário no Supabase Dashboard:
--    Authentication → Users → Add User
--    Email: (seu email de admin)
--    Password: (senha segura)
--    Marque "Auto Confirm User"
--
-- 2. Copie o UUID do usuário criado e substitua <MANAGER_USER_UUID> abaixo
--
-- 3. Execute este script no SQL Editor do Supabase
-- ============================================================================

-- Passo 1: Criar o hospital
INSERT INTO public.hospitals (id, name)
VALUES (
    gen_random_uuid(),
    'Hospital Piloto'
)
RETURNING id, name;

-- ⚠️ Copie o ID retornado acima e substitua <HOSPITAL_UUID> abaixo

-- Passo 2: Vincular o manager ao hospital
-- Substitua os dois UUIDs antes de executar:
--   <MANAGER_USER_UUID> = UUID do usuário criado no Auth
--   <HOSPITAL_UUID>     = UUID do hospital criado no passo 1

/*
UPDATE public.profiles
SET
    role = 'manager',
    hospital_id = '<HOSPITAL_UUID>',
    full_name = 'Administrador'
WHERE id = '<MANAGER_USER_UUID>';
*/

-- ============================================================================
-- Script auxiliar: verificar se o trigger criou o profile automaticamente
-- Execute após criar o usuário no dashboard para confirmar
-- ============================================================================

/*
SELECT
    p.id,
    p.full_name,
    p.role,
    p.hospital_id,
    h.name as hospital_name
FROM public.profiles p
LEFT JOIN public.hospitals h ON h.id = p.hospital_id
WHERE p.id = '<MANAGER_USER_UUID>';
*/

-- ============================================================================
-- Script auxiliar: criar um médico de teste
-- ============================================================================

/*
-- Primeiro crie o usuário no dashboard (Authentication → Users)
-- Depois execute:

UPDATE public.profiles
SET
    role = 'doctor',
    hospital_id = '<HOSPITAL_UUID>',
    full_name = 'Dr. Médico Teste'
WHERE id = '<DOCTOR_USER_UUID>';
*/
