/**
 * Song Search Panel Component
 * Allows users to search and add songs to their prediction
 */

import { useTranslation } from 'react-i18next';
import { useState, useMemo, memo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { MdDragIndicator } from 'react-icons/md';
import artistsData from '../../../../data/artists-info.json';
import { Box, Stack, HStack } from 'styled-system/jsx';
import { Input } from '~/components/ui/styled/input';
import { Button } from '~/components/ui/styled/button';
import { Text } from '~/components/ui/styled/text';
import { useSongData } from '~/hooks/useSongData';
import { getSongColor } from '~/utils/song';

interface Song {
  id: string;
  name: string;
  'name-romaji'?: string;
  'name-english'?: string;
  series?: string;
  seriesIds?: number[];
  artists?: string[];
}

interface DraggableSongItemProps {
  song: {
    id: string;
    name: string;
    nameRomaji?: string;
    artist?: string;
    series?: string;
    color: string;
  };
  onAddSong: (songId: string, songTitle: string) => void;
}

const DraggableSongItem = memo(function DraggableSongItem({ song, onAddSong }: DraggableSongItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `search-${song.id}`,
    data: {
      type: 'search-result',
      songId: song.id,
      songName: song.name
    }
  });

  return (
    <Box
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onDoubleClick={() => onAddSong(song.id, song.name)}
      borderBottomWidth="1px"
      borderRadius="md"
      p={2}
      opacity={isDragging ? 0.5 : 1}
      bgColor="bg.default"
      shadow={isDragging ? 'lg' : 'none'}
      cursor={isDragging ? 'grabbing' : 'grab'}
      _hover={{ bgColor: 'bg.subtle' }}
    >
      <HStack gap={2} alignItems="flex-start">
        <Box pt={1}>
          <MdDragIndicator size={16} />
        </Box>
        <Stack flex={1} gap={0.5}>
          <Text fontSize="sm" fontWeight="medium">
            {song.name}
          </Text>
          {song.nameRomaji && (
            <Text color="fg.muted" fontSize="xs">
              {song.nameRomaji}
            </Text>
          )}
          {song.artist && (
            <Text style={{ color: song.color }} fontSize="xs" fontWeight="medium">
              {song.artist}
            </Text>
          )}
          {song.series && (
            <Text style={{ color: song.color }} fontSize="xs">
              {song.series}
            </Text>
          )}
        </Stack>
      </HStack>
    </Box>
  );
});

export interface SongSearchPanelProps {
  onAddSong: (songId: string, songTitle: string) => void;
  onAddCustomSong?: (customName: string) => void;
}

export function SongSearchPanel({ onAddSong, onAddCustomSong }: SongSearchPanelProps) {
  const { t } = useTranslation();
  const songData = useSongData();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter songs based on search query
  const filteredSongs = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }

    const query = searchQuery.toLowerCase();
    const songs = Array.isArray(songData) ? songData : [];
    return songs
      .filter((song) => {
        const s = song as Song;
        const searchText =
          `${s.name} ${s['name-romaji'] || ''} ${s['name-english'] || ''}`.toLowerCase();
        return searchText.includes(query);
      })
      .slice(0, 50) // Limit results to 50
      .map((song) => {
        const s = song as Song;
        // Get artist name
        const artistId = s.artists?.[0];
        const artist = artistId ? artistsData.find((a) => a.id === artistId) : null;

        return {
          id: s.id,
          name: s.name,
          nameRomaji: s['name-romaji'],
          series: s.series,
          seriesIds: s.seriesIds,
          artist: artist?.name,
          color: getSongColor(s as any)
        };
      });
  }, [songData, searchQuery]);

  return (
    <Stack gap={3}>
      <Text fontSize="lg" fontWeight="bold">
        {t('setlistPrediction.songSearch', { defaultValue: 'Song Search' })}
      </Text>

      <Input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={t('setlistPrediction.searchSongs', {
          defaultValue: 'Search songs...'
        })}
      />

      {/* Search Results */}
      <Box borderRadius="md" borderWidth="1px" maxH="400px" overflow="auto">
        {searchQuery.trim() === '' ? (
          <Box p={4}>
            <Text color="fg.muted" textAlign="center" fontSize="sm">
              {t('setlistPrediction.startTyping', {
                defaultValue: 'Start typing to search for songs...'
              })}
            </Text>
          </Box>
        ) : filteredSongs.length === 0 ? (
          <Box p={4}>
            <Stack gap={3} alignItems="center">
              <Text color="fg.muted" textAlign="center" fontSize="sm">
                {t('setlistPrediction.noSongsFound', {
                  defaultValue: 'No songs found'
                })}
              </Text>
              {onAddCustomSong && searchQuery.trim() && (
                <Button
                  size="sm"
                  onClick={() => {
                    onAddCustomSong(searchQuery.trim());
                    setSearchQuery('');
                  }}
                >
                  {t('setlistPrediction.addCustomSong', {
                    defaultValue: `Add "${searchQuery.trim()}" as custom song`
                  })}
                </Button>
              )}
            </Stack>
          </Box>
        ) : (
          <Stack gap={0}>
            {filteredSongs.map((song) => (
              <DraggableSongItem key={song.id} song={song} onAddSong={onAddSong} />
            ))}
          </Stack>
        )}
      </Box>

      {filteredSongs.length > 0 && (
        <Text color="fg.muted" textAlign="center" fontSize="xs">
          {t('setlistPrediction.showingResults', {
            count: filteredSongs.length,
            defaultValue: `Showing ${filteredSongs.length} results`
          })}
        </Text>
      )}
    </Stack>
  );
}
