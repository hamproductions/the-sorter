import { and, eq, inArray, lte, sql } from 'drizzle-orm';
import {
  cohort_monthly,
  cohort_monthly_stats,
  item_monthly,
  monthly_stats,
  query_cache
} from '../database/schema';
import type { DB } from '../db';
import { computeContributions } from '../lib/ranking';

type Tx = Parameters<Parameters<DB['transaction']>[0]>[0];
export type Executor = DB | Tx;

export interface RollupTarget {
  kind: string;
  mode: string;
  month: string;
  cohort_hash: string | null;
  ranking: string[][];
}

const added = (column: string) => sql.raw(`excluded.${column}`);

export const applyRollups = async (db: Executor, target: RollupTarget, sign: 1 | -1) => {
  const { kind, mode, month, cohort_hash, ranking } = target;
  const contributions = computeContributions(ranking).sort((a, b) =>
    a.itemId < b.itemId ? -1 : a.itemId > b.itemId ? 1 : 0
  );
  const itemIds = contributions.map((c) => c.itemId);
  const values = contributions.map((c) => ({
    item_id: c.itemId,
    appearances: sign,
    percentile_sum: sign * c.percentile,
    top1: sign * c.top1,
    top3: sign * c.top3,
    top10: sign * c.top10
  }));

  await db
    .insert(item_monthly)
    .values(values.map((v) => ({ ...v, kind, mode, month })))
    .onConflictDoUpdate({
      target: [item_monthly.kind, item_monthly.mode, item_monthly.month, item_monthly.item_id],
      set: {
        appearances: sql`${item_monthly.appearances} + ${added('appearances')}`,
        percentile_sum: sql`${item_monthly.percentile_sum} + ${added('percentile_sum')}`,
        top1: sql`${item_monthly.top1} + ${added('top1')}`,
        top3: sql`${item_monthly.top3} + ${added('top3')}`,
        top10: sql`${item_monthly.top10} + ${added('top10')}`
      }
    });

  await db
    .insert(monthly_stats)
    .values({ kind, mode, month, submissions: sign })
    .onConflictDoUpdate({
      target: [monthly_stats.kind, monthly_stats.mode, monthly_stats.month],
      set: { submissions: sql`${monthly_stats.submissions} + ${added('submissions')}` }
    });

  if (cohort_hash) {
    await db
      .insert(cohort_monthly)
      .values(values.map((v) => ({ ...v, cohort_hash, month })))
      .onConflictDoUpdate({
        target: [cohort_monthly.cohort_hash, cohort_monthly.month, cohort_monthly.item_id],
        set: {
          appearances: sql`${cohort_monthly.appearances} + ${added('appearances')}`,
          percentile_sum: sql`${cohort_monthly.percentile_sum} + ${added('percentile_sum')}`,
          top1: sql`${cohort_monthly.top1} + ${added('top1')}`,
          top3: sql`${cohort_monthly.top3} + ${added('top3')}`,
          top10: sql`${cohort_monthly.top10} + ${added('top10')}`
        }
      });

    await db
      .insert(cohort_monthly_stats)
      .values({ cohort_hash, month, submissions: sign })
      .onConflictDoUpdate({
        target: [cohort_monthly_stats.cohort_hash, cohort_monthly_stats.month],
        set: {
          submissions: sql`${cohort_monthly_stats.submissions} + ${added('submissions')}`
        }
      });
  }

  if (sign < 0) {
    await db
      .delete(item_monthly)
      .where(
        and(
          eq(item_monthly.kind, kind),
          eq(item_monthly.mode, mode),
          eq(item_monthly.month, month),
          inArray(item_monthly.item_id, itemIds),
          lte(item_monthly.appearances, 0)
        )
      );
    await db
      .delete(monthly_stats)
      .where(
        and(
          eq(monthly_stats.kind, kind),
          eq(monthly_stats.mode, mode),
          eq(monthly_stats.month, month),
          lte(monthly_stats.submissions, 0)
        )
      );
    if (cohort_hash) {
      await db
        .delete(cohort_monthly)
        .where(
          and(
            eq(cohort_monthly.cohort_hash, cohort_hash),
            eq(cohort_monthly.month, month),
            inArray(cohort_monthly.item_id, itemIds),
            lte(cohort_monthly.appearances, 0)
          )
        );
      await db
        .delete(cohort_monthly_stats)
        .where(
          and(
            eq(cohort_monthly_stats.cohort_hash, cohort_hash),
            eq(cohort_monthly_stats.month, month),
            lte(cohort_monthly_stats.submissions, 0)
          )
        );
    }
  }

  await db.delete(query_cache).where(and(eq(query_cache.kind, kind), eq(query_cache.month, month)));
};
