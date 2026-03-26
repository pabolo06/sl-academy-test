'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { IndicatorLineChart } from '@/components/IndicatorLineChart';
import { indicatorApi, testAttemptApi, trackApi, lessonApi } from '@/lib/api';
import { Indicator, TestAttempt, Track } from '@/types';

interface DashboardStats {
  totalIndicators: number;
  totalTracks: number;
  totalLessons: number;
  totalTestAttempts: number;
  averagePreTestScore: number;
  averagePostTestScore: number;
  averageImprovement: number;
}

const statCards = [
  {
    key: 'totalIndicators',
    label: 'Indicadores',
    color: 'blue',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    key: 'totalTracks',
    label: 'Trilhas',
    color: 'emerald',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
  {
    key: 'totalLessons',
    label: 'Aulas',
    color: 'purple',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
      </svg>
    ),
  },
  {
    key: 'totalTestAttempts',
    label: 'Testes Realizados',
    color: 'amber',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
      </svg>
    ),
  },
];

const colorMap: Record<string, string> = {
  blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
};

function StatSkeleton() {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center gap-3">
        <div className="skeleton w-10 h-10 rounded-lg" />
        <div className="skeleton h-4 w-24" />
      </div>
      <div className="skeleton h-8 w-16" />
    </div>
  );
}

export default function ManagerDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalIndicators: 0,
    totalTracks: 0,
    totalLessons: 0,
    totalTestAttempts: 0,
    averagePreTestScore: 0,
    averagePostTestScore: 0,
    averageImprovement: 0,
  });
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [indicatorsResult, tracksResult] = await Promise.allSettled([
        indicatorApi.getAll(),
        trackApi.getAll(),
      ]);
      const indicatorsData = indicatorsResult.status === 'fulfilled' ? indicatorsResult.value : [];
      const tracksData = tracksResult.status === 'fulfilled' ? tracksResult.value : [];

      const lessonsPromises = tracksData.map((track) => lessonApi.getByTrack(track.id).catch(() => []));
      const lessonsArrays = await Promise.all(lessonsPromises);
      const allLessons = lessonsArrays.flat();

      const testAttemptsPromises = allLessons.map((lesson) =>
        testAttemptApi.getByLesson(lesson.id).catch(() => [])
      );
      const testAttemptsArrays = await Promise.all(testAttemptsPromises);
      const allTestAttempts = testAttemptsArrays.flat();

      const preTests = allTestAttempts.filter((t) => t.type === 'pre');
      const postTests = allTestAttempts.filter((t) => t.type === 'post');
      const avgPreScore = preTests.length > 0 ? preTests.reduce((s, t) => s + t.score, 0) / preTests.length : 0;
      const avgPostScore = postTests.length > 0 ? postTests.reduce((s, t) => s + t.score, 0) / postTests.length : 0;

      setStats({
        totalIndicators: indicatorsData.length,
        totalTracks: tracksData.length,
        totalLessons: allLessons.length,
        totalTestAttempts: allTestAttempts.length,
        averagePreTestScore: avgPreScore,
        averagePostTestScore: avgPostScore,
        averageImprovement: avgPostScore - avgPreScore,
      });
      setIndicators(indicatorsData.slice(0, 50));
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados do dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout requiredRole="manager">
      <div className="space-y-6">
        {/* Stats grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <StatSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="alert-error">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <div>
              <p>{error}</p>
              <button onClick={fetchDashboardData} className="mt-1.5 text-red-300 hover:text-red-200 underline text-xs">Tentar novamente</button>
            </div>
          </div>
        ) : (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {statCards.map(({ key, label, color, icon }) => (
                <div key={key} className="card p-5">
                  <div className={`w-10 h-10 rounded-lg border flex items-center justify-center mb-3 ${colorMap[color]}`}>
                    {icon}
                  </div>
                  <p className="text-2xl font-bold text-white tabular-nums">
                    {stats[key as keyof DashboardStats] as number}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Test performance */}
            <div className="card p-5">
              <h2 className="section-title mb-4">Desempenho em Testes</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Média Pré-teste', value: stats.averagePreTestScore, color: 'text-slate-200' },
                  { label: 'Média Pós-teste', value: stats.averagePostTestScore, color: 'text-slate-200' },
                  {
                    label: 'Melhoria Média',
                    value: stats.averageImprovement,
                    color: stats.averageImprovement >= 0 ? 'text-emerald-400' : 'text-red-400',
                    prefix: stats.averageImprovement >= 0 ? '+' : '',
                  },
                ].map(({ label, value, color, prefix }) => (
                  <div key={label} className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4">
                    <p className="text-xs text-slate-400 mb-1">{label}</p>
                    <p className={`text-2xl font-bold tabular-nums ${color}`}>
                      {prefix ?? ''}{value.toFixed(1)}%
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart */}
            {indicators.length > 0 && (
              <div className="card p-5">
                <IndicatorLineChart
                  indicators={indicators}
                  title="Tendência de Indicadores"
                />
              </div>
            )}

            {/* Quick actions */}
            <div className="card p-5">
              <h2 className="section-title mb-4">Ações Rápidas</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  {
                    href: '/manager/indicators/import',
                    label: 'Importar Indicadores',
                    desc: 'Upload CSV / XLSX',
                    color: 'blue',
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                    ),
                  },
                  {
                    href: '/manager/doubts',
                    label: 'Gerenciar Dúvidas',
                    desc: 'Responder perguntas',
                    color: 'emerald',
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                      </svg>
                    ),
                  },
                  {
                    href: '/manager/tracks',
                    label: 'Gerenciar Trilhas',
                    desc: 'Criar e editar conteúdo',
                    color: 'purple',
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                      </svg>
                    ),
                  },
                ].map(({ href, label, desc, color, icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-3 p-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-blue-500/20 rounded-lg transition-all group"
                  >
                    <div className={`w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0 ${colorMap[color]}`}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200">{label}</p>
                      <p className="text-xs text-slate-500">{desc}</p>
                    </div>
                    <svg className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
