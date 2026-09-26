import { sha256 } from './hash';
import type { FilterType } from '~/components/sorter/CharacterFilters';
import type { SongFilterType } from '~/components/sorter/SongFilters';
import type { RankingKind, RankingMode } from '~/types/global-ranking';

export type CanonicalFilter = Record<string, (string | number)[]>;

const FILTER_KEYS: Record<RankingKind, Record<string, 'string' | 'number'>> = {
  character: { series: 'string', school: 'string', units: 'string' },
  song: {
    series: 'string',
    artists: 'string',
    types: 'string',
    characters: 'number',
    discographies: 'number',
    songs: 'number',
    years: 'number'
  }
};

const MAX_FILTER_VALUES = 2000;
const MAX_VALUE_LENGTH = 64;

export const canonicalizeFilter = (
  kind: RankingKind,
  raw: unknown
): CanonicalFilter | undefined => {
  if (raw === null || raw === undefined) return {};
  if (typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const result: CanonicalFilter = {};
  for (const [key, type] of Object.entries(FILTER_KEYS[kind])) {
    const value = (raw as Record<string, unknown>)[key];
    if (value === undefined || value === null) continue;
    if (!Array.isArray(value) || value.length > MAX_FILTER_VALUES) return undefined;
    if (type === 'string') {
      if (!value.every((v) => typeof v === 'string' && v.length <= MAX_VALUE_LENGTH)) {
        return undefined;
      }
      const unique = [...new Set(value as string[])].sort();
      if (unique.length > 0) result[key] = unique;
    } else {
      if (!value.every((v) => typeof v === 'number' && Number.isInteger(v))) return undefined;
      const unique = [...new Set(value as number[])].sort((a, b) => a - b);
      if (unique.length > 0) result[key] = unique;
    }
  }
  return result;
};

export const normalizeIds = (ids: string[] | undefined) => [...new Set(ids ?? [])].sort();

export const cohortHashOf = (
  kind: RankingKind,
  mode: RankingMode,
  filter: CanonicalFilter,
  performanceIds: string[]
) => sha256(JSON.stringify([kind, mode, filter, performanceIds])).slice(0, 32);

export const toCharacterFilter = (filter: CanonicalFilter): FilterType => ({
  series: (filter.series as string[]) ?? [],
  school: (filter.school as string[]) ?? [],
  units: (filter.units as string[]) ?? []
});

export const toSongFilter = (filter: CanonicalFilter): SongFilterType => ({
  series: (filter.series as string[]) ?? [],
  artists: (filter.artists as string[]) ?? [],
  types: (filter.types as SongFilterType['types']) ?? [],
  characters: (filter.characters as number[]) ?? [],
  discographies: (filter.discographies as number[]) ?? [],
  songs: (filter.songs as number[]) ?? [],
  years: (filter.years as number[]) ?? []
});
