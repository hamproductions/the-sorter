import { hasFilter } from './filter';
import { matchSongFilter } from './song-filter';
import type { SongFilterType } from '~/components/sorter/SongFilters';
import type { Song } from '~/types/songs';

export const getSongSortList = (
  songs: Song[],
  songFilters: SongFilterType | null | undefined,
  options: {
    performanceSongIds?: string[];
    heardleMode?: boolean;
    excludedSongIds?: Set<string>;
  } = {}
): Song[] => {
  const { performanceSongIds, heardleMode, excludedSongIds } = options;
  let filtered = songs;

  if (performanceSongIds && performanceSongIds.length > 0) {
    const perfIds = new Set(performanceSongIds);
    filtered = filtered.filter((s) => perfIds.has(s.id));
  }

  if (songFilters && hasFilter(songFilters)) {
    filtered = filtered.filter((s) => matchSongFilter(s, songFilters));
  }

  if (heardleMode) {
    filtered = filtered.filter((s) => s.wikiAudioUrl);
  }

  if (excludedSongIds && excludedSongIds.size > 0) {
    filtered = filtered.filter((s) => !excludedSongIds.has(s.id));
  }

  return filtered;
};
