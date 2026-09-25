import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Metadata } from '~/components/layout/Metadata';
import { LeaderboardTable } from '~/components/leaderboard/LeaderboardTable';
import { useRankingItems } from '~/components/leaderboard/useRankingItems';
import type { FilterType } from '~/components/sorter/CharacterFilters';
import { LoadingCharacterFilters } from '~/components/sorter/LoadingCharacterFilters';
import type { SongFilterType } from '~/components/sorter/SongFilters';
import { Button } from '~/components/ui/button';
import { Link } from '~/components/ui/link';
import { SegmentGroup } from '~/components/ui/segment-group';
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
  getDumpUrl,
  isGlobalRankingEnabled
} from '~/utils/global-ranking';
import { Stack, Wrap } from 'styled-system/jsx';

const CharacterFilters = lazy(() =>
  import('~/components/sorter/CharacterFilters').then((m) => ({ default: m.CharacterFilters }))
);

const SongFilters = lazy(() =>
  import('~/components/sorter/SongFilters').then((m) => ({ default: m.SongFilters }))
);

const VIEWS: LeaderboardView[] = ['global', 'cohort', 'subset'];

const countFilter = (filter: RankingFilter | null | undefined) =>
  Object.values(filter ?? {}).reduce((total, values) => total + (values?.length ?? 0), 0);

function Choice<T extends string>({
  value,
  options,
  onChange,
  label
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <SegmentGroup.Root
      value={value}
      onValueChange={(e) => onChange(e.value as T)}
      size="sm"
      aria-label={label}
      orientation="horizontal"
    >
      <SegmentGroup.Indicator />
      {options.map((option) => (
        <SegmentGroup.Item key={option.value} value={option.value}>
          <SegmentGroup.ItemText>{option.label}</SegmentGroup.ItemText>
          <SegmentGroup.ItemHiddenInput />
        </SegmentGroup.Item>
      ))}
    </SegmentGroup.Root>
  );
}

export function Page() {
  const { t, i18n } = useTranslation();
  const characters = useData();
  const [kind, setKind] = useState<RankingKind>('character');
  const [mode, setMode] = useState<RankingMode | 'all'>('chara');
  const [period, setPeriod] = useState('all');
  const [view, setView] = useState<LeaderboardView>('global');
  const [characterFilter, setCharacterFilter] = useState<FilterType | null | undefined>({
    series: [],
    school: [],
    units: []
  });
  const [songFilter, setSongFilter] = useState<SongFilterType | null | undefined>();
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
    void fetchStats().then(setStats);
  }, []);

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
  }, [kind, activeMode]);

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
      ].toSorted(),
    [stats, kind, activeMode]
  );
  const years = [...new Set(months.map((m) => m.slice(0, 4)))];
  const selectedYear = period === 'all' ? undefined : period.slice(0, 4);

  const changeKind = (next: RankingKind) => {
    setKind(next);
    setMode(next === 'character' ? 'chara' : 'all');
    setPerformanceIds([]);
    setPeriod('all');
  };

  const applyCohort = (cohort: CohortSummary) => {
    setMode(cohort.mode);
    setView('cohort');
    setPerformanceIds(cohort.performanceIds);
    if (cohort.kind === 'character') {
      setCharacterFilter({ series: [], school: [], units: [], ...cohort.filter } as FilterType);
    } else {
      setSongFilter({
        series: [],
        artists: [],
        types: [],
        characters: [],
        discographies: [],
        songs: [],
        years: [],
        ...cohort.filter
      } as SongFilterType);
    }
  };

  const describeCohort = (cohort: CohortSummary) => {
    if (countFilter(cohort.filter) === 0 && cohort.performanceIds.length === 0) {
      return t('global_ranking.no_filter');
    }
    const title =
      cohort.kind === 'character'
        ? getFilterTitle(
            { series: [], school: [], units: [], ...cohort.filter } as FilterType,
            characters,
            i18n.language
          )
        : undefined;
    return title ?? t('global_ranking.filter_count', { count: countFilter(cohort.filter) });
  };

  const modeOptions: { value: RankingMode | 'all'; label: string }[] = [
    ...(kind === 'song' ? [{ value: 'all' as const, label: t('global_ranking.mode_all') }] : []),
    ...RANKING_MODES[kind].map((m) => ({ value: m, label: t(`global_ranking.mode_${m}`) }))
  ];

  const title = t('global_ranking.title');

  return (
    <>
      <Metadata title={title} helmet />
      <Stack gap="4" alignItems="center" w="full">
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
            <Stack gap="3" alignItems="center" w="full">
              <Choice
                label={t('global_ranking.kind_label')}
                value={kind}
                onChange={changeKind}
                options={[
                  { value: 'character', label: t('global_ranking.kind_character') },
                  { value: 'song', label: t('global_ranking.kind_song') }
                ]}
              />
              <Choice
                label={t('global_ranking.mode_label')}
                value={mode}
                onChange={(next) => {
                  setMode(next);
                  setPerformanceIds([]);
                }}
                options={modeOptions}
              />
              <Wrap aria-label={t('global_ranking.period_label')} gap="2" justifyContent="center">
                <Button
                  size="xs"
                  variant={period === 'all' ? 'solid' : 'outline'}
                  onClick={() => setPeriod('all')}
                >
                  {t('global_ranking.period_all')}
                </Button>
                {years.map((year) => (
                  <Button
                    key={year}
                    size="xs"
                    variant={period === year ? 'solid' : 'outline'}
                    onClick={() => setPeriod(year)}
                  >
                    {year}
                  </Button>
                ))}
              </Wrap>
              {selectedYear && (
                <Wrap gap="2" justifyContent="center">
                  {months
                    .filter((m) => m.startsWith(selectedYear))
                    .map((month) => (
                      <Button
                        key={month}
                        size="xs"
                        variant={period === month ? 'solid' : 'ghost'}
                        onClick={() => setPeriod(period === month ? selectedYear : month)}
                      >
                        {month}
                      </Button>
                    ))}
                </Wrap>
              )}
              <Choice
                label={t('global_ranking.view_label')}
                value={view}
                onChange={setView}
                options={VIEWS.map((v) => ({ value: v, label: t(`global_ranking.view_${v}`) }))}
              />
              <Text color="fg.muted" fontSize="sm" textAlign="center">
                {t(`global_ranking.view_${view}_hint`)}
              </Text>
            </Stack>

            {view !== 'global' && (
              <Stack gap="3" w="full">
                {cohorts.length > 0 && (
                  <Stack gap="2" alignItems="center">
                    <Text fontSize="sm" fontWeight="bold">
                      {t('global_ranking.popular_filters')}
                    </Text>
                    <Wrap gap="2" justifyContent="center">
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
              </Stack>
            )}

            <Stack aria-live="polite" gap="2" w="full">
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

            <Stack gap="1" alignItems="center">
              <Text fontSize="sm" fontWeight="bold">
                {t('global_ranking.downloads')}
              </Text>
              <Wrap gap="3" justifyContent="center" fontSize="sm">
                <Link href={getDumpUrl('rollups', period, 'csv')}>
                  {t('global_ranking.rollups_csv')}
                </Link>
                <Link href={getDumpUrl('rollups', period, 'json')}>
                  {t('global_ranking.rollups_json')}
                </Link>
                <Link href={getDumpUrl('submissions', period, 'ndjson')}>
                  {t('global_ranking.submissions_ndjson')}
                </Link>
              </Wrap>
            </Stack>
          </>
        )}
      </Stack>
    </>
  );
}
