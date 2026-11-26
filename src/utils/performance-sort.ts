import { uniqBy } from 'lodash-es';
import type { Character } from '~/types';
import type {
  PerformancePerformer,
  PerformanceSortMeta,
  SetlistOrderEntry
} from '~/types/performance-sort';
import type { Performance, PerformanceSetlist } from '~/types/setlist-prediction';
import type { Song } from '~/types/songs';
import { isSongItem } from '~/types/setlist-prediction';
import type { Locale } from '~/i18n';
import { getFullName } from './character';
import { getArtistName, getFullPerformanceName } from './names';
import {
  getPerformanceDisplayPerformers,
  getPerformanceVersionNote,
  getPerformerSignature,
  getSetlistPerformers,
  getSongGroupMemberIds
} from './performance-performers';

export { getPerformanceDisplayPerformers, getPerformanceVersionNote, getPerformerSignature };

export interface SongPerformanceDisplayEntry extends SetlistOrderEntry {
  dayLabel?: string;
}

export function getDistinctSongPerformanceEntries(
  songOrId: Song | string,
  setlistOrder?: SetlistOrderEntry[]
): SongPerformanceDisplayEntry[] {
  if (!setlistOrder?.length) return [];
  const songId = typeof songOrId === 'string' ? songOrId : songOrId.id;
  return setlistOrder
    .filter((entry) => entry.songId === songId)
    .map((entry) => ({ ...entry, dayLabel: entry.performanceName }));
}

export interface SongPerformanceLineup {
  key: string;
  group: SetlistOrderEntry[];
  labels: string[];
  note: string;
  performers: PerformancePerformer[];
}

export function getSongPerformanceLineups(
  song: Song,
  setlistOrder?: SetlistOrderEntry[]
): SongPerformanceLineup[] {
  const lineups = new Map<string, SetlistOrderEntry[]>();
  for (const entry of getDistinctSongPerformanceEntries(song, setlistOrder)) {
    const key = JSON.stringify([
      getPerformerSignature(entry.performers),
      getPerformanceVersionNote(entry),
      entry.customSongName
    ]);
    lineups.set(key, [...(lineups.get(key) ?? []), entry]);
  }
  return [...lineups].map(([key, group]) => ({
    key,
    group,
    labels: group.map((item) => {
      const day = item.performanceName?.match(/Day\.?\s*(\d+)/i)?.[1];
      const position = item.label.match(/(?:M|EN)\d+$/)?.[0] ?? item.label;
      return [day ? `Day ${day}` : item.date, position].filter(Boolean).join(' · ');
    }),
    note: getPerformanceVersionNote(group[0]),
    performers: getPerformanceDisplayPerformers(song, group[0].performers)
  }));
}

export function formatPerformancePerformersText(
  song: Song | undefined,
  setlistOrder: SetlistOrderEntry[] | undefined,
  characters: Character[],
  lang: string,
  shortName?: (name: string) => string | undefined
): string | undefined {
  if (!song || !setlistOrder?.length) return undefined;
  const lines = getSongPerformanceLineups(song, setlistOrder).map(({ group, note, performers }) => {
    const customName = group[0].customSongName;
    const groupMembers = performers.length ? getSongGroupMemberIds(song) : new Set<string>();
    const hasGuests = performers.some(
      (performer) => performer.kind === 'group' || !groupMembers.has(performer.characterId)
    );
    const names = (hasGuests ? performers : [])
      .map((performer) => {
        if (performer.kind === 'group') {
          return shortName?.(performer.name) ?? getArtistName(performer.name, lang);
        }
        const character = characters.find((item) => String(item.id) === performer.characterId);
        if (!character) return undefined;
        return shortName?.(character.fullName) ?? getFullName(character, lang as Locale);
      })
      .filter((name): name is string => Boolean(name));
    return [customName !== song.name ? customName : undefined, note, names.join(', ')]
      .filter(Boolean)
      .join(' · ');
  });
  const unique = uniqBy(lines.filter(Boolean), (line) => line.replace(/\s/g, ''));
  return unique.length ? unique.join('; ') : undefined;
}

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

    const remarks = item?.remarks?.trim() || undefined;
    const performers = getSetlistPerformers(remarks);

    return [
      {
        ...entry,
        songId,
        ...(customSongName ? { customSongName } : {}),
        ...(remarks ? { remarks } : {}),
        ...(performers ? { performers } : {})
      }
    ];
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
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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
      tourName: performance.tourName,
      venue: performance.venue,
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
      contextVersion: 1,
      date: firstPerformance.date,
      venue: selectedPerformances.length === 1 ? firstPerformance.venue : undefined,
      setlistOrder: orderEntries
    }
  };
}
