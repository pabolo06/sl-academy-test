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

const registerSchema = z
  .object({
    name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'Você deve aceitar os termos de uso',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Senhas não coincidem',
    path: ['confirmPassword'],
  });

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">{msg}</p>;
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loginData, setLoginData] = useState({ email: '', password: '', acceptTerms: false });
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});

  const [regData, setRegData] = useState({ name: '', email: '', password: '', confirmPassword: '', acceptTerms: false });
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});

  const role = searchParams.get('role') || 'doctor';
  const isManager = role === 'manager';

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
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
        router.push(profile?.role === 'manager' ? '/manager/dashboard' : '/dashboard');
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
        options: { data: { full_name: regData.name, role } },
      });

      if (error) { setApiError(error.message); return; }
      setSuccessMsg('Cadastro realizado! Verifique seu email para confirmar a conta.');
      setRegData({ name: '', email: '', password: '', confirmPassword: '', acceptTerms: false });
    } catch {
      setApiError('Erro ao cadastrar. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0a0e1a]">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 relative overflow-hidden">
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />

        <div className="relative">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center mb-8">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <h2 className="text-3xl font-bold text-white leading-tight">
            SL Academy<br />Platform
          </h2>
          <p className="text-blue-200 mt-3 text-sm leading-relaxed max-w-xs">
            Educação médica corporativa com trilhas de aprendizado, avaliações e indicadores hospitalares.
          </p>
        </div>

        <div className="relative space-y-4">
          {[
            'Trilhas de conteúdo personalizadas por hospital',
            'Avaliações pré e pós-aula com relatórios',
            'Indicadores e métricas em tempo real',
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              </div>
              <p className="text-blue-100 text-sm">{feature}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-white font-bold text-xl">S</span>
            </div>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">
              {isManager ? 'Acesso do Gestor' : 'Acesso do Médico'}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {tab === 'login' ? 'Entre na sua conta para continuar' : 'Crie sua conta para começar'}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex bg-white/5 rounded-lg p-1 mb-6 border border-white/[0.06]">
            <button
              type="button"
              onClick={() => { setTab('login'); setApiError(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                tab === 'login'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => { setTab('register'); setApiError(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                tab === 'register'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cadastrar
            </button>
          </div>

          {/* Alerts */}
          {apiError && (
            <div className="mb-4 flex items-start gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-lg">
              <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <p className="text-xs text-red-400">{apiError}</p>
            </div>
          )}
          {successMsg && (
            <div className="mb-4 flex items-start gap-2.5 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <svg className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-emerald-400">{successMsg}</p>
            </div>
          )}

          {/* Login Form */}
          {tab === 'login' && (
            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <label className="form-label" htmlFor="login-email">Email</label>
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  className="form-input"
                  placeholder="seu@email.com"
                />
                <FieldError msg={loginErrors.email} />
              </div>

              <div>
                <label className="form-label" htmlFor="login-password">Senha</label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className="form-input pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
                <FieldError msg={loginErrors.password} />
              </div>

              <div className="flex items-start gap-2.5">
                <input
                  id="loginTerms"
                  type="checkbox"
                  checked={loginData.acceptTerms}
                  onChange={(e) => setLoginData({ ...loginData, acceptTerms: e.target.checked })}
                  className="mt-0.5 h-4 w-4 rounded border-white/10 bg-white/5 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                />
                <label htmlFor="loginTerms" className="text-xs text-slate-400 leading-relaxed cursor-pointer">
                  Eu aceito os{' '}
                  <a href="/terms" target="_blank" className="text-blue-400 hover:text-blue-300 underline">Termos de Serviço</a>
                  {' '}e a{' '}
                  <a href="/privacy" target="_blank" className="text-blue-400 hover:text-blue-300 underline">Política de Privacidade</a>
                </label>
              </div>
              <FieldError msg={loginErrors.acceptTerms} />

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Entrando...
                  </>
                ) : 'Entrar'}
              </button>
            </form>
          )}

          {/* Register Form */}
          {tab === 'register' && (
            <form className="space-y-4" onSubmit={handleRegister}>
              <div>
                <label className="form-label" htmlFor="reg-name">Nome completo</label>
                <input
                  id="reg-name"
                  type="text"
                  required
                  autoComplete="name"
                  value={regData.name}
                  onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                  className="form-input"
                  placeholder="Dr. João Silva"
                />
                <FieldError msg={regErrors.name} />
              </div>

              <div>
                <label className="form-label" htmlFor="reg-email">Email</label>
                <input
                  id="reg-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={regData.email}
                  onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                  className="form-input"
                  placeholder="seu@email.com"
                />
                <FieldError msg={regErrors.email} />
              </div>

              <div>
                <label className="form-label" htmlFor="reg-password">Senha</label>
                <div className="relative">
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={regData.password}
                    onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                    className="form-input pr-10"
                    placeholder="Mínimo 8 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
                <FieldError msg={regErrors.password} />
              </div>

              <div>
                <label className="form-label" htmlFor="reg-confirm">Confirmar senha</label>
                <div className="relative">
                  <input
                    id="reg-confirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={regData.confirmPassword}
                    onChange={(e) => setRegData({ ...regData, confirmPassword: e.target.value })}
                    className="form-input pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <EyeIcon open={showConfirmPassword} />
                  </button>
                </div>
                <FieldError msg={regErrors.confirmPassword} />
              </div>

              <div className="flex items-start gap-2.5">
                <input
                  id="regTerms"
                  type="checkbox"
                  checked={regData.acceptTerms}
                  onChange={(e) => setRegData({ ...regData, acceptTerms: e.target.checked })}
                  className="mt-0.5 h-4 w-4 rounded border-white/10 bg-white/5 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                />
                <label htmlFor="regTerms" className="text-xs text-slate-400 leading-relaxed cursor-pointer">
                  Eu aceito os{' '}
                  <a href="/terms" target="_blank" className="text-blue-400 hover:text-blue-300 underline">Termos de Serviço</a>
                  {' '}e a{' '}
                  <a href="/privacy" target="_blank" className="text-blue-400 hover:text-blue-300 underline">Política de Privacidade</a>
                </label>
              </div>
              <FieldError msg={regErrors.acceptTerms} />

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Cadastrando...
                  </>
                ) : 'Criar conta'}
              </button>
            </form>
          )}

          {/* Role switch */}
          <p className="mt-6 text-center text-xs text-slate-500">
            {isManager ? (
              <a href="/login?role=doctor" className="text-slate-400 hover:text-blue-400 transition-colors">
                Acessar como Médico →
              </a>
            ) : (
              <a href="/login?role=manager" className="text-slate-400 hover:text-blue-400 transition-colors">
                Acessar como Gestor →
              </a>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0a0e1a]">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
