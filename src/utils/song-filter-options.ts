import series from '../../data/series-info.json';
import artists from '../../data/artists-info.json';
import character from '../../data/character-info.json';
import discographies from '../../data/discography-info.json';
import songs from '../../data/song-info.json';
import type { SongFilterType } from '~/components/sorter/SongFilters';

export const artistsWithoutCharacters = artists.filter(
  (a) =>
    !a.seriesIds.includes(5) &&
    !a.seriesIds.includes(7) &&
    ![
      '早乙女リリエル、竜崎クロウエル、白鳥ラナエル、綾小路シェリエル、東條ネルエル',
      '恋塚フルーネティ',
      '神楽坂ミナモ',
      'アサギ',
      'ミザリィ',
      ...'早乙女リリエル、竜崎クロウエル、白鳥ラナエル、綾小路シェリエル、東條ネルエル'.split('、')
    ].includes(a.name) &&
    !character.some((c) => a.name.includes(c.fullName))
);

export const years = Array.from(
  new Set(
    songs
      .map((s) => s.releasedOn?.substring(0, 4))
      .filter((y): y is string => !!y)
      .map(Number)
  )
).sort((a, b) => b - a);

export const FILTER_VALUES = {
  series: series.map((s) => s.id),
  artists: artistsWithoutCharacters.map((v) => v.id),
  types: ['group', 'solo', 'unit'],
  characters: character.map((c) => c.id),
  discographies: discographies.map((d) => Number(d.id)),
  songs: songs.map((s) => Number(s.id)),
  years: years
} satisfies Record<keyof SongFilterType, unknown>;
