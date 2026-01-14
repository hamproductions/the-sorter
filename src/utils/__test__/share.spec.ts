import { describe, expect, it } from 'vitest';
import { addPresetParams, addSongPresetParams, serializeData } from '../share';

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

  describe('serializeData function', () => {
    it('Serialize Data with lz compression algorithm', async () => {
      expect(await serializeData({ data: 'hoge' })).toMatchSnapshot();
    });
  });
});
