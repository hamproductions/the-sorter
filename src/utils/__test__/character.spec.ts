import { describe, expect, it } from 'vitest';
import { getCastName, getCharacterFromId, getFullName, parseSortResult } from '../character';

import characterInfo from '../../../data/character-info.json';
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
  describe('new hasunosora movie members', () => {
    it('includes maika and aoi with english names', () => {
      expect(characterInfo.find((character) => character.id === '91')).toMatchObject({
        id: '91',
        fullName: '錦上マイカ',
        englishName: 'Maika Kinjo',
        school: '蓮ノ空女学院',
        units: [{ name: '蓮ノ空女学院スクールアイドルクラブ', id: '133', additionalInfo: '106期' }],
        casts: [{ seiyuu: '星宮じゅりあ', englishName: 'Hoshimiya Juria' }]
      });
      expect(characterInfo.find((character) => character.id === '92')).toMatchObject({
        id: '92',
        fullName: '令沢葵',
        englishName: 'Aoi Reizawa',
        school: '蓮ノ空女学院',
        units: [{ name: '蓮ノ空女学院スクールアイドルクラブ', id: '133', additionalInfo: '106期' }],
        casts: [{ seiyuu: '朝陽花菜', englishName: 'Asahi Kana' }]
      });
      expect(characterInfo.find((character) => character.id === '93')).toMatchObject({
        id: '93',
        fullName: '柴輪みおん',
        englishName: 'Mion Shinowa',
        school: '蓮ノ空女学院',
        units: [{ name: '蓮ノ空女学院スクールアイドルクラブ', id: '133', additionalInfo: '106期' }],
        casts: [{ seiyuu: '湯浅かなえ', englishName: 'Kanae Yuasa' }]
      });
    });
  });
});
