/**
 * SetlistView Component
 * Clean, read-only setlist display for previews, exports, and sharing
 */

import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { BiLinkExternal } from 'react-icons/bi';
import artistsData from '../../../data/artists-info.json';
import { Box, Stack, HStack } from 'styled-system/jsx';
import { Text } from '~/components/ui/styled/text';
import type { PerformanceSetlist, SetlistItem, Performance } from '~/types/setlist-prediction';
import { useSongData } from '~/hooks/useSongData';
import { getSongColor } from '~/utils/song';

export interface SetlistViewProps {
  setlist: PerformanceSetlist;
  performance?: Performance;
  showHeader?: boolean;
  compact?: boolean;
}

// Convert number to circled number (①②③...)
const toCircledNumber = (num: number): string => {
  const circled = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];
  return circled[num - 1] || `(${num})`;
};

// Check if item is a song
const isSongItem = (item: SetlistItem): item is SetlistItem & { type: 'song' } => {
  return item.type === 'song';
};

export function SetlistView({
  setlist,
  performance,
  showHeader = true,
  compact = false
}: SetlistViewProps) {
  const { t } = useTranslation();
  const songData = useSongData();
  const items = setlist.items;

  // Find encore divider index
  const encoreDividerIndex = useMemo(() => {
    return items.findIndex((item) => {
      if (item.type === 'song') return false;
      const title = 'title' in item ? item.title : '';
      return title && (title.includes('━━ ENCORE ━━') || title.toUpperCase().includes('ENCORE'));
    });
  }, [items]);

  return (
    <Stack gap={compact ? 3 : 4}>
      {/* Header with performance info */}
      {showHeader && performance && (
        <Box borderBottomWidth="1px" pb={compact ? 2 : 3}>
          <Text mb={1} fontSize={compact ? 'lg' : 'xl'} fontWeight="bold">
            {performance.name}
          </Text>
          <HStack gap={3} color="fg.muted" fontSize="sm">
            {performance.date && <Text>{new Date(performance.date).toLocaleDateString()}</Text>}
            {performance.venue && <Text>• {performance.venue}</Text>}
            <Text>• {setlist.totalSongs} songs</Text>
          </HStack>
        </Box>
      )}

      {/* Setlist items */}
      <Stack gap={0}>
        {items.map((item, index) => {
          // Determine if this item is after encore divider
          const isAfterEncoreDivider = encoreDividerIndex !== -1 && index > encoreDividerIndex;

          // Calculate item number
          let itemNumber: string | null = null;

          if (item.type === 'song') {
            if (isAfterEncoreDivider) {
              // Count encore songs
              const encoreSongsBeforeThis = items
                .slice(0, index)
                .filter((i) => i.type === 'song' && items.indexOf(i) > encoreDividerIndex).length;
              itemNumber = `EN${(encoreSongsBeforeThis + 1).toString().padStart(2, '0')}`;
            } else {
              // Count regular songs
              const regularSongsBeforeThis = items
                .slice(0, index)
                .filter(
                  (i) =>
                    i.type === 'song' &&
                    (encoreDividerIndex === -1 || items.indexOf(i) < encoreDividerIndex)
                ).length;
              itemNumber = `M${(regularSongsBeforeThis + 1).toString().padStart(2, '0')}`;
            }
          } else if (item.type === 'mc') {
            const mcsBeforeThis = items.slice(0, index).filter((i) => i.type === 'mc').length;
            itemNumber = `MC${toCircledNumber(mcsBeforeThis + 1)}`;
          }

          // Check if this is a divider
          const title = 'title' in item ? item.title : '';
          const isDivider =
            title && (title.includes('━━') || title.includes('---') || title.includes('==='));

          // For song items, get song details
          let songName: string | undefined;
          let artistName: string | undefined;
          let songColor: string | undefined;

          if (isSongItem(item)) {
            if (item.isCustomSong) {
              songName = item.customSongName || 'Custom Song';
            } else {
              const songs = Array.isArray(songData) ? songData : [];
              const songDetails = songs.find((song) => String(song.id) === String(item.songId));
              songName = songDetails?.name || `Song ${item.songId}`;
              songColor = songDetails ? getSongColor(songDetails) : undefined;

              // Get artist name
              if (songDetails?.artists && songDetails.artists[0]) {
                const artist = artistsData.find((a) => a.id === String(songDetails.artists[0]));
                artistName = artist?.name;
              }
            }
          }

          return (
            <Box
              key={item.id || index}
              style={isSongItem(item) && songColor ? { borderLeftColor: songColor } : undefined}
              borderLeft={isSongItem(item) && songColor ? '4px solid' : undefined}
              borderBottomWidth="1px"
              py={compact ? 2 : 3}
              px={compact ? 3 : 4}
              bgColor={isDivider ? 'bg.emphasized' : index % 2 === 0 ? 'bg.default' : 'bg.subtle'}
            >
              <HStack gap={compact ? 2 : 3} alignItems="flex-start">
                {/* Item Number */}
                {itemNumber && (
                  <Text
                    flexShrink={0}
                    minW={compact ? '40px' : '45px'}
                    color={isSongItem(item) ? 'fg.default' : 'fg.muted'}
                    fontSize={compact ? 'xs' : 'sm'}
                    fontWeight="medium"
                  >
                    {itemNumber}
                  </Text>
                )}

                {/* Item Content */}
                <Stack flex={1} gap={0.5}>
                  {isSongItem(item) ? (
                    <>
                      <HStack gap={1} alignItems="center">
                        <Text fontSize={compact ? 'sm' : 'md'} fontWeight="medium" lineHeight="1.4">
                          {songName}
                        </Text>
                        {/* llfans link - only for non-custom songs */}
                        {!item.isCustomSong && (
                          <a
                            href={`https://ll-fans.jp/songs/${item.songId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'flex', alignItems: 'center' }}
                          >
                            <BiLinkExternal size={12} style={{ color: 'var(--colors-fg-muted)' }} />
                          </a>
                        )}
                      </HStack>
                      {/* Artist name */}
                      {!item.isCustomSong && artistName && !item.remarks && (
                        <Text color="fg.muted" fontSize="xs" lineHeight="1.3">
                          {artistName}
                        </Text>
                      )}
                      {/* Remarks (shown instead of artist if present) */}
                      {item.remarks && (
                        <Text color="fg.muted" fontSize="xs" lineHeight="1.3" fontStyle="italic">
                          {item.remarks}
                        </Text>
                      )}
                    </>
                  ) : (
                    <>
                      <Text
                        w={isDivider ? 'full' : 'auto'}
                        textAlign={isDivider ? 'center' : 'left'}
                        fontSize={compact ? 'sm' : 'md'}
                        fontWeight={isDivider ? 'bold' : 'medium'}
                        lineHeight="1.4"
                      >
                        {title}
                      </Text>
                      {item.remarks && (
                        <Text color="fg.muted" fontSize="xs" lineHeight="1.3" fontStyle="italic">
                          {item.remarks}
                        </Text>
                      )}
                    </>
                  )}
                </Stack>
              </HStack>
            </Box>
          );
        })}
      </Stack>

      {/* Footer with total songs */}
      {!compact && (
        <Box borderTopWidth="1px" pt={3}>
          <Text color="fg.muted" textAlign="center" fontSize="sm">
            {t('setlistPrediction.totalSongs', {
              count: setlist.totalSongs,
              defaultValue: `Total Songs: ${setlist.totalSongs}`
            })}
          </Text>
        </Box>
      )}
    </Stack>
  );
}
