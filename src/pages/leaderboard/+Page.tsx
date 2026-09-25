import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaChevronDown } from 'react-icons/fa6';
import { Metadata } from '~/components/layout/Metadata';
import { LeaderboardSelect } from '~/components/leaderboard/LeaderboardSelect';
import { LeaderboardTable } from '~/components/leaderboard/LeaderboardTable';
import { useRankingItems } from '~/components/leaderboard/useRankingItems';
import type { FilterType } from '~/components/sorter/CharacterFilters';
import { LoadingCharacterFilters } from '~/components/sorter/LoadingCharacterFilters';
import type { SongFilterType } from '~/components/sorter/SongFilters';
import { Accordion } from '~/components/ui/accordion';
import { Button } from '~/components/ui/button';
import { Switch } from '~/components/ui/switch';
import { Tabs } from '~/components/ui/tabs';
import { Text } from '~/components/ui/text';
import { useData } from '~/hooks/useData';
import {
  RANKING_MODES,
  type CohortSummary,
  type LeaderboardResponse,
  type LeaderboardView,
  type RankingFilter,
  type RankingKind,
  type RankingMode,
  type StatsResponse
} from '~/types/global-ranking';
import { getFilterTitle } from '~/utils/filter';
import {
  type LeaderboardQuery,
  fetchCohorts,
  fetchLeaderboard,
  fetchStats,
  isGlobalRankingEnabled
} from '~/utils/global-ranking';
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

const countFilter = (filter: RankingFilter | null | undefined) =>
  Object.values(filter ?? {}).reduce((total, values) => total + (values?.length ?? 0), 0);

export function Page() {
  const { t, i18n } = useTranslation();
  const characters = useData();
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

  const activeMode = mode === 'all' ? undefined : mode;
  const activeFilter = kind === 'character' ? characterFilter : songFilter;
  const filterCount = countFilter({ ...activeFilter }) + performanceIds.length;
  const view: LeaderboardView = filterCount === 0 ? 'global' : exactOnly ? 'cohort' : 'subset';

  useEffect(() => {
    if (filterCount === 0) setExactOnly(false);
  }, [filterCount]);
  const resolve = useRankingItems(kind, activeMode);

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
    if (!isGlobalRankingEnabled) return;
    let cancelled = false;
    const load = async () => {
      const res = await fetchCohorts(kind, activeMode);
      if (!cancelled) setCohorts(res ?? []);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [kind, activeMode, reloadKey]);

  useEffect(() => {
    if (!isGlobalRankingEnabled) return;
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
  }, [query, reloadKey]);

  const months = useMemo(
    () =>
      [
        ...new Set(
          (stats?.months ?? [])
            .filter((m) => m.kind === kind && (!activeMode || m.mode === activeMode))
            .map((m) => m.month)
        )
      ].toSorted((a, b) => b.localeCompare(a)),
    [stats, kind, activeMode]
  );

  const periodOptions = useMemo(() => {
    const monthFormat = new Intl.DateTimeFormat(i18n.language, { year: 'numeric', month: 'long' });
    const years = [...new Set(months.map((m) => m.slice(0, 4)))];
    const options = [{ value: 'all', label: t('global_ranking.period_all') }];
    for (const year of years) {
      options.push({ value: year, label: year });
      for (const month of months.filter((m) => m.startsWith(year))) {
        options.push({
          value: month,
          label: monthFormat.format(new Date(`${month}-01T00:00:00Z`))
        });
      }
    }
    if (!options.some((o) => o.value === period)) options.push({ value: period, label: period });
    return options;
  }, [months, period, t, i18n.language]);

  const modeOptions = useMemo(
    () => [
      ...(kind === 'song' ? [{ value: 'all', label: t('global_ranking.mode_all') }] : []),
      ...RANKING_MODES[kind].map((m) => ({ value: m, label: t(`global_ranking.mode_${m}`) }))
    ],
    [kind, t]
  );

  const changeKind = (next: RankingKind) => {
    setKind(next);
    setMode(next === 'character' ? 'chara' : 'all');
    setPerformanceIds([]);
    setPeriod('all');
  };

  const applyCohort = (cohort: CohortSummary) => {
    setMode(cohort.mode);
    setExactOnly(true);
    setPerformanceIds(cohort.performanceIds);
    if (cohort.kind === 'character') {
      setCharacterFilter({ ...EMPTY_CHARACTER_FILTER, ...cohort.filter } as FilterType);
    } else {
      setSongFilter({ ...EMPTY_SONG_FILTER, ...cohort.filter } as SongFilterType);
    }
  };

  const describeCohort = (cohort: CohortSummary) => {
    if (countFilter(cohort.filter) === 0 && cohort.performanceIds.length === 0) {
      return t('global_ranking.no_filter');
    }
    const title =
      cohort.kind === 'character'
        ? getFilterTitle(
            { ...EMPTY_CHARACTER_FILTER, ...cohort.filter } as FilterType,
            characters,
            i18n.language
          )
        : undefined;
    return title ?? t('global_ranking.filter_count', { count: countFilter(cohort.filter) });
  };

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
                  {t('global_ranking.kind_character')}
                </Tabs.Trigger>
                <Tabs.Trigger value="song" flex="1" justifyContent="center">
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
                  setMode(next as RankingMode | 'all');
                  setPerformanceIds([]);
                }}
              />
              <LeaderboardSelect
                label={t('global_ranking.period_label')}
                value={period}
                options={periodOptions}
                onChange={setPeriod}
              />
            </Wrap>

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
                    {cohorts.length > 0 && (
                      <Stack gap="2">
                        <Text fontSize="sm" fontWeight="bold">
                          {t('global_ranking.popular_filters')}
                        </Text>
                        <Wrap gap="2">
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
                      </Stack>
                    )}
                    <Suspense fallback={<LoadingCharacterFilters />}>
                      {import.meta.env.SSR ? (
                        <LoadingCharacterFilters />
                      ) : kind === 'character' ? (
                        <CharacterFilters
                          filters={characterFilter}
                          setFilters={(value) => {
                            setPerformanceIds([]);
                            setCharacterFilter(value);
                          }}
                        />
                      ) : (
                        <SongFilters
                          filters={songFilter}
                          setFilters={(value) => {
                            setPerformanceIds([]);
                            setSongFilter(value);
                          }}
                        />
                      )}
                    </Suspense>
                    <Switch
                      checked={exactOnly}
                      disabled={filterCount === 0}
                      onCheckedChange={(e) => setExactOnly(e.checked)}
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
                  <LeaderboardTable entries={result.items} resolve={resolve} query={query} />
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
