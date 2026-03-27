'use client';

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { AlertCircle, Loader } from 'lucide-react';
import DoctorCard from './DoctorCard';
import { Schedule, ScheduleSlot, ScheduleSlotCreate, ShiftType } from '@/types';
import { scheduleApi } from '@/lib/api';

interface KanbanBoardProps {
  schedule: Schedule;
  onSlotRemoved: (slotId: string) => void;
  onSlotAdded: (slot: ScheduleSlot) => void;
  isLoading?: boolean;
}

type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export default function KanbanBoard({ schedule, onSlotRemoved, onSlotAdded, isLoading }: KanbanBoardProps) {
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const weekStart = new Date(schedule.week_start);
  const shifts: ShiftType[] = ['morning', 'afternoon', 'night'];
  const shiftLabels: Record<ShiftType, string> = {
    morning: 'Manhã (06:00 - 14:00)',
    afternoon: 'Tarde (14:00 - 22:00)',
    night: 'Noite (22:00 - 06:00)',
  };

  const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];
  const dayDates: Date[] = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    return date;
  });

  // Group slots by day and shift
  const getSlotsByDayShift = (dayOfWeek: DayOfWeek, shift: ShiftType): ScheduleSlot[] => {
    const date = dayDates[dayOfWeek];
    const dateStr = date.toISOString().split('T')[0];
    return (schedule.schedule_slots || []).filter(
      (slot) => slot.slot_date === dateStr && slot.shift === shift
    );
  };

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    setError(null);
    setIsAddingSlot(true);

    try {
      // Parse destination: format is "day-shift" (e.g., "0-morning")
      const [dayStr, shift] = destination.droppableId.split('-');
      const dayOfWeek = parseInt(dayStr) as DayOfWeek;
      const date = dayDates[dayOfWeek];
      const dateStr = date.toISOString().split('T')[0];

      // If coming from a shift (not from the sidebar), remove from old location first
      if (source.droppableId !== 'sidebar') {
        const existingSlot = schedule.schedule_slots?.find((s) => s.id === draggableId);
        if (existingSlot) {
          await scheduleApi.removeSlot(existingSlot.id);
          onSlotRemoved(existingSlot.id);
        }
      }

      // Add to new location
      const slotData: ScheduleSlotCreate = {
        doctor_id: draggableId,
        slot_date: dateStr,
        shift: shift as ShiftType,
        notes: '',
      };

      const newSlot = await scheduleApi.addSlot(schedule.id, slotData);
      onSlotAdded(newSlot);
    } catch (err: any) {
      const msg = err.message || 'Erro ao adicionar médico ao turno';
      setError(msg);
      console.error('Erro ao adicionar slot:', err);
    } finally {
      setIsAddingSlot(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader size={32} className="text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex gap-3">
          <AlertCircle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900 dark:text-red-300">Erro</p>
            <p className="text-red-800 dark:text-red-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="grid gap-0 bg-white dark:bg-gray-800" style={{ gridTemplateColumns: 'auto repeat(7, 1fr)' }}>
          {/* Header row - shifts */}
          <div className="bg-gray-50 dark:bg-gray-750 border-r border-gray-200 dark:border-gray-700 p-3 font-semibold text-sm text-gray-600 dark:text-gray-400">
            Turno
          </div>
          {dayDates.map((date, idx) => (
            <div
              key={idx}
              className="bg-gray-50 dark:bg-gray-750 border-r border-gray-200 dark:border-gray-700 p-3 text-center font-semibold text-sm"
            >
              <div className="text-gray-900 dark:text-white">{days[idx]}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{date.getDate()}/{date.getMonth() + 1}</div>
            </div>
          ))}

          {/* Shift rows */}
          {shifts.map((shift) => (
            <React.Fragment key={shift}>
              {/* Shift label */}
              <div className="bg-white dark:bg-gray-800 border-r border-b border-gray-200 dark:border-gray-700 p-3 font-semibold text-sm text-gray-700 dark:text-gray-300 sticky left-0">
                {shiftLabels[shift]}
              </div>

              {/* Shift slots for each day */}
              {dayDates.map((_, dayIdx) => {
                const dayOfWeek = dayIdx as DayOfWeek;
                const slots = getSlotsByDayShift(dayOfWeek, shift);
                const droppableId = `${dayIdx}-${shift}`;

                return (
                  <Droppable key={droppableId} droppableId={droppableId} type={shift}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`
                          border-r border-b border-gray-200 dark:border-gray-700 p-2 min-h-24 transition-colors
                          ${snapshot.isDraggingOver ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-800'}
                        `}
                      >
                        <div className="space-y-2">
                          {slots.map((slot, idx) => (
                            <DoctorCard
                              key={slot.id}
                              slot={slot}
                              index={idx}
                              isDraggingOver={snapshot.isDraggingOver}
                              onRemove={async (slotId) => {
                                try {
                                  setError(null);
                                  await scheduleApi.removeSlot(slotId);
                                  onSlotRemoved(slotId);
                                } catch (err: any) {
                                  setError(err.message || 'Erro ao remover médico');
                                }
                              }}
                            />
                          ))}
                          {provided.placeholder}
                        </div>
                      </div>
                    )}
                  </Droppable>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {isAddingSlot && (
        <div className="mt-4 flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400">
          <Loader size={16} className="animate-spin" />
          <span className="text-sm">Atualizando escala...</span>
        </div>
      )}
    </DragDropContext>
  );
}
