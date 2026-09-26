import { describe, expect, it } from 'bun:test';
import { canonicalizeFilter, cohortHashOf } from '../src/lib/filters';
import { clientIp } from '../src/lib/ip';
import { isClosedMonth, parsePeriod } from '../src/lib/period';
import {
  computeAgreement,
  computeContributions,
  rankingHash,
  restrictRanking,
  toLeaderboard
} from '../src/lib/ranking';
import { replaySort } from '../src/lib/replay';
import { simulateChoices } from './helpers';

const items = ['a', 'b', 'c', 'd', 'e', 'f'];

describe('replaySort', () => {
  it('reproduces the ranking a sorter session produced', () => {
    const { choices, ranking } = simulateChoices(['c', 'a', 'f', 'b', 'e', 'd'], items);
    expect(replaySort(['c', 'a', 'f', 'b', 'e', 'd'], choices)).toEqual({ ok: true, ranking });
    expect(ranking).toEqual(items.map((id) => [id]));
  });

  it('keeps tie groups', () => {
    const { choices, ranking } = simulateChoices(items, items, { tieEvery: 2 });
    const result = replaySort(items, choices);
    expect(result).toEqual({ ok: true, ranking });
    expect(ranking.some((group) => group.length > 1)).toBe(true);
  });

  it('rejects a log that stops before the sort ends', () => {
    const { choices } = simulateChoices(items, items);
    expect(replaySort(items, choices.slice(0, -1))).toEqual({ ok: false, reason: 'incomplete' });
  });

  it('rejects choices after the sort has ended', () => {
    const { choices } = simulateChoices(items, items);
    expect(replaySort(items, `${choices}L`)).toEqual({ ok: false, reason: 'extra_choices' });
  });

  it('produces a different ranking when the initial order is swapped', () => {
    const { choices } = simulateChoices(items, items);
    const swapped = replaySort(['b', 'a', 'c', 'd', 'e', 'f'], choices);
    expect(swapped.ok && swapped.ranking).not.toEqual(items.map((id) => [id]));
  });
});

describe('computeContributions', () => {
  it('maps positions to percentiles with tie groups sharing the average', () => {
    const result = computeContributions([['a'], ['b', 'c'], ['d']]);
    expect(result).toEqual([
      { itemId: 'a', percentile: 1, top1: 1, top3: 1, top10: 1 },
      { itemId: 'b', percentile: 0.5, top1: 0, top3: 1, top10: 1 },
      { itemId: 'c', percentile: 0.5, top1: 0, top3: 1, top10: 1 },
      { itemId: 'd', percentile: 0, top1: 0, top3: 0, top10: 1 }
    ]);
  });

  it('counts every member of a tied first group as a #1 pick', () => {
    const result = computeContributions([['a', 'b'], ['c']]);
    expect(result.filter((c) => c.top1 === 1).map((c) => c.itemId)).toEqual(['a', 'b']);
  });
});

describe('restrictRanking', () => {
  it('drops items outside the subset and empty groups', () => {
    expect(restrictRanking([['a'], ['b', 'c'], ['d']], new Set(['c', 'd']))).toEqual([
      ['c'],
      ['d']
    ]);
  });
});

describe('toLeaderboard', () => {
  it('orders by shrunk score and gives equal scores the same rank', () => {
    const board = toLeaderboard([
      { itemId: 'x', appearances: 1, percentileSum: 1, top1: 1, top3: 1, top10: 1 },
      { itemId: 'y', appearances: 20, percentileSum: 18, top1: 10, top3: 20, top10: 20 },
      { itemId: 'z', appearances: 1, percentileSum: 1, top1: 1, top3: 1, top10: 1 }
    ]);
    expect(board.map((e) => [e.itemId, e.rank])).toEqual([
      ['y', 1],
      ['x', 2],
      ['z', 2]
    ]);
  });
});

describe('rankingHash', () => {
  it('ignores order inside tie groups and includes kind and mode', () => {
    expect(rankingHash('song', 'normal', [['a', 'b']])).toBe(
      rankingHash('song', 'normal', [['b', 'a']])
    );
    expect(rankingHash('song', 'normal', [['a'], ['b']])).not.toBe(
      rankingHash('song', 'heardle', [['a'], ['b']])
    );
  });
});

describe('canonicalizeFilter', () => {
  it('sorts, dedupes and drops empty or unknown keys', () => {
    expect(
      canonicalizeFilter('character', { units: ['2', '1', '1'], school: [], extra: ['x'] })
    ).toEqual({ units: ['1', '2'] });
  });

  it('treats null as no filter', () => {
    expect(canonicalizeFilter('song', null)).toEqual({});
  });

  it('rejects wrong value types', () => {
    expect(canonicalizeFilter('song', { years: ['2024'] })).toBeUndefined();
    expect(canonicalizeFilter('character', { series: [1] })).toBeUndefined();
    expect(canonicalizeFilter('character', ['series'])).toBeUndefined();
  });

  it('gives equivalent filters the same cohort hash', () => {
    const a = canonicalizeFilter('song', { years: [2024, 2023], artists: [] })!;
    const b = canonicalizeFilter('song', { years: [2023, 2024] })!;
    expect(cohortHashOf('song', 'normal', a, [])).toBe(cohortHashOf('song', 'normal', b, []));
  });
});

describe('computeAgreement', () => {
  const consensus = toLeaderboard(
    ['a', 'b', 'c', 'd'].map((itemId, idx) => ({
      itemId,
      appearances: 10,
      percentileSum: 10 - idx * 3,
      top1: 0,
      top3: 0,
      top10: 0
    }))
  );

  it('is 100% for the consensus order and 0% for its reverse', () => {
    expect(computeAgreement([['a'], ['b'], ['c'], ['d']], consensus).agreement).toBe(1);
    expect(computeAgreement([['d'], ['c'], ['b'], ['a']], consensus).agreement).toBe(0);
  });

  it('compares only items known to the consensus', () => {
    const result = computeAgreement([['zz'], ['a'], ['b']], consensus);
    expect(result.compared).toBe(2);
    expect(result.agreement).toBe(1);
  });

  it('reports shared places for ties while scoring with average ranks', () => {
    const result = computeAgreement([['a', 'b'], ['c'], ['d']], consensus);
    const ranks = Object.fromEntries(result.items.map((i) => [i.itemId, i.yourRank]));
    expect(ranks).toEqual({ a: 1, b: 1, c: 3, d: 4 });
    expect(result.agreement).toBeGreaterThan(0.9);
    expect(result.agreement).toBeLessThan(1);
  });

  it('returns null when there is nothing to compare', () => {
    expect(computeAgreement([['a']], consensus).agreement).toBeNull();
    expect(computeAgreement([['a', 'b']], consensus).agreement).toBeNull();
    expect(computeAgreement([['a'], ['b']], []).agreement).toBeNull();
  });
});

describe('parsePeriod', () => {
  it('parses all, year and month', () => {
    expect(parsePeriod('all')).toEqual({ from: '0000-01', to: '9999-12' });
    expect(parsePeriod('2026')).toEqual({ from: '2026-01', to: '2026-12' });
    expect(parsePeriod('2026-09')).toEqual({ from: '2026-09', to: '2026-09' });
  });

  it('rejects malformed periods', () => {
    for (const bad of ['2026-13', '2026-9', '26', 'latest', '2026-09-01', '']) {
      expect(parsePeriod(bad)).toBeUndefined();
    }
  });

  it('knows closed months', () => {
    const now = new Date('2026-09-15T00:00:00Z');
    expect(isClosedMonth('2026-08', now)).toBe(true);
    expect(isClosedMonth('2026-09', now)).toBe(false);
  });
});

describe('clientIp', () => {
  it('uses the right-most proxy header value', () => {
    expect(
      clientIp({ 'x-forwarded-for': 'spoofed, 198.51.100.7' }, '10.0.0.1', 'x-forwarded-for')
    ).toBe('198.51.100.7');
  });

  it('falls back to the socket address', () => {
    expect(clientIp({}, '10.0.0.1', 'x-real-ip')).toBe('10.0.0.1');
    expect(clientIp({ 'x-real-ip': '1.2.3.4' }, '10.0.0.1', undefined)).toBe('10.0.0.1');
    expect(clientIp({}, undefined, undefined)).toBe('unknown');
  });
});
