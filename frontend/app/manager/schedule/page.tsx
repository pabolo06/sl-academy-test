'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Loader, CheckCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import ScheduleWeekNav from '@/components/ScheduleWeekNav';
import KanbanBoard from '@/components/KanbanBoard';
import { Schedule, ScheduleSlot } from '@/types';
import { scheduleApi } from '@/lib/api';

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [weekStart, setWeekStart] = useState<Date>(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun … 6=Sat
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + daysToMonday);
    monday.setHours(0, 0, 0, 0);
    return monday;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadSchedule = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Use local date parts to avoid UTC offset shifting the day
      const y = weekStart.getFullYear();
      const m = String(weekStart.getMonth() + 1).padStart(2, '0');
      const d = String(weekStart.getDate()).padStart(2, '0');
      const weekStartStr = `${y}-${m}-${d}`;

      try {
        // Network first
        const data = await scheduleApi.getSchedule(weekStartStr);
        setSchedule(data);

        // Cache for offline use (SSR guard)
        if (typeof window !== 'undefined') {
          import('@/lib/offlineDb').then(({ cacheSchedule }) => {
            cacheSchedule(weekStartStr, data).catch(() => { });
          });
        }
      } catch (networkErr: any) {
        // Fallback to IndexedDB cache when offline
        if (typeof window !== 'undefined') {
          const { getCachedSchedule } = await import('@/lib/offlineDb');
          const cached = await getCachedSchedule(weekStartStr, 24 * 60 * 60 * 1000); // 24h cache for offline
          if (cached) {
            setSchedule(cached);
            setError('Modo offline — dados em cache. Reconecte para atualizar.');
            return;
          }
        }
        throw networkErr;
      }
    } catch (err: any) {
      const msg = err.message || 'Erro ao carregar escala';
      setError(msg);
      console.error('Erro ao carregar escala:', err);
    } finally {
      setIsLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  const handlePreviousWeek = () => {
    setWeekStart((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 7);
      return newDate;
    });
  };

  const handleNextWeek = () => {
    setWeekStart((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 7);
      return newDate;
    });
  };

  const handlePublishSchedule = async () => {
    if (!schedule || isPublishing) return;

    setError(null);
    setSuccessMessage(null);
    setIsPublishing(true);

    try {
      const updated = await scheduleApi.publishSchedule(schedule.id);
      setSchedule(updated);
      setSuccessMessage('Escala publicada com sucesso! Os médicos já podem visualizar seus plantões.');
      setTimeout(() => setSuccessMessage(null), 8000);
    } catch (err: any) {
      const msg = err.message || 'Erro ao publicar escala';
      setError(msg);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSlotAdded = (newSlot: ScheduleSlot) => {
    setSchedule((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        schedule_slots: [...(prev.schedule_slots || []), newSlot],
      };
    });
  };

  const handleSlotRemoved = (slotId: string) => {
    setSchedule((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        schedule_slots: (prev.schedule_slots || []).filter((s) => s.id !== slotId),
      };
    });
  };

  return (
    <DashboardLayout requiredRole="manager">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Escala de Plantões</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Organize os médicos plantonistas por dia e turno
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex gap-3">
            <AlertCircle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-900 dark:text-red-300">Erro ao carregar escala</p>
              <p className="text-red-800 dark:text-red-400 text-sm mt-0.5">{error}</p>
              <button
                onClick={loadSchedule}
                className="mt-2 text-sm font-medium text-red-700 dark:text-red-300 underline hover:no-underline"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex gap-3">
            <CheckCircle size={20} className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-900 dark:text-green-300">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Navigation and Actions */}
        <div className="mb-6">
          <ScheduleWeekNav
            weekStart={weekStart}
            onPreviousWeek={handlePreviousWeek}
            onNextWeek={handleNextWeek}
            isLoading={isLoading}
          />
        </div>

        {/* Publish Button */}
        {schedule && schedule.status === 'draft' && (
          <div className="mb-6 flex justify-end">
            <button
              onClick={handlePublishSchedule}
              disabled={isLoading || isPublishing}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
            >
              {isPublishing ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Publicando…
                </>
              ) : (
                'Publicar Escala'
              )}
            </button>
          </div>
        )}

        {schedule && schedule.status === 'published' && (
          <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-blue-900 dark:text-blue-300 text-sm font-semibold">
              ✓ Esta escala foi publicada. Os médicos conseguem visualizar seus plantões.
            </p>
          </div>
        )}

        {/* Kanban Board */}
        {schedule && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <KanbanBoard
              schedule={schedule}
              onSlotAdded={handleSlotAdded}
              onSlotRemoved={handleSlotRemoved}
              isLoading={isLoading}
            />
          </div>
        )}

        {isLoading && !schedule && (
          <div className="flex items-center justify-center py-12">
            <Loader size={32} className="text-blue-500 animate-spin" />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
