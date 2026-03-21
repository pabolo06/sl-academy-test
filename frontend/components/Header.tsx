'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { usePathname } from 'next/navigation';

function getPageTitle(pathname: string): string {
  const routes: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/tracks': 'Trilhas de Aprendizado',
    '/doubts': 'Minhas Dúvidas',
    '/manager/dashboard': 'Dashboard Gerencial',
    '/manager/doubts': 'Gerenciar Dúvidas',
    '/manager/tracks': 'Gerenciar Trilhas',
    '/manager/indicators': 'Indicadores',
    '/manager/indicators/import': 'Importar Indicadores',
    '/manager/users': 'Usuários',
  };

  for (const [route, title] of Object.entries(routes)) {
    if (pathname === route || pathname.startsWith(route + '/')) {
      return title;
    }
  }

  if (pathname.includes('/lessons')) return 'Gerenciar Aulas';
  if (pathname.includes('/tracks/')) return 'Detalhes da Trilha';
  if (pathname.includes('/lessons/')) return 'Aula';

  return 'SL Academy';
}

export function Header() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-20 bg-[#0d1117]/80 backdrop-blur-md border-b border-white/[0.05] px-6 py-3.5">
      <div className="flex items-center justify-between">
        {/* Page title */}
        <div>
          <h1 className="text-base font-semibold text-white">{pageTitle}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {user?.hospital_name || 'SL Academy Platform'}
          </p>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Role badge */}
          <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
            {user?.role === 'manager' ? 'Gestor' : 'Médico'}
          </span>

          {/* User email */}
          <span className="hidden md:block text-xs text-slate-400 max-w-[160px] truncate">
            {user?.email}
          </span>

          {/* Logout */}
          <button
            onClick={logout}
            aria-label="Sair da conta"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
}
