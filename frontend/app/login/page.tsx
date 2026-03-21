'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'Você deve aceitar os termos de uso',
  }),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'Você deve aceitar os termos de uso',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
});

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Login state
  const [loginData, setLoginData] = useState({ email: '', password: '', acceptTerms: false });
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});

  // Register state
  const [regData, setRegData] = useState({ name: '', email: '', password: '', confirmPassword: '', acceptTerms: false });
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});

  const role = searchParams.get('role') || 'doctor';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    setLoginErrors({});

    const result = loginSchema.safeParse(loginData);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach((err) => { if (err.path[0]) errs[err.path[0] as string] = err.message; });
      setLoginErrors(errs);
      return;
    }

    setIsLoading(true);
    try {
      const { supabase, isSupabaseConfigured } = await import('@/lib/supabase');
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: loginData.email,
          password: loginData.password,
        });
        if (error) {
          setApiError(error.message === 'Invalid login credentials' ? 'Email ou senha incorretos' : error.message);
          return;
        }
        // Redirect based on role in profile
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
        if (profile?.role === 'manager') {
          router.push('/manager/dashboard');
        } else {
          router.push('/dashboard');
        }
        return;
      }
      setApiError('Supabase não configurado.');
    } catch {
      setApiError('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    setSuccessMsg('');
    setRegErrors({});

    const result = registerSchema.safeParse(regData);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach((err) => { if (err.path[0]) errs[err.path[0] as string] = err.message; });
      setRegErrors(errs);
      return;
    }

    setIsLoading(true);
    try {
      const { supabase, isSupabaseConfigured } = await import('@/lib/supabase');
      if (!isSupabaseConfigured()) { setApiError('Supabase não configurado.'); return; }

      const { error } = await supabase.auth.signUp({
        email: regData.email,
        password: regData.password,
        options: {
          data: { full_name: regData.name, role },
        },
      });

      if (error) {
        setApiError(error.message);
        return;
      }

      setSuccessMsg('Cadastro realizado! Verifique seu email para confirmar a conta.');
      setRegData({ name: '', email: '', password: '', confirmPassword: '', acceptTerms: false });
    } catch {
      setApiError('Erro ao cadastrar. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">SL Academy Platform</h1>
          <p className="mt-2 text-sm text-gray-400">
            {role === 'manager' ? 'Área do Gestor' : 'Área do Médico'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-800 rounded-lg p-1">
          <button
            type="button"
            onClick={() => { setTab('login'); setApiError(''); setSuccessMsg(''); }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === 'login'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setApiError(''); setSuccessMsg(''); }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === 'register'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Cadastrar
          </button>
        </div>

        {/* Alerts */}
        {apiError && (
          <div className="rounded-md bg-red-900/50 border border-red-700 p-4">
            <p className="text-sm text-red-200">{apiError}</p>
          </div>
        )}
        {successMsg && (
          <div className="rounded-md bg-green-900/50 border border-green-700 p-4">
            <p className="text-sm text-green-200">{successMsg}</p>
          </div>
        )}

        {/* Login Form */}
        {tab === 'login' && (
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-gray-300">Email</label>
              <input
                type="email"
                required
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="seu@email.com"
              />
              {loginErrors.email && <p className="mt-1 text-xs text-red-400">{loginErrors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Senha</label>
              <input
                type="password"
                required
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
              />
              {loginErrors.password && <p className="mt-1 text-xs text-red-400">{loginErrors.password}</p>}
            </div>

            <div className="flex items-start gap-3">
              <input
                id="loginTerms"
                type="checkbox"
                checked={loginData.acceptTerms}
                onChange={(e) => setLoginData({ ...loginData, acceptTerms: e.target.checked })}
                className="mt-0.5 h-4 w-4 bg-gray-800 border-gray-700 rounded text-blue-600"
              />
              <label htmlFor="loginTerms" className="text-sm text-gray-300">
                Eu aceito os{' '}
                <a href="/terms" target="_blank" className="text-blue-400 hover:text-blue-300 underline">Termos de Serviço</a>
                {' '}e a{' '}
                <a href="/privacy" target="_blank" className="text-blue-400 hover:text-blue-300 underline">Política de Privacidade</a>
              </label>
            </div>
            {loginErrors.acceptTerms && <p className="text-xs text-red-400">{loginErrors.acceptTerms}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        )}

        {/* Register Form */}
        {tab === 'register' && (
          <form className="space-y-4" onSubmit={handleRegister}>
            <div>
              <label className="block text-sm font-medium text-gray-300">Nome completo</label>
              <input
                type="text"
                required
                value={regData.name}
                onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Dr. João Silva"
              />
              {regErrors.name && <p className="mt-1 text-xs text-red-400">{regErrors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Email</label>
              <input
                type="email"
                required
                value={regData.email}
                onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="seu@email.com"
              />
              {regErrors.email && <p className="mt-1 text-xs text-red-400">{regErrors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Senha</label>
              <input
                type="password"
                required
                value={regData.password}
                onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Mínimo 8 caracteres"
              />
              {regErrors.password && <p className="mt-1 text-xs text-red-400">{regErrors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Confirmar senha</label>
              <input
                type="password"
                required
                value={regData.confirmPassword}
                onChange={(e) => setRegData({ ...regData, confirmPassword: e.target.value })}
                className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
              />
              {regErrors.confirmPassword && <p className="mt-1 text-xs text-red-400">{regErrors.confirmPassword}</p>}
            </div>

            <div className="flex items-start gap-3">
              <input
                id="regTerms"
                type="checkbox"
                checked={regData.acceptTerms}
                onChange={(e) => setRegData({ ...regData, acceptTerms: e.target.checked })}
                className="mt-0.5 h-4 w-4 bg-gray-800 border-gray-700 rounded text-blue-600"
              />
              <label htmlFor="regTerms" className="text-sm text-gray-300">
                Eu aceito os{' '}
                <a href="/terms" target="_blank" className="text-blue-400 hover:text-blue-300 underline">Termos de Serviço</a>
                {' '}e a{' '}
                <a href="/privacy" target="_blank" className="text-blue-400 hover:text-blue-300 underline">Política de Privacidade</a>
              </label>
            </div>
            {regErrors.acceptTerms && <p className="text-xs text-red-400">{regErrors.acceptTerms}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors"
            >
              {isLoading ? 'Cadastrando...' : 'Criar conta'}
            </button>
          </form>
        )}

        {/* Role switch link */}
        <p className="text-center text-xs text-gray-500">
          {role === 'manager' ? (
            <a href="/login?role=doctor" className="text-gray-400 hover:text-white transition-colors">
              Acessar como Médico →
            </a>
          ) : (
            <a href="/login?role=manager" className="text-gray-400 hover:text-white transition-colors">
              Acessar como Gestor →
            </a>
          )}
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-900"><div className="text-white">Carregando...</div></div>}>
      <LoginPageContent />
    </Suspense>
  );
}
