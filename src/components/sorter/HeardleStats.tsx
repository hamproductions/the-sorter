import { useState } from 'react';
import { FaXmark } from 'react-icons/fa6';
import { HStack, Stack } from 'styled-system/jsx';
import { Button } from '~/components/ui/styled/button';
import { Dialog } from '~/components/ui/dialog';
import { IconButton } from '~/components/ui/icon-button';
import { Text } from '~/components/ui/styled/text';
import { getSongColor } from '~/utils/song';
import { getSongName } from '~/utils/names';
import type { Song } from '~/types/songs';

interface HeardleStatsProps {
  correctCount: number;
  failedSongs: Song[];
  lang: string;
}

export const HeardleStats = ({ correctCount, failedSongs, lang }: HeardleStatsProps) => {
  const [showDialog, setShowDialog] = useState(false);
  const total = correctCount + failedSongs.length;
  const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  if (total === 0) return null;

  return (
    <>
      <HStack gap="2" justifyContent="center">
        <Text fontSize="sm">
          {correctCount}/{total} ({percent}%) correct
        </Text>
        {failedSongs.length > 0 && (
          <Button size="xs" variant="subtle" onClick={() => setShowDialog(true)}>
            View failed ({failedSongs.length})
          </Button>
        )}
      </HStack>
      <Dialog.Root
        open={showDialog}
        lazyMount
        unmountOnExit
        onOpenChange={({ open }) => {
          if (!open) setShowDialog(false);
        }}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="lg" maxH="80vh">
            <Stack gap="4" p="6">
              <Stack gap="1">
                <Dialog.Title>Failed Songs</Dialog.Title>
                <Dialog.Description>
                  {failedSongs.length} song{failedSongs.length !== 1 ? 's' : ''} failed
                </Dialog.Description>
              </Stack>
              <Stack gap="2" overflow="auto" maxH="calc(80vh - 150px)">
                {failedSongs.map((song) => {
                  const color = getSongColor(song);
                  return (
                    <HStack
                      key={song.id}
                      style={{ borderLeft: color ? `4px solid ${color}` : undefined }}
                      rounded="l2"
                      p="2"
                      bg="bg.subtle"
                    >
                      <Text fontWeight="medium" lineClamp={1}>
                        {getSongName(song.name, song.englishName, lang)}
                      </Text>
                    </HStack>
                  );
                })}
              </Stack>
            </Stack>
            <Dialog.CloseTrigger asChild position="absolute" top="2" right="2">
              <IconButton aria-label="Close Dialog" variant="ghost" size="sm">
                <FaXmark />
              </IconButton>
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  );
};
