import { describe, expect, it } from 'vitest';
import {
  computeSetlistLabels,
  computeSortableSetlistLabels,
  getDistinctSongPerformanceEntries,
  parseSetlistPerformers
} from '../performance-sort';
import type { PerformanceSetlist, SetlistItem } from '~/types/setlist-prediction';
import type { Song } from '~/types/songs';

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
      [makeSong('a', 0), makeSong('b', 1), makeSong('c', 2), makeSong('d', 3), makeSong('e', 4)],
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

describe('computeSortableSetlistLabels', () => {
  const songs = [
    { id: '427', name: '繚乱！ビクトリーロード', englishName: 'Ryouran! Victory Road' },
    {
      id: '428',
      name: 'Colorful Dreams! Colorful Smiles!',
      englishName: 'Colorful Dreams! Colorful Smiles!'
    },
    { id: '820', name: '約束になれ僕らの歌', englishName: 'Yakusoku ni Nare Bokura no Uta' }
  ] as Song[];

  it('drops entries whose custom title does not resolve to a Love Live song', () => {
    const setlist = makeSetlist(
      [
        {
          id: 'item-0',
          type: 'song',
          position: 0,
          songId: '428',
          customSongName: 'Colorful Dreams! Colorful Smiles!'
        } as SetlistItem,
        {
          id: 'item-1',
          type: 'song',
          position: 1,
          songId: '89',
          customSongName: '1000%SPARKING!'
        } as SetlistItem
      ],
      [{ name: 'Main', startIndex: 0, endIndex: 1, type: 'main' }]
    );

    const result = computeSortableSetlistLabels(setlist, songs);

    expect(result).toEqual([{ songId: '428', label: 'M01' }]);
  });

  it('re-resolves wrong song ids by custom song title', () => {
    const setlist = makeSetlist(
      [
        {
          id: 'item-0',
          type: 'song',
          position: 0,
          songId: '15',
          customSongName: '約束になれ僕らの歌'
        } as SetlistItem
      ],
      [{ name: 'Main', startIndex: 0, endIndex: 0, type: 'main' }]
    );

    const result = computeSortableSetlistLabels(setlist, songs);

    expect(result).toEqual([{ songId: '820', label: 'M01' }]);
  });
});

describe('parseSetlistPerformers & getDistinctSongPerformanceEntries', () => {
  const museSong = {
    id: '69',
    name: 'ユメノトビラ',
    seriesIds: [1],
    artists: [{ id: '1', variant: null }]
  } as unknown as Song;

  const soloSong = {
    id: '784',
    name: 'ひっさつマイマイモード',
    seriesIds: [8],
    artists: [{ id: '215', variant: null }]
  } as unknown as Song;

  it('returns undefined when only a subset of the original group performs', () => {
    const result = parseSetlistPerformers('穂乃果・ことり・凛・真姫・花陽・にこ Ver.', museSong);
    expect(result).toBeUndefined();
  });

  it('returns only outside collaborating members when members from outside the original group participate', () => {
    const result = parseSetlistPerformers(
      '高坂穂乃果、南ことり、高海千歌、桜内梨子 Ver.',
      museSong
    );
    expect(result).toEqual([
      { kind: 'member', characterId: '13' },
      { kind: 'member', characterId: '14' }
    ]);
  });

  it('returns only outside collaborating members when other characters join a solo song', () => {
    const result = parseSetlistPerformers(
      'ショート Ver.｜麻布麻衣、朝香果林、葉月 恋、村野さやか Ver.',
      soloSong
    );
    expect(result).toEqual([
      { kind: 'member', characterId: '27' },
      { kind: 'member', characterId: '41' },
      { kind: 'member', characterId: '60' }
    ]);
  });

  it('returns only outside collaborating group performers when whole groups collaborate', () => {
    const result = parseSetlistPerformers(
      "Movie Edit｜μ's・Aqours・虹ヶ咲学園スクールアイドル同好会 Ver.",
      museSong
    );
    expect(result).toEqual([
      expect.objectContaining({ kind: 'group', id: '33', name: 'Aqours' }),
      expect.objectContaining({
        kind: 'group',
        id: '60',
        name: '虹ヶ咲学園スクールアイドル同好会'
      })
    ]);
  });

  it('deduplicates multi-day entries when lineup and remarks are identical across days', () => {
    const entries = getDistinctSongPerformanceEntries('103', [
      {
        songId: '103',
        label: 'Day.1 M50',
        performanceName: 'Day.1',
        remarks: 'Movie Edit',
        performers: [{ kind: 'group', id: '1', name: "μ's" }]
      },
      {
        songId: '103',
        label: 'Day.2 M49',
        performanceName: 'Day.2',
        remarks: 'Movie Edit',
        performers: [{ kind: 'group', id: '1', name: "μ's" }]
      }
    ]);
    expect(entries).toHaveLength(1);
    expect(entries[0].dayLabel).toBeUndefined();
  });

  it('preserves per-day entries with dayLabel when lineups differ across days', () => {
    const entries = getDistinctSongPerformanceEntries('892', [
      {
        songId: '892',
        label: 'Day.1 M14',
        performanceName: 'Day.1',
        remarks: '大沢瑠璃乃、高橋ポルカ Ver.',
        performers: [
          { kind: 'member', characterId: '63' },
          { kind: 'member', characterId: '81' }
        ]
      },
      {
        songId: '892',
        label: 'Day.2 M10',
        performanceName: 'Day.2'
      }
    ]);
    expect(entries).toHaveLength(2);
    expect(entries[0].dayLabel).toBe('Day.1');
    expect(entries[1].dayLabel).toBe('Day.2');
  });
});
