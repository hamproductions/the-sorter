import { useState, useCallback, useMemo } from 'react';
import {
  MeasuringStrategy,
  useSensors,
  useSensor,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  defaultDropAnimationSideEffects,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  type DropAnimation
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import type { usePredictionBuilder } from './usePredictionBuilder';
import type { SetlistItem as SetlistItemType } from '~/types/setlist-prediction';
import type { useSongData } from '~/hooks/useSongData';
import type { Song } from '~/types';

type Builder = ReturnType<typeof usePredictionBuilder>;

export function useSetlistDragAndDrop({
  prediction,
  songData,
  addSong: _addSong,
  reorderItems,
  addNonSongItem
}: Pick<Builder, 'prediction' | 'addSong' | 'reorderItems' | 'addNonSongItem'> & {
  songData: ReturnType<typeof useSongData>;
}) {
  // Track active drag state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeData, setActiveData] = useState<Record<string, unknown> | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  // Calculate drop indicator for visual feedback (without triggering reorders)
  const dropIndicator = useMemo(() => {
    if (!activeId || !overId || !activeData) return null;

    // Handle end position droppable (invisible elements after setlist)
    // Need both setlist-drop-zone and setlist-drop-zone-end since
    // setlist-drop-zone only seems to cover the area far below the last item
    // but setlist-drop-zone-end fills in the gap between the last item and the setlist-drop-zone
    if (overId === 'setlist-drop-zone-end' || overId === 'setlist-drop-zone') {
      // set overid to be the last item's id
      const overId = prediction.setlist.items[prediction.setlist.items.length - 1]?.id;
      if (activeData.type === 'search-result') {
        const songs = Array.isArray(songData) ? songData : [];
        const songId = activeData.songId as string;
        const songDetails = songs.find((song: Song) => String(song.id) === String(songId));

        const tempItem: SetlistItemType = {
          id: `temp-${songId}`,
          type: 'song' as const,
          songId: String(songId),
          isCustomSong: false,
          position: 0
        };

        // render at bottom of last item
        return {
          itemId: overId,
          position: 'bottom' as const,
          draggedItem: tempItem,
          songDetails
        };
      }

      if (activeData.type === 'quick-add-item') {
        const title = activeData.title as string;
        const itemType = activeData.itemType as 'mc' | 'other';

        const tempItem: SetlistItemType = {
          id: `temp-quick-add`,
          type: itemType,
          title: title,
          position: 0
        };

        // render at bottom of last item
        return {
          itemId: overId,
          position: 'bottom' as const,
          draggedItem: tempItem,
          songDetails: undefined
        };
      }

      return null;
    }

    const overData = prediction.setlist.items.find((item) => item.id === overId);
    if (!overData) return null;

    // Show indicator for cross-list dragging (search to setlist)
    if (activeData.type === 'search-result') {
      const songs = Array.isArray(songData) ? songData : [];
      const songId = activeData.songId as string;
      const songDetails = songs.find((song: Song) => String(song.id) === String(songId));

      const tempItem: SetlistItemType = {
        id: `temp-${songId}`,
        type: 'song' as const,
        songId: String(songId),
        isCustomSong: false,
        position: 0
      };

      return {
        itemId: overId,
        position: 'top' as const,
        draggedItem: tempItem,
        songDetails
      };
    }

    // Show indicator for quick-add items (MC/Encore/Other)
    if (activeData.type === 'quick-add-item') {
      const title = activeData.title as string;
      const itemType = activeData.itemType as 'mc' | 'other';

      const tempItem: SetlistItemType = {
        id: `temp-quick-add`,
        type: itemType,
        title: title,
        position: 0
      };

      return {
        itemId: overId,
        position: 'top' as const,
        draggedItem: tempItem,
        songDetails: undefined
      };
    }

    return null;
  }, [activeId, overId, activeData, prediction.setlist.items, songData]);

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
    setActiveData((event.active.data.current as Record<string, unknown>) || null);
  }, []);

  // Handle drag over - only track position, don't update items yet
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    setOverId(over ? String(over.id) : null);
  }, []);

  // Handle drag end - commit changes
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      // Clear active state
      setActiveId(null);
      setActiveData(null);
      setOverId(null);

      const { active, over } = event;

      // If no target, don't do anything
      if (!over) {
        return;
      }

      const activeData = active.data.current;
      const overData = over.data.current;

      // Handle cross-list dragging (search to setlist)
      if (activeData?.type === 'search-result') {
        const { songId } = activeData;
        const currentItems = prediction.setlist.items;
        let insertPosition = currentItems.length;

        // Find insert position if dropping over an item (not the zone itself or end droppable)
        if (over.id !== 'setlist-drop-zone' && over.id !== 'setlist-drop-zone-end') {
          const overIndex = currentItems.findIndex((item) => item.id === over.id);
          if (overIndex !== -1) {
            insertPosition = overIndex;
          }
        }

        // Add the song at the correct position
        _addSong(songId, insertPosition);
        return;
      }

      // Handle quick-add items (MC/Encore/Other)
      if (activeData?.type === 'quick-add-item') {
        const { title, itemType } = activeData;
        const currentItems = prediction.setlist.items;
        let insertPosition = currentItems.length;

        // Find insert position if dropping over an item (not the zone itself or end droppable)
        if (over.id !== 'setlist-drop-zone' && over.id !== 'setlist-drop-zone-end') {
          const overIndex = currentItems.findIndex((item) => item.id === over.id);
          if (overIndex !== -1) {
            insertPosition = overIndex;
          }
        }

        // Add the non-song item at the correct position
        addNonSongItem(title as string, itemType as 'mc' | 'other', insertPosition);
        return;
      }

      // Handle within-list reordering
      if (activeData?.type === 'setlist-item' && overData?.type === 'setlist-item') {
        const draggedItem = activeData.item;
        const currentItems = prediction.setlist.items;
        const activeIndex = currentItems.findIndex((item) => item.id === draggedItem.id);
        const overIndex = currentItems.findIndex((item) => item.id === over.id);

        if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
          const newItems = arrayMove(currentItems, activeIndex, overIndex);
          reorderItems(newItems);
        }
      }
    },
    [prediction.setlist.items, _addSong, reorderItems, addNonSongItem]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 0,
        tolerance: 5
      }
    }),
    useSensor(KeyboardSensor)
  );

  // Measuring configuration for better performance
  const measuring = useMemo(
    () => ({
      droppable: {
        strategy: MeasuringStrategy.WhileDragging
      },
      draggable: {
        measure: (element: HTMLElement) => element.getBoundingClientRect()
      }
    }),
    []
  );

  // Drop animation configuration for smooth transitions
  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5'
        }
      }
    })
  };

  return {
    activeId,
    activeData,
    dropIndicator,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    sensors,
    measuring,
    dropAnimation
  };
}
