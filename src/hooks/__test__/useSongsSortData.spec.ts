import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const leftFn = vi.fn();
const rightFn = vi.fn();
const tieFn = vi.fn();
const undoFn = vi.fn();

let mockState: any = { status: 'sorting' };

vi.mock('../useSongData', () => ({
  useSongData: () => [
    {
      id: 's1',
      name: 'Song A',
      artists: [],
      seriesIds: [],
      discographyIds: [],
      phoneticName: 'a',
      releasedOn: '2024-01-01'
    },
    {
      id: 's2',
      name: 'Song B',
      artists: [],
      seriesIds: [],
      discographyIds: [],
      phoneticName: 'b',
      releasedOn: '2024-01-01'
    }
  ]
}));

vi.mock('../useSorter', () => ({
  useSorter: () => ({
    init: vi.fn(),
    left: leftFn,
    right: rightFn,
    tie: tieFn,
    undo: undoFn,
    state: mockState,
    comparisonsCount: 1,
    isEstimatedCount: false,
    maxComparisons: 3,
    progress: 0,
    clear: vi.fn(),
    isEnded: false
  })
}));

vi.mock('~/context/ToasterContext', () => ({
  useToaster: () => ({ toast: vi.fn() })
}));

vi.mock('~/utils/filter', () => ({
  hasFilter: () => false
}));

vi.mock('~/utils/song-filter', () => ({
  matchSongFilter: () => true
}));

vi.mock('~/components/sorter/TieToastContent', () => ({
  TieToastContent: 'TieToastContent'
}));

vi.mock('styled-system/tokens', () => ({
  token: (path: string) => path
}));

import { useSongsSortData } from '../useSongsSortData';

const fireKey = (key: string, targetOverride?: Partial<EventTarget & { tagName: string }>) => {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  if (targetOverride) {
    Object.defineProperty(event, 'target', { value: targetOverride });
  }
  document.dispatchEvent(event);
  return event;
};

describe('useSongsSortData keyboard shortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState = { status: 'sorting' };
  });

  it('ArrowLeft calls left()', () => {
    renderHook(() => useSongsSortData());
    act(() => {
      fireKey('ArrowLeft');
    });
    expect(leftFn).toHaveBeenCalledOnce();
  });

  it('ArrowRight calls right()', () => {
    renderHook(() => useSongsSortData());
    act(() => {
      fireKey('ArrowRight');
    });
    expect(rightFn).toHaveBeenCalledOnce();
  });

  it('ArrowDown calls tie (via handleTie, noTieMode=false)', () => {
    renderHook(() => useSongsSortData());
    act(() => {
      fireKey('ArrowDown');
    });
    expect(tieFn).toHaveBeenCalledOnce();
  });

  it('ArrowUp calls undo()', () => {
    renderHook(() => useSongsSortData());
    act(() => {
      fireKey('ArrowUp');
    });
    expect(undoFn).toHaveBeenCalledOnce();
  });

  it('no-ops when state is undefined', () => {
    mockState = undefined;
    renderHook(() => useSongsSortData());
    act(() => {
      fireKey('ArrowLeft');
      fireKey('ArrowRight');
      fireKey('ArrowDown');
      fireKey('ArrowUp');
    });
    expect(leftFn).not.toHaveBeenCalled();
    expect(rightFn).not.toHaveBeenCalled();
    expect(tieFn).not.toHaveBeenCalled();
    expect(undoFn).not.toHaveBeenCalled();
  });

  it('no-ops when state.status === "end"', () => {
    mockState = { status: 'end' };
    renderHook(() => useSongsSortData());
    act(() => {
      fireKey('ArrowLeft');
      fireKey('ArrowRight');
    });
    expect(leftFn).not.toHaveBeenCalled();
    expect(rightFn).not.toHaveBeenCalled();
  });

  it('no-ops when target is INPUT', () => {
    renderHook(() => useSongsSortData());
    act(() => {
      fireKey('ArrowLeft', { tagName: 'INPUT' });
    });
    expect(leftFn).not.toHaveBeenCalled();
  });

  it('no-ops when target is TEXTAREA', () => {
    renderHook(() => useSongsSortData());
    act(() => {
      fireKey('ArrowRight', { tagName: 'TEXTAREA' });
    });
    expect(rightFn).not.toHaveBeenCalled();
  });

  it('no-ops when disableShortcutsRef.current === true', () => {
    const ref = { current: true };
    renderHook(() => useSongsSortData(undefined, { disableShortcutsRef: ref }));
    act(() => {
      fireKey('ArrowLeft');
    });
    expect(leftFn).not.toHaveBeenCalled();
  });

  it('works when disableShortcutsRef.current === false', () => {
    const ref = { current: false };
    renderHook(() => useSongsSortData(undefined, { disableShortcutsRef: ref }));
    act(() => {
      fireKey('ArrowLeft');
    });
    expect(leftFn).toHaveBeenCalledOnce();
  });
});
