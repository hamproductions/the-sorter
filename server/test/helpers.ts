import { sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { createApp } from '../src/app';
import { createDb, type DB } from '../src/db';
import { DataStore } from '../src/lib/data';
import { getCurrentItem, initSort, step } from '~/utils/sort';

export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgres://sorter:sorter@localhost:5433/sorter_test';

export const ADMIN_TOKEN = 'test-admin-token';

let db: DB | undefined;

export const getDb = async () => {
  if (!db) {
    db = createDb(TEST_DATABASE_URL);
    await migrate(db, { migrationsFolder: `${import.meta.dir}/../drizzle` });
  }
  return db;
};

export const resetDb = async () => {
  const database = await getDb();
  await database.execute(
    sql`TRUNCATE tickets, submissions, cohorts, item_monthly, cohort_monthly, monthly_stats, cohort_monthly_stats, query_cache, rate_limits, daily_salts`
  );
};

export const closeDb = async () => {
  await db?.$client.end();
  db = undefined;
};

export const createTestApp = async (clock: { now: Date }) => {
  const database = await getDb();
  const data = new DataStore();
  const { app, services } = createApp({
    db: database,
    data,
    config: {
      corsOrigins: ['https://hamproductions.github.io'],
      adminToken: ADMIN_TOKEN,
      clientIpHeader: 'x-real-ip'
    },
    now: () => clock.now,
    rateLimitMax: 100_000
  });
  const call = async (
    method: string,
    path: string,
    options: { body?: unknown; ip?: string; headers?: Record<string, string> } = {}
  ) => {
    const res = await app.handle(
      new Request(`http://localhost${path}`, {
        method,
        headers: {
          'content-type': 'application/json',
          'x-real-ip': options.ip ?? '203.0.113.1',
          ...options.headers
        },
        body: options.body === undefined ? undefined : JSON.stringify(options.body)
      })
    );
    const text = await res.text();
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      json = undefined;
    }
    return { status: res.status, json: json as any, text, headers: res.headers };
  };
  return { app, services, data, call, db: database };
};

export const simulateChoices = (
  initialOrder: string[],
  preference: string[],
  options: { tieEvery?: number } = {}
) => {
  const rank = new Map(preference.map((id, idx) => [id, idx]));
  let state = initSort(initialOrder);
  let choices = '';
  while (state.status !== 'end') {
    const current = getCurrentItem(state);
    if (!current?.left || !current.right) throw new Error('invalid state');
    const count = choices.length + 1;
    let choice: 'L' | 'R' | 'T';
    if (options.tieEvery && count % options.tieEvery === 0) choice = 'T';
    else choice = (rank.get(current.left[0]) ?? 0) <= (rank.get(current.right[0]) ?? 0) ? 'L' : 'R';
    choices += choice;
    state = step(choice === 'L' ? 'left' : choice === 'R' ? 'right' : 'tie', state);
  }
  return { choices, ranking: state.arr.filter((g) => g.length > 0) };
};

export const shuffled = <T>(items: T[], seed: number) => {
  const result = [...items];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) % 2147483648;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};
