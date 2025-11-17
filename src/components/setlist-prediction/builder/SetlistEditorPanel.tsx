/**
 * Setlist Editor Panel - Drag-and-drop setlist editing
 */

import { useTranslation } from 'react-i18next';
import { useDroppable } from '@dnd-kit/react';
import { CollisionPriority } from '@dnd-kit/abstract';
import { SetlistItem as SetlistItemComponent } from './setlist-editor/SetlistItem';
import { Box, Stack, HStack } from 'styled-system/jsx';
import { Text } from '~/components/ui/styled/text';
import { Button } from '~/components/ui/styled/button';
import type { SetlistItem } from '~/types/setlist-prediction';

export interface SetlistEditorPanelProps {
  items: SetlistItem[];
  previewItem?: { songId: string; songName: string; insertIndex: number } | null;
  onReorder: (items: SetlistItem[]) => void;
  onRemove: (itemId: string) => void;
  onUpdate: (itemId: string, updates: Partial<SetlistItem>) => void;
  onOpenImport?: () => void;
}

export function SetlistEditorPanel({
  items,
  previewItem,
  onRemove,
  onUpdate,
  onOpenImport
}: SetlistEditorPanelProps) {
  const { t } = useTranslation();

  // Make this panel a drop zone
  const { ref } = useDroppable({
    id: 'setlist-drop-zone',
    type: 'column',
    accept: 'item',
    collisionPriority: CollisionPriority.Low
  });

  if (items.length === 0) {
    return (
      <Stack
        ref={ref}
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
    <Stack ref={ref} gap={2} minH="full" p={4} bgColor="bg.subtle" transition="background-color 0.2s" data-setlist-editor="true">
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
        return (
          <div key={`${item.id}-${index}`}>
            {/* Show preview placeholder for drag from search */}
            {previewItem && previewItem.insertIndex === index && (
              <Box
                key="preview-placeholder"
                borderRadius="md"
                mb={2}
                py={2}
                px={3}
                opacity={0.6}
                bgColor="accent.muted"
                borderWidth="2px"
                borderStyle="dashed"
                borderColor="accent.default"
              >
                <HStack gap={2} alignItems="center">
                  <Text fontSize="sm" fontWeight="medium">
                    + {previewItem.songName}
                  </Text>
                </HStack>
              </Box>
            )}

            {(() => {
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
                const isAfterEncoreDivider =
                  encoreDividerIndex !== -1 && index > encoreDividerIndex;
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

                return (
                  <SetlistItemComponent
                    item={item}
                    index={index}
                    songNumber={songNumber}
                    encoreNumber={encoreNumber}
                    mcNumber={mcNumber}
                    showSectionDivider={false}
                    sectionName={undefined}
                    onRemove={() => onRemove(item.id)}
                    onUpdate={(updates) => onUpdate(item.id, updates)}
                  />
                );
              })()}
          </div>
        );
      })}

      {/* Show preview placeholder at the end if inserting after last item */}
      {previewItem && previewItem.insertIndex >= items.length && (
        <Box
          key="preview-placeholder-end"
          borderRadius="md"
          mb={2}
          py={2}
          px={3}
          opacity={0.6}
          bgColor="accent.muted"
          borderWidth="2px"
          borderStyle="dashed"
          borderColor="accent.default"
        >
          <HStack gap={2} alignItems="center">
            <Text fontSize="sm" fontWeight="medium">
              + {previewItem.songName}
            </Text>
          </HStack>
        </Box>
      )}
    </Stack>
  );
}
