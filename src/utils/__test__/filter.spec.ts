import { describe, expect, it } from 'vitest';
import characters from '../../../data/character-info.json';
import { getFilterTitle, hasFilter, isValidFilter, matchFilter } from '../filter';
import { mockCharacter } from '~/__test__/utils/mocks';

describe('Filter Utils', () => {
  describe('hasFilter function', () => {
    it('Checks if filters exists', () => {
      expect(hasFilter({})).toEqual(false);
      expect(hasFilter({ series: [] })).toEqual(false);
      expect(hasFilter({ series: ['hoge'] })).toEqual(true);
    });
  });

  describe('matchFilter function', () => {
    const character = mockCharacter();
    it('Match Series', () => {
      expect(
        matchFilter(character, {
          series: [character?.series]
        })
      ).toEqual(true);
      expect(
        matchFilter(character, {
          series: ['hoge'],
          school: [],
          units: []
        })
      ).toEqual(false);
    });
    it('Match School', () => {
      expect(
        matchFilter(character, {
          series: [],
          school: [character?.school],
          units: []
        })
      ).toEqual(true);
      expect(
        matchFilter(character, {
          series: [],
          school: ['hoge'],
          units: []
        })
      ).toEqual(false);
    });
    it('Match Units', () => {
      expect(
        matchFilter(character, {
          school: [],
          series: [],
          units: [character?.units[0]?.id]
        })
      ).toEqual(true);
      expect(
        matchFilter(character, {
          units: ['hoge'],
          school: [],
          series: []
        })
      ).toEqual(false);
    });
    it('Match All', () => {
      expect(
        matchFilter(character, {
          series: ['hoge', 'fuga'],
          school: [character?.school],
          units: [character?.units[0]?.id]
        })
      ).toEqual(true);
      expect(
        matchFilter(character, {
          series: [],
          school: [],
          units: ['DOLLCHESTRA']
        })
      ).toEqual(false);
    });
    it('Invalid Filter', () => {
      //@ts-expect-error Testing
      expect(matchFilter(character, undefined)).toEqual(true);
    });
  });

  describe('isValidFilter function', () => {
    it('Validates a filter', () => {
      expect(isValidFilter({ series: ['hoge'] })).toEqual(false);
      expect(isValidFilter(undefined)).toEqual(false);
      //@ts-expect-error Testing
      expect(isValidFilter('')).toEqual(false);
      expect(isValidFilter({})).toEqual(false);

      expect(
        isValidFilter({
          school: [],
          series: [],
          units: []
        })
      ).toEqual(true);
    });
  });

  describe('getFilterTitle function', () => {
    const character = mockCharacter();
    it('Series only', () => {
      expect(
        getFilterTitle(
          {
            series: [character?.series],
            school: [],
            units: []
          },
          characters,
          'en'
        )
      ).toEqual("Hasunosora Girls' High School Idol Club");
      expect(
        getFilterTitle(
          {
            series: [character?.series],
            school: [],
            units: []
          },
          characters,
          'ja'
        )
      ).toEqual('蓮ノ空女学院スクールアイドルクラブ');
    });
    it('School Only', () => {
      expect(
        getFilterTitle(
          {
            series: [],
            school: [character?.school],
            units: []
          },
          characters,
          'en'
        )
      ).toEqual("Hasunosora Girls' High School");
      expect(
        getFilterTitle(
          {
            series: [],
            school: [character?.school],
            units: []
          },
          characters,
          'ja'
        )
      ).toEqual('蓮ノ空女学院');
    });
    it('Match Units', () => {
      expect(
        getFilterTitle(
          {
            series: [],
            school: [],
            units: [character?.units[0]?.id]
          },
          characters,
          'en'
        )
      ).toEqual("Hasunosora Girls' High School Idol Club");
      expect(
        getFilterTitle(
          {
            series: [],
            school: [],
            units: [character?.units[0]?.id]
          },
          characters,
          'ja'
        )
      ).toEqual('蓮ノ空女学院スクールアイドルクラブ');
    });
    it('Multiple Title', () => {
      expect(
        getFilterTitle(
          {
            series: [],
            school: [],
            units: [character?.units[0]?.id, character?.units[1]?.id]
          },
          characters,
          'ja'
        )
      ).toEqual(undefined);
    });
    it('Invalid Filter', () => {
      //@ts-expect-error Testing
      expect(matchFilter(character, undefined)).toEqual(true);
    });
  });
});
