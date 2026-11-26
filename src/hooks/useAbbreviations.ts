import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocalStorage } from './useLocalStorage';
import {
  getEventAbbreviation,
  getNameAbbreviation,
  getSongAbbreviation
} from '~/utils/abbreviations';
import { getSongName } from '~/utils/names';
import type { Song } from '~/types/songs';

export function useAbbreviations() {
  const [stored, setEnabled] = useLocalStorage<boolean>('use-abbreviations', false);
  const { i18n } = useTranslation();
  const lang = i18n.language;

  const short = useMemo(
    () => ({
      song: (song: Pick<Song, 'id' | 'name' | 'englishName'>) => {
        const fullName = getSongName(song.name, song.englishName, lang);
        return getSongAbbreviation(song.id, fullName, lang) ?? fullName;
      },
      name: (name: string) => getNameAbbreviation(name, lang),
      event: (label: string, tourName = '') => {
        const eventName = getEventAbbreviation(tourName, lang);
        return eventName ? label.replace(tourName, eventName) : label;
      }
    }),
    [lang]
  );

  return { enabled: !!stored, setEnabled, short };
}
