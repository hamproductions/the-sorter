import { MdDragIndicator } from 'react-icons/md';
import { Box, HStack, Stack } from 'styled-system/jsx';
import { Text } from '~/components/ui';

interface DragPreviewProps {
  activeData: Record<string, unknown> | null;
}

export function DragPreview({ activeData }: DragPreviewProps) {
  if (!activeData) return null;

  const title = (activeData.songName as string) || (activeData.title as string) || 'Item';
  const subtitle = activeData.artist as string;

  return (
    <Box
      cursor="grabbing"
      borderColor="border.emphasized"
      borderRadius="md"
      borderWidth="1px"
      width="300px"
      p={2}
      bgColor="bg.default"
      opacity={0.9}
      shadow="xl"
    >
      <HStack gap={2} alignItems="flex-start">
        <Box pt={1} color="fg.muted">
          <MdDragIndicator size={20} />
        </Box>
        <Stack flex={1} gap={0.5}>
          <Text fontSize="sm" fontWeight="medium" lineClamp={1}>
            {title}
          </Text>
          {subtitle && (
            <Text color="fg.muted" fontSize="xs" lineClamp={1}>
              {subtitle}
            </Text>
          )}
        </Stack>
      </HStack>
    </Box>
  );
}
