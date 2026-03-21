'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { DoubtCard } from '@/components/DoubtCard';
import { DoubtForm } from '@/components/DoubtForm';
import { doubtApi, lessonApi } from '@/lib/api';
import { Doubt, Lesson } from '@/types';

function SkeletonDoubt() {
  return (
    <div className="card p-4 space-y-3">
      <div className="skeleton h-4 w-3/4" />
      <div className="skeleton h-3 w-full" />
      <div className="skeleton h-3 w-1/2" />
    </div>
  );
}

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
    lessonApi.getAll().then(setLessons).catch(() => {});
  }, []);

  useEffect(() => { fetchDoubts(); }, [statusFilter, selectedLesson]);

  const handleDoubtSubmitted = () => {
    setShowForm(false);
    fetchDoubts();
  };

  const pendingCount = doubts.filter((d) => d.status === 'pending').length;
  const answeredCount = doubts.filter((d) => d.status === 'answered').length;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Minhas Dúvidas</h1>
            <p className="page-subtitle">Gerencie suas dúvidas sobre as aulas</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className={showForm ? 'btn-secondary' : 'btn-primary'}
          >
            {showForm ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancelar
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Nova Dúvida
              </>
            )}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total', value: doubts.length, color: 'text-white' },
            { label: 'Pendentes', value: pendingCount, color: 'text-amber-400' },
            { label: 'Respondidas', value: answeredCount, color: 'text-emerald-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card p-4 text-center">
              <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* New Doubt Form */}
        {showForm && (
          <div className="card p-6">
            <h2 className="section-title mb-4">Nova Dúvida</h2>
            <div className="mb-4">
              <label htmlFor="lesson-select" className="form-label">Selecione a aula</label>
              <select
                id="lesson-select"
                value={selectedLesson}
                onChange={(e) => setSelectedLesson(e.target.value)}
                className="form-input"
              >
                <option value="">Selecione uma aula...</option>
                {lessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>{lesson.title}</option>
                ))}
              </select>
            </div>
            {selectedLesson && (
              <DoubtForm lessonId={selectedLesson} onSuccess={handleDoubtSubmitted} />
            )}
          </div>
        )}

        {/* Filters */}
        <div className="card p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="status-filter" className="form-label">Status</label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="form-input"
              >
                <option value="all">Todas</option>
                <option value="pending">Pendentes</option>
                <option value="answered">Respondidas</option>
              </select>
            </div>
            <div>
              <label htmlFor="lesson-filter" className="form-label">Aula</label>
              <select
                id="lesson-filter"
                value={selectedLesson}
                onChange={(e) => setSelectedLesson(e.target.value)}
                className="form-input"
              >
                <option value="">Todas as aulas</option>
                {lessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>{lesson.title}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="alert-error">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <div>
              <p>{error}</p>
              <button onClick={fetchDoubts} className="mt-1.5 text-red-300 hover:text-red-200 underline text-xs">Tentar novamente</button>
            </div>
          </div>
        )}

        {/* Doubts List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <SkeletonDoubt key={i} />)}
          </div>
        ) : doubts.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <svg className="empty-state-icon" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
              <p className="empty-state-title">Nenhuma dúvida encontrada</p>
              <p className="empty-state-text">Envie uma dúvida sobre qualquer aula das trilhas</p>
              <button onClick={() => setShowForm(true)} className="btn-primary">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Criar Primeira Dúvida
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {doubts.map((doubt) => (
              <DoubtCard key={doubt.id} doubt={doubt} onUpdate={fetchDoubts} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
