import type { SetlistOrderEntry } from '~/types/performance-sort';
import type { PerformanceSetlist } from '~/types/setlist-prediction';
import type { Song } from '~/types/songs';
import { isSongItem } from '~/types/setlist-prediction';

export function computeSetlistLabels(setlist: PerformanceSetlist): SetlistOrderEntry[] {
  const { items, sections } = setlist;
  const entries: SetlistOrderEntry[] = [];

  const getSectionType = (index: number): string => {
    for (const section of sections) {
      if (index >= section.startIndex && index <= section.endIndex) {
        return section.type ?? 'main';
      }
    }
    return 'main';
  };

  const songCountBySection: Record<string, number> = {};

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!isSongItem(item)) continue;

    const sectionType = getSectionType(i);
    songCountBySection[sectionType] = (songCountBySection[sectionType] ?? 0) + 1;

    let label: string;
    if (sectionType === 'encore') {
      label = `EN${songCountBySection[sectionType].toString().padStart(2, '0')}`;
    } else {
      label = `M${songCountBySection[sectionType].toString().padStart(2, '0')}`;
    }
    entries.push({ songId: item.songId, label });
  }

  return entries;
}

function normalizeSongName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function createSongLookup(songs: Song[]) {
  const lookup = new Map<string, string | null>();

  for (const song of songs) {
    for (const candidate of [song.name, song.englishName, song.phoneticName]) {
      if (!candidate) continue;
      const key = normalizeSongName(candidate);
      if (!key) continue;

      if (!lookup.has(key)) {
        lookup.set(key, song.id);
        continue;
      }

      if (lookup.get(key) !== song.id) {
        lookup.set(key, null);
      }
    }
  }

  return lookup;
}

export function computeSortableSetlistLabels(
  setlist: PerformanceSetlist,
  songs: Song[]
): SetlistOrderEntry[] {
  const songLookup = createSongLookup(songs);
  const songMap = new Map(songs.map((song) => [song.id, song]));

  return computeSetlistLabels(setlist).flatMap((entry, index) => {
    const item = setlist.items.filter(isSongItem)[index];
    const customSongName = item?.customSongName?.trim();
    const normalizedCustomSongName = customSongName ? normalizeSongName(customSongName) : '';
    const resolvedSongId = normalizedCustomSongName
      ? (songLookup.get(normalizedCustomSongName) ?? undefined)
      : undefined;
    const sourceSong = songMap.get(entry.songId);
    const matchesSourceSong =
      sourceSong &&
      normalizedCustomSongName &&
      [sourceSong.name, sourceSong.englishName, sourceSong.phoneticName]
        .filter((name): name is string => Boolean(name))
        .some((name) => normalizeSongName(name) === normalizedCustomSongName);
    const songId = customSongName
      ? (resolvedSongId ?? (matchesSourceSong ? entry.songId : undefined))
      : sourceSong?.id;

    if (!songId) return [];

    return [{ ...entry, songId }];
  });
}
