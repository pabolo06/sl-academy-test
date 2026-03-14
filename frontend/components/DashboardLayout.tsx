/**
 * SL Academy Platform - Dashboard Layout
 * Main layout with sidebar and header
 */

'use client';

import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ProtectedRoute } from './ProtectedRoute';

interface DashboardLayoutProps {
  children: React.ReactNode;
  requiredRole?: 'manager' | 'doctor';
}

export function DashboardLayout({ children, requiredRole }: DashboardLayoutProps) {
  return (
    <ProtectedRoute requiredRole={requiredRole}>
      <div className="flex min-h-screen bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
