/**
 * SetlistView Component
 * Clean, read-only setlist display for previews, exports, and sharing
 */

import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { BiLinkExternal } from 'react-icons/bi';
import artistsData from '../../../data/artists-info.json';
import { css } from 'styled-system/css';
import { Box, Stack, HStack } from 'styled-system/jsx';
import { Text } from '~/components/ui/styled/text';
import { Link } from '~/components/ui/link';
import type { SetlistItem, Performance, SetlistPrediction } from '~/types/setlist-prediction';
import { useSongData } from '~/hooks/useSongData';
import { getSongColor } from '~/utils/song';

export interface SetlistViewProps {
  prediction: SetlistPrediction;
  performance?: Performance;
  authorName?: string;
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
  prediction,
  performance,
  authorName,
  showHeader = true,
  compact = false
}: SetlistViewProps) {
  const { t } = useTranslation();
  const songData = useSongData();
  const setlist = prediction.setlist;
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
    <Stack className={css({ '&[data-compact=true]': { gap: 3 } })} data-compact={compact} gap={4}>
      {/* Header with performance info */}
      {showHeader && (
        <Box
          className={css({ '&[data-compact=true]': { pb: 2 } })}
          data-compact={compact}
          borderBottomWidth="1px"
          pb={3}
        >
          <Text
            className={css({ '&[data-compact=true]': { fontSize: 'lg' } })}
            data-compact={compact}
            mb={1}
            fontSize="xl"
            fontWeight="bold"
          >
            {performance?.name ||
              prediction.customPerformance?.name ||
              prediction.name ||
              'Setlist Prediction'}
          </Text>
          {authorName && (
            <Text mb={1} color="fg.muted" fontSize="sm">
              by {authorName}
            </Text>
          )}
          <HStack gap={3} color="fg.muted" fontSize="sm">
            {(() => {
              const date = performance?.date || prediction.customPerformance?.date;
              return date ? <Text>{new Date(date).toLocaleDateString()}</Text> : null;
            })()}
            {(performance?.venue || prediction.customPerformance?.venue) && (
              <Text>• {performance?.venue || prediction.customPerformance?.venue}</Text>
            )}
            <Text>
              {performance || prediction.customPerformance ? '•' : ''} {setlist.totalSongs} songs
            </Text>
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
                const artist = artistsData.find((a) => a.id === songDetails.artists[0].id);
                artistName = artist?.name;
              }
            }
          }

          return (
            <Box
              className={css({
                '&[data-compact=true]': { py: 2, px: 3 },
                '&[data-row-odd=true]': { bgColor: 'bg.subtle' },
                '&[data-is-divider=true]': { bgColor: 'bg.emphasized' },
                '&[data-has-color=true]': {
                  borderLeft: '4px solid',
                  borderLeftColor: 'var(--song-color)'
                }
              })}
              key={item.id || index}
              style={{ '--song-color': songColor } as React.CSSProperties}
              data-has-color={Boolean(isSongItem(item) && songColor)}
              data-is-divider={isDivider}
              data-row-odd={index % 2 !== 0}
              data-compact={compact}
              borderBottomWidth="1px"
              py={3}
              px={4}
              bgColor="bg.default"
            >
              <HStack
                className={css({ '&[data-compact=true]': { gap: 2 } })}
                data-compact={compact}
                gap={3}
                alignItems="flex-start"
              >
                {/* Item Number */}
                {itemNumber && (
                  <Text
                    className={css({
                      '&[data-compact=true]': { minW: '40px', fontSize: 'xs' },
                      '&[data-is-song=true]': { color: 'fg.default' }
                    })}
                    data-compact={compact}
                    data-is-song={isSongItem(item)}
                    flexShrink={0}
                    minW="45px"
                    color="fg.muted"
                    fontSize="sm"
                    fontWeight="medium"
                  >
                    {itemNumber}
                  </Text>
                )}

                {/* Item Content */}
                <Stack flex={1} gap={0.5}>
                  {isSongItem(item) ? (
                    <>
                      <HStack gap={2} alignItems="center">
                        <Text
                          className={css({ '&[data-compact=true]': { fontSize: 'sm' } })}
                          data-compact={compact}
                          fontSize="md"
                          fontWeight="medium"
                          lineHeight="1.4"
                        >
                          {songName}
                        </Text>
                        {!item.isCustomSong && (
                          <Link
                            href={`https://ll-fans.jp/data/song/${item.songId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                            display="inline-flex"
                            alignItems="center"
                            borderRadius="sm"
                            py={0.5}
                            px={1.5}
                            color="fg.muted"
                            bgColor="bg.subtle"
                            _hover={{ color: 'fg.default', bgColor: 'bg.emphasized' }}
                          >
                            <BiLinkExternal size={10} />
                          </Link>
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
                        className={css({
                          '&[data-compact=true]': { fontSize: 'sm' },
                          '&[data-is-divider=true]': {
                            w: 'full',
                            fontWeight: 'bold',
                            textAlign: 'center'
                          }
                        })}
                        data-compact={compact}
                        data-is-divider={isDivider}
                        w="auto"
                        fontSize="md"
                        fontWeight="medium"
                        lineHeight="1.4"
                        textAlign="left"
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
          <Text color="fg.muted" fontSize="sm" textAlign="center">
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
