/**
 * Setlist Editor Panel - Drag-and-drop setlist editing
 */

import { useTranslation } from 'react-i18next';
import { Box, Stack, HStack } from 'styled-system/jsx';
import { Text } from '~/components/ui/styled/text';
import { IconButton } from '~/components/ui/styled/icon-button';
import type { SetlistItem } from '~/types/setlist-prediction';
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { useSetlistDragDrop } from '~/hooks/setlist-prediction/useSetlistDragDrop';
import { SetlistItem as SetlistItemComponent } from './setlist-editor/SetlistItem';
import { BiTrash } from 'react-icons/bi';

export interface SetlistEditorPanelProps {
  items: SetlistItem[];
  onReorder: (items: SetlistItem[]) => void;
  onRemove: (itemId: string) => void;
  onUpdate: (itemId: string, updates: Partial<SetlistItem>) => void;
}

export function SetlistEditorPanel({
  items,
  onReorder,
  onRemove,
  onUpdate
}: SetlistEditorPanelProps) {
  const { t } = useTranslation();

  const { sensors, activeItem, handleDragStart, handleDragEnd, handleDragCancel } =
    useSetlistDragDrop({
      items,
      onReorder
    });

  if (items.length === 0) {
    return (
      <Stack alignItems="center" justifyContent="center" h="full" p={8}>
        <Box textAlign="center" p={8} borderWidth="2px" borderRadius="lg" borderStyle="dashed">
          <Text fontSize="lg" fontWeight="medium" mb={2}>
            {t('setlistPrediction.emptySetlist', {
              defaultValue: 'Your setlist is empty'
            })}
          </Text>
          <Text fontSize="sm" color="fg.muted">
            {t('setlistPrediction.emptySetlistHint', {
              defaultValue: 'Search for songs on the left to add them here'
            })}
          </Text>
        </Box>
      </Stack>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <Stack p={4} gap={2} minH="full">
        <HStack justifyContent="space-between" alignItems="center" mb={2}>
          <Text fontSize="lg" fontWeight="bold">
            {t('setlistPrediction.yourSetlist', { defaultValue: 'Your Setlist' })}
          </Text>
          <Text fontSize="sm" color="fg.muted">
            {t('setlistPrediction.itemCount', {
              count: items.length,
              defaultValue: `${items.length} items`
            })}
          </Text>
        </HStack>

        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          {items.map((item, index) => (
            <SetlistItemComponent
              key={item.id}
              item={item}
              index={index}
              onRemove={() => onRemove(item.id)}
              onUpdate={(updates) => onUpdate(item.id, updates)}
            />
          ))}
        </SortableContext>
      </Stack>

      <DragOverlay>
        {activeItem ? (
          <Box p={3} bgColor="bg.default" borderWidth="1px" borderRadius="md" shadow="lg">
            <Text fontSize="sm" fontWeight="medium">
              {activeItem.position + 1}.{' '}
              {activeItem.type === 'song'
                ? `Song ${(activeItem as any).songId}`
                : (activeItem as any).title}
            </Text>
          </Box>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
