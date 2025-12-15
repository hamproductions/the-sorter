import { MdDragIndicator } from 'react-icons/md';
import { Box, HStack, Stack } from 'styled-system/jsx';
import { Text } from '~/components/ui/styled/text';

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
      opacity={0.9}
      bgColor="bg.default"
      shadow="xl"
    >
      <HStack gap={2} alignItems="flex-start">
        <Box pt={1} color="fg.muted">
          <MdDragIndicator size={20} />
        </Box>
        <Stack flex={1} gap={0.5}>
          <Text lineClamp={1} fontSize="sm" fontWeight="medium">
            {title}
          </Text>
          {subtitle && (
            <Text color="fg.muted" lineClamp={1} fontSize="xs">
              {subtitle}
            </Text>
          )}
        </Stack>
      </HStack>
    </Box>
  );
}
