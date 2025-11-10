/**
 * Hook for drag-and-drop setlist editing
 */

import { useState } from 'react';
import type { SetlistItem } from '~/types/setlist-prediction';
import {
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

export interface UseSetlistDragDropOptions {
  items: SetlistItem[];
  onReorder: (items: SetlistItem[]) => void;
}

export function useSetlistDragDrop({ items, onReorder }: UseSetlistDragDropOptions) {
  const [activeId, setActiveId] = useState<string | null>(null);

  // Configure sensors for both mouse and touch
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5
      }
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(items, oldIndex, newIndex);
        onReorder(reordered);
      }
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activeItem = activeId ? items.find((item) => item.id === activeId) : null;

  return {
    sensors,
    activeId,
    activeItem,
    handleDragStart,
    handleDragEnd,
    handleDragCancel
  };
}
