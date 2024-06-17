import type { Locale } from '~/i18n';
import type { Character } from '~/types';

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

export const getFullName = (character: Character, locale: Locale) => {
  if (locale === 'en' && character.englishName) return character.englishName;

  return character.fullName;
};

export const getCastName = (cast: Character['casts'][number], locale: Locale) => {
  if (locale === 'en' && cast.englishName) return cast.englishName;
  return cast.seiyuu;
};
