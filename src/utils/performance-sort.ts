import type { SetlistOrderEntry } from '~/types/performance-sort';
import type { PerformanceSortMeta } from '~/types/performance-sort';
import type { Performance, PerformanceSetlist } from '~/types/setlist-prediction';
import type { Song } from '~/types/songs';
import { isSongItem } from '~/types/setlist-prediction';
import { getFullPerformanceName } from './names';

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

export function getPerformanceLegName(performance: Performance): string {
  const name = performance.performanceName?.trim();
  if (!name) return performance.tourName;

  const withoutSuffix = name
    .replace(/\s*[(（][^()（）]*[)）]\s*$/u, '')
    .replace(/\s*(?:Day\.?\s*\d+|DAY\s*\d+)$/u, '')
    .trim();

  return withoutSuffix || name;
}

export function getPerformanceSelectionLabel(performances: Performance[]): string {
  if (performances.length === 0) return '';
  if (performances.length === 1) return getFullPerformanceName(performances[0]);

  const tourNames = new Set(performances.map((performance) => performance.tourName));
  if (tourNames.size === 1) {
    const tourName = performances[0].tourName;
    const legNames = new Set(performances.map(getPerformanceLegName));
    if (legNames.size === 1) {
      const legName = [...legNames][0];
      if (legName !== tourName) {
        return `${tourName} - ${legName} (${performances.length} performances)`;
      }
    }
    return `${tourName} (${performances.length} performances)`;
  }

  return `${performances.length} performances`;
}

export function buildPerformanceSortSelection(
  performanceIds: string[],
  performances: Performance[],
  setlistsByPerformanceId: Map<string, PerformanceSetlist>,
  songs: Song[]
): { songIds: string[]; meta: PerformanceSortMeta } | undefined {
  const selectedIds = new Set(performanceIds);
  const selectedPerformances = performances
    .filter((performance) => selectedIds.has(performance.id))
    .toSorted((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (selectedPerformances.length === 0) return undefined;

  const orderEntries = selectedPerformances.flatMap((performance) => {
    const setlist = setlistsByPerformanceId.get(performance.id);
    if (!setlist) return [];

    return computeSortableSetlistLabels(setlist, songs).map((entry) => ({
      ...entry,
      label:
        selectedPerformances.length > 1
          ? `${performance.performanceName ?? performance.tourName} ${entry.label}`
          : entry.label,
      performanceId: performance.id,
      performanceName: performance.performanceName ?? performance.tourName,
      date: performance.date
    }));
  });
  const uniqueSongIds = [...new Set(orderEntries.map((entry) => entry.songId))];
  if (uniqueSongIds.length === 0) return undefined;

  const firstPerformance = selectedPerformances[0];
  const selectionLabel = getPerformanceSelectionLabel(selectedPerformances);
  return {
    songIds: uniqueSongIds,
    meta: {
      performanceId: selectedPerformances.length === 1 ? selectedPerformances[0].id : undefined,
      performanceIds: selectedPerformances.map((performance) => performance.id),
      tourName: firstPerformance.tourName,
      performanceName:
        selectedPerformances.length === 1 ? firstPerformance.performanceName : selectionLabel,
      selectionLabel,
      date: firstPerformance.date,
      venue: selectedPerformances.length === 1 ? firstPerformance.venue : undefined,
      setlistOrder: orderEntries
    }
  };
}
