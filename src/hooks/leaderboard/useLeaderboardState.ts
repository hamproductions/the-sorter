import { useEffect, useRef, useState } from 'react';
import { SORT_KEYS, type SortKey, type TableSort } from '~/components/leaderboard/LeaderboardTable';
import type { FilterType } from '~/components/sorter/CharacterFilters';
import type { SongFilterType } from '~/components/sorter/SongFilters';
import {
  RANKING_MODES,
  type LeaderboardView,
  type RankingFilter,
  type RankingKind,
  type RankingMode
} from '~/types/global-ranking';
import { countFilter } from '~/utils/filter-summary';
import {
  DEFAULT_SORT,
  EMPTY_CHARACTER_FILTER,
  EMPTY_SONG_FILTER,
  HISTORY_KEYS,
  isSpecificSongSelection,
  parseList
} from '~/utils/leaderboard';

export function useLeaderboardState() {
  const [kind, setKind] = useState<RankingKind>('character');
  const [mode, setMode] = useState<RankingMode | 'all'>('chara');
  const [period, setPeriod] = useState('all');
  const [exactOnly, setExactOnly] = useState(false);
  const [globalRanks, setGlobalRanks] = useState(false);
  const [characterFilter, setCharacterFilter] = useState<FilterType | null | undefined>(
    EMPTY_CHARACTER_FILTER
  );
  const [songFilter, setSongFilter] = useState<SongFilterType | null | undefined>(
    EMPTY_SONG_FILTER
  );
  const [performanceIds, setPerformanceIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [minAppearances, setMinAppearances] = useState(1);
  const [mineOnly, setMineOnly] = useState(false);
  const [sort, setSort] = useState<TableSort>(DEFAULT_SORT);
  const [page, setPage] = useState(1);
  const [hydrated, setHydrated] = useState(false);

  const activeMode = mode === 'all' ? undefined : mode;
  const activeFilter = kind === 'character' ? characterFilter : songFilter;
  const filterCount = countFilter({ ...activeFilter }) + performanceIds.length;
  const keepGlobalRanks = filterCount > 0 && globalRanks;
  const view: LeaderboardView =
    filterCount === 0 || keepGlobalRanks ? 'global' : exactOnly ? 'cohort' : 'subset';

  useEffect(() => {
    if (!hydrated || filterCount > 0) return;
    setExactOnly(false);
    setGlobalRanks(false);
  }, [filterCount, hydrated]);

  const isSpecificSelection = isSpecificSongSelection(kind, songFilter, performanceIds);
  const lastSpecificSelection = useRef(isSpecificSelection);

  useEffect(() => {
    if (!hydrated) return;
    const previous = lastSpecificSelection.current;
    lastSpecificSelection.current = isSpecificSelection;
    if (previous === isSpecificSelection) return;
    setExactOnly(isSpecificSelection);
    setGlobalRanks(false);
  }, [hydrated, isSpecificSelection]);

  const restoring = useRef(true);

  useEffect(() => {
    const readUrl = () => {
      restoring.current = true;
      const params = new URLSearchParams(window.location.search);
      const nextKind = params.get('kind') === 'song' ? 'song' : 'character';
      const nextMode = params.get('mode');
      setKind(nextKind);
      setMode(
        nextMode === 'all' && nextKind === 'song'
          ? 'all'
          : (RANKING_MODES[nextKind] as readonly string[]).includes(nextMode ?? '')
            ? (nextMode as RankingMode)
            : nextKind === 'character'
              ? 'chara'
              : 'all'
      );
      setPeriod(params.get('period') ?? 'all');
      setExactOnly(params.get('exact') === '1');
      setGlobalRanks(params.get('global') === '1');
      let urlFilter: RankingFilter | null = null;
      try {
        const filter = JSON.parse(params.get('filter') ?? 'null') as RankingFilter | null;
        urlFilter = filter;
        setCharacterFilter({
          ...EMPTY_CHARACTER_FILTER,
          ...(nextKind === 'character' ? filter : null)
        } as FilterType);
        setSongFilter({
          ...EMPTY_SONG_FILTER,
          ...(nextKind === 'song' ? filter : null)
        } as SongFilterType);
      } catch {}
      const nextPerformanceIds = parseList(params.get('perf'));
      setPerformanceIds(nextPerformanceIds);
      lastSpecificSelection.current = isSpecificSongSelection(
        nextKind,
        urlFilter as SongFilterType | null,
        nextPerformanceIds
      );
      const sortKey = params.get('sort');
      if (SORT_KEYS.includes(sortKey as SortKey)) {
        setSort({ key: sortKey as SortKey, desc: params.get('dir') === 'desc' });
      } else {
        setSort(DEFAULT_SORT);
      }
      setSearch(params.get('q') ?? '');
      setMinAppearances(Math.max(1, Number(params.get('min')) || 1));
      setMineOnly(params.get('mine') === '1');
      setPage(Math.max(1, Number(params.get('page')) || 1));
      setHydrated(true);
    };
    readUrl();
    window.addEventListener('popstate', readUrl);
    return () => window.removeEventListener('popstate', readUrl);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const params = new URLSearchParams();
    if (kind !== 'character') params.set('kind', kind);
    if (mode !== (kind === 'character' ? 'chara' : 'all')) params.set('mode', mode);
    if (period !== 'all') params.set('period', period);
    if (filterCount > 0) {
      if (countFilter({ ...activeFilter }) > 0) {
        params.set(
          'filter',
          JSON.stringify(
            Object.fromEntries(Object.entries({ ...activeFilter }).filter(([, v]) => v?.length))
          )
        );
      }
      if (performanceIds.length > 0) params.set('perf', performanceIds.join(','));
      if (exactOnly) params.set('exact', '1');
      if (globalRanks) params.set('global', '1');
    }
    if (sort.key !== DEFAULT_SORT.key || sort.desc !== DEFAULT_SORT.desc) {
      params.set('sort', sort.key);
      params.set('dir', sort.desc ? 'desc' : 'asc');
    }
    if (search) params.set('q', search);
    if (minAppearances > 1) params.set('min', String(minAppearances));
    if (mineOnly) params.set('mine', '1');
    if (page > 1) params.set('page', String(page));
    const query = params.toString();
    const url = `${window.location.pathname}${query ? `?${query}` : ''}`;
    const current = new URLSearchParams(window.location.search);
    const push =
      !restoring.current && HISTORY_KEYS.some((key) => current.get(key) !== params.get(key));
    restoring.current = false;
    if (url !== `${window.location.pathname}${window.location.search}`) {
      window.history[push ? 'pushState' : 'replaceState'](window.history.state, '', url);
    }
  }, [
    hydrated,
    kind,
    mode,
    period,
    filterCount,
    activeFilter,
    performanceIds,
    exactOnly,
    globalRanks,
    sort,
    search,
    minAppearances,
    mineOnly,
    page
  ]);

  return {
    kind,
    setKind,
    mode,
    setMode,
    period,
    setPeriod,
    exactOnly,
    setExactOnly,
    globalRanks,
    setGlobalRanks,
    characterFilter,
    setCharacterFilter,
    songFilter,
    setSongFilter,
    performanceIds,
    setPerformanceIds,
    search,
    setSearch,
    minAppearances,
    setMinAppearances,
    mineOnly,
    setMineOnly,
    sort,
    setSort,
    page,
    setPage,
    hydrated,
    activeMode,
    activeFilter,
    filterCount,
    keepGlobalRanks,
    view
  };
}
