import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SortState } from '~/utils/sort';

let mockState: SortState<string> | null = null;
const loadState = vi.fn();

const mockSongs = [
  {
    id: 's1',
    name: 'Song A',
    artists: [],
    seriesIds: ['1'],
    discographyIds: [],
    phoneticName: 'a',
    releasedOn: '2024-01-01'
  },
  {
    id: 's2',
    name: 'Song B',
    artists: [],
    seriesIds: ['1'],
    discographyIds: [],
    phoneticName: 'b',
    releasedOn: '2024-01-01'
  },
  {
    id: 's3',
    name: 'Song C',
    artists: [],
    seriesIds: ['2'],
    discographyIds: [],
    phoneticName: 'c',
    releasedOn: '2024-01-01'
  },
  {
    id: 's4',
    name: 'Song D',
    artists: [],
    seriesIds: ['2'],
    discographyIds: [],
    phoneticName: 'd',
    releasedOn: '2024-01-01'
  }
];

vi.mock('../useSongData', () => ({
  useSongData: () => mockSongs
}));

vi.mock('../useSorter', () => ({
  useSorter: vi.fn(() => ({
    init: vi.fn(),
    left: vi.fn(),
    right: vi.fn(),
    tie: vi.fn(),
    undo: vi.fn(),
    state: mockState,
    loadState,
    comparisonsCount: 0,
    isEstimatedCount: false,
    maxComparisons: 0,
    progress: 0,
    clear: vi.fn(),
    isEnded: mockState?.status === 'end'
  }))
}));

vi.mock('~/context/ToasterContext', () => ({
  useToaster: () => ({ toast: vi.fn() })
}));

let mockHasFilter = false;
vi.mock('~/utils/filter', () => ({
  hasFilter: (filter: Record<string, unknown[]>) =>
    mockHasFilter || Object.values(filter).some((values) => values?.length > 0)
}));

let mockMatchResult = true;
vi.mock('~/utils/song-filter', () => ({
  matchSongFilter: (song: { seriesIds: string[] }, filter: { series?: string[] }) => {
    if (filter.series?.length) return song.seriesIds.some((id) => filter.series?.includes(id));
    if (typeof mockMatchResult === 'boolean') return mockMatchResult;
    return true;
  }
}));

vi.mock('~/components/sorter/TieToastContent', () => ({
  TieToastContent: 'TieToastContent'
}));

vi.mock('styled-system/tokens', () => ({
  token: (path: string) => path
}));

import { useSongsSortData } from '../useSongsSortData';
import { useSorter } from '../useSorter';

describe('useSongsSortData performance mode', () => {
  beforeEach(() => {
    mockState = null;
    mockHasFilter = false;
    loadState.mockClear();
  });

  it('updates only missing songs matching the completed ranking scope', () => {
    const context = { kind: 'song', mode: 'normal', filter: { series: ['1'] } } as const;
    mockState = {
      arr: [['s1']],
      currentSize: 1,
      leftStart: 0,
      status: 'end',
      context: { ...context, filter: { series: ['1'] } }
    };
    const { result } = renderHook(() => useSongsSortData());
    expect(result.current.listToSort).toHaveLength(4);
    expect(result.current.newSongCount).toBe(1);
    act(() => result.current.addNewSongs());
    const updated = loadState.mock.calls[0][0].state;
    expect(updated.arr.flat().sort()).toEqual(['s1', 's2']);
    expect(updated.context).toEqual(context);
  });

  it('does not offer catalogue additions when the original scope is unknown', () => {
    mockState = { arr: [['s1']], currentSize: 1, leftStart: 0, status: 'end' };
    const { result } = renderHook(() => useSongsSortData());
    expect(result.current.newSongCount).toBe(0);
    act(() => result.current.addNewSongs());
    expect(loadState).not.toHaveBeenCalled();
  });

  it('returns all songs when no performance IDs and no filters', () => {
    mockHasFilter = false;
    const { result } = renderHook(() => useSongsSortData());

    expect(result.current.listToSort).toHaveLength(4);
    expect(result.current.listCount).toBe(4);
  });

  it('filters to performance song IDs when provided', () => {
    mockHasFilter = false;
    const { result } = renderHook(() =>
      useSongsSortData(undefined, {
        performanceSongIds: ['s1', 's3']
      })
    );

    expect(result.current.listToSort).toHaveLength(2);
    expect(result.current.listToSort.map((s) => s.id)).toEqual(['s1', 's3']);
  });

  it('passes storagePrefix to useSorter', () => {
    renderHook(() =>
      useSongsSortData(undefined, {
        performanceSongIds: ['s1'],
        storagePrefix: 'perf-songs'
      })
    );

    expect(useSorter).toHaveBeenCalledWith(
      expect.any(Array),
      'perf-songs',
      expect.objectContaining({ kind: 'song', mode: 'performance' })
    );
  });

  it('uses default storagePrefix "songs" when not specified', () => {
    renderHook(() => useSongsSortData());

    expect(useSorter).toHaveBeenCalledWith(
      expect.any(Array),
      'songs',
      expect.objectContaining({ kind: 'song', mode: 'normal' })
    );
  });

  it('excludes failed song IDs from performance songs', () => {
    const failedIds = new Set(['s1']);
    const { result } = renderHook(() =>
      useSongsSortData(failedIds, {
        performanceSongIds: ['s1', 's3']
      })
    );

    expect(result.current.listToSort).toHaveLength(1);
    expect(result.current.listToSort[0].id).toBe('s3');
  });

  it('returns empty list when performance IDs match no songs', () => {
    mockHasFilter = false;
    const { result } = renderHook(() =>
      useSongsSortData(undefined, {
        performanceSongIds: ['nonexistent1', 'nonexistent2']
      })
    );

    expect(result.current.listToSort).toHaveLength(0);
    expect(result.current.listCount).toBe(0);
  });

  it('does not use performance IDs when array is empty', () => {
    mockHasFilter = false;
    const { result } = renderHook(() =>
      useSongsSortData(undefined, {
        performanceSongIds: []
      })
    );

    // Should return all songs since performanceSongIds is empty
    expect(result.current.listToSort).toHaveLength(4);
  });
});
