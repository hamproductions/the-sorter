import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaChevronDown } from 'react-icons/fa6';
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
import { Accordion } from '~/components/ui/accordion';
import { Button } from '~/components/ui/button';
import { FormLabel } from '~/components/ui/form-label';
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
import { getSeriesName } from '~/utils/names';
import characterSeries from '../../../data/series.json';
import seriesInfo from '../../../data/series-info.json';
import {
  type LeaderboardQuery,
  fetchCohorts,
  fetchLeaderboard,
  fetchStats,
  isGlobalRankingEnabled
} from '~/utils/global-ranking';
import { getLocallySortedIds } from '~/utils/save-state';
import { HStack, Stack, Wrap } from 'styled-system/jsx';

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

export function Page() {
  const { t, i18n } = useTranslation();
  const [kind, setKind] = useState<RankingKind>('character');
  const [mode, setMode] = useState<RankingMode | 'all'>('chara');
  const [period, setPeriod] = useState('all');
  const [exactOnly, setExactOnly] = useState(false);
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
  const [hydrated, setHydrated] = useState(false);

  const activeMode = mode === 'all' ? undefined : mode;
  const activeFilter = kind === 'character' ? characterFilter : songFilter;
  const filterCount = countFilter({ ...activeFilter }) + performanceIds.length;
  const view: LeaderboardView = filterCount === 0 ? 'global' : exactOnly ? 'cohort' : 'subset';

  useEffect(() => {
    if (hydrated && filterCount === 0) setExactOnly(false);
  }, [filterCount, hydrated]);

  useEffect(() => {
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
    try {
      const filter = JSON.parse(params.get('filter') ?? 'null') as RankingFilter | null;
      if (filter && nextKind === 'character') {
        setCharacterFilter({ ...EMPTY_CHARACTER_FILTER, ...filter } as FilterType);
      } else if (filter) {
        setSongFilter({ ...EMPTY_SONG_FILTER, ...filter } as SongFilterType);
      }
    } catch {}
    setPerformanceIds(parseList(params.get('perf')));
    const sortKey = params.get('sort');
    if (SORT_KEYS.includes(sortKey as SortKey)) {
      setSort({ key: sortKey as SortKey, desc: params.get('dir') === 'desc' });
    }
    setSearch(params.get('q') ?? '');
    setMinAppearances(Math.max(1, Number(params.get('min')) || 1));
    setMineOnly(params.get('mine') === '1');
    setPage(Math.max(1, Number(params.get('page')) || 1));
    setHydrated(true);
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
      const res = await fetchLeaderboard(query);
      if (cancelled) return;
      setResult(res);
      setStatus(res ? 'idle' : 'error');
    };
    const timer = setTimeout(() => void load(), 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, reloadKey, hydrated]);

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
    if (url !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(window.history.state, '', url);
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

  const applyCohort = (cohort: CohortSummary) => {
    setPage(1);
    setMode(cohort.mode);
    setExactOnly(true);
    setPerformanceIds(cohort.performanceIds);
    if (cohort.kind === 'character') {
      setCharacterFilter({ ...EMPTY_CHARACTER_FILTER, ...cohort.filter } as FilterType);
    } else {
      setSongFilter({ ...EMPTY_SONG_FILTER, ...cohort.filter } as SongFilterType);
    }
  };

  const describeCohort = (cohort: CohortSummary) =>
    describeFilter(cohort.kind, cohort.filter, i18n.language, t, filterNames) ??
    (cohort.performanceIds.length > 0
      ? t('global_ranking.filter_count', { count: cohort.performanceIds.length })
      : t('global_ranking.no_filter'));

  const onSort = useCallback((key: SortKey) => {
    setPage(1);
    setSort((current) =>
      current.key === key ? { key, desc: !current.desc } : { key, desc: key !== 'rank' }
    );
  }, []);

  const seriesChips = useMemo(
    () =>
      kind === 'character'
        ? Object.keys(characterSeries).map((id) => ({
            id,
            label: getSeriesName(id, i18n.language)
          }))
        : seriesInfo.map((s) => ({ id: s.id, label: s.name })),
    [kind, i18n.language]
  );
  const selectedSeries = (activeFilter?.series ?? []) as string[];
  const toggleSeries = (id: string) => {
    const series = selectedSeries.includes(id)
      ? selectedSeries.filter((s) => s !== id)
      : [...selectedSeries, id];
    setPage(1);
    setPerformanceIds([]);
    if (kind === 'character')
      setCharacterFilter({ ...EMPTY_CHARACTER_FILTER, ...characterFilter, series });
    else setSongFilter({ ...EMPTY_SONG_FILTER, ...songFilter, series });
  };

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
      <Stack gap="5" alignItems="center" w="full">
        <Stack gap="1" alignItems="center" textAlign="center">
          <Text fontSize="3xl" fontWeight="bold">
            {title}
          </Text>
          <Text maxW="prose" color="fg.muted">
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

            <Wrap gap="4" justifyContent="center" alignItems="flex-end">
              <LeaderboardSelect
                label={t('global_ranking.mode_label')}
                value={mode}
                options={modeOptions}
                onChange={(next) => {
                  setPage(1);
                  setMode(next as RankingMode | 'all');
                  setPerformanceIds([]);
                }}
              />
              <LeaderboardSelect
                label={t('global_ranking.period_label')}
                value={period}
                options={periodOptions}
                onChange={(next) => {
                  setPage(1);
                  setPeriod(next);
                }}
                width="56"
              />
            </Wrap>

            <Stack gap="2" alignItems="center" w="full">
              <Wrap
                data-testid="series-chips"
                gap="2"
                justifyContent={{ base: 'flex-start', md: 'center' }}
                w="full"
                pb={{ base: '1', md: '0' }}
                overflowX={{ base: 'auto', md: 'visible' }}
                flexWrap={{ base: 'nowrap', md: 'wrap' }}
              >
                {seriesChips.map((chip) => (
                  <Button
                    key={chip.id}
                    size="xs"
                    variant={selectedSeries.includes(chip.id) ? 'solid' : 'outline'}
                    aria-pressed={selectedSeries.includes(chip.id)}
                    onClick={() => toggleSeries(chip.id)}
                    flexShrink={0}
                  >
                    {chip.label}
                  </Button>
                ))}
              </Wrap>
              {cohorts.length > 0 && (
                <Wrap gap="2" justifyContent="center" alignItems="center">
                  <Text color="fg.muted" fontSize="xs" fontWeight="bold">
                    {t('global_ranking.popular_filters')}
                  </Text>
                  {cohorts.slice(0, 10).map((cohort) => (
                    <Button
                      key={cohort.hash}
                      size="xs"
                      variant="subtle"
                      onClick={() => applyCohort(cohort)}
                    >
                      {describeCohort(cohort)} ({cohort.submissions})
                    </Button>
                  ))}
                </Wrap>
              )}
            </Stack>

            <Accordion.Root collapsible defaultValue={[]} w="full">
              <Accordion.Item value="filter" w="full">
                <Accordion.ItemTrigger>
                  <HStack gap="2">
                    <Text fontWeight="bold">{t('global_ranking.filter')}</Text>
                    <Text color="fg.muted" fontSize="sm">
                      {filterCount === 0
                        ? t('global_ranking.filter_none')
                        : t('global_ranking.filter_count', { count: filterCount })}
                    </Text>
                  </HStack>
                  <Accordion.ItemIndicator>
                    <FaChevronDown />
                  </Accordion.ItemIndicator>
                </Accordion.ItemTrigger>
                <Accordion.ItemContent>
                  <Stack gap="4" pb="2">
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
                    <Switch
                      checked={exactOnly}
                      disabled={filterCount === 0}
                      onCheckedChange={(e) => {
                        setPage(1);
                        setExactOnly(e.checked);
                      }}
                    >
                      {t('global_ranking.exact_only')}
                    </Switch>
                  </Stack>
                </Accordion.ItemContent>
              </Accordion.Item>
            </Accordion.Root>

            <Stack aria-live="polite" gap="2" w="full">
              <Text color="fg.muted" fontSize="sm" textAlign="center">
                {t(`global_ranking.view_${view}_hint`)}
              </Text>
              {status === 'error' ? (
                <Stack gap="2" alignItems="center">
                  <Text color="fg.muted">{t('global_ranking.error')}</Text>
                  <Button size="sm" variant="outline" onClick={() => setReloadKey((k) => k + 1)}>
                    {t('global_ranking.retry')}
                  </Button>
                </Stack>
              ) : result && result.items.length > 0 ? (
                <>
                  <Text color="fg.muted" fontSize="sm" textAlign="center">
                    {status === 'loading'
                      ? t('global_ranking.loading')
                      : t('global_ranking.submissions', { count: result.submissions })}
                  </Text>
                  <Wrap gap="3" justifyContent="center" alignItems="flex-end">
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
                        w="56"
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
                      width="36"
                    />
                    <Switch
                      checked={mineOnly}
                      disabled={mineIds.size === 0}
                      onCheckedChange={(e) => {
                        setPage(1);
                        setMineOnly(e.checked);
                      }}
                      pb="1.5"
                    >
                      {t(`global_ranking.mine_only_${kind}`)}
                    </Switch>
                  </Wrap>
                  {!search.trim() && (
                    <Stack alignItems="center" py="2">
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
                  <Text maxW="prose" mx="auto" color="fg.muted" fontSize="xs" textAlign="center">
                    {t('global_ranking.score_caption')}
                  </Text>
                </>
              ) : (
                <Text color="fg.muted" textAlign="center">
                  {status === 'loading' ? t('global_ranking.loading') : t('global_ranking.empty')}
                </Text>
              )}
            </Stack>
          </>
        )}
      </Stack>
    </>
  );
}
