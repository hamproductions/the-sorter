import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getAliasScore, getSongAliases } from '~/utils/abbreviations';
import { FaFilter, FaXmark } from 'react-icons/fa6';
import { CharactersIcon, SongsIcon } from '~/components/layout/section-icons';
import { Metadata } from '~/components/layout/Metadata';
import { LeaderboardSelect } from '~/components/leaderboard/LeaderboardSelect';
import { LeaderboardFilterDrawer } from '~/components/leaderboard/LeaderboardFilterDrawer';
import { LeaderboardPodium } from '~/components/leaderboard/LeaderboardPodium';
import { LeaderboardTable, type SortKey } from '~/components/leaderboard/LeaderboardTable';
import { useRankingItems } from '~/components/leaderboard/useRankingItems';
import type { FilterType } from '~/components/sorter/CharacterFilters';
import type { SongFilterType } from '~/components/sorter/SongFilters';
import { Button } from '~/components/ui/button';
import { FormLabel } from '~/components/ui/form-label';
import { Input } from '~/components/ui/input';
import { Pagination } from '~/components/ui/pagination';
import { Switch } from '~/components/ui/switch';
import { Tabs } from '~/components/ui/tabs';
import { Text } from '~/components/ui/text';
import {
  type CohortSummary,
  type RankingFilter,
  type RankingKind,
  type RankingMode
} from '~/types/global-ranking';
import { useLeaderboardData } from '~/hooks/leaderboard/useLeaderboardData';
import { useLeaderboardOptions } from '~/hooks/leaderboard/useLeaderboardOptions';
import { useLeaderboardState } from '~/hooks/leaderboard/useLeaderboardState';
import { useFilterNameLookup } from '~/hooks/useFilterNameLookup';
import { usePerformanceData } from '~/hooks/setlist-prediction/usePerformanceData';
import { countFilter, describeFilter } from '~/utils/filter-summary';
import { getFullPerformanceName } from '~/utils/names';
import { isGlobalRankingEnabled } from '~/utils/global-ranking';
import {
  AGGREGATIONS,
  EMPTY_CHARACTER_FILTER,
  EMPTY_SONG_FILTER,
  compareEntries,
  sameFilter,
  sameIds,
  type Aggregation
} from '~/utils/leaderboard';
import { getLocallySortedIds } from '~/utils/save-state';
import { appStorage } from '~/utils/storage';
import { css } from 'styled-system/css';
import { HStack, Stack, Wrap } from 'styled-system/jsx';

const PerformancePickerForSortDialog = lazy(() =>
  import('~/components/sorter/PerformancePickerForSortDialog').then((m) => ({
    default: m.PerformancePickerForSortDialog
  }))
);

const PAGE_SIZE = 50;
const MIN_APPEARANCE_OPTIONS = [1, 3, 5, 10, 25, 50];

export function Page() {
  const { t, i18n } = useTranslation();
  const state = useLeaderboardState();
  const {
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
    activeMode,
    activeFilter,
    filterCount
  } = state;
  const { stats, cohorts, result, status, query, reload } = useLeaderboardData(state);
  const [mineIds, setMineIds] = useState<Set<string>>(new Set());
  const [filterOpen, setFilterOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    try {
      setMineIds(getLocallySortedIds(appStorage, kind === 'character' ? 'characters' : 'songs'));
    } catch {
      setMineIds(new Set());
    }
  }, [kind]);
  const resolve = useRankingItems(kind, activeMode);
  const filterNames = useFilterNameLookup();
  const { performances } = usePerformanceData();
  const { periodOptions, modeOptions } = useLeaderboardOptions({
    stats,
    kind,
    activeMode,
    period
  });

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

  const describeSelection = (selectionKind: RankingKind, filter: RankingFilter, ids: string[]) =>
    [
      describeFilter(selectionKind, filter, i18n.language, t, filterNames, Infinity),
      ...ids.map((id) => {
        const performance = performances.find((entry) => entry.id === id);
        return performance
          ? [getFullPerformanceName(performance), performance.date, performance.venue]
              .filter(Boolean)
              .join(' · ')
          : `${t('global_ranking.mode_performance')}: ${id}`;
      })
    ]
      .filter(Boolean)
      .join(' / ');

  const describeCohort = (cohort: CohortSummary) =>
    describeSelection(cohort.kind, cohort.filter, cohort.performanceIds);

  const popularCohorts = cohorts
    .filter((cohort) => countFilter(cohort.filter) + cohort.performanceIds.length > 0)
    .slice(0, 10);

  const filterSummary =
    describeSelection(kind, { ...activeFilter }, performanceIds) || t('global_ranking.filter_none');

  const aggregation: Aggregation = globalRanks ? 'global' : exactOnly ? 'cohort' : 'subset';
  const setAggregation = (next: Aggregation) => {
    setPage(1);
    setGlobalRanks(next === 'global');
    setExactOnly(next === 'cohort');
  };

  const onSort = useCallback(
    (key: SortKey) => {
      setPage(1);
      setSort((current) =>
        current.key === key ? { key, desc: !current.desc } : { key, desc: key !== 'rank' }
      );
    },
    [setPage, setSort]
  );

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
          const aliases = kind === 'song' ? getSongAliases(entry.itemId) : [];
          return (
            `${item.name} ${item.subtitle ?? ''}`.toLowerCase().includes(needle) ||
            getAliasScore(aliases, needle) > 0
          );
        })
      : filtered;
    return matches.slice().sort(compareEntries(sort));
  }, [filtered, search, resolve, sort, kind]);
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
                  width="64"
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

            <LeaderboardFilterDrawer
              open={filterOpen}
              onOpenChange={setFilterOpen}
              kind={kind}
              popularCohorts={popularCohorts}
              describeCohort={describeCohort}
              isActiveCohort={isActiveCohort}
              applyCohort={applyCohort}
              performanceCount={performanceIds.length}
              onOpenPicker={() => setPickerOpen(true)}
              characterFilter={characterFilter}
              setCharacterFilter={(value) => {
                setPage(1);
                setPerformanceIds([]);
                setCharacterFilter(value);
              }}
              songFilter={songFilter}
              setSongFilter={(value) => {
                setPage(1);
                setPerformanceIds([]);
                setSongFilter(value);
              }}
              filterCount={filterCount}
              clearFilter={clearFilter}
              submissions={result?.submissions ?? 0}
            />

            {pickerOpen && (
              <Suspense fallback={null}>
                <PerformancePickerForSortDialog
                  open={pickerOpen}
                  onOpenChange={({ open }) => setPickerOpen(open)}
                  initialPerformanceIds={performanceIds}
                  onSelectPerformanceIds={(ids) => {
                    setPage(1);
                    setMode('performance');
                    setPerformanceIds(ids);
                  }}
                />
              </Suspense>
            )}

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
                  <Button size="sm" variant="outline" onClick={reload}>
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
                        entries={filtered
                          .slice()
                          .sort((a, b) => a.rank - b.rank)
                          .slice(0, 3)}
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
