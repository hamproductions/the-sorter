/**
 * Draggable Quick Add Item - Component for dragging MC/Encore/Other items into setlist
 */

import { useDraggable } from '@dnd-kit/core';

import { MdDragIndicator } from 'react-icons/md';
import { css } from 'styled-system/css';
import { Box, HStack, Stack } from 'styled-system/jsx';
import { Text } from '~/components/ui/styled/text';

export interface DraggableQuickAddItemProps {
  id: string;
  idSuffix?: string;
  title: string;
  type: 'mc' | 'other';
  description?: string;
  onDoubleClick?: () => void;
}

export function DraggableQuickAddItem({
  id,
  idSuffix,
  title,
  type,
  description,
  onDoubleClick
}: DraggableQuickAddItemProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({
    id: `quick-add-${id}${idSuffix ? `-${idSuffix}` : ''}`,
    data: {
      type: 'quick-add-item',
      itemType: type,
      title: title
    }
  });

  return (
    <Box
      className={css({ '&[data-is-dragging=true]': { opacity: 0.5, shadow: 'lg' } })}
      ref={setNodeRef}
      data-is-dragging={isDragging}
      onDoubleClick={onDoubleClick}
      borderRadius="md"
      borderWidth="1px"
      p={2}
      opacity={1}
      bgColor="bg.default"
      shadow="none"
      _hover={{ bgColor: 'bg.subtle' }}
    >
      <HStack gap={2} alignItems="center">
        <Box
          ref={setActivatorNodeRef}
          data-is-dragging={isDragging}
          {...attributes}
          {...listeners}
          className={css({ '&[data-is-dragging=true]': { cursor: 'grabbing' } })}
          style={{ touchAction: 'none' }}
          cursor="grab"
        >
          <MdDragIndicator size={16} />
        </Box>
        <Stack flex={1} gap={0}>
          <Text fontSize="sm" fontWeight="medium">
            {title}
          </Text>
          {description && (
            <Text color="fg.muted" fontSize="xs">
              {description}
            </Text>
          )}
        </Stack>
      </HStack>
    </Box>
  );
}
