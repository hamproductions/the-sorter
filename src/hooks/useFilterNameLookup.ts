import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useData } from './useData';
import { useDiscographyData } from './useDiscographyData';
import { useSongData } from './useSongData';
import type { FilterNameLookup } from '~/utils/filter-summary';
import { getFullName } from '~/utils/character';
import { getSongName } from '~/utils/names';

export const useFilterNameLookup = (): FilterNameLookup => {
  const { i18n } = useTranslation();
  const songs = useSongData();
  const characters = useData();
  const discographies = useDiscographyData();
  const lang = i18n.language;
  return useMemo(
    () => ({
      song: (id) => {
        const song = songs.find((s) => s.id === id);
        return song ? getSongName(song.name, song.englishName, lang) : undefined;
      },
      character: (id) => {
        const character = characters.find((c) => c.id === id);
        return character ? getFullName(character, lang) : undefined;
      },
      discography: (id) => discographies.find((d) => d.id === id)?.name
    }),
    [songs, characters, discographies, lang]
  );
};
