/**
 * Song Search Panel Component
 * Allows users to search and add songs to their prediction
 */

import { useTranslation } from 'react-i18next';
import { useState, useMemo, memo, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { MdArrowForward, MdDragIndicator } from 'react-icons/md';

import artistsData from '../../../../data/artists-info.json';
import { getArtistName, getSongName } from '~/utils/names';
import { fuzzySearch, getSearchScore } from '~/utils/search';
import { css } from 'styled-system/css';
import { Box, Stack, HStack } from 'styled-system/jsx';
import { Input } from '~/components/ui/styled/input';
import { Button } from '~/components/ui/styled/button';
import { Text } from '~/components/ui/styled/text';
import { useSongData } from '~/hooks/useSongData';
import { getSongColor } from '~/utils/song';
import type { Song } from '~/types/songs';

interface DraggableSongItemProps {
  song: {
    id: string;
    name: string;
    englishName?: string;
    artist?: string;
    series?: string;
    color: string;
  };
  lang: string;
  onAddSong: (songId: string, songTitle: string) => void;
  singleClickSelect?: boolean;
}

const DraggableSongItem = memo(function DraggableSongItem({
  song,
  lang,
  onAddSong,
  singleClickSelect
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
      onClick={singleClickSelect ? () => onAddSong(song.id, song.name) : undefined}
      style={singleClickSelect ? { cursor: 'pointer' } : undefined}
      borderBottomWidth="1px"
      borderRadius="md"
      p={2}
      bgColor="bg.default"
      opacity={1}
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
            {getSongName(song.name, song.englishName, lang)}
          </Text>
          {lang === 'en' && song.englishName && (
            <Text color="fg.muted" fontSize="xs">
              {song.name}
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

        <button
          type="button"
          style={{
            touchAction: 'none',
            cursor: 'pointer',
            border: 'none',
            background: 'none',
            padding: 0,
            display: 'flex',
            alignItems: 'center'
          }}
          onClick={(e) => {
            e.stopPropagation(); // Prevent event from bubbling to parent DraggableSongItem
            onAddSong(song.id, song.name);
          }}
          onDoubleClick={(e) => {
            e.stopPropagation(); // Prevent double-click from bubbling to parent
          }}
          aria-label={`Add ${song.name} to setlist`}
        >
          <MdArrowForward size={16} />
        </button>
      </HStack>
    </Box>
  );
});

export interface SongSearchPanelProps {
  onAddSong: (songId: string, songTitle: string) => void;
  onAddCustomSong?: (customName: string) => void;
  maxH?: string | number;
  hideTitle?: boolean;
  /** Optional custom song inventory to search within (for Heardle mode). If not provided, searches all songs. */
  songInventory?: Song[];
  /** When true, a single click on a song row triggers onAddSong (instead of requiring double-click or arrow button) */
  singleClickSelect?: boolean;
}

export function SongSearchPanel({
  onAddSong,
  onAddCustomSong,
  maxH = '400px',
  hideTitle = false,
  songInventory,
  singleClickSelect
}: SongSearchPanelProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const allSongData = useSongData();
  // Use provided inventory or fall back to all songs
  const songData = songInventory ?? allSongData;
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
    const songs = Array.isArray(songData) ? songData : [];

    // Step 1: Find songs that match by name, sorted by relevance
    const directSongMatches = new Set<string>();
    const songMatchResults = songs
      .filter((song) => {
        const matches = fuzzySearch(song, debouncedQuery);
        if (matches) {
          directSongMatches.add(song.id);
        }
        return matches;
      })
      .toSorted((a, b) => getSearchScore(b, debouncedQuery) - getSearchScore(a, debouncedQuery))
      .slice(0, 50)
      .map((song) => {
        const artistRef = song.artists?.[0];
        const artist = artistRef ? artistsData.find((a) => a.id === artistRef.id) : null;

        return {
          id: song.id,
          name: song.name,
          englishName: song.englishName,
          series: undefined,
          seriesIds: song.seriesIds,
          artist: artist ? getArtistName(artist.name, lang) : undefined,
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
        return song.artists?.some((artistRef) =>
          matchingArtists.some((matchingArtist) => matchingArtist.id === artistRef.id)
        );
      })
      .slice(0, 50)
      .map((song) => {
        const artistRef = song.artists?.[0];
        const artist = artistRef ? artistsData.find((a) => a.id === artistRef.id) : null;

        return {
          id: song.id,
          name: song.name,
          englishName: song.englishName,
          series: undefined,
          seriesIds: song.seriesIds,
          artist: artist ? getArtistName(artist.name, lang) : undefined,
          color: getSongColor(song)
        };
      });

    return {
      songMatches: songMatchResults,
      artistMatches: artistMatchResults
    };
  }, [songData, debouncedQuery, lang]);

  return (
    <Stack gap={3} h="full">
      {!hideTitle && (
        <Text fontSize="lg" fontWeight="bold">
          {t('setlistPrediction.songSearch', { defaultValue: 'Song Search' })}
        </Text>
      )}

      <Box flexShrink={0}>
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('setlistPrediction.searchSongs', {
            defaultValue: 'Search songs or artists...'
          })}
        />
      </Box>

      {/* Search Results */}
      <Box style={{ maxHeight: maxH }} borderRadius="md" borderWidth="1px" overflow="auto">
        {searchQuery.trim() === '' ? (
          <Box p={4}>
            <Text color="fg.muted" fontSize="sm" textAlign="center">
              {t('setlistPrediction.startTyping', {
                defaultValue: 'Start typing to search for songs or artists...'
              })}
            </Text>
          </Box>
        ) : songMatches.length === 0 && artistMatches.length === 0 ? (
          <Box p={4}>
            <Stack gap={3} alignItems="center">
              <Text color="fg.muted" fontSize="sm" textAlign="center">
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
                  <DraggableSongItem
                    key={song.id}
                    song={song}
                    lang={lang}
                    onAddSong={onAddSong}
                    singleClickSelect={singleClickSelect}
                  />
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
                  <DraggableSongItem
                    key={song.id}
                    song={song}
                    lang={lang}
                    onAddSong={onAddSong}
                    singleClickSelect={singleClickSelect}
                  />
                ))}
              </>
            )}
          </Stack>
        )}
      </Box>

      {(songMatches.length > 0 || artistMatches.length > 0) && (
        <Text color="fg.muted" fontSize="xs" textAlign="center">
          {t('setlistPrediction.showingResults', {
            count: songMatches.length + artistMatches.length,
            defaultValue: `Showing ${songMatches.length + artistMatches.length} results`
          })}
        </Text>
      )}
    </Stack>
  );
}
