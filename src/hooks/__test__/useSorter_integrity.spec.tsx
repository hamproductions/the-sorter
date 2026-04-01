import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useSorter } from '../useSorter';
import { useLocalStorage } from '../useLocalStorage';

// Mock useLocalStorage to control the state
vi.mock('../useLocalStorage', () => ({
  useLocalStorage: vi.fn()
}));

describe('useSorter Integrity and Robustness', () => {
  it('resets state when items length does not match state.arr length', () => {
    const setState = vi.fn();
    const setHistory = vi.fn();
    const setComparisonsCount = vi.fn();

    // Initial state with 3 items
    const initialState = {
      arr: [[1], [2], [3]],
      currentSize: 1,
      leftStart: 0
    };

    (useLocalStorage as any).mockImplementation((key: string) => {
      if (key.endsWith('sort-state')) return [initialState, setState];
      if (key.endsWith('sort-state-history')) return [[], setHistory];
      if (key.endsWith('comparisons-count')) return [1, setComparisonsCount];
      return [null, vi.fn()];
    });

    // Render with 2 items instead of 3
    renderHook(() => useSorter([1, 2]));

    // useEffect should trigger reset
    expect(setState).toHaveBeenCalledWith(undefined);
    expect(setHistory).toHaveBeenCalledWith(undefined);
    expect(setComparisonsCount).toHaveBeenCalledWith(undefined);
  });

  it('clamps progress between 0 and 1', () => {
    (useLocalStorage as any).mockImplementation((key: string) => {
      // Return a state that results in negative progress if not clamped
      if (key.endsWith('sort-state'))
        return [
          {
            arr: [[1], [2]],
            currentSize: 1,
            leftStart: 10 // Inconsistent leftStart
          },
          vi.fn()
        ];
      return [null, vi.fn()];
    });

    const { result } = renderHook(() => useSorter([1, 2]));

    expect(result.current.progress).toBeGreaterThanOrEqual(0);
    expect(result.current.progress).toBeLessThanOrEqual(1);
  });

  it('handles maxComparisons = 0', () => {
    (useLocalStorage as any).mockImplementation((key: string) => {
      if (key.endsWith('sort-state'))
        return [
          {
            arr: [[1]],
            currentSize: 1,
            leftStart: 0,
            status: 'end'
          },
          vi.fn()
        ];
      return [null, vi.fn()];
    });

    const { result } = renderHook(() => useSorter([1]));

    expect(result.current.maxComparisons).toBe(0);
    expect(result.current.progress).toBe(0);
  });
});
