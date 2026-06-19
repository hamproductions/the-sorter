/**
 * Timing model for a song ranking session.
 *
 * All timing is measured in *active* time — time the tab is foregrounded. Time
 * spent with the tab hidden is excluded (the stopwatch pauses on
 * `visibilitychange` and resumes when the tab is visible again).
 *
 * `durations` holds the active time (ms) spent on each *standing* comparison
 * (undo pops the last entry). `accumulatedActiveMs` is the monotonic total active
 * time — undo does not rewind it — so it includes time spent on comparisons that
 * were later undone, and can exceed the sum of `durations`.
 */
export interface SortTimingData {
  /** Wall-clock epoch ms when the session started (display reference only). */
  startedAt: number;
  /** Per-comparison active durations in ms for standing comparisons, in order. */
  durations: number[];
  /** Monotonic total active ms; not rewound by undo (includes undone time). */
  accumulatedActiveMs: number;
  /** Active ms at the last recorded decision (for per-comparison diffing). */
  lastTickActiveMs: number;
  /** Wall-clock epoch ms when the sort reached its end state. */
  endedAt?: number;
}

export interface SortTimingStats {
  /** Total active time in ms. Includes time spent on undone comparisons, so it
   * is sourced from the monotonic clock and may exceed the sum of durations. */
  totalMs: number;
  /** Number of standing (counted) comparisons. */
  comparisons: number;
  /** Mean time per comparison in ms. */
  averageMs: number;
  /** Fastest single comparison in ms. */
  fastestMs: number;
  /** Slowest single comparison in ms. */
  slowestMs: number;
  /** Median comparison time in ms. */
  medianMs: number;
}

export const createTimingData = (now: number): SortTimingData => ({
  startedAt: now,
  durations: [],
  accumulatedActiveMs: 0,
  lastTickActiveMs: 0
});

export const computeTimingStats = (durations: number[]): SortTimingStats | undefined => {
  if (!durations || durations.length === 0) return undefined;

  const totalMs = durations.reduce((sum, d) => sum + d, 0);
  const comparisons = durations.length;
  const sorted = durations.toSorted((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const medianMs = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

  return {
    totalMs,
    comparisons,
    averageMs: totalMs / comparisons,
    fastestMs: sorted[0],
    slowestMs: sorted[sorted.length - 1],
    medianMs
  };
};

/**
 * Format a duration in ms into a compact human-readable string.
 * Examples: 950 -> "0.9s", 12300 -> "12.3s", 83000 -> "1m 23s", 3723000 -> "1h 2m 3s".
 */
export const formatDuration = (ms: number): string => {
  if (!Number.isFinite(ms) || ms < 0) return '0.0s';

  const totalSeconds = ms / 1000;

  if (totalSeconds < 60) {
    return `${totalSeconds.toFixed(1)}s`;
  }

  const totalWholeSeconds = Math.round(totalSeconds);
  const hours = Math.floor(totalWholeSeconds / 3600);
  const minutes = Math.floor((totalWholeSeconds % 3600) / 60);
  const seconds = totalWholeSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  return `${minutes}m ${seconds}s`;
};

/**
 * Format a duration in ms using whole-second precision (no tenths).
 * Used for the live running timer, which ticks once per second.
 * Examples: 950 -> "0s", 12300 -> "12s", 83000 -> "1m 23s".
 */
export const formatElapsed = (ms: number): string => {
  if (!Number.isFinite(ms) || ms < 0) return '0s';

  const totalWholeSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalWholeSeconds / 3600);
  const minutes = Math.floor((totalWholeSeconds % 3600) / 60);
  const seconds = totalWholeSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
};
