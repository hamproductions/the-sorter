import { describe, expect, test } from 'vitest';
import { addSongPresetParams, getAllCommaSeparated } from '../share';

describe('Share Utils', () => {
  describe('addSongPresetParams function', () => {
    test('Create create parameters for preset', () => {
      const params = new URLSearchParams();
      const filters = {
        series: ['series1', 'series2'],
        artists: ['artist1'],
        types: ['group'] as ('group' | 'solo' | 'unit')[],
        characters: [1, 2],
        discographies: [3],
        songs: [4],
        years: [2015]
      };

      const result = addSongPresetParams(params, filters);

      expect(result.toString()).toMatchSnapshot();
      expect(result.getAll('series')).toEqual(['series1,series2']);
      expect(result.getAll('artists')).toEqual(['artist1']);
      expect(result.getAll('types')).toEqual(['group']);
      expect(result.getAll('characters')).toEqual(['1,2']);
      expect(result.getAll('discographies')).toEqual(['3']);
      expect(result.getAll('songs')).toEqual(['4']);
    });

    test('Create empty parameters when filter is empty', () => {
      const params = new URLSearchParams();
      const filters = {
        series: [],
        artists: [],
        types: [] as ('group' | 'solo' | 'unit')[],
        characters: [],
        discographies: [],
        songs: [],
        years: []
      };

      const result = addSongPresetParams(params, filters);
      expect(result.toString()).toBe('');
    });

    test('Create parameters for partial filter', () => {
      const params = new URLSearchParams();
      const filters = {
        series: ['series1'],
        artists: [],
        types: [] as ('group' | 'solo' | 'unit')[],
        characters: [],
        discographies: [],
        songs: [],
        years: []
      };

      const result = addSongPresetParams(params, filters);
      expect(result.getAll('series')).toEqual(['series1']);
      expect(result.getAll('artists')).toEqual([]);
    });
  });

  describe('getAllCommaSeparated', () => {
    test('Parse legacy format (repeated keys)', () => {
      const params = new URLSearchParams('songs=1&songs=2');
      const result = getAllCommaSeparated(params, 'songs');
      expect(result).toEqual(['1', '2']);
    });

    test('Parse new format (comma separated)', () => {
      const params = new URLSearchParams('songs=1,2');
      const result = getAllCommaSeparated(params, 'songs');
      expect(result).toEqual(['1', '2']);
    });

    test('Parse mixed format', () => {
      const params = new URLSearchParams('songs=1&songs=2,3');
      const result = getAllCommaSeparated(params, 'songs');
      expect(result).toEqual(['1', '2', '3']);
    });

    test('Parse empty', () => {
      const params = new URLSearchParams('');
      const result = getAllCommaSeparated(params, 'songs');
      expect(result).toEqual([]);
    });

    test('Parse with empty values', () => {
      const params = new URLSearchParams('songs=1,,2');
      const result = getAllCommaSeparated(params, 'songs');
      expect(result).toEqual(['1', '2']);
    });
  });
});
