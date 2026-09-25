import {
  and,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  isNotNull,
  lt,
  lte,
  sql,
  type SQL
} from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import {
  cohort_monthly,
  cohort_monthly_stats,
  cohorts,
  item_monthly,
  monthly_stats,
  query_cache,
  submissions
} from '../database/schema';
import type { DB } from '../db';
import type { DataStore } from '../lib/data';
import { type CanonicalFilter, cohortHashOf } from '../lib/filters';
import { sha256 } from '../lib/hash';
import { isClosedMonth, type PeriodRange } from '../lib/period';
import {
  accumulate,
  computeAgreement,
  computeContributions,
  mergeRollups,
  restrictRanking,
  type Rollup,
  toLeaderboard
} from '../lib/ranking';
import {
  RANKING_MODES,
  type CohortSummary,
  type ItemHistoryPoint,
  type LeaderboardResponse,
  type LeaderboardView,
  type RankingKind,
  type RankingMode,
  type StatsResponse
} from '~/types/global-ranking';

const OPEN_MONTH_CACHE_MS = 10 * 60 * 1000;

export interface LeaderboardScope {
  kind: RankingKind;
  mode?: RankingMode;
  range: PeriodRange;
  view: LeaderboardView;
  filter: CanonicalFilter;
  performanceIds: string[];
}

interface MonthPartial {
  submissions: number;
  rows: Rollup[];
}

export class ScopeError extends Error {}

const rollupSelect = <T extends typeof item_monthly | typeof cohort_monthly>(t: T) => ({
  itemId: t.item_id,
  appearances: sql<number>`sum(${t.appearances})::int`,
  percentileSum: sql<number>`sum(${t.percentile_sum})::float8`,
  top1: sql<number>`sum(${t.top1})::int`,
  top3: sql<number>`sum(${t.top3})::int`,
  top10: sql<number>`sum(${t.top10})::int`
});

export class LeaderboardService {
  constructor(
    private db: DB,
    private data: DataStore,
    private now: () => Date = () => new Date()
  ) {}

  private modesFor(kind: RankingKind, mode?: RankingMode): RankingMode[] {
    return mode ? [mode] : [...RANKING_MODES[kind]];
  }

  private cohortHashes(scope: LeaderboardScope) {
    return this.modesFor(scope.kind, scope.mode).map((mode) =>
      cohortHashOf(
        scope.kind,
        mode,
        scope.filter,
        mode === 'performance' ? scope.performanceIds : []
      )
    );
  }

  subsetOf(scope: Pick<LeaderboardScope, 'kind' | 'mode' | 'filter' | 'performanceIds'>) {
    const mode = scope.mode ?? (scope.kind === 'character' ? undefined : ('normal' as RankingMode));
    if (!mode) throw new ScopeError('mode is required for character subset views');
    const effectiveMode =
      mode === 'performance' && scope.performanceIds.length === 0 ? 'normal' : mode;
    const items = this.data.deriveItems(
      scope.kind,
      effectiveMode,
      scope.filter,
      scope.performanceIds
    );
    if (!items) throw new ScopeError('filter does not resolve to an item set');
    return items;
  }

  private modeCondition(column: AnyPgColumn, modes: RankingMode[]) {
    return modes.length === 1 ? eq(column, modes[0]) : undefined;
  }

  private async months(scope: LeaderboardScope) {
    const modes = this.modesFor(scope.kind, scope.mode);
    const rows = await this.db
      .selectDistinct({ month: monthly_stats.month })
      .from(monthly_stats)
      .where(
        and(
          eq(monthly_stats.kind, scope.kind),
          this.modeCondition(monthly_stats.mode, modes),
          gte(monthly_stats.month, scope.range.from),
          lte(monthly_stats.month, scope.range.to)
        )
      )
      .orderBy(monthly_stats.month);
    return rows.map((r) => r.month);
  }

  private async subsetMonth(
    scope: LeaderboardScope,
    items: string[],
    month: string
  ): Promise<MonthPartial> {
    const modes = this.modesFor(scope.kind, scope.mode);
    const key = sha256(
      JSON.stringify([
        'subset',
        scope.kind,
        modes,
        month,
        sha256(JSON.stringify([...items].sort()))
      ])
    );
    const now = this.now();
    const [cached] = await this.db.select().from(query_cache).where(eq(query_cache.key, key));
    if (cached && (!cached.expires_at || cached.expires_at > now)) {
      return cached.value as MonthPartial;
    }

    const subset = new Set(items);
    const target = new Map<string, Rollup>();
    let total = 0;
    const itemArray = sql`ARRAY[${sql.join(
      items.map((id) => sql`${id}`),
      sql`, `
    )}]::text[]`;
    const rows = await this.db
      .select({ ranking: submissions.ranking })
      .from(submissions)
      .where(
        and(
          eq(submissions.kind, scope.kind),
          modes.length === 1 ? eq(submissions.mode, modes[0]) : undefined,
          eq(submissions.status, 'accepted'),
          eq(submissions.month, month),
          sql`${submissions.initial_order} && ${itemArray}`
        )
      );
    for (const { ranking } of rows) {
      const restricted = restrictRanking(ranking, subset);
      if (restricted.flat().length < 2) continue;
      accumulate(target, computeContributions(restricted));
      total += 1;
    }
    const partial: MonthPartial = { submissions: total, rows: [...target.values()] };
    await this.db
      .insert(query_cache)
      .values({
        key,
        kind: scope.kind,
        month,
        value: partial,
        expires_at: isClosedMonth(month, now) ? null : new Date(now.getTime() + OPEN_MONTH_CACHE_MS)
      })
      .onConflictDoUpdate({
        target: query_cache.key,
        set: { value: partial, expires_at: sql`excluded.expires_at` }
      });
    return partial;
  }

  private async globalRows(scope: LeaderboardScope, byMonth: boolean) {
    const modes = this.modesFor(scope.kind, scope.mode);
    const where = and(
      eq(item_monthly.kind, scope.kind),
      this.modeCondition(item_monthly.mode, modes),
      gte(item_monthly.month, scope.range.from),
      lte(item_monthly.month, scope.range.to)
    );
    const select = { ...rollupSelect(item_monthly), month: item_monthly.month };
    return byMonth
      ? this.db
          .select(select)
          .from(item_monthly)
          .where(where)
          .groupBy(item_monthly.month, item_monthly.item_id)
      : this.db
          .select({ ...rollupSelect(item_monthly), month: sql<string>`''` })
          .from(item_monthly)
          .where(where)
          .groupBy(item_monthly.item_id);
  }

  private async cohortRows(scope: LeaderboardScope, byMonth: boolean) {
    const hashes = this.cohortHashes(scope);
    const where = and(
      inArray(cohort_monthly.cohort_hash, hashes),
      gte(cohort_monthly.month, scope.range.from),
      lte(cohort_monthly.month, scope.range.to)
    );
    return byMonth
      ? this.db
          .select({ ...rollupSelect(cohort_monthly), month: cohort_monthly.month })
          .from(cohort_monthly)
          .where(where)
          .groupBy(cohort_monthly.month, cohort_monthly.item_id)
      : this.db
          .select({ ...rollupSelect(cohort_monthly), month: sql<string>`''` })
          .from(cohort_monthly)
          .where(where)
          .groupBy(cohort_monthly.item_id);
  }

  private async submissionCount(scope: LeaderboardScope) {
    if (scope.view === 'cohort') {
      const [row] = await this.db
        .select({ total: sql<number>`coalesce(sum(${cohort_monthly_stats.submissions}), 0)::int` })
        .from(cohort_monthly_stats)
        .where(
          and(
            inArray(cohort_monthly_stats.cohort_hash, this.cohortHashes(scope)),
            gte(cohort_monthly_stats.month, scope.range.from),
            lte(cohort_monthly_stats.month, scope.range.to)
          )
        );
      return row.total;
    }
    const modes = this.modesFor(scope.kind, scope.mode);
    const [row] = await this.db
      .select({ total: sql<number>`coalesce(sum(${monthly_stats.submissions}), 0)::int` })
      .from(monthly_stats)
      .where(
        and(
          eq(monthly_stats.kind, scope.kind),
          this.modeCondition(monthly_stats.mode, modes),
          gte(monthly_stats.month, scope.range.from),
          lte(monthly_stats.month, scope.range.to)
        )
      );
    return row.total;
  }

  async leaderboard(scope: LeaderboardScope, period: string): Promise<LeaderboardResponse> {
    const base = { kind: scope.kind, mode: scope.mode ?? null, period, view: scope.view };
    if (scope.view === 'subset') {
      const items = this.subsetOf(scope);
      const partials = await Promise.all(
        (await this.months(scope)).map((month) => this.subsetMonth(scope, items, month))
      );
      return {
        ...base,
        submissions: partials.reduce((total, p) => total + p.submissions, 0),
        items: toLeaderboard(mergeRollups(partials.flatMap((p) => p.rows)))
      };
    }
    const rows =
      scope.view === 'cohort'
        ? await this.cohortRows(scope, false)
        : await this.globalRows(scope, false);
    return { ...base, submissions: await this.submissionCount(scope), items: toLeaderboard(rows) };
  }

  async history(scope: LeaderboardScope, itemId: string): Promise<ItemHistoryPoint[]> {
    const byMonth = new Map<string, Rollup[]>();
    if (scope.view === 'subset') {
      const items = this.subsetOf(scope);
      for (const month of await this.months(scope)) {
        byMonth.set(month, (await this.subsetMonth(scope, items, month)).rows);
      }
    } else {
      const rows =
        scope.view === 'cohort'
          ? await this.cohortRows(scope, true)
          : await this.globalRows(scope, true);
      for (const row of rows) {
        const list = byMonth.get(row.month) ?? [];
        list.push(row);
        byMonth.set(row.month, list);
      }
    }
    return [...byMonth.entries()]
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .flatMap(([month, rows]) => {
        const board = toLeaderboard(rows);
        const entry = board.find((e) => e.itemId === itemId);
        return entry
          ? [
              {
                month,
                rank: entry.rank,
                of: board.length,
                score: entry.score,
                appearances: entry.appearances
              }
            ]
          : [];
      });
  }

  async consensus(kind: RankingKind, mode: RankingMode) {
    const rows = await this.globalRows(
      {
        kind,
        mode,
        range: { from: '0000-01', to: '9999-12' },
        view: 'global',
        filter: {},
        performanceIds: []
      },
      false
    );
    return toLeaderboard(rows);
  }

  async agreement(kind: RankingKind, mode: RankingMode, ranking: string[][]) {
    const consensus = await this.consensus(kind, mode);
    const result = computeAgreement(ranking, consensus);
    const scope = and(
      eq(submissions.kind, kind),
      eq(submissions.mode, mode),
      eq(submissions.status, 'accepted'),
      isNotNull(submissions.agreement)
    );
    const [{ total }] = await this.db.select({ total: count() }).from(submissions).where(scope);
    let percentile: number | null = null;
    if (result.agreement !== null && total > 0) {
      const [{ below }] = await this.db
        .select({ below: count() })
        .from(submissions)
        .where(and(scope, lt(submissions.agreement, result.agreement)));
      percentile = below / total;
    }
    return { ...result, percentile, sampleSize: total };
  }

  async cohorts(kind: RankingKind, mode: RankingMode | undefined, limit: number) {
    const total = sql<number>`coalesce(sum(${cohort_monthly_stats.submissions}), 0)::int`;
    const conditions: (SQL | undefined)[] = [
      eq(cohorts.kind, kind),
      mode ? eq(cohorts.mode, mode) : undefined
    ];
    const rows = await this.db
      .select({
        hash: cohorts.hash,
        kind: cohorts.kind,
        mode: cohorts.mode,
        filter: cohorts.filter,
        performanceIds: cohorts.performance_ids,
        submissions: total
      })
      .from(cohorts)
      .innerJoin(cohort_monthly_stats, eq(cohort_monthly_stats.cohort_hash, cohorts.hash))
      .where(and(...conditions))
      .groupBy(cohorts.hash)
      .having(gt(total, 0))
      .orderBy(desc(total))
      .limit(limit);
    return rows as CohortSummary[];
  }

  async stats(): Promise<StatsResponse> {
    const months = await this.db
      .select({
        month: monthly_stats.month,
        kind: monthly_stats.kind,
        mode: monthly_stats.mode,
        submissions: monthly_stats.submissions
      })
      .from(monthly_stats)
      .orderBy(monthly_stats.month, monthly_stats.kind, monthly_stats.mode);
    const totals = new Map<string, StatsResponse['totals'][number]>();
    for (const m of months) {
      const key = `${m.kind}:${m.mode}`;
      const row = totals.get(key) ?? {
        kind: m.kind as RankingKind,
        mode: m.mode as RankingMode,
        submissions: 0
      };
      row.submissions += m.submissions;
      totals.set(key, row);
    }
    const [{ pending }] = await this.db
      .select({ pending: count() })
      .from(submissions)
      .where(eq(submissions.status, 'pending_review'));
    return {
      totals: [...totals.values()],
      months: months as StatsResponse['months'],
      pendingReview: pending
    };
  }
}
