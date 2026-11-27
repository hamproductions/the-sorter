import type { TableSort } from '~/components/leaderboard/LeaderboardTable';
import type { FilterType } from '~/components/sorter/CharacterFilters';
import type { SongFilterType } from '~/components/sorter/SongFilters';
import type { LeaderboardEntry, RankingFilter, RankingKind } from '~/types/global-ranking';

export const EMPTY_CHARACTER_FILTER: FilterType = { series: [], school: [], units: [] };
export const EMPTY_SONG_FILTER: SongFilterType = {
  series: [],
  artists: [],
  types: [],
  characters: [],
  discographies: [],
  songs: [],
  years: []
};

export const DEFAULT_SORT: TableSort = { key: 'rank', desc: false };

export const compareEntries = (sort: TableSort) => (a: LeaderboardEntry, b: LeaderboardEntry) =>
  sort.key === 'rank'
    ? (a.rank - b.rank) * (sort.desc ? -1 : 1)
    : (a[sort.key] - b[sort.key]) * (sort.desc ? -1 : 1) || a.rank - b.rank;

export const parseList = (value: string | null) => (value ? value.split(',').filter(Boolean) : []);

export const HISTORY_KEYS = ['kind', 'mode', 'period', 'filter', 'perf', 'exact', 'global'];
export const AGGREGATIONS = ['subset', 'global', 'cohort'] as const;
export type Aggregation = (typeof AGGREGATIONS)[number];

export const sameIds = (a: (string | number)[] = [], b: (string | number)[] = []) =>
  a.length === b.length && a.map(String).sort().join() === b.map(String).sort().join();

export const sameFilter = (a: RankingFilter, b: RankingFilter) =>
  [...new Set([...Object.keys(a), ...Object.keys(b)])].every((key) => sameIds(a[key], b[key]));

export const isSpecificSongSelection = (
  kind: RankingKind,
  filter: SongFilterType | null | undefined,
  performanceIds: string[]
) =>
  kind === 'song' &&
  (performanceIds.length > 0 || !!filter?.discographies?.length || !!filter?.songs?.length);
