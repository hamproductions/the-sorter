/**
 * Invisible droppable element for adding items to the end of a setlist
 */

import { useDroppable } from '@dnd-kit/core';
import { Box } from 'styled-system/jsx';

export function SetlistEndDropZone() {
  const { setNodeRef } = useDroppable({
    id: 'setlist-drop-zone-end'
  });

  return <Box ref={setNodeRef} data-dropzone="end" w="full" h="4" mt={2} />;
}
