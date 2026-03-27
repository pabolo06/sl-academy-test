'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ScheduleWeekNavProps {
  weekStart: Date;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  isLoading?: boolean;
}

export default function ScheduleWeekNav({ weekStart, onPreviousWeek, onNextWeek, isLoading }: ScheduleWeekNavProps) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <button
        onClick={onPreviousWeek}
        disabled={isLoading}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Semana anterior"
      >
        <ChevronLeft size={20} className="text-gray-700 dark:text-gray-300" />
      </button>

      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Semana de {formatDate(weekStart)} a {formatDate(weekEnd)}
        </h2>
      </div>

      <button
        onClick={onNextWeek}
        disabled={isLoading}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Próxima semana"
      >
        <ChevronRight size={20} className="text-gray-700 dark:text-gray-300" />
      </button>
    </div>
  );
}
