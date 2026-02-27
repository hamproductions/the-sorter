import { useEffect, useMemo, useState } from 'react';

import artistsData from '../../data/artists-info.json';
import { getArtistName } from '~/utils/names';
import { fuzzySearch, getSearchScore } from '~/utils/search';
import { getSongColor } from '~/utils/song';
import type { Song } from '~/types/songs';

export interface SongSearchResult {
  id: string;
  name: string;
  englishName?: string;
  artist?: string;
  color: string;
}

export interface SongSearchItem {
  value: string;
  label: string;
  englishName?: string;
  artist?: string;
  color: string;
  group: 'song' | 'artist';
}

export function useSongSearch(songs: Song[], query: string, lang: string) {
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 150);
    return () => clearTimeout(timer);
  }, [query]);

  const { songMatches, artistMatches } = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return { songMatches: [] as SongSearchResult[], artistMatches: [] as SongSearchResult[] };
    }

    const q = debouncedQuery.toLowerCase();
    const list = Array.isArray(songs) ? songs : [];

    const directSongIds = new Set<string>();
    const songMatchResults: SongSearchResult[] = list
      .filter((song) => {
        const matches = fuzzySearch(song, debouncedQuery);
        if (matches) directSongIds.add(song.id);
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
          artist: artist ? getArtistName(artist.name, lang) : undefined,
          color: getSongColor(song)
        };
      });

    const matchingArtists = artistsData.filter((artist) => {
      const artistName = artist.name.toLowerCase();
      const artistEnglishName = artist.englishName?.toLowerCase() ?? '';
      return artistName.includes(q) || artistEnglishName.includes(q);
    });

    const artistMatchResults: SongSearchResult[] = list
      .filter((song) => {
        if (directSongIds.has(song.id)) return false;
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
          artist: artist ? getArtistName(artist.name, lang) : undefined,
          color: getSongColor(song)
        };
      });

    return { songMatches: songMatchResults, artistMatches: artistMatchResults };
  }, [songs, debouncedQuery, lang]);

  const items: SongSearchItem[] = useMemo(() => {
    const toItem = (r: SongSearchResult, group: 'song' | 'artist'): SongSearchItem => ({
      value: r.id,
      label: r.name,
      englishName: r.englishName,
      artist: r.artist,
      color: r.color,
      group
    });
    return [
      ...songMatches.map((r) => toItem(r, 'song')),
      ...artistMatches.map((r) => toItem(r, 'artist'))
    ];
  }, [songMatches, artistMatches]);

  return { songMatches, artistMatches, items };
}
