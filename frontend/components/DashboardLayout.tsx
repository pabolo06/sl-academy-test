/**
 * SL Academy Platform - Dashboard Layout
 * Main layout with sidebar and header
 */

'use client';

import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ProtectedRoute } from './ProtectedRoute';
import AIAssistantButton from './AIAssistantButton';
import MobileDrawer from './MobileDrawer';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
  requiredRole?: 'manager' | 'doctor';
}

export function DashboardLayout({ children, requiredRole }: DashboardLayoutProps) {
  const router = useRouter();
  const { user } = useAuth();

  const getDoctorDrawerItems = () => [
    { icon: '👤', label: 'Meu Perfil', href: '/profile' },
    { icon: '📖', label: 'Minhas Trilhas', href: '/tracks' },
    { icon: '❓', label: 'Minhas Dúvidas', href: '/doubts' },
    { icon: '📊', label: 'Meu Progresso', href: '/progress' },
    { icon: '⚙️', label: 'Configurações', href: '/settings' },
    { icon: '', label: '', divider: true },
    {
      icon: '🚪',
      label: 'Logout',
      onClick: () => {
        localStorage.removeItem('auth_token');
        router.push('/login');
      },
    },
  ];

  const getManagerDrawerItems = () => [
    { icon: '👤', label: 'Meu Perfil', href: '/profile' },
    { icon: '📊', label: 'Dashboard', href: '/manager/dashboard' },
    { icon: '👥', label: 'Minha Equipe', href: '/manager/team' },
    { icon: '📈', label: 'Indicadores', href: '/manager/indicators' },
    { icon: '⚙️', label: 'Configurações', href: '/settings' },
    { icon: '', label: '', divider: true },
    {
      icon: '🚪',
      label: 'Logout',
      onClick: () => {
        localStorage.removeItem('auth_token');
        router.push('/login');
      },
    },
  ];

  const drawerItems =
    user?.role === 'doctor'
      ? getDoctorDrawerItems()
      : getManagerDrawerItems();

  return (
    <ProtectedRoute requiredRole={requiredRole}>
      <div className="flex min-h-screen bg-[#0a0e1a]">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
      <AIAssistantButton />
      <MobileDrawer
        items={drawerItems}
        title={user?.role === 'doctor' ? 'Médico' : 'Gestor'}
        isAuthenticated={!!user}
      />
    </ProtectedRoute>
  );
}
