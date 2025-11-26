/**
 * Draggable Quick Add Item - Component for dragging MC/Encore/Other items into setlist
 */

import { useDraggable } from '@dnd-kit/core';
import { MdDragIndicator } from 'react-icons/md';
import { Box, HStack, Stack } from 'styled-system/jsx';
import { Text } from '~/components/ui/styled/text';

export interface DraggableQuickAddItemProps {
  id: string;
  title: string;
  type: 'mc' | 'other';
  description?: string;
  onDoubleClick?: () => void;
}

export function DraggableQuickAddItem({
  id,
  title,
  type,
  description,
  onDoubleClick
}: DraggableQuickAddItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `quick-add-${id}`,
    data: {
      type: 'quick-add-item',
      itemType: type,
      title: title
    }
  });

  return (
    <Box
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onDoubleClick={onDoubleClick}
      borderRadius="md"
      borderWidth="1px"
      p={2}
      opacity={isDragging ? 0.5 : 1}
      bgColor="bg.default"
      shadow={isDragging ? 'lg' : 'none'}
      cursor={isDragging ? 'grabbing' : 'grab'}
      _hover={{ bgColor: 'bg.subtle' }}
      onDoubleClick={onDoubleClick}
    >
      <HStack gap={2} alignItems="center">
        <Box>
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
