import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { LeaderboardSelectOption } from '~/components/leaderboard/LeaderboardSelect';
import {
  RANKING_MODES,
  type RankingKind,
  type RankingMode,
  type StatsResponse
} from '~/types/global-ranking';

export function useLeaderboardOptions({
  stats,
  kind,
  activeMode,
  period
}: {
  stats: StatsResponse | undefined;
  kind: RankingKind;
  activeMode: RankingMode | undefined;
  period: string;
}) {
  const { t, i18n } = useTranslation();

  const monthCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of stats?.months ?? []) {
      if (m.kind !== kind || (activeMode && m.mode !== activeMode)) continue;
      counts.set(m.month, (counts.get(m.month) ?? 0) + m.submissions);
    }
    return counts;
  }, [stats, kind, activeMode]);
  const months = useMemo(
    () => [...monthCounts.keys()].sort((a, b) => b.localeCompare(a)),
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

  return { periodOptions, modeOptions };
}
