import { hasFilter, matchFilter } from './filter';
import type { FilterType } from '~/components/sorter/CharacterFilters';
import type { Locale } from '~/i18n';
import type { Character, WithRank } from '~/types';

const toSeiyuuList = (characters: Character[]): Character[] => {
  const bySeiyuu = new Map<string, Character>();
  for (const c of characters) {
    c.casts.forEach((cast, idx) => {
      if (!bySeiyuu.has(cast.seiyuu)) {
        bySeiyuu.set(cast.seiyuu, {
          ...c,
          id: idx > 0 ? `${c.id}-${idx}` : c.id,
          casts: [cast]
        } as Character);
      }
    });
  }
  return [...bySeiyuu.values()];
};

export const getCharacterSortList = (
  characters: Character[],
  seiyuu: boolean,
  filters?: FilterType | null
): Character[] => {
  const list = seiyuu ? toSeiyuuList(characters) : characters;
  return filters && hasFilter(filters) ? list.filter((c) => matchFilter(c, filters)) : list;
};

export const getCharacterFromId = (
  data: Character[],
  id: string,
  isSeiyuu?: boolean
): Character | undefined => {
  const [charaId, castId] = id.split('-');
  const chara = data.find((i) => i.id === charaId);
  if (!chara) {
    return undefined;
  }
  return {
    ...chara,
    id,
    //@ts-expect-error TODO: will fix
    casts: isSeiyuu
      ? chara.casts.filter((_, idx) => idx === (castId !== undefined ? Number(castId) : 0))
      : chara.casts
  };
};

export const stateToCharacterList = (
  state: string[][],
  data: Character[],
  isSeiyuu: boolean
): WithRank<Character>[][] => {
  return (
    state
      ?.map((ids, idx, arr) => {
        const startRank = arr
          .slice(0, idx)
          .reduce((p, c) => p + (Array.isArray(c) ? c.length : 1), 1);
        if (Array.isArray(ids)) {
          return ids
            .map((id) => ({ rank: startRank, ...getCharacterFromId(data, id, isSeiyuu) }))
            .filter((d) => 'id' in d);
        } else {
          const chara = data.find((i) => i.id === (ids as string));
          if (!chara) return [];
          return [{ rank: startRank, ...chara }];
        }
      })
      .filter((c): c is WithRank<Character>[] => !!c) ?? []
  );
};

export const parseSortResult = (
  state: string[][],
  data: Character[],
  isSeiyuu: boolean
): WithRank<Character>[] => {
  return stateToCharacterList(state, data, isSeiyuu).flatMap((r) => r);
};

export const getFullName = (character: Character, locale: Locale) => {
  if (locale === 'en' && character.englishName) return character.englishName;
  return character.fullName;
};

export const getCastName = (cast: Character['casts'][number], locale: Locale) => {
  if (locale === 'en' && cast.englishName)
    return cast.englishName.split(' ').toReversed().join(' ');
  return cast.seiyuu;
};
