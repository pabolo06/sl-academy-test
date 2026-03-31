'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';

function getPageTitle(pathname: string): string {
  const routes: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/tracks': 'Trilhas de Aprendizado',
    '/doubts': 'Minhas Dúvidas',
    '/shifts': 'Meus Plantões',
    '/cdss': 'Suporte Clínico',
    '/manager/dashboard': 'Dashboard Gerencial',
    '/manager/doubts': 'Gerenciar Dúvidas',
    '/manager/tracks': 'Gerenciar Trilhas',
    '/manager/schedule': 'Escala de Plantões',
    '/manager/rostering': 'Rostering IA',
    '/manager/indicators': 'Indicadores',
    '/manager/indicators/import': 'Importar Indicadores',
    '/manager/occupational': 'Saúde Ocupacional',
    '/manager/watcher': 'Monitor de Diretrizes',
    '/manager/users': 'Utilizadores',
  };

  for (const [route, title] of Object.entries(routes)) {
    if (pathname === route || pathname.startsWith(route + '/')) {
      return title;
    }
  }

  if (pathname.startsWith('/lessons/')) return 'Aula';
  if (pathname.includes('/lessons')) return 'Gerenciar Aulas';
  if (pathname.includes('/tracks/')) return 'Detalhes da Trilha';

  return 'SL Academy';
}

interface HeaderProps {
  onMenuOpen?: () => void;
}

export function Header({ onMenuOpen }: HeaderProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-20 bg-[#0d1117]/80 backdrop-blur-md border-b border-white/[0.05] px-4 sm:px-6 py-3">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        {onMenuOpen && (
          <button
            onClick={onMenuOpen}
            className="md:hidden p-1.5 rounded-lg hover:bg-white/[0.07] text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0"
            aria-label="Abrir menu"
          >
            <Menu size={20} />
          </button>
        )}

        {/* Page title */}
        <div className="min-w-0 flex-1">
          <h1 className="text-sm sm:text-base font-semibold text-white truncate">{pageTitle}</h1>
          <p className="text-xs text-slate-500 mt-0.5 truncate">
            {user?.hospital_name || 'SL Academy Platform'}
          </p>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Role badge — hidden on mobile */}
          <span className="hidden sm:inline-flex items-center px-2 sm:px-2.5 py-1 rounded-md text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 whitespace-nowrap">
            {user?.role === 'manager' ? 'Gestor' : 'Médico'}
          </span>

          {/* Email — desktop only */}
          <span className="hidden lg:block text-xs text-slate-400 max-w-[160px] truncate">
            {user?.email}
          </span>

          {/* Logout */}
          <button
            onClick={logout}
            aria-label="Sair da conta"
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/10"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
}
