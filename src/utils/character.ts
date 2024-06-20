import type { Locale } from '~/i18n';
import type { Character, WithRank } from '~/types';

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

export const stateToCharacterList = (state: string[][], data: Character[], isSeiyuu: boolean) => {
  return (state
    ?.flatMap((ids, idx, arr) => {
      const startRank = arr.slice(0, idx).reduce((p, c) => p + c.length, 1);
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
    .filter((c) => !!c) ?? []) as WithRank<Character>[];
};

export const getFullName = (character: Character, locale: Locale) => {
  if (locale === 'en' && character.englishName) return character.englishName;

  return character.fullName;
};

export const getCastName = (cast: Character['casts'][number], locale: Locale) => {
  if (locale === 'en' && cast.englishName) return cast.englishName;
  return cast.seiyuu;
};
