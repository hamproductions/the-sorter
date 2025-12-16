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
  const { artists, types, series } = filter;

  if (!isValidSongFilter(filter)) return true;
  let isValid = true;
  if (artists && artists.length > 0) {
    isValid = isValid && artists.some((a) => item.artists.some((art) => art.id === a));
  }
  const artistData = item.artists.map((i) => artistInfo.find((a) => a.id === i.id));
  if (types && types.length > 0) {
    isValid =
      isValid &&
      types.some((type) => {
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
      });
  }
  if (series && series.length > 0) {
    isValid = isValid && item.seriesIds.every((s) => series.includes(s + ''));
  }

  return isValid;
};

export const isValidSongFilter = (filter?: SongFilterType | null): filter is SongFilterType => {
  if (!filter) return false;
  const { artists, types, series } = filter;
  if (!Array.isArray(artists) || !Array.isArray(types) || !Array.isArray(series)) return false;
  return true;
};
