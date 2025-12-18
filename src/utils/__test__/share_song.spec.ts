import { describe, expect, test } from 'vitest';
import { addSongPresetParams } from '../share';

describe('Share Utils', () => {
  describe('addSongPresetParams function', () => {
    test('Create create parameters for preset', () => {
      const params = new URLSearchParams();
      const filters = {
        series: ['series1', 'series2'],
        artists: ['artist1'],
        types: ['group'] as ('group' | 'solo' | 'unit')[],
        characters: [],
        discographies: []
      };

      const result = addSongPresetParams(params, filters);

      expect(result.toString()).toMatchSnapshot();
      expect(result.getAll('series')).toEqual(['series1', 'series2']);
      expect(result.getAll('artists')).toEqual(['artist1']);
      expect(result.getAll('types')).toEqual(['group']);
    });

    test('Create empty parameters when filter is empty', () => {
      const params = new URLSearchParams();
      const filters = {
        series: [],
        artists: [],
        types: [] as ('group' | 'solo' | 'unit')[],
        characters: [],
        discographies: []
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
        discographies: []
      };

      const result = addSongPresetParams(params, filters);
      expect(result.getAll('series')).toEqual(['series1']);
      expect(result.getAll('artists')).toEqual([]);
    });
  });
});
