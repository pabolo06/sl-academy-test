'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Stethoscope, BarChart3, MessageSquare, Menu, FileText, Lock, LogIn } from 'lucide-react';
import MobileDrawer from '@/components/MobileDrawer';

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const drawerItems = [
    { icon: <LogIn size={18} />,   label: 'Entrar como Médico',  href: '/login?role=doctor' },
    { icon: <LogIn size={18} />,   label: 'Entrar como Gestor',  href: '/login?role=manager' },
    { divider: true },
    { icon: <FileText size={18} />, label: 'Termos de Uso',      href: '/terms' },
    { icon: <Lock size={18} />,     label: 'Privacidade',        href: '/privacy' },
  ];

  const features = [
    {
      icon: <Stethoscope size={28} />,
      title: 'Trilhas Médicas',
      description: 'Aprenda com conteúdo estruturado, vídeos e avaliações',
      color: 'from-blue-500 to-blue-600',
      badge: false,
    },
    {
      icon: <BarChart3 size={28} />,
      title: 'Indicadores',
      description: 'Análise de performance e indicadores hospitalares',
      color: 'from-emerald-500 to-emerald-600',
      badge: false,
    },
    {
      icon: <MessageSquare size={28} />,
      title: 'Assistente IA',
      description: 'Suporte inteligente para dúvidas médicas e gestão',
      color: 'from-purple-500 to-purple-600',
      badge: true,
    },
  ];

  return (
    <main className="relative flex min-h-screen flex-col bg-[#0a0e1a] overflow-hidden">
      {/* Mobile Drawer */}
      <MobileDrawer
        items={drawerItems}
        title="SL Academy"
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="fixed top-4 right-4 z-50 md:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
        aria-label="Abrir menu"
      >
        <Menu size={22} />
      </button>

      {/* Animated Background Gradient */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-r from-blue-500/20 to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-l from-emerald-500/20 to-transparent rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Hero Section */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl w-full text-center space-y-8 animate-fade-in">
            {/* Logo */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-2xl shadow-blue-500/40 transform transition hover:scale-110 duration-300">
                <span className="text-white font-bold text-4xl">SL</span>
              </div>
            </div>

            {/* Main Headline */}
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
                <span className="block text-white mb-2">Educação Médica</span>
                <span className="bg-gradient-to-r from-blue-400 via-emerald-400 to-blue-400 bg-clip-text text-transparent animate-gradient">
                  Corporativa
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
                Plataforma completa para hospitais: trilhas de aprendizado, avaliações, indicadores e suporte inteligente com IA.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              {/* Doctor Button */}
              <Link
                href="/login?role=doctor"
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:scale-105 border border-blue-500/20"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
                <span>Médico</span>
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>

              {/* Manager Button */}
              <Link
                href="/login?role=manager"
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/50 hover:scale-105 border border-emerald-500/20"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span>Gestor</span>
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Trust Text */}
            <p className="text-sm text-slate-400">
              ✓ Protocolo seguro de dados médicos • ✓ Compatível com RLS do hospital
            </p>
          </div>
        </div>

        {/* Features Section */}
        <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Tudo que você precisa
              </h2>
              <p className="text-slate-400">
                Recursos poderosos para educação médica e gestão hospitalar
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {features.map((feature, idx) => (
                <div
                  key={idx}
                  className="group relative"
                >
                  {/* Glassmorphism Card */}
                  <div className="relative h-full p-6 rounded-2xl backdrop-blur-xl bg-white/[0.05] border border-white/[0.1] hover:border-white/[0.2] transition-all duration-300 hover:bg-white/[0.08] hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-2">
                    {/* Badge */}
                    {feature.badge && (
                      <div className="absolute top-4 right-4">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold">
                          🆕 Novo
                        </span>
                      </div>
                    )}

                    {/* Icon */}
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300`}
                    >
                      {feature.icon}
                    </div>

                    {/* Content */}
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="relative z-10 border-t border-white/[0.05] px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-400">
            <p>© 2026 SL Academy. Educação Médica Corporativa.</p>
            <div className="flex gap-6">
              <Link href="/terms" className="hover:text-white transition">
                Termos
              </Link>
              <Link href="/privacy" className="hover:text-white transition">
                Privacidade
              </Link>
            </div>
          </div>
        </footer>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes gradient-shift {
          0%, 100% {
            background-position: 0% center;
          }
          50% {
            background-position: 100% center;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }

        .animate-gradient {
          background-size: 200% auto;
          animation: gradient-shift 3s ease-in-out infinite;
        }
      `}</style>
    </main>
  );
}
