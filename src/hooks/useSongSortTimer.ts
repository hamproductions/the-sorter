import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';
import {
  computeTimingStats,
  createTimingData,
  type SortTimingData,
  type SortTimingStats
} from '../utils/sort-timing';

const isVisible = () => typeof document === 'undefined' || document.visibilityState === 'visible';

/**
 * Tracks per-comparison and total timing for a song ranking session, counting
 * only *active* (foregrounded) time.
 *
 * Implements a pausable stopwatch via the Page Visibility API: `accumulatedActiveMs`
 * holds folded active time, and `runningSinceRef` marks the start of the current
 * running segment (null while the tab is hidden). When the tab is hidden the
 * running segment is folded into the accumulator and the clock pauses; when it
 * becomes visible again the clock resumes. Persisted to localStorage (keyed by
 * `storagePrefix`) so timing survives reloads mid-session.
 */
export const useSongSortTimer = (storagePrefix = 'songs') => {
  const [timing, setTiming] = useLocalStorage<SortTimingData>(`${storagePrefix}-sort-timing`);

  const timingRef = useRef(timing);
  timingRef.current = timing;

  // Wall-clock ms when the current active segment began; null while paused/hidden.
  // In-memory only — never persisted, so closed-tab time can't be counted on reload.
  const runningSinceRef = useRef<number | null>(null);

  const commit = useCallback(
    (next: SortTimingData | undefined) => {
      timingRef.current = next;
      setTiming(next);
    },
    [setTiming]
  );

  // Total active ms as of `now`, including the current running segment.
  const activeElapsed = useCallback((now: number) => {
    const t = timingRef.current;
    if (!t) return 0;
    if (t.endedAt) return t.accumulatedActiveMs;
    const running = runningSinceRef.current;
    return t.accumulatedActiveMs + (running != null ? Math.max(0, now - running) : 0);
  }, []);

  const getElapsedMs = useCallback(() => activeElapsed(Date.now()), [activeElapsed]);

  const startTimer = useCallback(() => {
    const now = Date.now();
    runningSinceRef.current = isVisible() ? now : null;
    commit(createTimingData(now));
  }, [commit]);

  const clearTimer = useCallback(() => {
    runningSinceRef.current = null;
    commit(undefined);
  }, [commit]);

  // Record the active time spent on this comparison, then re-baseline the clock.
  const recordTick = useCallback(() => {
    const now = Date.now();
    const base = timingRef.current ?? createTimingData(now);
    const active = activeElapsed(now);
    const duration = Math.max(0, active - base.lastTickActiveMs);
    runningSinceRef.current = isVisible() ? now : null;
    commit({
      ...base,
      durations: [...base.durations, duration],
      accumulatedActiveMs: active,
      lastTickActiveMs: active,
      endedAt: undefined
    });
  }, [activeElapsed, commit]);

  // Undo: drop the last comparison from the per-comparison stats, but keep the
  // accumulated clock and running segment so the undone time still counts toward
  // the total. The next decision re-times the comparison from the last tick.
  const removeLastTick = useCallback(() => {
    const base = timingRef.current;
    if (!base || base.durations.length === 0) return;
    commit({ ...base, durations: base.durations.slice(0, -1), endedAt: undefined });
  }, [commit]);

  const markEnded = useCallback(() => {
    const base = timingRef.current;
    if (!base || base.endedAt) return;
    runningSinceRef.current = null;
    commit({ ...base, accumulatedActiveMs: base.lastTickActiveMs, endedAt: Date.now() });
  }, [commit]);

  // Re-baseline the running segment on mount (e.g. after a reload) so time spent
  // with the page closed is never counted.
  useEffect(() => {
    const base = timingRef.current;
    if (base && !base.endedAt) {
      runningSinceRef.current = isVisible() ? Date.now() : null;
    }
    // oxlint-disable-next-line exhaustive-deps
  }, []);

  // Pause on hidden (fold running segment), resume on visible.
  useEffect(() => {
    const handleVisibility = () => {
      const base = timingRef.current;
      if (!base || base.endedAt) return;
      const now = Date.now();
      if (document.visibilityState === 'hidden') {
        const running = runningSinceRef.current;
        if (running != null) {
          runningSinceRef.current = null;
          commit({
            ...base,
            accumulatedActiveMs: base.accumulatedActiveMs + Math.max(0, now - running)
          });
        }
      } else if (runningSinceRef.current == null) {
        runningSinceRef.current = now;
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [commit]);

  // Per-comparison stats come from the standing durations; the total is the
  // monotonic accumulated clock so it includes time spent on undone comparisons.
  const stats: SortTimingStats | undefined = useMemo(() => {
    if (!timing) return undefined;
    const s = computeTimingStats(timing.durations);
    return s ? { ...s, totalMs: timing.accumulatedActiveMs } : undefined;
  }, [timing]);

  return {
    timing: timing ?? undefined,
    stats,
    getElapsedMs,
    startTimer,
    clearTimer,
    recordTick,
    removeLastTick,
    markEnded
  };
};
