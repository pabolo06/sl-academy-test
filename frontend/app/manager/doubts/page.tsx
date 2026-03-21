'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { DoubtCard } from '@/components/DoubtCard';
import { doubtApi } from '@/lib/api';
import { Doubt } from '@/types';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';

function SkeletonDoubt() {
  return (
    <div className="card p-4 space-y-3">
      <div className="skeleton h-4 w-3/4" />
      <div className="skeleton h-3 w-full" />
      <div className="skeleton h-3 w-1/2" />
      <div className="flex gap-2 pt-1">
        <div className="skeleton h-3 w-16" />
        <div className="skeleton h-3 w-12" />
      </div>
    </div>
  );
}

export default function ManagerDoubtsPage() {
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [activeDoubt, setActiveDoubt] = useState<Doubt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lessonFilter, setLessonFilter] = useState<string>('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const fetchDoubts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await doubtApi.getAll(undefined, lessonFilter || undefined);
      setDoubts(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dúvidas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchDoubts(); }, [lessonFilter]);

  const handleDragStart = (event: DragStartEvent) => {
    const doubt = doubts.find((d) => d.id === event.active.id);
    if (doubt) setActiveDoubt(doubt);
  };

  const handleDragEnd = (_event: DragEndEvent) => {
    setActiveDoubt(null);
  };

  const pendingDoubts = doubts.filter((d) => d.status === 'pending');
  const answeredDoubts = doubts.filter((d) => d.status === 'answered');

  return (
    <DashboardLayout requiredRole="manager">
      <div className="space-y-6">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Gerenciar Dúvidas</h1>
            <p className="page-subtitle">Visualize e responda dúvidas dos médicos</p>
          </div>
          <button
            onClick={fetchDoubts}
            className="btn-secondary flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Atualizar
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total', value: doubts.length, color: 'text-white' },
            { label: 'Pendentes', value: pendingDoubts.length, color: 'text-amber-400' },
            { label: 'Respondidas', value: answeredDoubts.length, color: 'text-emerald-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card p-4 text-center">
              <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="card p-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label htmlFor="lesson-filter" className="form-label">Filtrar por Aula</label>
              <select
                id="lesson-filter"
                value={lessonFilter}
                onChange={(e) => setLessonFilter(e.target.value)}
                className="form-input"
              >
                <option value="">Todas as aulas</option>
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

        {/* Kanban */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <SkeletonDoubt key={i} />)}
            </div>
            <div className="space-y-3">
              {[1, 2].map((i) => <SkeletonDoubt key={i} />)}
            </div>
          </div>
        ) : (
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pending */}
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 px-3 py-2.5 bg-amber-500/5 border border-amber-500/15 rounded-lg">
                  <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-amber-400">Pendentes</span>
                  <span className="ml-auto badge badge-yellow">{pendingDoubts.length}</span>
                </div>
                <div className="space-y-3">
                  {pendingDoubts.length === 0 ? (
                    <div className="card p-8 text-center">
                      <p className="text-sm text-slate-500">Nenhuma dúvida pendente</p>
                    </div>
                  ) : (
                    pendingDoubts.map((doubt) => (
                      <DoubtCard key={doubt.id} doubt={doubt} onUpdate={fetchDoubts} />
                    ))
                  )}
                </div>
              </div>

              {/* Answered */}
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 px-3 py-2.5 bg-emerald-500/5 border border-emerald-500/15 rounded-lg">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-emerald-400">Respondidas</span>
                  <span className="ml-auto badge badge-green">{answeredDoubts.length}</span>
                </div>
                <div className="space-y-3">
                  {answeredDoubts.length === 0 ? (
                    <div className="card p-8 text-center">
                      <p className="text-sm text-slate-500">Nenhuma dúvida respondida</p>
                    </div>
                  ) : (
                    answeredDoubts.map((doubt) => (
                      <DoubtCard key={doubt.id} doubt={doubt} onUpdate={fetchDoubts} />
                    ))
                  )}
                </div>
              </div>
            </div>

            <DragOverlay>
              {activeDoubt ? (
                <div className="opacity-60 rotate-2">
                  <DoubtCard doubt={activeDoubt} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </DashboardLayout>
  );
}
