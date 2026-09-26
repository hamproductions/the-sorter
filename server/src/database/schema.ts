import { sql } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from 'drizzle-orm/pg-core';

export const tickets = pgTable(
  'tickets',
  {
    id: uuid().primaryKey().defaultRandom(),
    kind: text().notNull(),
    ip_hash: text().notNull(),
    issued_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
    used_at: timestamp({ withTimezone: true }),
    submitted: boolean().notNull().default(false)
  },
  (t) => [index('tickets_issued_at_idx').on(t.issued_at)]
);

export const submissions = pgTable(
  'submissions',
  {
    id: uuid().primaryKey().defaultRandom(),
    ticket_id: uuid().notNull(),
    kind: text().notNull(),
    mode: text().notNull(),
    filter: jsonb().$type<Record<string, (string | number)[]>>().notNull(),
    performance_ids: text()
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    cohort_hash: text(),
    initial_order: text().array().notNull(),
    choices: text().notNull(),
    ranking: jsonb().$type<string[][]>().notNull(),
    ranking_hash: text().notNull(),
    item_count: integer().notNull(),
    ip_hash: text().notNull(),
    delete_token_hash: text().notNull(),
    status: text().notNull(),
    review_reason: text(),
    agreement: doublePrecision(),
    month: text().notNull(),
    created_at: timestamp({ withTimezone: true }).notNull().defaultNow()
  },
  (t) => [
    uniqueIndex('submissions_ticket_id_idx').on(t.ticket_id),
    index('submissions_scope_idx').on(t.kind, t.mode, t.status, t.month),
    index('submissions_ranking_hash_idx').on(t.ranking_hash, t.created_at),
    index('submissions_ip_hash_idx').on(t.ip_hash, t.created_at),
    index('submissions_status_idx').on(t.status, t.created_at),
    index('submissions_agreement_idx').on(t.kind, t.mode, t.status, t.agreement),
    index('submissions_initial_order_idx').using('gin', t.initial_order)
  ]
);

export const cohorts = pgTable(
  'cohorts',
  {
    hash: text().primaryKey(),
    kind: text().notNull(),
    mode: text().notNull(),
    filter: jsonb().$type<Record<string, (string | number)[]>>().notNull(),
    performance_ids: text()
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    created_at: timestamp({ withTimezone: true }).notNull().defaultNow()
  },
  (t) => [index('cohorts_scope_idx').on(t.kind, t.mode)]
);

const rollupColumns = {
  appearances: integer().notNull(),
  percentile_sum: doublePrecision().notNull(),
  top1: integer().notNull(),
  top3: integer().notNull(),
  top10: integer().notNull()
};

export const item_monthly = pgTable(
  'item_monthly',
  {
    kind: text().notNull(),
    mode: text().notNull(),
    month: text().notNull(),
    item_id: text().notNull(),
    ...rollupColumns
  },
  (t) => [primaryKey({ columns: [t.kind, t.mode, t.month, t.item_id] })]
);

export const cohort_monthly = pgTable(
  'cohort_monthly',
  {
    cohort_hash: text().notNull(),
    month: text().notNull(),
    item_id: text().notNull(),
    ...rollupColumns
  },
  (t) => [primaryKey({ columns: [t.cohort_hash, t.month, t.item_id] })]
);

export const monthly_stats = pgTable(
  'monthly_stats',
  {
    kind: text().notNull(),
    mode: text().notNull(),
    month: text().notNull(),
    submissions: integer().notNull()
  },
  (t) => [primaryKey({ columns: [t.kind, t.mode, t.month] })]
);

export const cohort_monthly_stats = pgTable(
  'cohort_monthly_stats',
  {
    cohort_hash: text().notNull(),
    month: text().notNull(),
    submissions: integer().notNull()
  },
  (t) => [primaryKey({ columns: [t.cohort_hash, t.month] })]
);

export const query_cache = pgTable(
  'query_cache',
  {
    key: text().primaryKey(),
    kind: text().notNull(),
    month: text().notNull(),
    value: jsonb().notNull(),
    expires_at: timestamp({ withTimezone: true })
  },
  (t) => [index('query_cache_scope_idx').on(t.kind, t.month)]
);

export const rate_limits = pgTable(
  'rate_limits',
  {
    ip_hash: text().notNull(),
    day: text().notNull(),
    kind: text().notNull(),
    action: text().notNull(),
    count: integer().notNull()
  },
  (t) => [primaryKey({ columns: [t.ip_hash, t.day, t.kind, t.action] })]
);

export const daily_salts = pgTable('daily_salts', {
  day: text().primaryKey(),
  salt: text().notNull()
});

export const table = {
  tickets,
  submissions,
  cohorts,
  item_monthly,
  cohort_monthly,
  monthly_stats,
  cohort_monthly_stats,
  query_cache,
  rate_limits,
  daily_salts
} as const;
