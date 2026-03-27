'use client';

import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { X } from 'lucide-react';
import { ScheduleSlot, ShiftType } from '@/types';

interface DoctorCardProps {
  slot: ScheduleSlot;
  index: number;
  isDraggingOver?: boolean;
  onRemove: (slotId: string) => void;
}

export default function DoctorCard({ slot, index, isDraggingOver, onRemove }: DoctorCardProps) {
  const shiftColors: Record<ShiftType, { bg: string; badge: string }> = {
    morning: { bg: 'bg-amber-50', badge: 'bg-amber-100 text-amber-800' },
    afternoon: { bg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-800' },
    night: { bg: 'bg-purple-50', badge: 'bg-purple-100 text-purple-800' },
  };

  const shiftLabels: Record<ShiftType, string> = {
    morning: 'Manhã',
    afternoon: 'Tarde',
    night: 'Noite',
  };

  const colors = shiftColors[slot.shift];

  return (
    <Draggable draggableId={slot.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`
            p-3 rounded-lg border border-gray-200 transition-all duration-200
            ${colors.bg}
            ${snapshot.isDragging ? 'shadow-lg scale-105 opacity-90' : 'shadow-sm'}
            ${isDraggingOver ? 'opacity-70' : ''}
          `}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-gray-900 truncate">
                {slot.doctor_email?.split('@')[0] || 'Dr.'}
              </div>
              <span className={`inline-block text-xs font-medium px-2 py-1 rounded mt-1 ${colors.badge}`}>
                {shiftLabels[slot.shift]}
              </span>
            </div>
            <button
              onClick={() => onRemove(slot.id)}
              className="text-gray-400 hover:text-red-500 transition-colors p-1 flex-shrink-0"
              title="Remover do turno"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </Draggable>
  );
}
