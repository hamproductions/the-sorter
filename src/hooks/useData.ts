import { Character } from '~/types';
import characterInfo from '../../data/character-info.json';

export const useData = () => {
  return characterInfo as Character[];
};
