import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSongSortTimer } from '../useSongSortTimer';

// Control wall-clock time deterministically.
let nowMs = 0;
const advance = (ms: number) => {
  nowMs += ms;
};

const setVisibility = (state: 'visible' | 'hidden') => {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state
  });
  document.dispatchEvent(new Event('visibilitychange'));
};

describe('useSongSortTimer', () => {
  beforeEach(() => {
    localStorage.clear();
    nowMs = 1_000_000;
    vi.spyOn(Date, 'now').mockImplementation(() => nowMs);
    setVisibility('visible');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('records active time per comparison', () => {
    const { result } = renderHook(() => useSongSortTimer('test'));

    act(() => result.current.startTimer());
    act(() => advance(2000));
    act(() => result.current.recordTick());
    act(() => advance(3000));
    act(() => result.current.recordTick());

    expect(result.current.timing?.durations).toEqual([2000, 3000]);
    expect(result.current.stats?.totalMs).toBe(5000);
  });

  it('excludes time while the tab is hidden from the elapsed clock', () => {
    const { result } = renderHook(() => useSongSortTimer('test'));

    act(() => result.current.startTimer());
    act(() => advance(2000)); // 2s active
    act(() => setVisibility('hidden'));
    act(() => advance(10_000)); // 10s hidden — must NOT count
    act(() => setVisibility('visible'));
    act(() => advance(1000)); // 1s active

    expect(result.current.getElapsedMs()).toBe(3000);
  });

  it('excludes hidden time from a comparison duration', () => {
    const { result } = renderHook(() => useSongSortTimer('test'));

    act(() => result.current.startTimer());
    act(() => advance(1000)); // 1s active
    act(() => setVisibility('hidden'));
    act(() => advance(8000)); // hidden
    act(() => setVisibility('visible'));
    act(() => advance(2000)); // 2s active
    act(() => result.current.recordTick());

    expect(result.current.timing?.durations).toEqual([3000]);
  });

  it('freezes the elapsed clock once ended', () => {
    const { result } = renderHook(() => useSongSortTimer('test'));

    act(() => result.current.startTimer());
    act(() => advance(4000));
    act(() => result.current.recordTick());
    act(() => result.current.markEnded());
    const frozen = result.current.getElapsedMs();
    act(() => advance(5000));

    expect(result.current.getElapsedMs()).toBe(frozen);
    expect(frozen).toBe(4000);
  });

  it('rewinds the clock on undo', () => {
    const { result } = renderHook(() => useSongSortTimer('test'));

    act(() => result.current.startTimer());
    act(() => advance(2000));
    act(() => result.current.recordTick());
    act(() => advance(3000));
    act(() => result.current.recordTick());
    act(() => result.current.removeLastTick());

    expect(result.current.timing?.durations).toEqual([2000]);
  });
});
