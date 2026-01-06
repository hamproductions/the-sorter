import { describe, expect, it } from 'vitest';
import { matchSongFilter } from '~/utils/song-filter';
import type { Song } from '~/types/songs';
import type { SongFilterType } from '~/components/sorter/SongFilters';

const mockSongSingle1: Song = {
  id: '1',
  name: 'Song Single 1',
  seriesIds: [1],
  artists: [],
  discographyIds: [],
  group: 'group'
} as unknown as Song;

const mockSongSingle2: Song = {
  id: '2',
  name: 'Song Single 2',
  seriesIds: [2],
  artists: [],
  discographyIds: [],
  group: 'group'
} as unknown as Song;

const mockSongCross: Song = {
  id: '3',
  name: 'Song Cross',
  seriesIds: [1, 2],
  artists: [],
  discographyIds: [],
  group: 'group'
} as unknown as Song;

const emptyFilter: SongFilterType = {
  series: [],
  artists: [],
  types: [],
  characters: [],
  discographies: [],
  years: []
};

describe('Series Filter Logic', () => {
  it('should show all songs when no filter is applied', () => {
    expect(matchSongFilter(mockSongSingle1, emptyFilter)).toBe(true);
    expect(matchSongFilter(mockSongSingle2, emptyFilter)).toBe(true);
    expect(matchSongFilter(mockSongCross, emptyFilter)).toBe(true);
  });

  it('should show only exclusive single series songs when series 1 is selected', () => {
    const filter: SongFilterType = { ...emptyFilter, series: ['1'] };

    expect(matchSongFilter(mockSongSingle1, filter)).toBe(true); // Matches series 1 exclusively
    expect(matchSongFilter(mockSongSingle2, filter)).toBe(false); // Series 2
    expect(matchSongFilter(mockSongCross, filter)).toBe(false); // Has series 1 but is cross
  });

  it('should show only exclusive single series songs when series 2 is selected', () => {
    const filter: SongFilterType = { ...emptyFilter, series: ['2'] };

    expect(matchSongFilter(mockSongSingle1, filter)).toBe(false);
    expect(matchSongFilter(mockSongSingle2, filter)).toBe(true);
    expect(matchSongFilter(mockSongCross, filter)).toBe(false);
  });

  it('should show only cross series songs when "cross" is selected', () => {
    const filter: SongFilterType = { ...emptyFilter, series: ['cross'] };

    expect(matchSongFilter(mockSongSingle1, filter)).toBe(false);
    expect(matchSongFilter(mockSongSingle2, filter)).toBe(false);
    expect(matchSongFilter(mockSongCross, filter)).toBe(true);
  });

  it('should show both if "series 1" AND "cross" are selected', () => {
    const filter: SongFilterType = { ...emptyFilter, series: ['1', 'cross'] };

    expect(matchSongFilter(mockSongSingle1, filter)).toBe(true);
    expect(matchSongFilter(mockSongSingle2, filter)).toBe(false);
    expect(matchSongFilter(mockSongCross, filter)).toBe(true);
  });
});
