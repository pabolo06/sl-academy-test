/**
 * SL Academy Platform - Doubts Page (Doctor View)
 * List and manage user's doubts
 */

'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { DoubtCard } from '@/components/DoubtCard';
import { DoubtForm } from '@/components/DoubtForm';
import { doubtApi, lessonApi } from '@/lib/api';
import { Doubt, Lesson } from '@/types';

export default function DoubtsPage() {
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'answered'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchDoubts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const status = statusFilter === 'all' ? undefined : statusFilter;
      const lessonId = selectedLesson || undefined;
      
      const data = await doubtApi.getAll(status, lessonId);
      setDoubts(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dúvidas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoubts();
  }, [statusFilter, selectedLesson]);

  const handleDoubtSubmitted = () => {
    setShowForm(false);
    fetchDoubts();
  };

  const filteredDoubts = doubts;

  const pendingCount = doubts.filter(d => d.status === 'pending').length;
  const answeredCount = doubts.filter(d => d.status === 'answered').length;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Minhas Dúvidas</h1>
            <p className="text-gray-400 mt-1">
              Gerencie suas dúvidas sobre as aulas
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            {showForm ? 'Cancelar' : 'Nova Dúvida'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-400">Total</p>
            <p className="text-2xl font-bold text-white mt-1">{doubts.length}</p>
          </div>
          <div className="bg-gray-800 border border-yellow-700/50 rounded-lg p-4">
            <p className="text-sm text-yellow-300">Pendentes</p>
            <p className="text-2xl font-bold text-white mt-1">{pendingCount}</p>
          </div>
          <div className="bg-gray-800 border border-green-700/50 rounded-lg p-4">
            <p className="text-sm text-green-300">Respondidas</p>
            <p className="text-2xl font-bold text-white mt-1">{answeredCount}</p>
          </div>
        </div>

        {/* New Doubt Form */}
        {showForm && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Nova Dúvida</h2>
            <div className="mb-4">
              <label htmlFor="lesson-select" className="block text-sm font-medium text-gray-300 mb-2">
                Selecione a aula
              </label>
              <select
                id="lesson-select"
                value={selectedLesson}
                onChange={(e) => setSelectedLesson(e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione uma aula...</option>
                {lessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.title}
                  </option>
                ))}
              </select>
            </div>
            {selectedLesson && (
              <DoubtForm lessonId={selectedLesson} onSuccess={handleDoubtSubmitted} />
            )}
          </div>
        )}

        {/* Filters */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-300 mb-2">
                Status
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todas</option>
                <option value="pending">Pendentes</option>
                <option value="answered">Respondidas</option>
              </select>
            </div>
            <div className="flex-1">
              <label htmlFor="lesson-filter" className="block text-sm font-medium text-gray-300 mb-2">
                Aula
              </label>
              <select
                id="lesson-filter"
                value={selectedLesson}
                onChange={(e) => setSelectedLesson(e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas as aulas</option>
                {lessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Doubts List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4">
            <p className="text-red-300">{error}</p>
            <button
              onClick={fetchDoubts}
              className="mt-3 px-4 py-2 bg-red-700 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        ) : filteredDoubts.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
            <p className="text-gray-400">Nenhuma dúvida encontrada</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
            >
              Criar Primeira Dúvida
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDoubts.map((doubt) => (
              <DoubtCard key={doubt.id} doubt={doubt} onUpdate={fetchDoubts} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
