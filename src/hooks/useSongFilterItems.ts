import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import series from '../../data/series-info.json';
import character from '../../data/character-info.json';
import discographies from '../../data/discography-info.json';
import songs from '../../data/song-info.json';
import type { SongFilterType } from '~/components/sorter/SongFilters';
import { artistsWithoutCharacters } from '~/utils/song-filter-options';
import { getSongName } from '~/utils/names';
import { getSongAliases } from '~/utils/abbreviations';

export function useSongFilterItems(filters: SongFilterType | null | undefined) {
  const { i18n: _i18n } = useTranslation();

  const seriesMap = useMemo(
    () =>
      series.reduce(
        (acc, s) => {
          acc[s.id] = s.name;
          return acc;
        },
        {} as Record<string, string>
      ),
    []
  );

  // Dependent Filtering Logic
  const selectedSeriesIds = useMemo(() => filters?.series ?? [], [filters?.series]);

  const filteredArtists = useMemo(() => {
    if (selectedSeriesIds.length === 0) return artistsWithoutCharacters;
    return artistsWithoutCharacters.filter((a) =>
      a.seriesIds.some((sid) => selectedSeriesIds.includes(String(sid)))
    );
  }, [selectedSeriesIds]);

  const filteredCharacters = useMemo(() => {
    if (selectedSeriesIds.length === 0) return character;
    return character.filter((c) => selectedSeriesIds.includes(String(c.seriesId)));
  }, [selectedSeriesIds]);

  // Helper for series color mapping
  const seriesColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    series.forEach((s) => {
      map[String(s.id)] = s.color;
    });
    return map;
  }, []);

  const artistItems = useMemo(
    () =>
      filteredArtists.map((a) => ({
        id: a.id,
        name: _i18n.language === 'en' ? a.englishName || a.name : a.name,
        category: seriesMap[String(a.seriesIds[0])],
        color: seriesColorMap[String(a.seriesIds[0])],
        englishName: a.englishName
      })),
    [filteredArtists, _i18n.language, seriesMap, seriesColorMap]
  );

  const characterItems = useMemo(
    () =>
      filteredCharacters.map((c) => ({
        id: Number(c.id),
        name: _i18n.language === 'en' ? c.englishName || c.fullName : c.fullName,
        category: seriesMap[c.seriesId],
        color: c.colorCode ?? seriesColorMap[String(c.seriesId)]
      })),
    [filteredCharacters, _i18n.language, seriesMap, seriesColorMap]
  );

  const discographyItems = useMemo(
    () =>
      discographies.map((d) => ({
        id: Number(d.id),
        name: d.name,
        category: d.seriesIds.map((sid) => seriesMap[String(sid)]).join(', '),
        color: seriesColorMap[String(d.seriesIds[0])]
      })),
    [seriesMap, seriesColorMap]
  );

  const filteredSongs = useMemo(() => {
    if (selectedSeriesIds.length === 0) return songs;
    const selectedSongIds = filters?.songs ?? [];
    return songs.filter((s) => {
      const matchesSeries = s.seriesIds.some((sid) => selectedSeriesIds.includes(String(sid)));
      const isAlreadySelected = selectedSongIds.includes(Number(s.id));
      return matchesSeries || isAlreadySelected;
    });
  }, [selectedSeriesIds, filters?.songs]);

  const songItems = useMemo(
    () =>
      filteredSongs
        .map((s) => ({
          id: Number(s.id),
          name: getSongName(s.name, s.englishName, _i18n.language),
          category: s.seriesIds.map((sid) => seriesMap[String(sid)]).join(', '),
          color: seriesColorMap[String(s.seriesIds[0])],
          phoneticName: s.phoneticName,
          englishName: s.englishName,
          aliases: getSongAliases(s.id, s.englishName)
        }))
        .sort((a, b) => a.name.localeCompare(b.name, _i18n.language)),
    [filteredSongs, seriesMap, seriesColorMap, _i18n.language]
  );

  const categories = useMemo(
    () => series.map((s) => ({ id: s.name, label: s.name, color: s.color })),
    []
  );

  return {
    artistItems,
    characterItems,
    filteredCharacters,
    discographyItems,
    songItems,
    categories
  };
}
