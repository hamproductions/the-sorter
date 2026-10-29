import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaFilter, FaXmark } from 'react-icons/fa6';
import { CharactersIcon, SongsIcon } from '~/components/layout/section-icons';
import { Metadata } from '~/components/layout/Metadata';
import {
  LeaderboardSelect,
  type LeaderboardSelectOption
} from '~/components/leaderboard/LeaderboardSelect';
import { LeaderboardPodium } from '~/components/leaderboard/LeaderboardPodium';
import {
  LeaderboardTable,
  SORT_KEYS,
  type SortKey,
  type TableSort
} from '~/components/leaderboard/LeaderboardTable';
import { useRankingItems } from '~/components/leaderboard/useRankingItems';
import type { FilterType } from '~/components/sorter/CharacterFilters';
import { LoadingCharacterFilters } from '~/components/sorter/LoadingCharacterFilters';
import type { SongFilterType } from '~/components/sorter/SongFilters';
import { Button } from '~/components/ui/button';
import { Drawer } from '~/components/ui/drawer';
import { FormLabel } from '~/components/ui/form-label';
import { IconButton } from '~/components/ui/icon-button';
import { Input } from '~/components/ui/input';
import { Pagination } from '~/components/ui/pagination';
import { Switch } from '~/components/ui/switch';
import { Tabs } from '~/components/ui/tabs';
import { Text } from '~/components/ui/text';
import {
  RANKING_MODES,
  type CohortSummary,
  type LeaderboardEntry,
  type LeaderboardResponse,
  type LeaderboardView,
  type RankingFilter,
  type RankingKind,
  type RankingMode,
  type StatsResponse
} from '~/types/global-ranking';
import { useFilterNameLookup } from '~/hooks/useFilterNameLookup';
import { countFilter, describeFilter } from '~/utils/filter-summary';
import {
  type LeaderboardQuery,
  fetchCohorts,
  fetchLeaderboard,
  fetchStats,
  isGlobalRankingEnabled
} from '~/utils/global-ranking';
import { getLocallySortedIds } from '~/utils/save-state';
import { css } from 'styled-system/css';
import { HStack, Stack, Wrap, styled } from 'styled-system/jsx';

const CharacterFilters = lazy(() =>
  import('~/components/sorter/CharacterFilters').then((m) => ({ default: m.CharacterFilters }))
);

const SongFilters = lazy(() =>
  import('~/components/sorter/SongFilters').then((m) => ({ default: m.SongFilters }))
);

const EMPTY_CHARACTER_FILTER: FilterType = { series: [], school: [], units: [] };
const EMPTY_SONG_FILTER: SongFilterType = {
  series: [],
  artists: [],
  types: [],
  characters: [],
  discographies: [],
  songs: [],
  years: []
};

const PAGE_SIZE = 50;
const MIN_APPEARANCE_OPTIONS = [1, 3, 5, 10, 25, 50];
const DEFAULT_SORT: TableSort = { key: 'rank', desc: false };

const compareEntries = (sort: TableSort) => (a: LeaderboardEntry, b: LeaderboardEntry) =>
  sort.key === 'rank'
    ? (a.rank - b.rank) * (sort.desc ? -1 : 1)
    : (a[sort.key] - b[sort.key]) * (sort.desc ? -1 : 1) || a.rank - b.rank;

const parseList = (value: string | null) => (value ? value.split(',').filter(Boolean) : []);

const HISTORY_KEYS = ['kind', 'mode', 'period', 'filter', 'perf', 'exact', 'global'];
const AGGREGATIONS = ['subset', 'global', 'cohort'] as const;
type Aggregation = (typeof AGGREGATIONS)[number];

const sameIds = (a: (string | number)[] = [], b: (string | number)[] = []) =>
  a.length === b.length && a.map(String).toSorted().join() === b.map(String).toSorted().join();

const sameFilter = (a: RankingFilter, b: RankingFilter) =>
  [...new Set([...Object.keys(a), ...Object.keys(b)])].every((key) => sameIds(a[key], b[key]));

function QuickFilterRow({
  label,
  testId,
  children
}: {
  label: string;
  testId: string;
  children: React.ReactNode;
}) {
  return (
    <Stack gap="2" w="full">
      <Text color="fg.muted" fontSize="xs" fontWeight="bold">
        {label}
      </Text>
      <Wrap data-testid={testId} gap="2">
        {children}
      </Wrap>
    </Stack>
  );
}

export function Page() {
  const { t, i18n } = useTranslation();
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
  const [stats, setStats] = useState<StatsResponse>();
  const [cohorts, setCohorts] = useState<CohortSummary[]>([]);
  const [result, setResult] = useState<LeaderboardResponse>();
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>(
    isGlobalRankingEnabled ? 'loading' : 'idle'
  );
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState('');
  const [minAppearances, setMinAppearances] = useState(1);
  const [mineOnly, setMineOnly] = useState(false);
  const [mineIds, setMineIds] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<TableSort>(DEFAULT_SORT);
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
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
      try {
        const filter = JSON.parse(params.get('filter') ?? 'null') as RankingFilter | null;
        setCharacterFilter({
          ...EMPTY_CHARACTER_FILTER,
          ...(nextKind === 'character' ? filter : null)
        } as FilterType);
        setSongFilter({
          ...EMPTY_SONG_FILTER,
          ...(nextKind === 'song' ? filter : null)
        } as SongFilterType);
      } catch {}
      setPerformanceIds(parseList(params.get('perf')));
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
    try {
      setMineIds(getLocallySortedIds(localStorage, kind === 'character' ? 'characters' : 'songs'));
    } catch {
      setMineIds(new Set());
    }
  }, [kind]);
  const resolve = useRankingItems(kind, activeMode);
  const filterNames = useFilterNameLookup();

  const query = useMemo<LeaderboardQuery>(
    () => ({
      kind,
      mode: activeMode,
      period,
      view,
      filter: view === 'global' ? null : { ...activeFilter },
      performanceIds: view === 'global' ? undefined : performanceIds
    }),
    [kind, activeMode, period, view, activeFilter, performanceIds]
  );
  const scopeQuery = useMemo<LeaderboardQuery>(
    () => ({
      kind,
      mode: activeMode,
      period,
      view: 'subset',
      filter: { ...activeFilter },
      performanceIds
    }),
    [kind, activeMode, period, activeFilter, performanceIds]
  );

  useEffect(() => {
    if (!isGlobalRankingEnabled) return;
    let cancelled = false;
    const load = async () => {
      const res = await fetchStats();
      if (!cancelled && res) setStats(res);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    if (!isGlobalRankingEnabled || !hydrated) return;
    let cancelled = false;
    const load = async () => {
      const res = await fetchCohorts(kind, activeMode);
      if (!cancelled) setCohorts(res ?? []);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [kind, activeMode, reloadKey, hydrated]);

  useEffect(() => {
    if (!isGlobalRankingEnabled || !hydrated) return;
    let cancelled = false;
    setStatus('loading');
    const load = async () => {
      const [res, scope] = await Promise.all([
        fetchLeaderboard(query),
        keepGlobalRanks ? fetchLeaderboard(scopeQuery) : undefined
      ]);
      if (cancelled) return;
      const scopeIds = new Set(scope?.items.map((entry) => entry.itemId));
      const scoped =
        res && keepGlobalRanks && scope
          ? { ...res, items: res.items.filter((entry) => scopeIds.has(entry.itemId)) }
          : keepGlobalRanks
            ? undefined
            : res;
      setResult(scoped);
      setStatus(scoped ? 'idle' : 'error');
    };
    const timer = setTimeout(() => void load(), 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, scopeQuery, keepGlobalRanks, reloadKey, hydrated]);

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

  const monthCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of stats?.months ?? []) {
      if (m.kind !== kind || (activeMode && m.mode !== activeMode)) continue;
      counts.set(m.month, (counts.get(m.month) ?? 0) + m.submissions);
    }
    return counts;
  }, [stats, kind, activeMode]);
  const months = useMemo(
    () => [...monthCounts.keys()].toSorted((a, b) => b.localeCompare(a)),
    [monthCounts]
  );

  const periodOptions = useMemo(() => {
    const monthFormat = new Intl.DateTimeFormat(i18n.language, {
      year: 'numeric',
      month: 'long',
      timeZone: 'UTC'
    });
    const sum = (list: string[]) => list.reduce((total, m) => total + (monthCounts.get(m) ?? 0), 0);
    const years = [...new Set(months.map((m) => m.slice(0, 4)))];
    const options: LeaderboardSelectOption[] = [
      { value: 'all', label: t('global_ranking.period_all'), count: sum(months) }
    ];
    for (const year of years) {
      const yearMonths = months.filter((m) => m.startsWith(year));
      options.push({
        value: year,
        label: t('global_ranking.period_whole_year', { year }),
        group: year,
        count: sum(yearMonths)
      });
      for (const month of yearMonths) {
        options.push({
          value: month,
          label: monthFormat.format(new Date(`${month}-01T00:00:00Z`)),
          group: year,
          indent: true,
          count: monthCounts.get(month)
        });
      }
    }
    if (!options.some((o) => o.value === period)) options.push({ value: period, label: period });
    return options;
  }, [months, monthCounts, period, t, i18n.language]);

  const modeOptions = useMemo(
    () => [
      ...(kind === 'song' ? [{ value: 'all', label: t('global_ranking.mode_all') }] : []),
      ...RANKING_MODES[kind].map((m) => ({ value: m, label: t(`global_ranking.mode_${m}`) }))
    ],
    [kind, t]
  );

  const changeKind = (next: RankingKind) => {
    setPage(1);
    setKind(next);
    setMode(next === 'character' ? 'chara' : 'all');
    setPerformanceIds([]);
    setPeriod('all');
  };

  const isActiveCohort = (cohort: CohortSummary) =>
    filterCount > 0 &&
    exactOnly &&
    !globalRanks &&
    cohort.mode === mode &&
    sameIds(cohort.performanceIds, performanceIds) &&
    sameFilter(cohort.filter, { ...activeFilter });

  const clearFilter = () => {
    setPage(1);
    setPerformanceIds([]);
    setExactOnly(false);
    setGlobalRanks(false);
    if (kind === 'character') setCharacterFilter(EMPTY_CHARACTER_FILTER);
    else setSongFilter(EMPTY_SONG_FILTER);
  };

  const applyCohort = (cohort: CohortSummary) => {
    if (isActiveCohort(cohort)) {
      clearFilter();
      return;
    }
    setPage(1);
    setMode(cohort.mode);
    setExactOnly(true);
    setGlobalRanks(false);
    setPerformanceIds(cohort.performanceIds);
    if (cohort.kind === 'character') {
      setCharacterFilter({ ...EMPTY_CHARACTER_FILTER, ...cohort.filter } as FilterType);
    } else {
      setSongFilter({ ...EMPTY_SONG_FILTER, ...cohort.filter } as SongFilterType);
    }
  };

  const describeCohort = (cohort: CohortSummary) =>
    describeFilter(cohort.kind, cohort.filter, i18n.language, t, filterNames) ??
    t('global_ranking.filter_count', { count: cohort.performanceIds.length });

  const popularCohorts = cohorts
    .filter((cohort) => countFilter(cohort.filter) + cohort.performanceIds.length > 0)
    .slice(0, 10);

  const filterSummary =
    describeFilter(kind, { ...activeFilter }, i18n.language, t, filterNames) ??
    (performanceIds.length > 0
      ? t('global_ranking.filter_count', { count: performanceIds.length })
      : t('global_ranking.filter_none'));

  const aggregation: Aggregation = globalRanks ? 'global' : exactOnly ? 'cohort' : 'subset';
  const setAggregation = (next: Aggregation) => {
    setPage(1);
    setGlobalRanks(next === 'global');
    setExactOnly(next === 'cohort');
  };

  const onSort = useCallback((key: SortKey) => {
    setPage(1);
    setSort((current) =>
      current.key === key ? { key, desc: !current.desc } : { key, desc: key !== 'rank' }
    );
  }, []);

  const filtered = useMemo(
    () =>
      (result?.items ?? []).filter(
        (entry) => entry.appearances >= minAppearances && (!mineOnly || mineIds.has(entry.itemId))
      ),
    [result, minAppearances, mineOnly, mineIds]
  );
  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const matches = needle
      ? filtered.filter((entry) => {
          const item = resolve(entry.itemId);
          return `${item.name} ${item.subtitle ?? ''}`.toLowerCase().includes(needle);
        })
      : filtered;
    return matches.toSorted(compareEntries(sort));
  }, [filtered, search, resolve, sort]);
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageEntries = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const title = t('global_ranking.title');

  return (
    <>
      <Metadata title={title} helmet />
      <Stack gap="4" alignItems="center" w="full">
        <Stack gap="0" alignItems="center" textAlign="center">
          <Text fontSize="2xl" fontWeight="bold">
            {title}
          </Text>
          <Text maxW="prose" color="fg.muted" fontSize="sm">
            {t('global_ranking.description')}
          </Text>
        </Stack>

        {!isGlobalRankingEnabled ? (
          <Text color="fg.muted">{t('global_ranking.disabled')}</Text>
        ) : (
          <>
            <Tabs.Root
              value={kind}
              onValueChange={(e) => changeKind(e.value as RankingKind)}
              w="full"
              maxW="md"
            >
              <Tabs.List justifyContent="center" w="full">
                <Tabs.Trigger value="character" flex="1" justifyContent="center">
                  <CharactersIcon />
                  {t('global_ranking.kind_character')}
                </Tabs.Trigger>
                <Tabs.Trigger value="song" flex="1" justifyContent="center">
                  <SongsIcon />
                  {t('global_ranking.kind_song')}
                </Tabs.Trigger>
                <Tabs.Indicator />
              </Tabs.List>
            </Tabs.Root>

            <Wrap gap="3" justifyContent="center" alignItems="flex-end" w="full">
              <LeaderboardSelect
                label={t('global_ranking.mode_label')}
                value={mode}
                options={modeOptions}
                onChange={(next) => {
                  setPage(1);
                  setMode(next as RankingMode | 'all');
                  setPerformanceIds([]);
                }}
                width="36"
              />
              <LeaderboardSelect
                label={t('global_ranking.period_label')}
                value={period}
                options={periodOptions}
                onChange={(next) => {
                  setPage(1);
                  setPeriod(next);
                }}
                width="48"
              />
              <Stack gap="1.5">
                <FormLabel htmlFor="leaderboard-search" fontSize="sm">
                  {t('global_ranking.search_label')}
                </FormLabel>
                <Input
                  id="leaderboard-search"
                  type="search"
                  size="sm"
                  value={search}
                  placeholder={t('global_ranking.search_placeholder')}
                  onChange={(e) => {
                    setPage(1);
                    setSearch(e.target.value);
                  }}
                  w="48"
                />
              </Stack>
              <LeaderboardSelect
                label={t('global_ranking.min_appearances')}
                value={String(minAppearances)}
                options={MIN_APPEARANCE_OPTIONS.map((value) => ({
                  value: String(value),
                  label:
                    value === 1
                      ? t('global_ranking.min_appearances_any')
                      : t('global_ranking.min_appearances_value', { count: value })
                }))}
                onChange={(next) => {
                  setPage(1);
                  setMinAppearances(Number(next));
                }}
                width="32"
              />
              {filterCount > 0 && (
                <LeaderboardSelect
                  label={t('global_ranking.aggregation')}
                  value={aggregation}
                  options={AGGREGATIONS.map((value) => ({
                    value,
                    label: t(`global_ranking.aggregation_${value}`)
                  }))}
                  onChange={(next) => setAggregation(next as Aggregation)}
                  width="56"
                />
              )}
              <Button
                data-testid="filter-button"
                size="sm"
                variant={filterCount > 0 ? 'solid' : 'outline'}
                onClick={() => setFilterOpen(true)}
              >
                <FaFilter />
                {filterCount > 0
                  ? `${t('global_ranking.filter')} (${filterCount})`
                  : t('global_ranking.filter')}
              </Button>
              {mineIds.size > 0 && (
                <Switch
                  checked={mineOnly}
                  onCheckedChange={(e) => {
                    setPage(1);
                    setMineOnly(e.checked);
                  }}
                  pb="1.5"
                >
                  {t(`global_ranking.mine_only_${kind}`)}
                </Switch>
              )}
            </Wrap>

            <Drawer.Root open={filterOpen} onOpenChange={(e) => setFilterOpen(e.open)}>
              <Drawer.Backdrop />
              <Drawer.Positioner>
                <Drawer.Content>
                  <Drawer.Header>
                    <HStack justifyContent="space-between">
                      <Drawer.Title>{t('global_ranking.filter')}</Drawer.Title>
                      <Drawer.CloseTrigger asChild>
                        <IconButton
                          aria-label={t('global_ranking.close')}
                          variant="ghost"
                          size="sm"
                        >
                          <FaXmark />
                        </IconButton>
                      </Drawer.CloseTrigger>
                    </HStack>
                  </Drawer.Header>
                  <Drawer.Body>
                    <Stack gap="5">
                      {popularCohorts.length > 0 && (
                        <QuickFilterRow
                          label={t('global_ranking.popular_filters')}
                          testId="cohort-chips"
                        >
                          {popularCohorts.map((cohort) => {
                            const label = describeCohort(cohort);
                            const active = isActiveCohort(cohort);
                            return (
                              <Button
                                key={cohort.hash}
                                size="xs"
                                variant={active ? 'solid' : 'subtle'}
                                aria-pressed={active}
                                title={label}
                                onClick={() => applyCohort(cohort)}
                                flexShrink={0}
                              >
                                <styled.span display="block" maxW="60" truncate>
                                  {label}
                                </styled.span>
                                <styled.span fontVariantNumeric="tabular-nums" opacity="0.75">
                                  {cohort.submissions}
                                </styled.span>
                              </Button>
                            );
                          })}
                        </QuickFilterRow>
                      )}
                      <Suspense fallback={<LoadingCharacterFilters />}>
                        {import.meta.env.SSR ? (
                          <LoadingCharacterFilters />
                        ) : kind === 'character' ? (
                          <CharacterFilters
                            filters={characterFilter}
                            setFilters={(value) => {
                              setPage(1);
                              setPerformanceIds([]);
                              setCharacterFilter(value);
                            }}
                          />
                        ) : (
                          <SongFilters
                            filters={songFilter}
                            setFilters={(value) => {
                              setPage(1);
                              setPerformanceIds([]);
                              setSongFilter(value);
                            }}
                          />
                        )}
                      </Suspense>
                    </Stack>
                  </Drawer.Body>
                  <Drawer.Footer>
                    <HStack justifyContent="space-between" w="full">
                      <Button variant="ghost" onClick={clearFilter} disabled={filterCount === 0}>
                        {t('global_ranking.clear_filter')}
                      </Button>
                      <Drawer.CloseTrigger asChild>
                        <Button>
                          {t('global_ranking.show_results', {
                            count: result?.submissions ?? 0
                          })}
                        </Button>
                      </Drawer.CloseTrigger>
                    </HStack>
                  </Drawer.Footer>
                </Drawer.Content>
              </Drawer.Positioner>
            </Drawer.Root>

            <Stack aria-live="polite" gap="3" w="full">
              <HStack gap="2" justifyContent="center" w="full" minW="0" minH="6">
                <Text flexShrink={0} color="fg.muted" fontSize="sm">
                  {status === 'loading'
                    ? t('global_ranking.loading')
                    : result
                      ? t('global_ranking.submissions', { count: result.submissions })
                      : ''}
                </Text>
                {filterCount > 0 && (
                  <>
                    <Text
                      title={filterSummary}
                      color="fg.muted"
                      fontSize="sm"
                      truncate
                    >{`· ${filterSummary}`}</Text>
                    <Button size="xs" variant="ghost" onClick={clearFilter} flexShrink={0}>
                      <FaXmark />
                      {t('global_ranking.clear_filter')}
                    </Button>
                  </>
                )}
              </HStack>
              {status === 'error' ? (
                <Stack gap="2" alignItems="center">
                  <Text color="fg.muted">{t('global_ranking.error')}</Text>
                  <Button size="sm" variant="outline" onClick={() => setReloadKey((k) => k + 1)}>
                    {t('global_ranking.retry')}
                  </Button>
                </Stack>
              ) : result && result.items.length > 0 ? (
                <Stack
                  aria-busy={status === 'loading'}
                  gap="3"
                  opacity={status === 'loading' ? 0.5 : 1}
                  transition="opacity 0.2s"
                >
                  {!search.trim() && (
                    <Stack
                      className={css({
                        '@media (max-height: 819px), (max-width: 767px)': { display: 'none' }
                      })}
                      alignItems="center"
                    >
                      <LeaderboardPodium
                        entries={filtered.toSorted((a, b) => a.rank - b.rank).slice(0, 3)}
                        resolve={resolve}
                      />
                    </Stack>
                  )}
                  {visible.length === 0 ? (
                    <Text color="fg.muted" textAlign="center">
                      {t('global_ranking.no_matches')}
                    </Text>
                  ) : (
                    <LeaderboardTable
                      entries={pageEntries}
                      resolve={resolve}
                      query={query}
                      sort={sort}
                      onSort={onSort}
                    />
                  )}
                  {pageCount > 1 && (
                    <Stack alignItems="center">
                      <Pagination
                        count={visible.length}
                        pageSize={PAGE_SIZE}
                        siblingCount={1}
                        onPageChange={(e) => setPage(e.page)}
                        page={currentPage}
                      />
                    </Stack>
                  )}
                </Stack>
              ) : (
                status !== 'loading' && (
                  <Text color="fg.muted" textAlign="center">
                    {t('global_ranking.empty')}
                  </Text>
                )
              )}
            </Stack>
          </>
        )}
      </Stack>
    </>
  );
}
