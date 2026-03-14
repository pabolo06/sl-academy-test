/**
 * SL Academy Platform - Manager Doubts Kanban Board
 * Drag-and-drop board for managing all hospital doubts
 */

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

export default function ManagerDoubtsPage() {
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [activeDoubt, setActiveDoubt] = useState<Doubt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lessonFilter, setLessonFilter] = useState<string>('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const fetchDoubts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const lessonId = lessonFilter || undefined;
      const data = await doubtApi.getAll(undefined, lessonId);
      setDoubts(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dúvidas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoubts();
  }, [lessonFilter]);

  const handleDragStart = (event: DragStartEvent) => {
    const doubt = doubts.find(d => d.id === event.active.id);
    if (doubt) {
      setActiveDoubt(doubt);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDoubt(null);
    // Note: Status changes are handled through the DoubtCard answer functionality
    // Drag-and-drop is primarily for visual organization
  };

  const pendingDoubts = doubts.filter(d => d.status === 'pending');
  const answeredDoubts = doubts.filter(d => d.status === 'answered');

  return (
    <DashboardLayout requiredRole="manager">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Gerenciar Dúvidas</h1>
          <p className="text-gray-400 mt-1">
            Visualize e responda dúvidas de todos os médicos do hospital
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-400">Total</p>
            <p className="text-2xl font-bold text-white mt-1">{doubts.length}</p>
          </div>
          <div className="bg-gray-800 border border-yellow-700/50 rounded-lg p-4">
            <p className="text-sm text-yellow-300">Pendentes</p>
            <p className="text-2xl font-bold text-white mt-1">{pendingDoubts.length}</p>
          </div>
          <div className="bg-gray-800 border border-green-700/50 rounded-lg p-4">
            <p className="text-sm text-green-300">Respondidas</p>
            <p className="text-2xl font-bold text-white mt-1">{answeredDoubts.length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="lesson-filter" className="block text-sm font-medium text-gray-300 mb-2">
                Filtrar por Aula
              </label>
              <select
                id="lesson-filter"
                value={lessonFilter}
                onChange={(e) => setLessonFilter(e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas as aulas</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchDoubts}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Atualizar
              </button>
            </div>
          </div>
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
              onClick={fetchDoubts}
              className="mt-3 px-4 py-2 bg-red-700 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {/* Kanban Board */}
            <div className="grid grid-cols-2 gap-6">
              {/* Pending Column */}
              <div className="space-y-4">
                <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
                  <h2 className="text-lg font-semibold text-yellow-300 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Pendentes
                    <span className="ml-auto text-sm">({pendingDoubts.length})</span>
                  </h2>
                </div>
                <div className="space-y-4">
                  {pendingDoubts.length === 0 ? (
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
                      <p className="text-gray-400">Nenhuma dúvida pendente</p>
                    </div>
                  ) : (
                    pendingDoubts.map((doubt) => (
                      <DoubtCard key={doubt.id} doubt={doubt} onUpdate={fetchDoubts} />
                    ))
                  )}
                </div>
              </div>

              {/* Answered Column */}
              <div className="space-y-4">
                <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4">
                  <h2 className="text-lg font-semibold text-green-300 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Respondidas
                    <span className="ml-auto text-sm">({answeredDoubts.length})</span>
                  </h2>
                </div>
                <div className="space-y-4">
                  {answeredDoubts.length === 0 ? (
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
                      <p className="text-gray-400">Nenhuma dúvida respondida</p>
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
                <div className="opacity-50">
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
