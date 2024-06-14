import { Character } from '~/types';

export const getCharacterFromId = (data: Character[], id: string): Character | undefined => {
  const [charaId, castId] = id.split('-');
  const chara = data.find((i) => i.id === charaId);
  if (!chara) {
    return undefined;
  }
  return {
    ...chara,
    id,
    //@ts-expect-error TODO: will fix
    casts: chara.casts.filter((_, idx) => idx === (castId !== undefined ? Number(castId) : 0))
  };
};
