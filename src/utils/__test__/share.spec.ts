import { describe, expect, it } from 'vitest';
import { addPresetParams, serializeData } from '../share';

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

  describe('serializeData function', () => {
    it('Serialize Data with lz compression algorithm', async () => {
      expect(await serializeData({ data: 'hoge' })).toMatchSnapshot();
    });
  });
});
