/**
 * Invisible droppable element for adding items to the end of a setlist
 */

import { useDroppable } from '@dnd-kit/core';
import { Box } from 'styled-system/jsx';

export function SetlistEndDropZone() {
  const { setNodeRef } = useDroppable({
    id: 'setlist-drop-zone-end'
  });

  return (
    <Box
      ref={setNodeRef}
      display="flex"
      justifyContent="center"
      alignItems="center"
      borderRadius="md"
      w="full"
      minH="60px"
      mt={2}
    ></Box>
  );
}
