import { renderHook, act } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { useSorter } from '../useSorter';
import { initSort, step } from '../../utils/sort';

describe('useSorter', () => {
  beforeAll(() => {
    localStorage.clear();
  });

  beforeEach(() => {
    localStorage.clear();
  });

  it('caps history at 50 items', () => {
    const items = ['item1', 'item2', 'item3'];
    const { result } = renderHook(() => useSorter(items));

    // Initialize the sorter
    act(() => {
      result.current.init();
    });

    // Verify initial state
    expect(result.current.history).toEqual([]);

    // Perform more than 50 steps
    // Each step should add 1 item to history
    for (let i = 0; i < 60; i++) {
      act(() => {
        result.current.left();
      });
    }

    // Verify history length is capped at 50
    expect(result.current.history?.length).toBe(50);
  });

  it('maintains 50 items limit after undo and new step', () => {
    const items = ['item1', 'item2', 'item3'];
    const { result } = renderHook(() => useSorter(items));

    act(() => {
      result.current.init();
    });

    // Fill history to 50
    for (let i = 0; i < 50; i++) {
      act(() => {
        result.current.left();
      });
    }
    expect(result.current.history?.length).toBe(50);

    // Undo once
    act(() => {
      result.current.undo();
    });
    expect(result.current.history?.length).toBe(49);

    // Perform another step
    act(() => {
      result.current.left();
    });
    expect(result.current.history?.length).toBe(50);

    // Perform one more step (should cap at 50)
    act(() => {
      result.current.left();
    });
    expect(result.current.history?.length).toBe(50);
  });

  it('trims history from > 50 down to 50 on next step (backward compatibility)', () => {
    const items = ['item1', 'item2', 'item3'];
    const { result } = renderHook(() => useSorter(items));

    act(() => {
      result.current.init();
    });

    const sixtyHistory = Array.from({ length: 60 }, () => result.current.state!);
    act(() => {
      result.current.loadState({
        state: result.current.state!,
        history: sixtyHistory
      });
    });

    expect(result.current.history?.length).toBe(60);

    // One more step should trim it to 50
    act(() => {
      result.current.left();
    });

    expect(result.current.history?.length).toBe(50);
  });

  describe('comparisonsCount and progress', () => {
    it('starts with comparisonsCount = 1 and isEstimatedCount = false after init', () => {
      const items = ['a', 'b', 'c', 'd', 'e'];
      const { result } = renderHook(() => useSorter(items, 'test-count-1'));

      expect(result.current.comparisonsCount).toBe(0);
      expect(result.current.isEstimatedCount).toBe(false);

      act(() => {
        result.current.init();
      });

      expect(result.current.comparisonsCount).toBe(1);
      expect(result.current.isEstimatedCount).toBe(false);
    });

    it('increments comparisonsCount on each step', () => {
      const items = ['a', 'b', 'c', 'd'];
      const { result } = renderHook(() => useSorter(items, 'test-count-2'));

      act(() => {
        result.current.init();
      });

      expect(result.current.comparisonsCount).toBe(1);

      act(() => {
        result.current.left();
      });
      expect(result.current.comparisonsCount).toBe(2);

      act(() => {
        result.current.right();
      });
      expect(result.current.comparisonsCount).toBe(3);

      act(() => {
        result.current.tie();
      });
      expect(result.current.comparisonsCount).toBe(4);
    });

    it('decrements comparisonsCount on undo', () => {
      const items = ['a', 'b', 'c', 'd'];
      const { result } = renderHook(() => useSorter(items, 'test-count-3'));

      act(() => {
        result.current.init();
      });

      act(() => {
        result.current.left();
      });

      act(() => {
        result.current.left();
      });

      expect(result.current.comparisonsCount).toBe(3);

      act(() => {
        result.current.undo();
      });

      expect(result.current.comparisonsCount).toBe(2);
    });

    it('uses estimated count with ~ indicator for existing sessions without explicit counter', () => {
      const items = ['a', 'b', 'c', 'd', 'e'];
      const prefix = 'test-existing-session';

      let state = initSort(items);
      state = step('left', state);
      state = step('right', state);
      state = step('left', state);

      localStorage.setItem(`${prefix}-sort-state`, JSON.stringify(state));
      localStorage.setItem(`${prefix}-sort-state-history`, JSON.stringify([state, state, state]));

      const { result } = renderHook(() => useSorter(items, prefix));

      expect(result.current.state).toBeDefined();
      expect(result.current.isEstimatedCount).toBe(true);
      expect(result.current.comparisonsCount).toBeGreaterThan(0);
    });

    it('continues from estimate when stepping in existing session', () => {
      const items = ['a', 'b', 'c', 'd', 'e'];
      const prefix = 'test-continue-estimate';

      let state = initSort(items);
      state = step('left', state);
      state = step('right', state);

      localStorage.setItem(`${prefix}-sort-state`, JSON.stringify(state));
      localStorage.setItem(`${prefix}-sort-state-history`, JSON.stringify([state, state]));

      const { result } = renderHook(() => useSorter(items, prefix));

      expect(result.current.isEstimatedCount).toBe(true);
      const estimatedCount = result.current.comparisonsCount;

      act(() => {
        result.current.left();
      });

      expect(result.current.isEstimatedCount).toBe(false);
      expect(result.current.comparisonsCount).toBe(estimatedCount + 1);
    });

    it('resets comparisonsCount to undefined on clear', () => {
      const items = ['a', 'b', 'c', 'd'];
      const { result } = renderHook(() => useSorter(items, 'test-clear'));

      act(() => {
        result.current.init();
      });

      act(() => {
        result.current.left();
      });

      expect(result.current.comparisonsCount).toBe(2);

      act(() => {
        result.current.clear();
      });

      expect(result.current.comparisonsCount).toBe(0);
      expect(result.current.state).toBeUndefined();
    });

    it('calculates progress as comparisons made / max comparisons', () => {
      const items = ['a', 'b', 'c', 'd'];
      const { result } = renderHook(() => useSorter(items, 'test-progress'));

      act(() => {
        result.current.init();
      });

      expect(result.current.progress).toBeGreaterThanOrEqual(0);
      expect(result.current.progress).toBeLessThanOrEqual(1);
      expect(result.current.maxComparisons).toBeGreaterThan(0);

      const initialProgress = result.current.progress;

      act(() => {
        result.current.left();
      });

      expect(result.current.progress).toBeGreaterThan(initialProgress);
    });

    it('progress reaches 1 when sorting is complete', () => {
      const items = ['a', 'b'];
      const { result } = renderHook(() => useSorter(items, 'test-progress-end'));

      act(() => {
        result.current.init();
      });

      while (result.current.state?.status !== 'end') {
        act(() => {
          result.current.left();
        });
      }

      expect(result.current.progress).toBe(1);
    });
  });
});
