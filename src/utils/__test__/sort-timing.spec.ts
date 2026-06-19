import { describe, expect, it } from 'vitest';
import {
  computeTimingStats,
  createTimingData,
  formatDuration,
  formatElapsed
} from '../sort-timing';

describe('computeTimingStats', () => {
  it('returns undefined for empty input', () => {
    expect(computeTimingStats([])).toBeUndefined();
  });

  it('computes total, average, fastest, slowest', () => {
    const stats = computeTimingStats([1000, 3000, 2000]);
    expect(stats).toBeDefined();
    expect(stats?.totalMs).toBe(6000);
    expect(stats?.comparisons).toBe(3);
    expect(stats?.averageMs).toBe(2000);
    expect(stats?.fastestMs).toBe(1000);
    expect(stats?.slowestMs).toBe(3000);
  });

  it('computes median for odd count', () => {
    expect(computeTimingStats([3000, 1000, 2000])?.medianMs).toBe(2000);
  });

  it('computes median for even count', () => {
    expect(computeTimingStats([1000, 2000, 3000, 4000])?.medianMs).toBe(2500);
  });

  it('does not mutate the input array', () => {
    const input = [3000, 1000, 2000];
    computeTimingStats(input);
    expect(input).toEqual([3000, 1000, 2000]);
  });
});

describe('formatDuration', () => {
  it('formats sub-minute durations in seconds', () => {
    expect(formatDuration(950)).toBe('0.9s');
    expect(formatDuration(12300)).toBe('12.3s');
  });

  it('formats minute-scale durations', () => {
    expect(formatDuration(83000)).toBe('1m 23s');
  });

  it('formats hour-scale durations', () => {
    expect(formatDuration(3723000)).toBe('1h 2m 3s');
  });

  it('handles invalid input gracefully', () => {
    expect(formatDuration(-5)).toBe('0.0s');
    expect(formatDuration(Number.NaN)).toBe('0.0s');
  });
});

describe('formatElapsed', () => {
  it('uses whole seconds with no tenths under a minute', () => {
    expect(formatElapsed(950)).toBe('0s');
    expect(formatElapsed(12300)).toBe('12s');
    expect(formatElapsed(12999)).toBe('12s');
  });

  it('formats minute- and hour-scale durations', () => {
    expect(formatElapsed(83000)).toBe('1m 23s');
    expect(formatElapsed(3723000)).toBe('1h 2m 3s');
  });

  it('handles invalid input gracefully', () => {
    expect(formatElapsed(-5)).toBe('0s');
    expect(formatElapsed(Number.NaN)).toBe('0s');
  });
});

describe('createTimingData', () => {
  it('initializes with the given timestamp and empty durations', () => {
    const data = createTimingData(1000);
    expect(data).toEqual({ startedAt: 1000, lastTickAt: 1000, durations: [] });
  });
});
