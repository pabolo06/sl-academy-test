'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { scheduleApi } from '@/lib/api';
import { ScheduleSlot } from '@/types';

interface ProgressData {
  completed: number;
  total: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [shifts, setShifts] = useState<ScheduleSlot[]>([]);
  const [shiftsLoading, setShiftsLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'doctor') {
      setShiftsLoading(true);
      scheduleApi
        .getMyShifts()
        .then(setShifts)
        .catch((err) => console.error('Erro ao carregar plantões:', err))
        .finally(() => setShiftsLoading(false));
    }
  }, [user?.role]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const fetchProgress = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      const [lessonsRes, attemptsRes] = await Promise.all([
        supabase.from('lessons').select('id', { count: 'exact' }).is('deleted_at', null),
        supabase.from('test_attempts').select('lesson_id').eq('user_id', session.user.id).eq('type', 'post'),
      ]);

      const total = lessonsRes.count ?? 0;
      const completedIds = new Set((attemptsRes.data || []).map((a: any) => a.lesson_id));
      setProgress({ completed: completedIds.size, total });
    };

    fetchProgress();
  }, []);

  const pct = progress && progress.total > 0
    ? Math.round((progress.completed / progress.total) * 100)
    : null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome banner */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600/20 via-blue-700/10 to-indigo-900/20 border border-blue-500/20 p-6">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl" />
          <div className="relative">
            <p className="text-sm text-blue-400 font-medium mb-1">Bem-vindo de volta</p>
            <h2 className="text-2xl font-bold text-white mb-1">
              {user?.email?.split('@')[0] || 'Usuário'}
            </h2>
            <p className="text-slate-400 text-sm">
              {user?.hospital_name || 'SL Academy'} · {user?.role === 'manager' ? 'Gestor' : 'Médico'}
            </p>
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <svg className="w-4.5 h-4.5 text-blue-400" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-slate-300">Perfil</span>
            </div>
            <p className="text-sm text-slate-400 truncate">{user?.email}</p>
            <p className="text-xs text-slate-500 mt-1 capitalize">
              {user?.role === 'manager' ? 'Gestor' : 'Médico'}
            </p>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <svg className="w-4.5 h-4.5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                </svg>
              </div>
              <span className="text-sm font-medium text-slate-300">Hospital</span>
            </div>
            <p className="text-sm text-slate-400">{user?.hospital_name || 'Não vinculado'}</p>
            <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              Ativo
            </p>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <svg className="w-4.5 h-4.5 text-amber-400" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-slate-300">Progresso</span>
            </div>
            {pct !== null ? (
              <>
                <div className="flex items-baseline justify-between mb-1.5">
                  <p className="text-lg font-bold text-white tabular-nums">{pct}%</p>
                  <p className="text-xs text-slate-500">{progress!.completed}/{progress!.total} aulas</p>
                </div>
                <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-400">Carregando...</p>
                <div className="w-full h-1.5 bg-white/[0.06] rounded-full mt-1.5">
                  <div className="h-full w-0 bg-amber-400 rounded-full" />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="card p-5">
          <h3 className="section-title mb-4">Acesso Rápido</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/tracks"
              className="flex items-center gap-3 p-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-blue-500/20 rounded-lg transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/20 transition-colors">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">Trilhas de Aprendizado</p>
                <p className="text-xs text-slate-500">Explore conteúdo disponível</p>
              </div>
              <svg className="w-4 h-4 text-slate-600 ml-auto group-hover:text-slate-400 transition-colors" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>

            <Link
              href="/doubts"
              className="flex items-center gap-3 p-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-blue-500/20 rounded-lg transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500/20 transition-colors">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">Minhas Dúvidas</p>
                <p className="text-xs text-slate-500">Perguntas e respostas</p>
              </div>
              <svg className="w-4 h-4 text-slate-600 ml-auto group-hover:text-slate-400 transition-colors" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Doctor Shifts */}
        {user?.role === 'doctor' && (
          <div className="card p-5">
            <h3 className="section-title mb-4">Seus Plantões Esta Semana</h3>
            {shiftsLoading ? (
              <p className="text-slate-400 text-sm">Carregando...</p>
            ) : shifts.length > 0 ? (
              <div className="space-y-3">
                {shifts.map((shift) => {
                  const shiftColors: Record<string, string> = {
                    morning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                    afternoon: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                    night: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                  };

                  const shiftLabels: Record<string, string> = {
                    morning: 'Manhã',
                    afternoon: 'Tarde',
                    night: 'Noite',
                  };

                  const date = new Date(shift.slot_date);
                  const formattedDate = date.toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: '2-digit',
                    month: '2-digit',
                  });

                  return (
                    <div
                      key={shift.id}
                      className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/[0.06] rounded-lg hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${shiftColors[shift.shift]}`}>
                          {shiftLabels[shift.shift]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-200 capitalize">{formattedDate}</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500">{shift.slot_date}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-slate-400 text-sm">Nenhum plantão agendado para esta semana.</p>
            )}
          </div>
        )}

        {/* Tips */}
        <div className="card p-5">
          <h3 className="section-title mb-3">Próximos Passos</h3>
          <ul className="space-y-2.5">
            {[
              'Explore as trilhas de aprendizado disponíveis',
              'Complete os testes de avaliação pré e pós-aula',
              'Envie suas dúvidas para os gestores do hospital',
              ...(user?.role === 'manager'
                ? ['Gerencie trilhas e conteúdos no painel gerencial', 'Acompanhe os indicadores hospitalares']
                : []),
            ].map((tip) => (
              <li key={tip} className="flex items-center gap-2.5 text-sm text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
