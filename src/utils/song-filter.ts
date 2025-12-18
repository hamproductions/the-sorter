import artistInfo from '../../data/artists-info.json';
import type { SongFilterType } from '~/components/sorter/SongFilters';
import type { Song } from '~/types/songs';

const GROUPS_INFO = [
  { name: "μ's", seriesId: 1 },
  { name: 'Aqours', seriesId: 2 },
  { name: 'Aqours feat. 初音ミク', seriesId: 2 },
  { name: 'Saint Aqours Snow', seriesId: 2 },
  { name: '私立浦の星女学院一同', seriesId: 2 },
  { name: 'シャゼリア☆キッス', seriesId: 2 },
  { name: '虹ヶ咲学園スクールアイドル同好会', seriesId: 3 },
  { name: 'ニジガク with You', seriesId: 3 },
  { name: 'Liella!', seriesId: 4 },
  { name: '椿滝桜女学院高等学校スクールアイドル部!', seriesId: 5 },
  { name: '蓮ノ空女学院スクールアイドルクラブ', seriesId: 6 },
  { name: 'スリーズブーケ＆DOLLCHESTRA＆みらくらぱーく！', seriesId: 6 }
];

export const matchSongFilter = (item: Song, filter: SongFilterType) => {
  if (!filter) return true;
  if (!isValidSongFilter(filter)) return true;

  const artistData = item.artists.map((i) => artistInfo.find((a) => a.id === i.id));

  // 1. Series Logic (OR within section)
  const seriesMatch =
    filter.series.length === 0 || item.seriesIds.some((s) => filter.series.includes(String(s)));

  // 2. Artists Logic (OR within section)
  const artistsMatch =
    filter.artists.length === 0 ||
    filter.artists.some((a) => item.artists.some((art) => art.id === a));

  // 3. Types Logic (OR within section)
  const typesMatch =
    filter.types.length === 0 ||
    filter.types.some((type) => {
      if (type === 'group') {
        return artistData.some((a) => GROUPS_INFO.find((g) => g.name === a?.name));
      } else if (type === 'solo') {
        return artistData.some((a) => a?.characters.length === 1);
      } else if (type === 'unit') {
        return (
          !artistData.some((a) => GROUPS_INFO.find((g) => g.name === a?.name)) &&
          !artistData.some((a) => a?.characters.length === 1)
        );
      }
      return false;
    });

  // 4. Character Logic (OR within section)
  let charactersMatch = true;
  if (filter.characters && filter.characters.length > 0) {
    const songCharacters = new Set<string>();
    artistData.forEach((a) => {
      a?.characters.forEach((c) => songCharacters.add(c));
    });
    charactersMatch = filter.characters.some((c) => songCharacters.has(String(c)));
  }

  // 5. Discography Logic (OR within section)
  let discographiesMatch = true;
  if (filter.discographies && filter.discographies.length > 0) {
    discographiesMatch = filter.discographies.some((d) => item.discographyIds?.includes(d));
  }

  // Global Logic: AND between sections
  return seriesMatch && artistsMatch && typesMatch && charactersMatch && discographiesMatch;
};

export const isValidSongFilter = (filter?: SongFilterType | null): filter is SongFilterType => {
  if (!filter) return false;
  const { artists, types, series, discographies } = filter;
  if (
    !Array.isArray(artists) ||
    !Array.isArray(types) ||
    !Array.isArray(series) ||
    (discographies && !Array.isArray(discographies))
  )
    return false;
  return true;
};
