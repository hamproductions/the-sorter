import artists from '../../data/artists-info.json';
import type { Artist } from '~/types/songs';

export const useArtistsData = (): Artist[] => {
  return artists;
};
