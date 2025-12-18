import { describe, test, expect, vi, it } from 'vitest';
import { matchSongFilter } from '../song-filter';
import type { Song } from '../../types/songs';
import type { SongFilterType } from '../../components/sorter/SongFilters';

// Mock the artist info data to be consistent with test data
vi.mock('../../../data/artists-info.json', () => ({
  default: [
    { id: '1', characters: ['1'], name: 'Honoka' },
    { id: '6', characters: ['6'], name: 'Maki' },
    { id: '4', characters: ['2', '6', '9'], name: 'BiBi' } // BiBi implies Eli(2), Maki(6), Nico(9)
  ]
}));

describe('matchSongFilter', () => {
  // Mock Data
  const songHonoka = {
    id: 's1',
    name: 'Honoka Solo',
    artists: [{ id: '6', variant: null }], // Maki (id 6)
    seriesIds: [1],
    discographyIds: [100], // Mock Discography ID
    characters: [6]
  } as unknown as Song;


  // Helper to create basic filter
  const createFilter = (overrides?: Partial<SongFilterType>): SongFilterType => ({
    characters: [],
    series: [],
    artists: [],
    types: [],
    discographies: [],
    ...overrides
  });

  test('No Filter', () => {
    expect(matchSongFilter(songHonoka, createFilter())).toBe(true);
  });

  test('Filter by Series (OR within section)', () => {
    // Match
    expect(matchSongFilter(songHonoka, createFilter({ series: ['1'] }))).toBe(true);
    // No Match
    expect(matchSongFilter(songHonoka, createFilter({ series: ['2'] }))).toBe(false);
    // OR Logic: Series 1 OR Series 2 matches song with Series 1
    expect(matchSongFilter(songHonoka, createFilter({ series: ['1', '2'] }))).toBe(true);
  });

  describe('Character Filter', () => {
    test('Characters (OR logic)', () => {
      // Maki (6) matches
      expect(matchSongFilter(songHonoka, createFilter({ characters: [6] }))).toBe(true);
      // Honoka (1) does not match song with only Maki
      expect(matchSongFilter(songHonoka, createFilter({ characters: [1] }))).toBe(false);
      // OR: 1 OR 6 matches song with 6
      expect(matchSongFilter(songHonoka, createFilter({ characters: [1, 6] }))).toBe(true);
    });
  });

  describe('Artist Filter Logic', () => {
    test('Artists (OR logic)', () => {
      // Song has Maki (6), filter has Maki (6) -> Match
      expect(matchSongFilter(songHonoka, createFilter({ artists: ['6'] }))).toBe(true);
      // Song has Maki (6), filter has BiBi (4) -> No match
      expect(matchSongFilter(songHonoka, createFilter({ artists: ['4'] }))).toBe(false);
      // OR: 6 OR 4 -> Matches song with 6
      expect(matchSongFilter(songHonoka, createFilter({ artists: ['4', '6'] }))).toBe(true);
    });
  });

  describe('Global Logic (AND between sections)', () => {
    it('returns true if ALL active sections match', () => {
      const filter = createFilter({
        series: ['1'], // Matches
        artists: ['6'] // Matches
      });
      expect(matchSongFilter(songHonoka, filter)).toBe(true);
    });

    it('returns false if ANY active section fails', () => {
      const filter = createFilter({
        series: ['1'], // Matches
        artists: ['4'] // Fails (4=BiBi, song has 6=Maki)
      });
      expect(matchSongFilter(songHonoka, filter)).toBe(false);
    });

    it('ignores empty sections', () => {
      const filter = createFilter({
        series: ['1'],
        artists: [] // Empty -> Ignored
      });
      expect(matchSongFilter(songHonoka, filter)).toBe(true);
    });
  });
});
