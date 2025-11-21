import { Box, HStack, Stack } from 'styled-system/jsx';
import { Text } from '~/components/ui/styled/text';
import { MdDragIndicator } from 'react-icons/md';

interface DragPreviewProps {
  activeData: Record<string, unknown> | null;
}

export function DragPreview({ activeData }: DragPreviewProps) {
  if (!activeData) return null;

  const isSong = activeData.type === 'search-result' || activeData.type === 'setlist-item';
  const title = (activeData.songName as string) || (activeData.title as string) || 'Item';
  const subtitle = activeData.artist as string;

  return (
    <Box
      borderRadius="md"
      p={2}
      bgColor="bg.default"
      shadow="xl"
      borderWidth="1px"
      borderColor="border.emphasized"
      opacity={0.9}
      cursor="grabbing"
      width="300px"
    >
      <HStack gap={2} alignItems="flex-start">
        <Box pt={1} color="fg.muted">
          <MdDragIndicator size={20} />
        </Box>
        <Stack gap={0.5} flex={1}>
          <Text fontSize="sm" fontWeight="medium" lineClamp={1}>
            {title}
          </Text>
          {subtitle && (
            <Text fontSize="xs" color="fg.muted" lineClamp={1}>
              {subtitle}
            </Text>
          )}
        </Stack>
      </HStack>
    </Box>
  );
}
