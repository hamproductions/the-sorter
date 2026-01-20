/**
 * Shared Drop Preview Component
 * Used for showing drag previews across the setlist builder
 */

import { useMemo } from 'react';
import { MdDragIndicator } from 'react-icons/md';
import artistsData from '../../../../../data/artists-info.json';
import { Box, HStack, Stack } from 'styled-system/jsx';
import { Text } from '~/components/ui';
import { css } from 'styled-system/css';
import type { SetlistItem } from '~/types/setlist-prediction';
import { isSongItem } from '~/types/setlist-prediction';
import type { Song } from '~/types';
import { getSongColor } from '~/utils/song';

export interface DropPreviewProps {
  draggedItem: SetlistItem;
  songDetails?: Song;
  position?: 'top' | 'bottom';
  showDropHereText?: boolean;
}

export function DropPreview({
  draggedItem,
  songDetails,
  position,
  showDropHereText = false
}: DropPreviewProps) {
  // Get song color for border
  const songColor = useMemo(() => {
    if (!isSongItem(draggedItem) || !songDetails) return undefined;
    return getSongColor(songDetails);
  }, [draggedItem, songDetails]);

  // Get artist name
  const artistName = useMemo(() => {
    if (!songDetails?.artists) return undefined;
    const firstArtist = songDetails.artists[0];
    if (!firstArtist) return undefined;
    const artist = artistsData.find((a) => a.id === firstArtist.id);
    return artist?.name;
  }, [songDetails]);

  return (
    <Box
      className={css({
        '&[data-position=bottom]': { mt: 1 },
        '&[data-position=top]': { mb: 1 },
        '&[data-drop-text=true]': { w: 'full', maxW: '400px' }
      })}
      data-position={position}
      data-drop-text={showDropHereText}
      opacity={0.6}
    >
      <Box
        className={css({
          '&[data-has-color=true]': { borderColor: 'var(--song-color)', borderLeft: '4px solid' }
        })}
        style={{ '--song-color': songColor } as React.CSSProperties}
        data-has-color={Boolean(isSongItem(draggedItem) && songColor)}
        borderColor="border.emphasized"
        borderRadius="md"
        borderWidth="2px"
        w="full"
        py={2}
        px={3}
        bgColor="bg.muted"
        borderStyle="dashed"
      >
        <HStack gap={2} justifyContent="space-between" alignItems="flex-start">
          <HStack flex={1} gap={2} alignItems="flex-start">
            <Box display="flex" alignItems="center">
              <MdDragIndicator size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
            </Box>

            {/* Preview Content */}
            <Stack flex={1} gap={0.5}>
              {isSongItem(draggedItem) ? (
                <>
                  <Text fontSize="sm" fontWeight="medium" lineHeight="1.4">
                    {draggedItem.isCustomSong
                      ? draggedItem.customSongName
                      : songDetails?.name ||
                        draggedItem.customSongName ||
                        `Song ${draggedItem.songId}`}
                  </Text>
                  {!draggedItem.isCustomSong && (draggedItem.remarks || artistName) && (
                    <Text
                      color={draggedItem.remarks ? 'fg.muted' : 'var(--song-color)'}
                      fontSize="xs"
                      lineHeight="1.3"
                      fontStyle={draggedItem.remarks ? 'italic' : undefined}
                    >
                      {draggedItem.remarks || artistName}
                    </Text>
                  )}
                </>
              ) : (
                <>
                  <Text fontSize="sm" fontWeight="medium" lineHeight="1.4">
                    {draggedItem.title}
                  </Text>
                  {draggedItem.remarks && (
                    <Text color="fg.muted" fontSize="xs" lineHeight="1.3" fontStyle="italic">
                      {draggedItem.remarks}
                    </Text>
                  )}
                </>
              )}
            </Stack>
          </HStack>
        </HStack>
      </Box>
      {showDropHereText && (
        <Text mt={2} color="fg.muted" fontSize="sm" textAlign="center">
          Drop here to add to setlist
        </Text>
      )}
    </Box>
  );
}
