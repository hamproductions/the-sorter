import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useData } from '~/hooks/useData';
import { useSeriesData } from '~/hooks/useSeriesData';
import { useSongData } from '~/hooks/useSongData';
import type { RankingKind, RankingMode } from '~/types/global-ranking';
import { getPicUrl } from '~/utils/assets';
import { getCastName, getCharacterFromId, getFullName } from '~/utils/character';
import { getSongName } from '~/utils/names';

export interface RankingItemDisplay {
  name: string;
  subtitle?: string;
  color?: string;
  image?: string;
}

export const useRankingItems = (kind: RankingKind, mode?: RankingMode) => {
  const { i18n } = useTranslation();
  const characters = useData();
  const songs = useSongData();
  const series = useSeriesData();
  const lang = i18n.language;

  return useCallback(
    (id: string): RankingItemDisplay => {
      if (kind === 'character') {
        const isSeiyuu = mode === 'seiyuu';
        const character = getCharacterFromId(characters, id, isSeiyuu);
        if (!character) return { name: id };
        const characterName = getFullName(character, lang);
        return {
          name: isSeiyuu ? getCastName(character.casts[0], lang) : characterName,
          subtitle: isSeiyuu ? characterName : undefined,
          color: character.colorCode ?? character.seriesColor,
          image: character.hasIcon ? getPicUrl(character.id.split('-')[0], 'icons') : undefined
        };
      }
      const song = songs.find((s) => s.id === id);
      if (!song) return { name: id };
      return {
        name: getSongName(song.name, song.englishName, lang),
        color: series.find((s) => String(s.id) === String(song.seriesIds[0]))?.color
      };
    },
    [kind, mode, characters, songs, series, lang]
  );
};
