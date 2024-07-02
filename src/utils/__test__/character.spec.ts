import { describe, expect, it } from 'vitest';
import { getCastName, getCharacterFromId, getFullName, parseSortResult } from '../character';

import { mockCharacter } from '~/__test__/utils/mocks';

describe('Character Utils', () => {
  const character = mockCharacter();
  describe('getCharacterFromId', () => {
    it('Gets Character from Id', () => {
      expect(getCharacterFromId([character], character.id, false)).toEqual(character);
    });
    it('Gets Seiyuu(s) from Id', () => {
      const setsuna = mockCharacter('優木せつ菜');
      expect(getCharacterFromId([setsuna], setsuna.id, true)?.casts[0].seiyuu).toEqual(
        '楠木ともり'
      );
      expect(getCharacterFromId([setsuna], `${setsuna.id}-1`, true)?.casts[0].seiyuu).toEqual(
        '林 鼓子'
      );
    });
    it('Id not found', () => {
      expect(getCharacterFromId([], character.id, false)).toEqual(undefined);
      expect(getCharacterFromId([character], '', false)).toEqual(undefined);
    });
  });
  describe('parseSortResult', () => {
    const kanata = mockCharacter('近江彼方');
    it('Convert 2d array of IDs (state) to list of characters and rank', () => {
      expect(parseSortResult([[character.id]], [character], false)).toEqual([
        { rank: 1, ...character }
      ]);
      expect(parseSortResult([[character.id], [kanata.id]], [character, kanata], false)).toEqual([
        { rank: 1, ...character },
        { rank: 2, ...kanata }
      ]);
    });
    it('Handle Ties', () => {
      expect(parseSortResult([[character.id, kanata.id]], [character, kanata], false)).toEqual([
        { rank: 1, ...character },
        { rank: 1, ...kanata }
      ]);
    });
    it('Legacy Support ', () => {
      //@ts-expect-error Legacy support just in case
      expect(parseSortResult([character.id, kanata.id], [character, kanata], false)).toEqual([
        { rank: 1, ...character },
        { rank: 2, ...kanata }
      ]);
    });
  });
  describe('getFullName', () => {
    it('gets name in Japanese', () => {
      expect(getFullName(character, 'ja')).toEqual('日野下花帆');
    });
    it('gets name in English', () => {
      expect(getFullName(character, 'en')).toEqual('Kaho Hinoshita');
    });
  });
  describe('getCastName', () => {
    it('gets name in Japanese', () => {
      expect(getCastName(character.casts[0], 'ja')).toEqual('楡井希実');
    });
    it('gets name in English', () => {
      expect(getCastName(character.casts[0], 'en')).toEqual('Nozomi Nirei');
    });
  });
});
