import { useEffect, useMemo, useState } from 'react';
import type { FilterType } from '~/components/sorter/CharacterFilters';
import type { SongFilterType } from '~/components/sorter/SongFilters';
import type {
  CohortSummary,
  LeaderboardResponse,
  LeaderboardView,
  RankingKind,
  RankingMode,
  StatsResponse
} from '~/types/global-ranking';
import {
  type LeaderboardQuery,
  fetchCohorts,
  fetchLeaderboard,
  fetchStats,
  isGlobalRankingEnabled
} from '~/utils/global-ranking';

export function useLeaderboardData({
  kind,
  activeMode,
  period,
  view,
  activeFilter,
  performanceIds,
  keepGlobalRanks,
  hydrated
}: {
  kind: RankingKind;
  activeMode: RankingMode | undefined;
  period: string;
  view: LeaderboardView;
  activeFilter: FilterType | SongFilterType | null | undefined;
  performanceIds: string[];
  keepGlobalRanks: boolean;
  hydrated: boolean;
}) {
  const [stats, setStats] = useState<StatsResponse>();
  const [cohorts, setCohorts] = useState<CohortSummary[]>([]);
  const [result, setResult] = useState<LeaderboardResponse>();
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>(
    isGlobalRankingEnabled ? 'loading' : 'idle'
  );
  const [reloadKey, setReloadKey] = useState(0);

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

  const reload = () => setReloadKey((k) => k + 1);

  return { stats, cohorts, result, status, query, reload };
}
