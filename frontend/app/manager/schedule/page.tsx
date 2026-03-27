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
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
    return new Date(today.setDate(diff));
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadSchedule = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const weekStartStr = weekStart.toISOString().split('T')[0];
      const data = await scheduleApi.getSchedule(weekStartStr);
      setSchedule(data);
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
    if (!schedule) return;

    setError(null);
    setSuccessMessage(null);

    try {
      const updated = await scheduleApi.publishSchedule(schedule.id);
      setSchedule(updated);
      setSuccessMessage('Escala publicada com sucesso!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      const msg = err.message || 'Erro ao publicar escala';
      setError(msg);
      console.error('Erro ao publicar escala:', err);
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
            <div>
              <p className="font-semibold text-red-900 dark:text-red-300">Erro</p>
              <p className="text-red-800 dark:text-red-400 text-sm">{error}</p>
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
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
            >
              {isLoading && <Loader size={16} className="animate-spin" />}
              Publicar Escala
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
