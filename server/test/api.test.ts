import { afterAll, beforeEach, describe, expect, it } from 'bun:test';
import { eq } from 'drizzle-orm';
import { submissions, tickets } from '../src/database/schema';
import { getCharacterSortList } from '~/utils/character';
import { ADMIN_TOKEN, closeDb, createTestApp, resetDb, shuffled, simulateChoices } from './helpers';

const clock = { now: new Date('2026-09-10T12:00:00Z') };
const env = await createTestApp(clock);
const { call, data, services, db } = env;

const characterIds = data.characters.map((c) => c.id);
const songIds = data.songs.map((s) => s.id);

type Kind = 'character' | 'song';

const ticketFor = async (kind: Kind, ip?: string) => {
  const res = await call('POST', '/tickets', { body: { kind }, ip });
  expect(res.status).toBe(200);
  return res.json.ticket as string;
};

const buildPayload = (
  ticket: string,
  options: {
    kind?: Kind;
    mode?: string;
    items?: string[];
    preference?: string[];
    filter?: unknown;
    performanceIds?: string[];
    seed?: number;
    tieEvery?: number;
  } = {}
) => {
  const kind = options.kind ?? 'character';
  const items = options.items ?? characterIds.slice(0, 8);
  const initialOrder = shuffled(items, options.seed ?? 7);
  const { choices, ranking } = simulateChoices(initialOrder, options.preference ?? items, {
    tieEvery: options.tieEvery
  });
  return {
    body: {
      protocol: 1,
      ticket,
      kind,
      mode: options.mode ?? (kind === 'character' ? 'chara' : 'normal'),
      filter: options.filter ?? null,
      performanceIds: options.performanceIds,
      initialOrder,
      choices
    },
    ranking
  };
};

const submit = async (options: Parameters<typeof buildPayload>[1] & { ip?: string } = {}) => {
  const ticket = await ticketFor(options.kind ?? 'character', options.ip);
  const { body, ranking } = buildPayload(ticket, options);
  const res = await call('POST', '/submissions', { body, ip: options.ip });
  return { res, ticket, body, ranking };
};

const leaderboard = async (query: string) => {
  const res = await call('GET', `/leaderboard?${query}`);
  expect(res.status).toBe(200);
  return res.json;
};

beforeEach(async () => {
  clock.now = new Date('2026-09-10T12:00:00Z');
  await resetDb();
});

afterAll(async () => {
  await closeDb();
});

describe('tickets', () => {
  it('issues a 7 day ticket', async () => {
    const res = await call('POST', '/tickets', { body: { kind: 'song' } });
    expect(res.status).toBe(200);
    expect(new Date(res.json.expiresAt).getTime() - clock.now.getTime()).toBe(7 * 24 * 3600 * 1000);
  });

  it('rejects unknown kinds', async () => {
    expect((await call('POST', '/tickets', { body: { kind: 'hasu' } })).status).toBe(422);
    expect((await call('POST', '/tickets', { body: {} })).status).toBe(422);
  });

  it('limits tickets per network, day and kind', async () => {
    for (let i = 0; i < 20; i++) await ticketFor('character');
    expect((await call('POST', '/tickets', { body: { kind: 'character' } })).status).toBe(429);
    expect((await call('POST', '/tickets', { body: { kind: 'song' } })).status).toBe(200);
    expect(
      (await call('POST', '/tickets', { body: { kind: 'character' }, ip: '198.51.100.9' })).status
    ).toBe(200);
    clock.now = new Date('2026-09-11T12:00:00Z');
    expect((await call('POST', '/tickets', { body: { kind: 'character' } })).status).toBe(200);
  });
});

describe('submissions', () => {
  it('accepts a replayed sort and derives the ranking server side', async () => {
    const { res, ranking } = await submit();
    expect(res.status).toBe(200);
    expect(res.json.status).toBe('accepted');
    expect(typeof res.json.deleteToken).toBe('string');
    const [row] = await db.select().from(submissions).where(eq(submissions.id, res.json.id));
    expect(row.ranking).toEqual(ranking);
    expect(row.month).toBe('2026-09');
    const board = await leaderboard('kind=character&mode=chara');
    expect(board.submissions).toBe(1);
    expect(board.items.map((e: { itemId: string }) => e.itemId)).toEqual(ranking.flat());
  });

  it('accepts sorts with ties', async () => {
    const { res, ranking } = await submit({ tieEvery: 3 });
    expect(res.json.status).toBe('accepted');
    expect(ranking.some((g) => g.length > 1)).toBe(true);
  });

  it('rejects a reused ticket', async () => {
    const { ticket } = await submit();
    const again = buildPayload(ticket, { seed: 99 });
    const res = await call('POST', '/submissions', { body: again.body });
    expect(res.status).toBe(409);
    expect(res.json.error).toBe('invalid_ticket');
  });

  it('rejects the same ticket submitted twice at once', async () => {
    const ticket = await ticketFor('character');
    const a = buildPayload(ticket, { seed: 1 });
    const b = buildPayload(ticket, { seed: 2 });
    const results = await Promise.all([
      call('POST', '/submissions', { body: a.body }),
      call('POST', '/submissions', { body: b.body })
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    const rows = await db.select().from(submissions);
    expect(rows).toHaveLength(1);
  });

  it('rejects expired, unknown and wrong-kind tickets', async () => {
    const ticket = await ticketFor('character');
    clock.now = new Date('2026-09-17T12:00:01Z');
    expect((await call('POST', '/submissions', { body: buildPayload(ticket).body })).status).toBe(
      409
    );
    clock.now = new Date('2026-09-10T12:00:00Z');
    const unknown = buildPayload('00000000-0000-4000-8000-000000000000').body;
    expect((await call('POST', '/submissions', { body: unknown })).status).toBe(409);
    const songTicket = await ticketFor('song');
    expect(
      (await call('POST', '/submissions', { body: buildPayload(songTicket).body })).status
    ).toBe(409);
    expect(
      (await call('POST', '/submissions', { body: buildPayload('not-a-uuid').body })).json.error
    ).toBe('invalid_ticket');
  });

  it('rejects tampered or malformed sort logs without using the ticket', async () => {
    const ticket = await ticketFor('character');
    const { body } = buildPayload(ticket);
    const cases: [Record<string, unknown>, string][] = [
      [{ choices: `${body.choices}L` }, 'extra_choices'],
      [{ choices: body.choices.slice(0, -1) }, 'incomplete'],
      [{ choices: 'LRX' }, 'invalid_choices'],
      [{ choices: 42 }, 'invalid_choices'],
      [{ choices: 'L'.repeat(10_000) }, 'invalid_choices'],
      [
        { initialOrder: [...body.initialOrder.slice(0, 7), body.initialOrder[0]] },
        'duplicate_items'
      ],
      [{ initialOrder: ['1', '2', '3', '4'] }, 'too_few_items'],
      [{ initialOrder: [...body.initialOrder.slice(0, 7), 'nope'] }, 'unknown_items'],
      [{ initialOrder: 'abc' }, 'invalid_items'],
      [
        { mode: 'seiyuu', initialOrder: [...body.initialOrder.slice(0, 7), '1-9'] },
        'unknown_items'
      ],
      [{ mode: 'heardle' }, 'invalid_mode'],
      [{ kind: 'hasu' }, 'invalid_kind'],
      [{ protocol: 2 }, 'unsupported_protocol'],
      [{ filter: { series: 'x' } }, 'invalid_filter'],
      [{ filter: [] }, 'invalid_filter'],
      [{ mode: 'performance', kind: 'song', performanceIds: 'x' }, 'invalid_performance_ids']
    ];
    for (const [patch, error] of cases) {
      const res = await call('POST', '/submissions', { body: { ...body, ...patch } });
      expect([res.status, res.json.error]).toEqual([422, error]);
    }
    const [row] = await db.select().from(tickets).where(eq(tickets.id, ticket));
    expect(row.used_at).toBeNull();
    expect((await call('POST', '/submissions', { body })).json.status).toBe('accepted');
  });

  it('rejects bodies that are not JSON objects', async () => {
    const res = await call('POST', '/submissions', { body: 'hello' });
    expect(res.status).toBe(422);
  });

  it('limits submissions per network, day and kind', async () => {
    for (let i = 0; i < 5; i++) {
      clock.now = new Date(Date.UTC(2026, 8, 10, 1 + i * 2));
      const { res } = await submit({
        seed: i + 1,
        preference: shuffled(characterIds.slice(0, 8), i)
      });
      expect(res.json.status).toBe('accepted');
    }
    clock.now = new Date(Date.UTC(2026, 8, 10, 13));
    const { res } = await submit({ seed: 42, preference: shuffled(characterIds.slice(0, 8), 42) });
    expect(res.status).toBe(429);
    const other = await submit({ seed: 43, ip: '198.51.100.20' });
    expect(other.res.json.status).toBe('accepted');
  });

  it('answers duplicate for the same ranking from the same network and stores nothing', async () => {
    await submit({ seed: 1 });
    clock.now = new Date('2026-09-10T13:00:00Z');
    const { res } = await submit({ seed: 2 });
    expect(res.status).toBe(200);
    expect(res.json).toEqual({ status: 'duplicate' });
    expect(await db.select().from(submissions)).toHaveLength(1);
  });

  it('sends identical long rankings from other networks to review', async () => {
    const items = characterIds.slice(0, 16);
    await submit({ items, ip: '198.51.100.1' });
    const { res } = await submit({ items, seed: 3, ip: '198.51.100.2' });
    expect(res.json.status).toBe('pending_review');
    const board = await leaderboard('kind=character&mode=chara');
    expect(board.submissions).toBe(1);
    expect(board.items[0].appearances).toBe(1);
    const stats = (await call('GET', '/stats')).json;
    expect(stats.pendingReview).toBe(1);
  });

  it('does not flag identical short rankings', async () => {
    await submit({ ip: '198.51.100.1' });
    const { res } = await submit({ seed: 3, ip: '198.51.100.2' });
    expect(res.json.status).toBe('accepted');
  });

  it('sends bursts from one network to review', async () => {
    for (let i = 0; i < 3; i++) {
      const { res } = await submit({
        seed: i,
        preference: shuffled(characterIds.slice(0, 8), i + 10)
      });
      expect(res.json.status).toBe('accepted');
    }
    const { res } = await submit({ seed: 9, preference: shuffled(characterIds.slice(0, 8), 99) });
    expect(res.json.status).toBe('pending_review');
    clock.now = new Date('2026-09-10T12:11:00Z');
    const later = await submit({ seed: 8, preference: shuffled(characterIds.slice(0, 8), 98) });
    expect(later.res.json.status).toBe('accepted');
  });
});

describe('withdrawing', () => {
  it('needs the delete token, reverses the totals and frees the ticket', async () => {
    const { res, ticket, body } = await submit();
    expect(
      (await call('DELETE', `/submissions/${res.json.id}`, { body: { deleteToken: 'wrong' } }))
        .status
    ).toBe(404);
    expect(
      (
        await call('DELETE', '/submissions/00000000-0000-4000-8000-000000000000', {
          body: { deleteToken: res.json.deleteToken }
        })
      ).status
    ).toBe(404);
    const deleted = await call('DELETE', `/submissions/${res.json.id}`, {
      body: { deleteToken: res.json.deleteToken }
    });
    expect(deleted.json).toEqual({ status: 'deleted' });
    const board = await leaderboard('kind=character&mode=chara');
    expect(board).toMatchObject({ submissions: 0, items: [] });
    expect((await call('GET', '/stats')).json.totals).toEqual([]);
    const resubmit = await call('POST', '/submissions', { body: { ...body, ticket } });
    expect(resubmit.json.status).toBe('accepted');
  });

  it('does not count withdrawing and resubmitting the same ticket against the daily limit', async () => {
    const { res, ticket, body } = await submit();
    let current = res.json;
    for (let i = 0; i < 6; i++) {
      await call('DELETE', `/submissions/${current.id}`, {
        body: { deleteToken: current.deleteToken }
      });
      const again = await call('POST', '/submissions', { body: { ...body, ticket } });
      expect(again.status).toBe(200);
      current = again.json;
    }
    expect((await db.select().from(submissions)).length).toBe(1);
    for (let i = 0; i < 4; i++) {
      clock.now = new Date(Date.UTC(2026, 8, 10, 13 + i * 2));
      const other = await submit({
        seed: 20 + i,
        preference: shuffled(characterIds.slice(0, 8), i + 30)
      });
      expect(other.res.status).toBe(200);
    }
    clock.now = new Date(Date.UTC(2026, 8, 10, 23));
    expect(
      (await submit({ seed: 99, preference: shuffled(characterIds.slice(0, 8), 99) })).res.status
    ).toBe(429);
  });

  it('keeps other results when one is withdrawn', async () => {
    const first = await submit({ ip: '198.51.100.1' });
    await submit({ ip: '198.51.100.2', preference: [...characterIds.slice(0, 8)].reverse() });
    await call('DELETE', `/submissions/${first.res.json.id}`, {
      body: { deleteToken: first.res.json.deleteToken }
    });
    const board = await leaderboard('kind=character&mode=chara');
    expect(board.submissions).toBe(1);
    expect(board.items[0].itemId).toBe(characterIds[7]);
    expect(board.items.every((e: { appearances: number }) => e.appearances === 1)).toBe(true);
  });
});

describe('review queue', () => {
  const queueOne = async () => {
    const items = characterIds.slice(0, 16);
    await submit({ items, ip: '198.51.100.1' });
    const { res } = await submit({ items, seed: 5, ip: '198.51.100.2' });
    return res.json.id as string;
  };

  it('serves the admin page without data and requires the token for data', async () => {
    const page = await call('GET', '/admin');
    expect(page.status).toBe(200);
    expect(page.headers.get('content-type')).toContain('text/html');
    expect(page.text).not.toContain(ADMIN_TOKEN);
  });

  it('requires the admin token', async () => {
    expect((await call('GET', '/admin/reviews')).status).toBe(401);
    expect(
      (await call('GET', '/admin/reviews', { headers: { authorization: 'Bearer nope' } })).status
    ).toBe(401);
  });

  it('keeping adds the result to the totals', async () => {
    const id = await queueOne();
    const auth = { authorization: `Bearer ${ADMIN_TOKEN}` };
    const list = await call('GET', '/admin/reviews', { headers: auth });
    expect(list.json.map((r: { id: string; reason: string }) => [r.id, r.reason])).toEqual([
      [id, 'identical_ranking']
    ]);
    const names = list.json[0].names as Record<string, string>;
    expect(Object.keys(names)).toHaveLength(16);
    expect(Object.values(names).every((name) => name.length > 0)).toBe(true);
    expect(list.text).not.toContain('ip_hash');
    expect((await call('POST', `/admin/reviews/${id}/keep`, { headers: auth })).json.status).toBe(
      'kept'
    );
    expect((await leaderboard('kind=character&mode=chara')).submissions).toBe(2);
    expect((await call('POST', `/admin/reviews/${id}/keep`, { headers: auth })).status).toBe(404);
    expect((await call('DELETE', `/admin/reviews/${id}`, { headers: auth })).status).toBe(404);
  });

  it('deleting removes the result', async () => {
    const id = await queueOne();
    const auth = { authorization: `Bearer ${ADMIN_TOKEN}` };
    expect((await call('DELETE', `/admin/reviews/${id}`, { headers: auth })).json.status).toBe(
      'deleted'
    );
    expect(await db.select().from(submissions).where(eq(submissions.id, id))).toHaveLength(0);
    expect((await leaderboard('kind=character&mode=chara')).submissions).toBe(1);
  });

  it('purges unreviewed results after 30 days, stale tickets and limits', async () => {
    await queueOne();
    await ticketFor('song');
    clock.now = new Date('2026-10-11T12:00:00Z');
    await services.submissions.purge();
    expect(
      await db.select().from(submissions).where(eq(submissions.status, 'pending_review'))
    ).toHaveLength(0);
    expect(
      await db.select().from(submissions).where(eq(submissions.status, 'accepted'))
    ).toHaveLength(1);
    expect(await db.select().from(tickets)).toHaveLength(0);
  });
});

describe('cohorts and views', () => {
  const MUSE = 'ラブライブ！';
  const muse = getCharacterSortList(data.characters, false, {
    series: [MUSE],
    school: [],
    units: []
  }).map((c) => c.id);

  it('files a result under its filter when the items match the filter', async () => {
    const { res } = await submit({
      items: muse,
      filter: { series: [MUSE], school: [], units: [] }
    });
    expect(res.json.status).toBe('accepted');
    const cohort = await leaderboard(
      `kind=character&mode=chara&view=cohort&filter=${encodeURIComponent(JSON.stringify({ series: [MUSE] }))}`
    );
    expect(cohort.submissions).toBe(1);
    const list = (await call('GET', '/cohorts?kind=character&mode=chara')).json;
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ filter: { series: [MUSE] }, submissions: 1 });
  });

  it('keeps a result out of cohorts when its items do not match the filter', async () => {
    const { res } = await submit({
      items: muse.slice(0, 6),
      filter: { series: [MUSE], school: [], units: [] }
    });
    expect(res.json.status).toBe('accepted');
    const [row] = await db.select().from(submissions);
    expect(row.cohort_hash).toBeNull();
    expect((await leaderboard('kind=character&mode=chara')).submissions).toBe(1);
    expect((await call('GET', '/cohorts?kind=character')).json).toEqual([]);
  });

  it('re-ranks every result within a subset', async () => {
    const all = characterIds.slice(0, 12);
    await submit({ items: all, preference: all, ip: '198.51.100.1' });
    await submit({ items: all, preference: [...all].reverse(), ip: '198.51.100.2' });
    const subset = await leaderboard(
      `kind=character&mode=chara&view=subset&filter=${encodeURIComponent(
        JSON.stringify({ series: [MUSE] })
      )}`
    );
    const inMuse = all.filter((id) => muse.includes(id));
    expect(subset.submissions).toBe(2);
    expect(subset.items.map((e: { itemId: string }) => e.itemId).sort()).toEqual(
      [...inMuse].sort()
    );
    expect(subset.items.every((e: { appearances: number }) => e.appearances === 2)).toBe(true);
  });

  it('serves subset views from cache until a result changes that month', async () => {
    const all = characterIds.slice(0, 10);
    const q = `kind=character&mode=chara&view=subset&filter=${encodeURIComponent(JSON.stringify({ series: [MUSE] }))}`;
    await submit({ items: all, ip: '198.51.100.1' });
    expect((await leaderboard(q)).submissions).toBe(1);
    const second = await submit({ items: all, preference: [...all].reverse(), ip: '198.51.100.2' });
    expect((await leaderboard(q)).submissions).toBe(2);
    await call('DELETE', `/submissions/${second.res.json.id}`, {
      body: { deleteToken: second.res.json.deleteToken }
    });
    expect((await leaderboard(q)).submissions).toBe(1);
  });

  it('requires a mode for character subsets and valid parameters', async () => {
    expect((await call('GET', '/leaderboard?kind=character&view=subset')).status).toBe(400);
    for (const q of [
      'kind=hasu',
      'kind=song&mode=chara',
      'kind=song&period=2026-13',
      'kind=song&view=weird',
      'kind=song&filter=notjson',
      'kind=song&filter=%7B%22years%22%3A%5B%22x%22%5D%7D'
    ]) {
      expect((await call('GET', `/leaderboard?${q}`)).status).toBe(400);
    }
    expect((await call('GET', '/leaderboard')).status).toBe(422);
  });

  it('keeps seiyuu and character results apart', async () => {
    const seiyuuIds = getCharacterSortList(data.characters, true).map((c) => c.id);
    const extra = seiyuuIds.filter((id) => id.includes('-')).slice(0, 2);
    const items = [...seiyuuIds.filter((id) => !id.includes('-')).slice(0, 6), ...extra];
    const { res } = await submit({ mode: 'seiyuu', items });
    expect(res.json.status).toBe('accepted');
    expect((await leaderboard('kind=character&mode=seiyuu')).submissions).toBe(1);
    expect((await leaderboard('kind=character&mode=chara')).submissions).toBe(0);
  });

  it('files song results by mode and combines modes on request', async () => {
    const withAudio = data.songs.filter((s) => s.wikiAudioUrl).map((s) => s.id);
    await submit({ kind: 'song', items: songIds.slice(0, 6) });
    await submit({
      kind: 'song',
      mode: 'heardle',
      items: withAudio.slice(0, 6),
      ip: '198.51.100.3'
    });
    expect((await leaderboard('kind=song&mode=normal')).submissions).toBe(1);
    expect((await leaderboard('kind=song&mode=heardle')).submissions).toBe(1);
    expect((await leaderboard('kind=song')).submissions).toBe(2);
    const [heardle] = await db.select().from(submissions).where(eq(submissions.mode, 'heardle'));
    expect(heardle.cohort_hash).toBeNull();
  });

  it('files performance results under their performances', async () => {
    const performance = Object.keys(
      (await import('../../data/performance-setlists.json')).default
    ).find((id) => {
      const items = data.deriveItems('song', 'performance', {}, [id]);
      return items && items.length >= 5 && items.length <= 30;
    })!;
    const items = data.deriveItems('song', 'performance', {}, [performance])!;
    const { res } = await submit({
      kind: 'song',
      mode: 'performance',
      items,
      performanceIds: [performance]
    });
    expect(res.json.status).toBe('accepted');
    const cohort = await leaderboard(
      `kind=song&mode=performance&view=cohort&performanceIds=${performance}`
    );
    expect(cohort.submissions).toBe(1);
  });
});

describe('time series', () => {
  it('splits totals by month and year and tracks rank history', async () => {
    const items = characterIds.slice(0, 8);
    clock.now = new Date('2026-08-20T12:00:00Z');
    await submit({ items, preference: items, ip: '198.51.100.1' });
    clock.now = new Date('2026-09-05T12:00:00Z');
    await submit({ items, preference: [...items].reverse(), ip: '198.51.100.2' });
    clock.now = new Date('2027-01-05T12:00:00Z');
    await submit({ items, preference: [...items].reverse(), ip: '198.51.100.3' });

    expect((await leaderboard('kind=character&mode=chara&period=2026-08')).items[0].itemId).toBe(
      items[0]
    );
    expect((await leaderboard('kind=character&mode=chara&period=2026-09')).items[0].itemId).toBe(
      items[7]
    );
    expect((await leaderboard('kind=character&mode=chara&period=2026')).submissions).toBe(2);
    expect((await leaderboard('kind=character&mode=chara&period=2027')).submissions).toBe(1);
    expect((await leaderboard('kind=character&mode=chara&period=2025')).items).toEqual([]);

    const history = await call('GET', `/items/${items[0]}/history?kind=character&mode=chara`);
    expect(
      history.json.points.map((p: { month: string; rank: number }) => [p.month, p.rank])
    ).toEqual([
      ['2026-08', 1],
      ['2026-09', 8],
      ['2027-01', 8]
    ]);
    const months = (await call('GET', '/stats')).json.months.map((m: { month: string }) => m.month);
    expect(months).toEqual(['2026-08', '2026-09', '2027-01']);
  });
});

describe('agreement', () => {
  it('scores a ranking against everyone and places it among other results', async () => {
    const items = characterIds.slice(0, 8);
    for (let i = 0; i < 4; i++) {
      await submit({ items, preference: items, seed: i, ip: `198.51.100.${i + 10}` });
    }
    await submit({ items, preference: [...items].reverse(), ip: '198.51.100.99' });
    await services.submissions.recomputeAgreement();
    const same = await call('POST', '/agreement', {
      body: { kind: 'character', mode: 'chara', ranking: items.map((id) => [id]) }
    });
    expect(same.json.agreement).toBeCloseTo(1, 5);
    expect(same.json.sampleSize).toBe(5);
    expect(same.json.percentile).toBeCloseTo(1 / 5, 5);
    const reverse = await call('POST', '/agreement', {
      body: { kind: 'character', mode: 'chara', ranking: [...items].reverse().map((id) => [id]) }
    });
    expect(reverse.json.agreement).toBeCloseTo(0, 5);
    expect(reverse.json.percentile).toBe(0);
  });

  it('handles empty data and bad input', async () => {
    const empty = await call('POST', '/agreement', {
      body: { kind: 'song', mode: 'normal', ranking: [['1'], ['2']] }
    });
    expect(empty.json).toMatchObject({ agreement: null, percentile: null, sampleSize: 0 });
    expect(
      (await call('POST', '/agreement', { body: { kind: 'song', mode: 'normal', ranking: 'x' } }))
        .status
    ).toBe(400);
    expect(
      (await call('POST', '/agreement', { body: { kind: 'song', mode: 'chara', ranking: [] } }))
        .status
    ).toBe(400);
  });
});

describe('dumps', () => {
  it('exports totals and anonymous results without private fields', async () => {
    await submit({ filter: { units: ['2'] } });
    const csv = await call('GET', '/dumps/rollups/2026.csv');
    expect(csv.headers.get('content-type')).toContain('text/csv');
    expect(csv.text.split('\n')[0]).toBe(
      'kind,mode,month,item_id,appearances,percentile_sum,top1,top3,top10'
    );
    expect(csv.text.split('\n')).toHaveLength(9);
    const json = await call('GET', '/dumps/rollups/all.json');
    expect(json.json).toHaveLength(8);
    const ndjson = await call('GET', '/dumps/submissions/2026-09.ndjson');
    const lines = ndjson.text
      .trim()
      .split('\n')
      .map((l) => JSON.parse(l));
    expect(lines).toHaveLength(1);
    expect(Object.keys(lines[0]).sort()).toEqual(
      ['date', 'filter', 'itemCount', 'kind', 'mode', 'performanceIds', 'ranking'].sort()
    );
    expect(ndjson.text).not.toMatch(/ip_hash|ticket|delete/);
    expect((await call('GET', '/dumps/submissions/2026.json')).json).toHaveLength(1);
    expect((await call('GET', '/dumps/submissions/2025.json')).json).toEqual([]);
    expect((await call('GET', '/dumps/other/all.json')).status).toBe(404);
    expect((await call('GET', '/dumps/rollups/latest.json')).status).toBe(404);
  });

  it('streams large exports in batches', async () => {
    for (let i = 0; i < 3; i++) {
      await submit({
        ip: `198.51.100.${i + 1}`,
        preference: shuffled(characterIds.slice(0, 8), i)
      });
    }
    const stream = services.dumps.submissionsStream({ from: '0000-01', to: '9999-12' }, 'json', 2);
    const text = await new Response(stream).text();
    expect(JSON.parse(text)).toHaveLength(3);
  });
});

describe('http', () => {
  it('allows the site origin only', async () => {
    const allowed = await call('GET', '/stats', {
      headers: { origin: 'https://hamproductions.github.io' }
    });
    expect(allowed.headers.get('access-control-allow-origin')).toBe(
      'https://hamproductions.github.io'
    );
    const denied = await call('GET', '/stats', { headers: { origin: 'https://evil.example' } });
    expect(denied.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('reports health and unknown routes', async () => {
    expect((await call('GET', '/health')).json).toEqual({ status: 'ok' });
    expect((await call('GET', '/nope')).status).toBe(404);
  });
});
