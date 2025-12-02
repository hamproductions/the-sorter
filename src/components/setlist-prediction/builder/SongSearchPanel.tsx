/**
 * Song Search Panel Component
 * Allows users to search and add songs to their prediction
 */

import { useTranslation } from 'react-i18next';
import { useState, useMemo, memo, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { MdDragIndicator } from 'react-icons/md';
import { toHiragana, toRomaji } from 'wanakana';
import artistsData from '../../../../data/artists-info.json';
import { css } from 'styled-system/css';
import { Box, Stack, HStack } from 'styled-system/jsx';
import { Input } from '~/components/ui/styled/input';
import { Button } from '~/components/ui/styled/button';
import { Text } from '~/components/ui/styled/text';
import { useSongData } from '~/hooks/useSongData';
import { getSongColor } from '~/utils/song';

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

const DraggableSongItem = memo(function DraggableSongItem({
  song,
  onAddSong
}: DraggableSongItemProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({
    id: `search-${song.id}`,
    data: {
      type: 'search-result',
      songId: song.id,
      songName: song.name
    }
  });

  return (
    <Box
      className={css({ '&[data-is-dragging=true]': { opacity: 0.5, shadow: 'lg' } })}
      ref={setNodeRef}
      data-is-dragging={isDragging}
      onDoubleClick={() => onAddSong(song.id, song.name)}
      borderBottomWidth="1px"
      borderRadius="md"
      p={2}
      opacity={1}
      bgColor="bg.default"
      shadow="none"
      _hover={{ bgColor: 'bg.subtle' }}
    >
      <HStack gap={2} alignItems="flex-start">
        <Box
          ref={setActivatorNodeRef}
          data-is-dragging={isDragging}
          pt={1}
          {...attributes}
          {...listeners}
          className={css({ '&[data-is-dragging=true]': { cursor: 'grabbing' } })}
          style={{ touchAction: 'none' }}
          cursor="grab"
        >
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
            <Text
              style={{ '--song-color': song.color } as React.CSSProperties}
              color="var(--song-color)"
              fontSize="xs"
              fontWeight="medium"
            >
              {song.artist}
            </Text>
          )}
          {song.series && (
            <Text
              style={{ '--song-color': song.color } as React.CSSProperties}
              color="var(--song-color)"
              fontSize="xs"
            >
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
  maxH?: string | number;
  hideTitle?: boolean;
}

export function SongSearchPanel({
  onAddSong,
  onAddCustomSong,
  maxH = '400px',
  hideTitle = false
}: SongSearchPanelProps) {
  const { t } = useTranslation();
  const songData = useSongData();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter songs based on search query (both by song name and artist name)
  const { songMatches, artistMatches } = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return { songMatches: [], artistMatches: [] };
    }

    const query = debouncedQuery.toLowerCase();
    const queryHiragana = toHiragana(query, { passRomaji: false });
    const queryRomaji = toRomaji(queryHiragana);
    const songs = Array.isArray(songData) ? songData : [];

    // Step 1: Find songs that match by name
    const directSongMatches = new Set<string>();
    const songMatchResults = songs
      .filter((song) => {
        const phoneticName = song.phoneticName ?? '';
        const phoneticRomaji = toRomaji(phoneticName);
        const searchText = `${song.name} ${phoneticName}`.toLowerCase();
        
        // Normalize romaji by removing spaces for better matching
        const normalizedPhoneticRomaji = phoneticRomaji.replace(/\s+/g, '');
        const normalizedQueryRomaji = queryRomaji.replace(/\s+/g, '');
        
        const matches =
          searchText.includes(query) ||
          phoneticName.includes(queryHiragana) ||
          normalizedPhoneticRomaji.includes(normalizedQueryRomaji);
        if (matches) {
          directSongMatches.add(song.id);
        }
        return matches;
      })
      .slice(0, 50)
      .map((song) => {
        const artistId = song.artists?.[0];
        const artist = artistId ? artistsData.find((a) => a.id === artistId) : null;

        return {
          id: song.id,
          name: song.name,
          nameRomaji: undefined,
          series: undefined,
          seriesIds: song.seriesIds,
          artist: artist?.name,
          color: getSongColor(song)
        };
      });

    // Step 2: Find artists that match by name (Japanese or English)
    const matchingArtists = artistsData.filter((artist) => {
      const artistName = artist.name.toLowerCase();
      const artistEnglishName = artist.englishName?.toLowerCase() ?? '';
      return artistName.includes(query) || artistEnglishName.includes(query);
    });

    // Step 3: Find all songs by matching artists (excluding songs already in direct matches)
    const artistMatchResults = songs
      .filter((song) => {
        // Skip if already in direct song matches
        if (directSongMatches.has(song.id)) {
          return false;
        }

        // Check if song has any of the matching artists
        return song.artists?.some((artistId) =>
          matchingArtists.some((matchingArtist) => matchingArtist.id === artistId)
        );
      })
      .slice(0, 50)
      .map((song) => {
        const artistId = song.artists?.[0];
        const artist = artistId ? artistsData.find((a) => a.id === artistId) : null;

        return {
          id: song.id,
          name: song.name,
          nameRomaji: undefined,
          series: undefined,
          seriesIds: song.seriesIds,
          artist: artist?.name,
          color: getSongColor(song)
        };
      });

    return {
      songMatches: songMatchResults,
      artistMatches: artistMatchResults
    };
  }, [songData, debouncedQuery]);

  return (
    <Stack gap={3} h="full">
      {!hideTitle && (
        <Text fontSize="lg" fontWeight="bold">
          {t('setlistPrediction.songSearch', { defaultValue: 'Song Search' })}
        </Text>
      )}

      <Input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={t('setlistPrediction.searchSongs', {
          defaultValue: 'Search songs or artists...'
        })}
      />

      {/* Search Results */}
      <Box borderRadius="md" borderWidth="1px" maxH={maxH} overflow="auto">
        {searchQuery.trim() === '' ? (
          <Box p={4}>
            <Text color="fg.muted" textAlign="center" fontSize="sm">
              {t('setlistPrediction.startTyping', {
                defaultValue: 'Start typing to search for songs or artists...'
              })}
            </Text>
          </Box>
        ) : songMatches.length === 0 && artistMatches.length === 0 ? (
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
            {/* Song Name Matches */}
            {songMatches.length > 0 && (
              <>
                {songMatches.map((song) => (
                  <DraggableSongItem key={song.id} song={song} onAddSong={onAddSong} />
                ))}
              </>
            )}

            {/* Artist/Group Matches */}
            {artistMatches.length > 0 && (
              <>
                {songMatches.length > 0 && (
                  <Box borderTopWidth="2px" borderBottomWidth="1px" p={2} bgColor="bg.muted">
                    <Text color="fg.muted" fontSize="xs" fontWeight="semibold">
                      {t('setlistPrediction.artistMatches', {
                        defaultValue: 'Songs by matching artists/groups'
                      })}
                    </Text>
                  </Box>
                )}
                {artistMatches.map((song) => (
                  <DraggableSongItem key={song.id} song={song} onAddSong={onAddSong} />
                ))}
              </>
            )}
          </Stack>
        )}
      </Box>

      {(songMatches.length > 0 || artistMatches.length > 0) && (
        <Text color="fg.muted" textAlign="center" fontSize="xs">
          {t('setlistPrediction.showingResults', {
            count: songMatches.length + artistMatches.length,
            defaultValue: `Showing ${songMatches.length + artistMatches.length} results`
          })}
        </Text>
      )}
    </Stack>
  );
}
