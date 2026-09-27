import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useData } from '~/hooks/useData';
import { useDiscographyData } from '~/hooks/useDiscographyData';
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

const PLACEHOLDER_OWNERS = 3;
let jacketById: Map<string, string> | undefined;

export const useRankingItems = (kind: RankingKind, mode?: RankingMode) => {
  const { i18n } = useTranslation();
  const characters = useData();
  const songs = useSongData();
  const series = useSeriesData();
  const discographies = useDiscographyData();
  const lang = i18n.language;

  jacketById ??= (() => {
    const owners = new Map<string, Set<string>>();
    for (const d of discographies) {
      for (const v of d.versions) {
        if (v.imageUrl) owners.set(v.imageUrl, (owners.get(v.imageUrl) ?? new Set()).add(d.id));
      }
    }
    const isPlaceholder = (url: string) => (owners.get(url)?.size ?? 0) >= PLACEHOLDER_OWNERS;
    return new Map(
      discographies.flatMap((d) => {
        const image = d.versions.find((v) => v.imageUrl && !isPlaceholder(v.imageUrl))?.imageUrl;
        return image ? [[d.id, image] as const] : [];
      })
    );
  })();
  const jackets = jacketById;

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
      const jacket = song.discographyIds
        ?.map((discographyId) => jackets.get(String(discographyId)))
        .find(Boolean);
      const videoId = song.musicVideo?.videoId;
      return {
        name: getSongName(song.name, song.englishName, lang),
        color: series.find((s) => String(s.id) === String(song.seriesIds[0]))?.color,
        image: jacket ?? (videoId ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` : undefined)
      };
    },
    [kind, mode, characters, songs, series, jackets, lang]
  );
};
