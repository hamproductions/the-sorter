import { renderHook, act } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';
import { useSorter } from '../useSorter';

describe('useSorter', () => {
  beforeAll(() => {
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
});
