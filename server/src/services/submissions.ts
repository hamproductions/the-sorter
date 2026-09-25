import { and, asc, count, eq, gt, lt, ne, sql } from 'drizzle-orm';
import {
  cohorts,
  daily_salts,
  query_cache,
  rate_limits,
  submissions,
  tickets
} from '../database/schema';
import type { DB } from '../db';
import type { DataStore } from '../lib/data';
import { canonicalizeFilter, cohortHashOf, normalizeIds } from '../lib/filters';
import { randomToken, safeEqual, sha256 } from '../lib/hash';
import type { IpHasher } from '../lib/ip';
import { dayOf, monthOf } from '../lib/period';
import { computeAgreement, countItems, rankingHash } from '../lib/ranking';
import { replaySort } from '../lib/replay';
import { type Executor, applyRollups } from './rollups';
import type { LeaderboardService } from './leaderboard';
import {
  GLOBAL_RANKING_MAX_ITEMS,
  GLOBAL_RANKING_MIN_ITEMS,
  GLOBAL_RANKING_PROTOCOL,
  RANKING_KINDS,
  RANKING_MODES,
  TICKET_TTL_MS,
  type RankingKind,
  type RankingMode,
  type ReviewItem,
  type SubmissionResponse
} from '~/types/global-ranking';
import { calculateMaxComparisons } from '~/utils/sort';

export const LIMITS = { ticket: 20, submit: 5 } as const;
export const IDENTICAL_MIN_ITEMS = 15;
export const IDENTICAL_WINDOW_MS = 24 * 60 * 60 * 1000;
export const BURST_WINDOW_MS = 10 * 60 * 1000;
export const BURST_LIMIT = 3;
export const REVIEW_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_ID_LENGTH = 64;
const MAX_PERFORMANCE_IDS = 100;

export type Failure = { code: 400 | 404 | 409 | 422 | 429; error: string };

export interface SubmitInput {
  protocol: number;
  ticket: string;
  kind: string;
  mode: string;
  filter: unknown;
  performanceIds?: unknown;
  initialOrder: unknown;
  choices: unknown;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isKind = (value: unknown): value is RankingKind =>
  RANKING_KINDS.includes(value as RankingKind);

export const isModeOf = (kind: RankingKind, value: unknown): value is RankingMode =>
  (RANKING_MODES[kind] as readonly string[]).includes(value as string);

const isIdList = (value: unknown, max: number): value is string[] =>
  Array.isArray(value) &&
  value.length <= max &&
  value.every((v) => typeof v === 'string' && v.length > 0 && v.length <= MAX_ID_LENGTH);

const sameSet = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((id) => set.has(id));
};

export class SubmissionService {
  constructor(
    private db: DB,
    private data: DataStore,
    private hasher: IpHasher,
    private leaderboard: LeaderboardService,
    private now: () => Date = () => new Date()
  ) {}

  private async hitLimit(
    db: Executor,
    ipHash: string,
    day: string,
    kind: string,
    action: keyof typeof LIMITS
  ) {
    const [row] = await db
      .insert(rate_limits)
      .values({ ip_hash: ipHash, day, kind, action, count: 1 })
      .onConflictDoUpdate({
        target: [rate_limits.ip_hash, rate_limits.day, rate_limits.kind, rate_limits.action],
        set: { count: sql`${rate_limits.count} + 1` }
      })
      .returning({ count: rate_limits.count });
    return row.count <= LIMITS[action];
  }

  async issueTicket(kind: unknown, ip: string) {
    if (!isKind(kind)) return { code: 422, error: 'invalid_kind' } satisfies Failure;
    const now = this.now();
    const { day, ipHash } = await this.hasher.hash(ip, now);
    if (!(await this.hitLimit(this.db, ipHash, day, kind, 'ticket'))) {
      return { code: 429, error: 'rate_limited' } satisfies Failure;
    }
    const [row] = await this.db
      .insert(tickets)
      .values({ kind, ip_hash: ipHash, issued_at: now })
      .returning({ id: tickets.id, issuedAt: tickets.issued_at });
    return {
      ticket: row.id,
      expiresAt: new Date(row.issuedAt.getTime() + TICKET_TTL_MS).toISOString()
    };
  }

  validate(input: SubmitInput) {
    if (input.protocol !== GLOBAL_RANKING_PROTOCOL) return { error: 'unsupported_protocol' };
    if (typeof input.ticket !== 'string' || !UUID.test(input.ticket))
      return { error: 'invalid_ticket' };
    if (!isKind(input.kind)) return { error: 'invalid_kind' };
    const kind = input.kind;
    if (!isModeOf(kind, input.mode)) return { error: 'invalid_mode' };
    const mode = input.mode;
    const filter = canonicalizeFilter(kind, input.filter);
    if (!filter) return { error: 'invalid_filter' };
    if (
      input.performanceIds !== undefined &&
      input.performanceIds !== null &&
      !isIdList(input.performanceIds, MAX_PERFORMANCE_IDS)
    ) {
      return { error: 'invalid_performance_ids' };
    }
    const performanceIds =
      mode === 'performance'
        ? normalizeIds((input.performanceIds as string[] | undefined) ?? [])
        : [];
    if (!isIdList(input.initialOrder, GLOBAL_RANKING_MAX_ITEMS)) return { error: 'invalid_items' };
    const initialOrder = input.initialOrder;
    if (initialOrder.length < GLOBAL_RANKING_MIN_ITEMS) return { error: 'too_few_items' };
    if (new Set(initialOrder).size !== initialOrder.length) return { error: 'duplicate_items' };
    const universe = this.data.universe(kind, mode);
    if (!initialOrder.every((id) => universe.has(id))) return { error: 'unknown_items' };
    if (
      typeof input.choices !== 'string' ||
      !/^[LRT]*$/.test(input.choices) ||
      input.choices.length > calculateMaxComparisons(initialOrder.length)
    ) {
      return { error: 'invalid_choices' };
    }
    const replay = replaySort(initialOrder, input.choices);
    if (!replay.ok) return { error: replay.reason };
    return {
      value: {
        ticket: input.ticket,
        kind,
        mode,
        filter,
        performanceIds,
        initialOrder,
        choices: input.choices,
        ranking: replay.ranking
      }
    };
  }

  private cohortFor(
    kind: RankingKind,
    mode: RankingMode,
    filter: Record<string, (string | number)[]>,
    performanceIds: string[],
    initialOrder: string[]
  ) {
    if (mode === 'heardle') return null;
    const derived = this.data.deriveItems(kind, mode, filter, performanceIds);
    if (!derived || !sameSet(derived, initialOrder)) return null;
    return cohortHashOf(kind, mode, filter, performanceIds);
  }

  async submit(input: SubmitInput, ip: string): Promise<SubmissionResponse | Failure> {
    const validated = this.validate(input);
    if ('error' in validated) return { code: 422, error: validated.error as string };
    const v = validated.value;
    const now = this.now();
    const { day, ipHash } = await this.hasher.hash(ip, now);
    const hash = rankingHash(v.kind, v.mode, v.ranking);
    const cohortHash = this.cohortFor(v.kind, v.mode, v.filter, v.performanceIds, v.initialOrder);
    const itemCount = countItems(v.ranking);
    const consensus = await this.leaderboard.consensus(v.kind, v.mode);
    const agreement = computeAgreement(v.ranking, consensus).agreement;

    return this.db.transaction(async (tx) => {
      const [ticket] = await tx
        .select()
        .from(tickets)
        .where(eq(tickets.id, v.ticket))
        .for('update');
      if (
        !ticket ||
        ticket.kind !== v.kind ||
        ticket.used_at ||
        ticket.issued_at.getTime() + TICKET_TTL_MS <= now.getTime()
      ) {
        return { code: 409, error: 'invalid_ticket' } satisfies Failure;
      }
      if (!(await this.hitLimit(tx, ipHash, day, v.kind, 'submit'))) {
        return { code: 429, error: 'rate_limited' } satisfies Failure;
      }

      const [{ duplicates }] = await tx
        .select({ duplicates: count() })
        .from(submissions)
        .where(and(eq(submissions.ip_hash, ipHash), eq(submissions.ranking_hash, hash)));
      if (duplicates > 0) {
        await tx.update(tickets).set({ used_at: now }).where(eq(tickets.id, v.ticket));
        return { status: 'duplicate' } satisfies SubmissionResponse;
      }

      let reviewReason: string | null = null;
      if (itemCount >= IDENTICAL_MIN_ITEMS) {
        const [{ identical }] = await tx
          .select({ identical: count() })
          .from(submissions)
          .where(
            and(
              eq(submissions.ranking_hash, hash),
              ne(submissions.ip_hash, ipHash),
              gt(submissions.created_at, new Date(now.getTime() - IDENTICAL_WINDOW_MS))
            )
          );
        if (identical > 0) reviewReason = 'identical_ranking';
      }
      if (!reviewReason) {
        const [{ recent }] = await tx
          .select({ recent: count() })
          .from(submissions)
          .where(
            and(
              eq(submissions.ip_hash, ipHash),
              gt(submissions.created_at, new Date(now.getTime() - BURST_WINDOW_MS))
            )
          );
        if (recent >= BURST_LIMIT) reviewReason = 'burst';
      }

      if (cohortHash) {
        await tx
          .insert(cohorts)
          .values({
            hash: cohortHash,
            kind: v.kind,
            mode: v.mode,
            filter: v.filter,
            performance_ids: v.performanceIds
          })
          .onConflictDoNothing();
      }

      const deleteToken = randomToken();
      const status = reviewReason ? 'pending_review' : 'accepted';
      const month = monthOf(now);
      const [row] = await tx
        .insert(submissions)
        .values({
          ticket_id: v.ticket,
          kind: v.kind,
          mode: v.mode,
          filter: v.filter,
          performance_ids: v.performanceIds,
          cohort_hash: cohortHash,
          initial_order: v.initialOrder,
          choices: v.choices,
          ranking: v.ranking,
          ranking_hash: hash,
          item_count: itemCount,
          ip_hash: ipHash,
          delete_token_hash: sha256(deleteToken),
          status,
          review_reason: reviewReason,
          agreement,
          month,
          created_at: now
        })
        .returning({ id: submissions.id });
      await tx.update(tickets).set({ used_at: now }).where(eq(tickets.id, v.ticket));

      if (status === 'accepted') {
        await applyRollups(
          tx,
          { kind: v.kind, mode: v.mode, month, cohort_hash: cohortHash, ranking: v.ranking },
          1
        );
      }
      return { status, id: row.id, deleteToken } satisfies SubmissionResponse;
    });
  }

  async withdraw(id: string, deleteToken: unknown) {
    if (!UUID.test(id) || typeof deleteToken !== 'string') {
      return { code: 404, error: 'not_found' } satisfies Failure;
    }
    return this.db.transaction(async (tx) => {
      const [row] = await tx.select().from(submissions).where(eq(submissions.id, id)).for('update');
      if (!row || !safeEqual(sha256(deleteToken), row.delete_token_hash)) {
        return { code: 404, error: 'not_found' } satisfies Failure;
      }
      if (row.status === 'accepted') await applyRollups(tx, row, -1);
      await tx.delete(submissions).where(eq(submissions.id, id));
      await tx.update(tickets).set({ used_at: null }).where(eq(tickets.id, row.ticket_id));
      return { status: 'deleted' as const };
    });
  }

  async listReviews(limit = 100): Promise<ReviewItem[]> {
    const rows = await this.db
      .select()
      .from(submissions)
      .where(eq(submissions.status, 'pending_review'))
      .orderBy(asc(submissions.created_at))
      .limit(limit);
    return rows.map((r) => ({
      id: r.id,
      kind: r.kind as RankingKind,
      mode: r.mode as RankingMode,
      filter: r.filter,
      ranking: r.ranking,
      reason: r.review_reason ?? '',
      createdAt: r.created_at.toISOString()
    }));
  }

  async resolveReview(id: string, action: 'approve' | 'reject') {
    if (!UUID.test(id)) return { code: 404, error: 'not_found' } satisfies Failure;
    return this.db.transaction(async (tx) => {
      const [row] = await tx
        .select()
        .from(submissions)
        .where(and(eq(submissions.id, id), eq(submissions.status, 'pending_review')))
        .for('update');
      if (!row) return { code: 404, error: 'not_found' } satisfies Failure;
      if (action === 'reject') {
        await tx.delete(submissions).where(eq(submissions.id, id));
        return { status: 'rejected' };
      }
      await tx
        .update(submissions)
        .set({ status: 'accepted', review_reason: null })
        .where(eq(submissions.id, id));
      await applyRollups(tx, row, 1);
      return { status: 'accepted' };
    });
  }

  async purge() {
    const now = this.now();
    const yesterday = dayOf(new Date(now.getTime() - 24 * 60 * 60 * 1000));
    await this.db
      .delete(tickets)
      .where(lt(tickets.issued_at, new Date(now.getTime() - TICKET_TTL_MS - 24 * 60 * 60 * 1000)));
    await this.db.delete(rate_limits).where(lt(rate_limits.day, yesterday));
    await this.db.delete(daily_salts).where(lt(daily_salts.day, yesterday));
    await this.db
      .delete(submissions)
      .where(
        and(
          eq(submissions.status, 'pending_review'),
          lt(submissions.created_at, new Date(now.getTime() - REVIEW_TTL_MS))
        )
      );
    await this.db.delete(query_cache).where(lt(query_cache.expires_at, now));
  }

  async recomputeAgreement(batchSize = 500) {
    for (const kind of RANKING_KINDS) {
      for (const mode of RANKING_MODES[kind]) {
        const consensus = await this.leaderboard.consensus(kind, mode);
        let cursor: string | undefined;
        for (;;) {
          const rows = await this.db
            .select({ id: submissions.id, ranking: submissions.ranking })
            .from(submissions)
            .where(
              and(
                eq(submissions.kind, kind),
                eq(submissions.mode, mode),
                eq(submissions.status, 'accepted'),
                cursor ? gt(submissions.id, cursor) : undefined
              )
            )
            .orderBy(asc(submissions.id))
            .limit(batchSize);
          if (rows.length === 0) break;
          for (const row of rows) {
            const { agreement } = computeAgreement(row.ranking, consensus);
            await this.db.update(submissions).set({ agreement }).where(eq(submissions.id, row.id));
          }
          cursor = rows[rows.length - 1].id;
        }
      }
    }
  }
}
