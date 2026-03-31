/**
 * SL Academy Platform - Dashboard Layout
 * Main layout with sidebar and header
 */

'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ProtectedRoute } from './ProtectedRoute';
import AIAssistantButton from './AIAssistantButton';
import MobileDrawer from './MobileDrawer';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  LayoutDashboard, BookOpen, Calendar, HelpCircle, Stethoscope,
  Settings, MessageSquare, ArrowLeftRight, BarChart2, Activity,
  Rss, Users, LogOut,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  requiredRole?: 'manager' | 'doctor';
}

export function DashboardLayout({ children, requiredRole }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const doctorItems = [
    { icon: <LayoutDashboard size={18} />, label: 'Dashboard',        href: '/dashboard' },
    { icon: <BookOpen size={18} />,        label: 'Trilhas',           href: '/tracks' },
    { icon: <Calendar size={18} />,        label: 'Meus Plantões',     href: '/shifts' },
    { icon: <HelpCircle size={18} />,      label: 'Minhas Dúvidas',    href: '/doubts' },
    { icon: <Stethoscope size={18} />,     label: 'Suporte Clínico',   href: '/cdss' },
    { divider: true },
    { icon: <LogOut size={18} />,          label: 'Sair',              onClick: logout },
  ];

  const managerItems = [
    { icon: <LayoutDashboard size={18} />, label: 'Dashboard',             href: '/manager/dashboard' },
    { icon: <Settings size={18} />,        label: 'Gerenciar Trilhas',      href: '/manager/tracks' },
    { icon: <MessageSquare size={18} />,   label: 'Gerenciar Dúvidas',      href: '/manager/doubts' },
    { icon: <Calendar size={18} />,        label: 'Escala de Plantões',     href: '/manager/schedule' },
    { icon: <ArrowLeftRight size={18} />,  label: 'Rostering IA',           href: '/manager/rostering' },
    { icon: <BarChart2 size={18} />,       label: 'Indicadores',            href: '/manager/indicators' },
    { icon: <Activity size={18} />,        label: 'Saúde Ocupacional',      href: '/manager/occupational' },
    { icon: <Rss size={18} />,             label: 'Monitor de Diretrizes',  href: '/manager/watcher' },
    { icon: <Users size={18} />,           label: 'Utilizadores',           href: '/manager/users' },
    { divider: true },
    { icon: <LogOut size={18} />,          label: 'Sair',                   onClick: logout },
  ];

  const drawerItems = user?.role === 'doctor' ? doctorItems : managerItems;
  const drawerTitle = user?.role === 'doctor' ? 'Área do Médico' : 'Painel Gerencial';

  return (
    <ProtectedRoute requiredRole={requiredRole}>
      <div className="flex min-h-screen bg-[#0a0e1a]">
        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden md:flex md:flex-shrink-0">
          <Sidebar />
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header onMenuOpen={() => setMobileMenuOpen(true)} />
          <main className="flex-1 overflow-auto p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>

      {/* AI Assistant Button */}
      <AIAssistantButton />

      {/* Mobile Navigation Drawer */}
      <MobileDrawer
        items={drawerItems}
        title={drawerTitle}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </ProtectedRoute>
  );
}
