import { describe, expect, it } from 'vitest';
import {
  addPresetParams,
  addSongPerformanceParams,
  addSongPresetParams,
  getSongPerformanceParams,
  serializeData
} from '../share';

describe('Share Utils', () => {
  describe('addPresetParams function', () => {
    it('Create create parameters for preset', () => {
      expect(
        addPresetParams(
          new URLSearchParams(),
          { series: ['hoge'], school: ['fuga'], units: ['1', '2', '3', '4'] },
          false
        ).toString()
      ).toEqual('series=hoge&school=fuga&units=1&units=2&units=3&units=4');
      expect(
        addPresetParams(
          new URLSearchParams(),
          { series: ['hoge'], school: ['fuga'], units: ['1', '2', '3', '4'] },
          true
        ).toString()
      ).toEqual('series=hoge&school=fuga&units=1&units=2&units=3&units=4&seiyuu=true');
    });
  });

  describe('addSongPresetParams function', () => {
    it('should create parameters for song preset', () => {
      expect(
        addSongPresetParams(new URLSearchParams(), {
          series: ['series1'],
          artists: ['artist1'],
          types: ['group'],
          characters: [1, 2],
          discographies: [10],
          songs: [100, 101],
          years: []
        }).toString()
      ).toEqual(
        'series=series1&artists=artist1&types=group&characters=1%2C2&discographies=10&songs=100%2C101'
      );
    });
  });

  describe('song performance params', () => {
    it('round-trips selected performance songs and label', () => {
      const params = addSongPerformanceParams(new URLSearchParams(), ['691', '831'], {
        performanceIds: ['750', '736'],
        tourName: 'unused',
        selectionLabel: 'Two performances',
        setlistOrder: []
      });

      expect(params.toString()).toEqual(
        'performanceSongs=691%2C831&performanceIds=750%2C736&performanceLabel=Two+performances'
      );
      expect(getSongPerformanceParams(params)).toEqual({
        songIds: ['691', '831'],
        meta: {
          performanceId: undefined,
          performanceIds: ['750', '736'],
          tourName: 'Two performances',
          performanceName: undefined,
          selectionLabel: 'Two performances',
          setlistOrder: []
        }
      });
    });
  });

  describe('serializeData function', () => {
    it('Serialize Data with lz compression algorithm', async () => {
      expect(await serializeData({ data: 'hoge' })).toMatchSnapshot();
    });
  });
});
