/**
 * Setlist Editor Panel - Drag-and-drop setlist editing
 */

import { useTranslation } from 'react-i18next';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SetlistItem as SetlistItemComponent } from './setlist-editor/SetlistItem';
import { Box, Stack, HStack } from 'styled-system/jsx';
import { Text } from '~/components/ui/styled/text';
import { Button } from '~/components/ui/styled/button';
import type { SetlistItem } from '~/types/setlist-prediction';

export interface SetlistEditorPanelProps {
  items: SetlistItem[];
  onReorder: (items: SetlistItem[]) => void;
  onRemove: (itemId: string) => void;
  onUpdate: (itemId: string, updates: Partial<SetlistItem>) => void;
  onOpenImport?: () => void;
  dropIndicator?: {
    itemId: string;
    position: 'top' | 'bottom';
    draggedItem?: any;
    songDetails?: any;
  } | null;
}

export function SetlistEditorPanel({
  items,
  onRemove,
  onUpdate,
  onOpenImport,
  dropIndicator
}: SetlistEditorPanelProps) {
  const { t } = useTranslation();

  // Make this panel a drop zone
  const { setNodeRef } = useDroppable({
    id: 'setlist-drop-zone'
  });

  if (items.length === 0) {
    return (
      <Stack
        ref={setNodeRef}
        justifyContent="center"
        alignItems="center"
        h="full"
        p={8}
        transition="background-color 0.2s"
      >
        <Box borderRadius="lg" borderWidth="2px" p={8} textAlign="center" borderStyle="dashed">
          <Text mb={2} fontSize="lg" fontWeight="medium">
            {t('setlistPrediction.emptySetlist', {
              defaultValue: 'Your setlist is empty'
            })}
          </Text>
          <Text mb={4} color="fg.muted" fontSize="sm">
            {t('setlistPrediction.emptySetlistHint', {
              defaultValue: 'Search for songs on the left to add them here'
            })}
          </Text>
          {onOpenImport && (
            <Button onClick={onOpenImport}>{t('common.import', { defaultValue: 'Import' })}</Button>
          )}
        </Box>
      </Stack>
    );
  }

  return (
    <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
      <Stack
        ref={setNodeRef}
        data-setlist-editor="true"
        gap={2}
        minH="full"
        p={4}
        bgColor="bg.subtle"
        transition="background-color 0.2s"
      >
        <HStack justifyContent="space-between" alignItems="center" mb={2}>
          <Text fontSize="lg" fontWeight="bold">
            {t('setlistPrediction.yourSetlist', { defaultValue: 'Your Setlist' })}
          </Text>
          <Text color="fg.muted" fontSize="sm">
            {t('setlistPrediction.itemCount', {
              count: items.length,
              defaultValue: `${items.length} items`
            })}
          </Text>
        </HStack>

        {items.map((item, index) => {
        // Find the first encore divider
        const encoreDividerIndex = items.findIndex((i) => {
          const isSong = i.type === 'song';
          return (
            !isSong &&
            'title' in i &&
            i.title &&
            (i.title.includes('━━ ENCORE ━━') || i.title.toUpperCase().includes('ENCORE'))
          );
        });

        // Determine if this item is after the encore divider
        const isAfterEncoreDivider = encoreDividerIndex !== -1 && index > encoreDividerIndex;
        const isEncore = isAfterEncoreDivider;

        // Calculate numbers based on position relative to encore
        const mcsBeforeThis = items.slice(0, index).filter((i) => i.type === 'mc');

        let songNumber: number | undefined;
        let encoreNumber: number | undefined;

        if (item.type === 'song') {
          if (isEncore) {
            // Count encore songs (songs after encore divider)
            const encoreSongsBeforeThis = items.slice(0, index).filter((i) => {
              if (i.type !== 'song') return false;
              const iIdx = items.indexOf(i);
              return encoreDividerIndex !== -1 && iIdx > encoreDividerIndex;
            });
            encoreNumber = encoreSongsBeforeThis.length + 1;
          } else {
            // Count regular songs (songs before encore divider)
            const regularSongsBeforeThis = items.slice(0, index).filter((i) => {
              if (i.type !== 'song') return false;
              const iIdx = items.indexOf(i);
              return encoreDividerIndex === -1 || iIdx < encoreDividerIndex;
            });
            songNumber = regularSongsBeforeThis.length + 1;
          }
        }

        const mcNumber = item.type === 'mc' ? mcsBeforeThis.length + 1 : undefined;

        // Check if this item should show drop indicator
        const showDropIndicator =
          dropIndicator?.itemId === item.id ? dropIndicator.position : null;

        return (
          <SetlistItemComponent
            key={item.id}
            item={item}
            index={index}
            songNumber={songNumber}
            encoreNumber={encoreNumber}
            mcNumber={mcNumber}
            showSectionDivider={false}
            sectionName={undefined}
            onRemove={() => onRemove(item.id)}
            onUpdate={(updates) => onUpdate(item.id, updates)}
            dropIndicatorPosition={showDropIndicator}
            draggedItem={dropIndicator?.itemId === item.id ? dropIndicator.draggedItem : undefined}
            draggedSongDetails={
              dropIndicator?.itemId === item.id ? dropIndicator.songDetails : undefined
            }
          />
        );
      })}
      </Stack>
    </SortableContext>
  );
}
