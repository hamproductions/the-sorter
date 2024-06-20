import characters from '../../../data/character-info.json';
import type { Character } from '~/types';

export const mockCharacter = (name = '日野下花帆') => {
  return characters.find((c) => c.fullName === name) as Character;
};
