-- ============================================================================
-- Script para criar usuários de teste no Supabase
-- Execute este script no SQL Editor do Supabase Dashboard
-- ============================================================================

-- IMPORTANTE: Este script deve ser executado no Supabase SQL Editor
-- Acesse: https://supabase.com/dashboard → Seu Projeto → SQL Editor

-- ============================================================================
-- 1. Criar Hospital de Teste
-- ============================================================================

-- Verificar se o hospital já existe
DO $$
DECLARE
    hospital_uuid UUID;
BEGIN
    -- Tentar encontrar hospital existente
    SELECT id INTO hospital_uuid FROM hospitals WHERE name = 'Hospital Teste' LIMIT 1;
    
    -- Se não existir, criar
    IF hospital_uuid IS NULL THEN
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
        )
        RETURNING id INTO hospital_uuid;
        
        RAISE NOTICE 'Hospital criado com ID: %', hospital_uuid;
    ELSE
        RAISE NOTICE 'Hospital já existe com ID: %', hospital_uuid;
    END IF;
END $$;

-- ============================================================================
-- 2. Criar Usuário Médico de Teste
-- ============================================================================

DO $$
DECLARE
    hospital_uuid UUID;
    user_uuid UUID;
    user_exists BOOLEAN;
BEGIN
    -- Pegar ID do hospital
    SELECT id INTO hospital_uuid FROM hospitals WHERE name = 'Hospital Teste' LIMIT 1;
    
    -- Verificar se usuário já existe
    SELECT EXISTS(
        SELECT 1 FROM auth.users WHERE email = 'medico@teste.com'
    ) INTO user_exists;
    
    IF NOT user_exists THEN
        -- Criar usuário no auth.users
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            recovery_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'medico@teste.com',
            crypt('teste123', gen_salt('bf')),
            now(),
            now(),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{}',
            now(),
            now(),
            '',
            '',
            '',
            ''
        )
        RETURNING id INTO user_uuid;
        
        -- Criar perfil do médico
        INSERT INTO profiles (
            id,
            full_name,
            role,
            hospital_id,
            consent_timestamp,
            created_at
        ) VALUES (
            user_uuid,
            'Médico Teste',
            'doctor',
            hospital_uuid,
            now(),
            now()
        );
        
        RAISE NOTICE 'Usuário médico criado: medico@teste.com (senha: teste123)';
        RAISE NOTICE 'User ID: %', user_uuid;
    ELSE
        RAISE NOTICE 'Usuário médico já existe: medico@teste.com';
    END IF;
END $$;

-- ============================================================================
-- 3. Criar Usuário Gestor de Teste
-- ============================================================================

DO $$
DECLARE
    hospital_uuid UUID;
    user_uuid UUID;
    user_exists BOOLEAN;
BEGIN
    -- Pegar ID do hospital
    SELECT id INTO hospital_uuid FROM hospitals WHERE name = 'Hospital Teste' LIMIT 1;
    
    -- Verificar se usuário já existe
    SELECT EXISTS(
        SELECT 1 FROM auth.users WHERE email = 'gestor@teste.com'
    ) INTO user_exists;
    
    IF NOT user_exists THEN
        -- Criar usuário no auth.users
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            recovery_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'gestor@teste.com',
            crypt('teste123', gen_salt('bf')),
            now(),
            now(),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{}',
            now(),
            now(),
            '',
            '',
            '',
            ''
        )
        RETURNING id INTO user_uuid;
        
        -- Criar perfil do gestor
        INSERT INTO profiles (
            id,
            full_name,
            role,
            hospital_id,
            consent_timestamp,
            created_at
        ) VALUES (
            user_uuid,
            'Gestor Teste',
            'manager',
            hospital_uuid,
            now(),
            now()
        );
        
        RAISE NOTICE 'Usuário gestor criado: gestor@teste.com (senha: teste123)';
        RAISE NOTICE 'User ID: %', user_uuid;
    ELSE
        RAISE NOTICE 'Usuário gestor já existe: gestor@teste.com';
    END IF;
END $$;

-- ============================================================================
-- 4. Verificar Usuários Criados
-- ============================================================================

SELECT 
    u.id,
    u.email,
    p.role,
    h.name as hospital_name,
    u.email_confirmed_at,
    p.consent_timestamp,
    u.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN hospitals h ON p.hospital_id = h.id
WHERE u.email IN ('medico@teste.com', 'gestor@teste.com')
ORDER BY u.email;

-- ============================================================================
-- CREDENCIAIS DE TESTE
-- ============================================================================

/*
MÉDICO:
  Email: medico@teste.com
  Senha: teste123
  Role: medico
  
GESTOR:
  Email: gestor@teste.com
  Senha: teste123
  Role: gestor
  
HOSPITAL:
  Nome: Hospital Teste
  CNPJ: 12.345.678/0001-90
*/
