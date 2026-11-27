import { MdDragIndicator } from 'react-icons/md';
import artistsData from '../../../../data/artists-info.json';

import { css } from 'styled-system/css';
import { Box, Stack, HStack } from 'styled-system/jsx';
import { Text } from '~/components/ui/styled/text';
import type { SetlistItem as SetlistItemType } from '~/types/setlist-prediction';
import { useSongData } from '~/hooks/useSongData';
import { getSongColor } from '~/utils/song';
import type { Song } from '~/types';

/**
 * Drag Preview Component - rendered inside DragOverlay
 */
export function BuilderDragPreview({ activeData }: { activeData: Record<string, unknown> | null }) {
  const songData = useSongData();

  if (!activeData) {
    return null;
  }

  const sourceData = activeData;

  // Handle search result preview
  if (sourceData.type === 'search-result') {
    const songId = sourceData.songId as string;
    const songName = sourceData.songName as string;
    const songs = Array.isArray(songData) ? songData : [];
    const songDetails = songs.find((song: Song) => String(song.id) === String(songId));
    const songColor = songDetails ? getSongColor(songDetails) : undefined;

    // Get artist name
    const artistRef = songDetails?.artists?.[0];
    const artist = artistRef ? artistsData.find((a) => a.id === artistRef.id) : null;

    return (
      <Box
        className={css({
          '&[data-has-color=true]': { borderColor: 'var(--song-color)', borderLeft: '4px solid' }
        })}
        style={{ '--song-color': songColor } as React.CSSProperties}
        data-has-color={Boolean(songColor)}
        cursor="grabbing"
        borderRadius="md"
        minW="250px"
        py={2}
        px={3}
        bgColor="bg.default"
        opacity={0.95}
        shadow="lg"
      >
        <HStack gap={2} alignItems="flex-start">
          <Box pt={1}>
            <MdDragIndicator size={16} />
          </Box>
          <Stack flex={1} gap={0.5}>
            <Text fontSize="sm" fontWeight="medium">
              {songName}
            </Text>
            {artist?.name && (
              <Text color="var(--song-color)" fontSize="xs" fontWeight="medium">
                {artist.name}
              </Text>
            )}
          </Stack>
        </HStack>
      </Box>
    );
  }

  // Handle setlist item preview
  if (sourceData.type === 'setlist-item') {
    const item = sourceData.item as SetlistItemType;
    const songDetails = sourceData.songDetails as Song | undefined;
    const songColor = songDetails ? getSongColor(songDetails) : undefined;

    // Get artist name
    const artistRef = songDetails?.artists?.[0];
    const artist = artistRef ? artistsData.find((a) => a.id === artistRef.id) : null;

    return (
      <Box
        className={css({
          '&[data-has-color=true]': { borderColor: 'var(--song-color)', borderLeft: '4px solid' }
        })}
        style={{ '--song-color': songColor } as React.CSSProperties}
        data-has-color={Boolean(item.type === 'song' && songColor)}
        cursor="grabbing"
        borderRadius="md"
        minW="250px"
        py={2}
        px={3}
        bgColor="bg.default"
        opacity={0.95}
        shadow="lg"
      >
        <HStack gap={2} alignItems="flex-start">
          <Box pt={1}>
            <MdDragIndicator size={16} />
          </Box>
          <Stack flex={1} gap={0.5}>
            {item.type === 'song' ? (
              <>
                <Text fontSize="sm" fontWeight="medium">
                  {item.isCustomSong
                    ? item.customSongName
                    : songDetails?.name || item.customSongName || `Song ${item.songId}`}
                </Text>
                {!item.isCustomSong && (item.remarks || artist?.name) && (
                  <Text color="fg.muted" fontSize="xs">
                    {item.remarks || artist?.name}
                  </Text>
                )}
              </>
            ) : (
              <>
                <Text fontSize="sm" fontWeight="medium">
                  {item.title}
                </Text>
                {item.remarks && (
                  <Text color="fg.muted" fontSize="xs">
                    {item.remarks}
                  </Text>
                )}
              </>
            )}
          </Stack>
        </HStack>
      </Box>
    );
  }

  // Handle quick-add item preview
  if (sourceData.type === 'quick-add-item') {
    const title = sourceData.title as string;

    return (
      <Box
        cursor="grabbing"
        borderRadius="md"
        minW="250px"
        py={2}
        px={3}
        bgColor="bg.default"
        opacity={0.95}
        shadow="lg"
      >
        <HStack gap={2} alignItems="flex-start">
          <Box pt={1}>
            <MdDragIndicator size={16} />
          </Box>
          <Stack flex={1} gap={0.5}>
            <Text fontSize="sm" fontWeight="medium">
              {title}
            </Text>
          </Stack>
        </HStack>
      </Box>
    );
  }

  return null;
}
