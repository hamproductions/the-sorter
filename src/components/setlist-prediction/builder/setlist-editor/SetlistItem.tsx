/**
 * Individual Setlist Item Component
 * Draggable and editable setlist item
 */

import { Box, HStack, Stack } from 'styled-system/jsx';
import { Text } from '~/components/ui/styled/text';
import { IconButton } from '~/components/ui/styled/icon-button';
import type { SetlistItem as SetlistItemType } from '~/types/setlist-prediction';
import { isSongItem } from '~/types/setlist-prediction';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BiTrash } from 'react-icons/bi';
import { MdDragIndicator } from 'react-icons/md';
import { useTranslation } from 'react-i18next';

export interface SetlistItemProps {
  item: SetlistItemType;
  index: number;
  onRemove: () => void;
  onUpdate: (updates: Partial<SetlistItemType>) => void;
}

export function SetlistItem({ item, index, onRemove, onUpdate }: SetlistItemProps) {
  const { t } = useTranslation();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      p={3}
      bgColor="bg.default"
      borderWidth="1px"
      borderRadius="md"
      _hover={{ bgColor: 'bg.muted' }}
    >
      <HStack justifyContent="space-between" alignItems="center">
        {/* Drag Handle */}
        <HStack gap={2} flex={1} {...attributes} {...listeners} cursor="grab">
          <MdDragIndicator size={20} />

          {/* Position */}
          <Text fontSize="sm" fontWeight="bold" color="fg.muted" minW="30px">
            {index + 1}.
          </Text>

          {/* Item Content */}
          <Stack gap={0} flex={1}>
            {isSongItem(item) ? (
              <>
                <Text fontSize="sm" fontWeight="medium">
                  ♪ {item.isCustomSong ? item.customSongName : `Song ${item.songId}`}
                </Text>
                {item.remarks && (
                  <Text fontSize="xs" color="fg.muted">
                    {item.remarks}
                  </Text>
                )}
              </>
            ) : (
              <>
                <Text fontSize="sm" fontWeight="medium" fontStyle="italic">
                  [{item.title}]
                </Text>
                <Text fontSize="xs" color="fg.muted">
                  {item.type.toUpperCase()}
                </Text>
              </>
            )}
          </Stack>
        </HStack>

        {/* Actions */}
        <HStack gap={1}>
          <IconButton
            size="sm"
            variant="ghost"
            onClick={onRemove}
            aria-label={t('common.delete', { defaultValue: 'Delete' })}
          >
            <BiTrash />
          </IconButton>
        </HStack>
      </HStack>

      {/* Section Tag */}
      {item.section && (
        <Box mt={2}>
          <Text
            fontSize="xs"
            px={2}
            py={0.5}
            bgColor="bg.emphasized"
            borderRadius="sm"
            display="inline-block"
          >
            {item.section}
          </Text>
        </Box>
      )}
    </Box>
  );
}
