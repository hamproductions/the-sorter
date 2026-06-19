import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import {
  computeTimingStats,
  createTimingData,
  type SortTimingData,
  type SortTimingStats
} from '../utils/sort-timing';

/**
 * Tracks per-comparison and total wall-clock timing for a song ranking session.
 *
 * State is persisted to localStorage (keyed by `storagePrefix`) so timing
 * survives reloads mid-session, mirroring how the sort state itself is stored.
 */
export const useSongSortTimer = (storagePrefix = 'songs') => {
  const [timing, setTiming] = useLocalStorage<SortTimingData>(`${storagePrefix}-sort-timing`);

  const startTimer = useCallback(() => {
    setTiming(createTimingData(Date.now()));
  }, [setTiming]);

  const clearTimer = useCallback(() => {
    setTiming(undefined);
  }, [setTiming]);

  // Record the elapsed time since the previous decision as one comparison duration.
  const recordTick = useCallback(() => {
    setTiming((prev) => {
      const now = Date.now();
      const base = prev ?? createTimingData(now);
      const duration = Math.max(0, now - base.lastTickAt);
      return {
        ...base,
        lastTickAt: now,
        durations: [...base.durations, duration],
        // Reaching this point again means the user resumed sorting after an end.
        endedAt: undefined
      };
    });
  }, [setTiming]);

  // Undo: drop the most recent comparison and rewind the tick cursor.
  const removeLastTick = useCallback(() => {
    setTiming((prev) => {
      if (!prev || prev.durations.length === 0) return prev;
      const lastDuration = prev.durations[prev.durations.length - 1];
      return {
        ...prev,
        lastTickAt: Math.max(prev.startedAt, prev.lastTickAt - lastDuration),
        durations: prev.durations.slice(0, -1),
        endedAt: undefined
      };
    });
  }, [setTiming]);

  const markEnded = useCallback(() => {
    setTiming((prev) => {
      if (!prev || prev.endedAt) return prev;
      // Final decision time is the true completion moment.
      return { ...prev, endedAt: prev.lastTickAt };
    });
  }, [setTiming]);

  const stats: SortTimingStats | undefined = useMemo(
    () => (timing ? computeTimingStats(timing.durations) : undefined),
    [timing]
  );

  return {
    timing: timing ?? undefined,
    stats,
    startTimer,
    clearTimer,
    recordTick,
    removeLastTick,
    markEnded
  };
};
