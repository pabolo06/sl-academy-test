/**
 * SL Academy Platform - Manager Dashboard
 * Overview dashboard with indicators, test scores, and completion rates
 */

'use client';

import { useState, useEffect } from 'react';
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

      // Fetch all data in parallel
      const [indicatorsData, tracksData] = await Promise.all([
        indicatorApi.getAll(),
        trackApi.getAll(),
      ]);

      // Fetch lessons for all tracks
      const lessonsPromises = tracksData.map((track) => lessonApi.getByTrack(track.id));
      const lessonsArrays = await Promise.all(lessonsPromises);
      const allLessons = lessonsArrays.flat();

      // Fetch test attempts for all lessons
      const testAttemptsPromises = allLessons.map((lesson) => 
        testAttemptApi.getByLesson(lesson.id).catch(() => [])
      );
      const testAttemptsArrays = await Promise.all(testAttemptsPromises);
      const allTestAttempts = testAttemptsArrays.flat();

      // Calculate test statistics
      const preTests = allTestAttempts.filter((t) => t.type === 'pre');
      const postTests = allTestAttempts.filter((t) => t.type === 'post');

      const avgPreScore = preTests.length > 0
        ? preTests.reduce((sum, t) => sum + t.score, 0) / preTests.length
        : 0;

      const avgPostScore = postTests.length > 0
        ? postTests.reduce((sum, t) => sum + t.score, 0) / postTests.length
        : 0;

      const avgImprovement = avgPostScore - avgPreScore;

      setStats({
        totalIndicators: indicatorsData.length,
        totalTracks: tracksData.length,
        totalLessons: allLessons.length,
        totalTestAttempts: allTestAttempts.length,
        averagePreTestScore: avgPreScore,
        averagePostTestScore: avgPostScore,
        averageImprovement: avgImprovement,
      });

      setIndicators(indicatorsData.slice(0, 50)); // Show recent indicators
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados do dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout requiredRole="manager">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard Gerencial</h1>
          <p className="text-gray-400 mt-1">
            Visão geral do desempenho e indicadores do hospital
          </p>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4">
            <p className="text-red-300">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="mt-3 px-4 py-2 bg-red-700 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        ) : (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-900/50 rounded-lg">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Indicadores</p>
                    <p className="text-2xl font-bold text-white">{stats.totalIndicators}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-900/50 rounded-lg">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Trilhas</p>
                    <p className="text-2xl font-bold text-white">{stats.totalTracks}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-900/50 rounded-lg">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Aulas</p>
                    <p className="text-2xl font-bold text-white">{stats.totalLessons}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-900/50 rounded-lg">
                    <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Testes Realizados</p>
                    <p className="text-2xl font-bold text-white">{stats.totalTestAttempts}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Test Performance Stats */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Desempenho em Testes</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Média Pré-teste</p>
                  <p className="text-3xl font-bold text-white">
                    {stats.averagePreTestScore.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Média Pós-teste</p>
                  <p className="text-3xl font-bold text-white">
                    {stats.averagePostTestScore.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Melhoria Média</p>
                  <p className={`text-3xl font-bold ${
                    stats.averageImprovement >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {stats.averageImprovement >= 0 ? '+' : ''}
                    {stats.averageImprovement.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Indicator Trends */}
            {indicators.length > 0 && (
              <IndicatorLineChart
                indicators={indicators}
                title="Tendência de Indicadores Recentes"
              />
            )}

            {/* Quick Actions */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Ações Rápidas</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <a
                  href="/manager/indicators/import"
                  className="flex items-center gap-3 p-4 bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div>
                    <p className="font-medium text-white">Importar Indicadores</p>
                    <p className="text-sm text-gray-400">Upload CSV/XLSX</p>
                  </div>
                </a>

                <a
                  href="/manager/doubts"
                  className="flex items-center gap-3 p-4 bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <div>
                    <p className="font-medium text-white">Gerenciar Dúvidas</p>
                    <p className="text-sm text-gray-400">Responder perguntas</p>
                  </div>
                </a>

                <a
                  href="/manager/tracks"
                  className="flex items-center gap-3 p-4 bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <div>
                    <p className="font-medium text-white">Gerenciar Trilhas</p>
                    <p className="text-sm text-gray-400">Criar e editar</p>
                  </div>
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
