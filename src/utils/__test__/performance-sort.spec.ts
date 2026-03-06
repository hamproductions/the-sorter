import { describe, expect, it } from 'vitest';
import { computeSetlistLabels } from '../performance-sort';
import type { PerformanceSetlist, SetlistItem } from '~/types/setlist-prediction';

function makeSong(id: string, position: number): SetlistItem {
  return {
    id: `item-${position}`,
    type: 'song',
    position,
    songId: id
  } as SetlistItem;
}

function makeNonSong(type: 'mc' | 'custom' | 'vtr', title: string, position: number): SetlistItem {
  return {
    id: `item-${position}`,
    type,
    position,
    title
  } as SetlistItem;
}

function makeSetlist(
  items: SetlistItem[],
  sections: PerformanceSetlist['sections']
): PerformanceSetlist {
  return {
    id: 'test-setlist',
    items,
    sections,
    isActual: true
  };
}

describe('computeSetlistLabels', () => {
  it('labels all songs as M01, M02, ... when only main section exists', () => {
    const setlist = makeSetlist(
      [makeSong('a', 0), makeSong('b', 1), makeSong('c', 2)],
      [{ name: 'Main', startIndex: 0, endIndex: 2, type: 'main' }]
    );

    const result = computeSetlistLabels(setlist);

    expect(result).toEqual([
      { songId: 'a', label: 'M01' },
      { songId: 'b', label: 'M02' },
      { songId: 'c', label: 'M03' }
    ]);
  });

  it('labels encore songs as EN01, EN02, ... after encore section boundary', () => {
    const setlist = makeSetlist(
      [
        makeSong('a', 0),
        makeSong('b', 1),
        makeSong('c', 2),
        makeSong('d', 3),
        makeSong('e', 4)
      ],
      [
        { name: 'Main', startIndex: 0, endIndex: 2, type: 'main' },
        { name: 'Encore', startIndex: 3, endIndex: 4, type: 'encore' }
      ]
    );

    const result = computeSetlistLabels(setlist);

    expect(result).toEqual([
      { songId: 'a', label: 'M01' },
      { songId: 'b', label: 'M02' },
      { songId: 'c', label: 'M03' },
      { songId: 'd', label: 'EN01' },
      { songId: 'e', label: 'EN02' }
    ]);
  });

  it('skips non-song items (MC, VTR, custom)', () => {
    const setlist = makeSetlist(
      [
        makeSong('a', 0),
        makeNonSong('mc', 'Talk', 1),
        makeSong('b', 2),
        makeNonSong('vtr', 'Video', 3),
        makeSong('c', 4)
      ],
      [{ name: 'Main', startIndex: 0, endIndex: 4, type: 'main' }]
    );

    const result = computeSetlistLabels(setlist);

    expect(result).toEqual([
      { songId: 'a', label: 'M01' },
      { songId: 'b', label: 'M02' },
      { songId: 'c', label: 'M03' }
    ]);
  });

  it('handles non-song items between main and encore', () => {
    const setlist = makeSetlist(
      [
        makeSong('a', 0),
        makeSong('b', 1),
        makeNonSong('mc', 'Talk', 2),
        makeSong('c', 3),
        makeSong('d', 4)
      ],
      [
        { name: 'Main', startIndex: 0, endIndex: 2, type: 'main' },
        { name: 'Encore', startIndex: 3, endIndex: 4, type: 'encore' }
      ]
    );

    const result = computeSetlistLabels(setlist);

    expect(result).toEqual([
      { songId: 'a', label: 'M01' },
      { songId: 'b', label: 'M02' },
      { songId: 'c', label: 'EN01' },
      { songId: 'd', label: 'EN02' }
    ]);
  });

  it('defaults to main when item index is not covered by any section', () => {
    const setlist = makeSetlist(
      [makeSong('a', 0), makeSong('b', 1), makeSong('c', 2)],
      [] // no sections defined
    );

    const result = computeSetlistLabels(setlist);

    expect(result).toEqual([
      { songId: 'a', label: 'M01' },
      { songId: 'b', label: 'M02' },
      { songId: 'c', label: 'M03' }
    ]);
  });

  it('defaults to main when section type is undefined', () => {
    const setlist = makeSetlist(
      [makeSong('a', 0), makeSong('b', 1)],
      [{ name: 'Unknown', startIndex: 0, endIndex: 1 }]
    );

    const result = computeSetlistLabels(setlist);

    expect(result).toEqual([
      { songId: 'a', label: 'M01' },
      { songId: 'b', label: 'M02' }
    ]);
  });

  it('handles duplicate song IDs (same song performed twice)', () => {
    const setlist = makeSetlist(
      [makeSong('a', 0), makeSong('b', 1), makeSong('a', 2)],
      [{ name: 'Main', startIndex: 0, endIndex: 2, type: 'main' }]
    );

    const result = computeSetlistLabels(setlist);

    expect(result).toEqual([
      { songId: 'a', label: 'M01' },
      { songId: 'b', label: 'M02' },
      { songId: 'a', label: 'M03' }
    ]);
  });

  it('pads numbers correctly for large setlists', () => {
    const items = Array.from({ length: 12 }, (_, i) => makeSong(`s${i}`, i));
    const setlist = makeSetlist(items, [
      { name: 'Main', startIndex: 0, endIndex: 11, type: 'main' }
    ]);

    const result = computeSetlistLabels(setlist);

    expect(result[0].label).toBe('M01');
    expect(result[8].label).toBe('M09');
    expect(result[9].label).toBe('M10');
    expect(result[11].label).toBe('M12');
  });

  it('returns empty array for setlist with no songs', () => {
    const setlist = makeSetlist(
      [makeNonSong('mc', 'Talk', 0), makeNonSong('vtr', 'Video', 1)],
      [{ name: 'Main', startIndex: 0, endIndex: 1, type: 'main' }]
    );

    const result = computeSetlistLabels(setlist);

    expect(result).toEqual([]);
  });

  it('handles empty setlist', () => {
    const setlist = makeSetlist([], []);

    const result = computeSetlistLabels(setlist);

    expect(result).toEqual([]);
  });
});
