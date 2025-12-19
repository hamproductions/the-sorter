import { useEffect, type Dispatch, type SetStateAction, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Group } from '../ui/styled/checkbox';
import { Text } from '../ui/text';

import series from '../../../data/series-info.json';
import artists from '../../../data/artists-info.json';
import character from '../../../data/character-info.json';
import discographies from '../../../data/discography-info.json';

import { DualListSelector } from './DualListSelector';
import { Badge } from '~/components/ui/badge';
import { HStack, Stack, Wrap, Box } from 'styled-system/jsx';
import { isValidSongFilter } from '~/utils/song-filter';
import { getSeriesName } from '~/utils/names';

export type SongFilterType = {
  series: string[];
  artists: string[];
  types: ('group' | 'solo' | 'unit')[];
  characters: number[];
  discographies: number[];
};

const artistsWithoutCharacters = artists.filter(
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

const FILTER_VALUES = {
  series: series.map((s) => s.id),
  artists: artistsWithoutCharacters.map((v) => v.id),
  types: ['group', 'solo', 'unit'],
  characters: character.map((c) => c.id),
  discographies: discographies.map((d) => Number(d.id))
} satisfies Record<keyof SongFilterType, unknown>;

export function SongFilters({
  filters,
  setFilters
}: {
  filters: SongFilterType | null | undefined;
  setFilters: Dispatch<SetStateAction<SongFilterType | null | undefined>>;
}) {
  const { t, i18n: _i18n } = useTranslation();

  const selectAll = (key: keyof SongFilterType) => () => {
    setFilters((f) => {
      // If any items are selected, this action acts as "Clear"
      // If NO items are selected, it acts as "Select All"
      const hasSelection = f?.[key]?.length && f[key].length > 0;
      const res = hasSelection ? [] : FILTER_VALUES[key];
      return {
        ...f,
        [key]: res
      } as SongFilterType;
    });
  };

  const clearSection = (key: keyof SongFilterType) => () => {
    setFilters((f) => {
      return {
        ...f,
        [key]: []
      } as SongFilterType;
    });
  };

  const deselectAll = () => {
    setFilters(() => {
      return {
        series: [],
        artists: [],
        types: [],
        characters: [],
        discographies: []
      };
    });
  };

  const initFilters = useCallback(() => {
    const params = new URLSearchParams(location.search);
    const urlSeries = params.getAll('series');
    const urlArtists = params.getAll('artists');
    const urlTypes = params.getAll('types');
    const urlCharacters = params.getAll('characters');
    const urlDiscographies = params.getAll('discographies');

    if (
      urlSeries.length > 0 ||
      urlArtists.length > 0 ||
      urlTypes.length > 0 ||
      urlCharacters.length > 0 ||
      urlDiscographies.length > 0
    ) {
      setFilters({
        series: urlSeries.filter((s) => FILTER_VALUES.series.includes(s)),
        artists: urlArtists.filter((s) => FILTER_VALUES.artists.includes(s)),
        types: urlTypes.filter((s) =>
          FILTER_VALUES.types.includes(s as 'group' | 'solo' | 'unit')
        ) as ('group' | 'solo' | 'unit')[],
        characters: urlCharacters.map(Number).filter((c) => !isNaN(c)),
        discographies: urlDiscographies.map(Number).filter((d) => !isNaN(d))
      });
      return;
    }

    setFilters({
      series: [],
      artists: [],
      types: [],
      characters: [],
      discographies: []
    });
  }, [setFilters]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (
      params.has('series') ||
      params.has('artists') ||
      params.has('types') ||
      params.has('characters') ||
      params.has('discographies') ||
      filters === undefined ||
      !isValidSongFilter(filters)
    ) {
      initFilters();
    }
    
  // oxlint-disable-next-line exhaustive-deps
  }, [initFilters]);

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

  const artistItems = useMemo(
    () =>
      filteredArtists.map((a) => ({
        id: a.id,
        name: _i18n.language === 'en' ? a.englishName || a.name : a.name,
        category: seriesMap[String(a.seriesIds[0])]
      })),
    [filteredArtists, _i18n.language, seriesMap]
  );

  const characterItems = useMemo(
    () =>
      filteredCharacters.map((c) => ({
        id: Number(c.id),
        name: _i18n.language === 'en' ? c.englishName || c.fullName : c.fullName,
        category: seriesMap[c.seriesId]
      })),
    [filteredCharacters, _i18n.language, seriesMap]
  );

  const discographyItems = useMemo(
    () =>
      discographies.map((d) => ({
        id: Number(d.id),
        name: d.name,
        category: d.seriesIds.map((sid) => seriesMap[String(sid)]).join(', ')
      })),
    [seriesMap]
  );

  const categories = useMemo(() => series.map((s) => ({ id: s.name, label: s.name })), []);

  // Helper for Adaptive Header
  const renderHeader = (
    title: string,
    count: number,
    sectionKey: keyof SongFilterType,
    isModal = false
  ) => {
    const hasSelection = count > 0;

    // For Series/Types (isModal=false): Button is "Select All" (if empty) or "Clear" (if selected)
    // For Modals (isModal=true): Button is "Clear" (only if selected)

    let button = null;

    if (!isModal) {
      // Toggle logic for Series/Types
      button = (
        <Button size="sm" onClick={selectAll(sectionKey)}>
          {hasSelection ? t('settings.deselect_all') : t('settings.select_all')}
        </Button>
      );
    } else {
      // Clear button for Modals (Always render to reserve space, but hide if no selection)
      button = (
        <Button
          size="xs"
          variant="outline"
          onClick={clearSection(sectionKey)}
          disabled={!hasSelection}
          style={{ visibility: hasSelection ? 'visible' : 'hidden' }}
        >
          {t('settings.deselect_all')}
        </Button>
      );
    }

    return (
      <HStack justifyContent="space-between" alignItems="center" h="8">
        <Text fontWeight="bold">
          {title} {hasSelection && `(${count})`}
        </Text>
        {button}
      </HStack>
    );
  };

  const seriesCount = filters?.series?.length ?? 0;
  const artistsCount = filters?.artists?.length ?? 0;
  const charactersCount = filters?.characters?.length ?? 0;
  const typesCount = filters?.types?.length ?? 0;
  const discographiesCount = filters?.discographies?.length ?? 0;

  return (
    <Stack border="1px solid" borderColor="border.default" rounded="l1" p="4">
      {/* Series */}
      <Stack>
        {renderHeader(t('settings.series'), seriesCount, 'series', false)}
        <Group
          asChild
          defaultValue={[]}
          value={filters?.series ?? []}
          onValueChange={(series) => {
            if (!filters) return;
            setFilters({ ...filters, series });
          }}
        >
          <Wrap>
            {series.map((s) => {
              return (
                <Checkbox size="sm" key={s.id} value={String(s.id)}>
                  {getSeriesName(s.name, _i18n.language as any)}
                </Checkbox>
              );
            })}
            <Checkbox size="sm" value="cross">
              {t('settings.cross_series')}
            </Checkbox>
          </Wrap>
        </Group>
      </Stack>

      <Box height="1px" bg="border.subtle" />

      {/* Artists & Characters Modals */}
      <HStack gap="8" alignItems="flex-start" flexWrap="wrap">
        {/* Artists */}
        <Stack flex="1" gap="4" minW="300px">
          {renderHeader(t('settings.artists'), artistsCount, 'artists', true)}

          <DualListSelector
            title={t('settings.artists')}
            triggerLabel={t('settings.artists')}
            items={artistItems}
            selectedIds={filters?.artists ?? []}
            onSelectionChange={(ids) => {
              if (!filters) return;
              setFilters({ ...filters, artists: ids.map(String) });
            }}
            categories={categories}
          />

          {filters?.artists && filters.artists.length > 0 && (
            <HStack gap="2" pt="2" flexWrap="wrap">
              {filters.artists.map((artistId) => {
                const artist = artistItems.find((a) => String(a.id) === artistId);
                if (!artist) return null;
                return (
                  <Badge key={artistId} variant="subtle" size="sm">
                    {artist.name}
                  </Badge>
                );
              })}
            </HStack>
          )}
        </Stack>

        {/* Characters */}
        <Stack flex="1" gap="4" minW="300px">
          {renderHeader(t('settings.characters'), charactersCount, 'characters', true)}

          <DualListSelector
            title={t('settings.characters')}
            triggerLabel={t('settings.characters')}
            items={characterItems}
            selectedIds={filters?.characters ?? []}
            onSelectionChange={(ids) => {
              if (!filters) return;
              setFilters({ ...filters, characters: ids.map(Number) });
            }}
            categories={categories}
          />

          {filters?.characters && filters.characters.length > 0 && (
            <HStack gap="2" pt="2" flexWrap="wrap">
              {filters.characters.map((charId) => {
                const char = characterItems.find((c) => Number(c.id) === charId);
                if (!char) return null;
                return (
                  <Badge key={charId} variant="subtle" size="sm">
                    {char.name}
                  </Badge>
                );
              })}
            </HStack>
          )}
        </Stack>
      </HStack>

      <Box height="1px" bg="border.subtle" />

      {/* Types */}
      <Stack>
        {renderHeader(t('settings.types'), typesCount, 'types', false)}
        <Group
          asChild
          defaultValue={[]}
          value={filters?.types}
          onValueChange={(types) => {
            if (!filters) return;
            setFilters({ ...filters, types: types as ('group' | 'solo' | 'unit')[] });
          }}
        >
          <Wrap>
            {FILTER_VALUES.types.map((type) => (
              <Checkbox size="sm" key={type} value={type}>
                {t(`settings.type.${type}`)}
              </Checkbox>
            ))}
          </Wrap>
        </Group>
      </Stack>

      <Box height="1px" bg="border.subtle" />

      {/* Discographies */}
      <Stack>
        {renderHeader(t('settings.discographies'), discographiesCount, 'discographies', true)}
        <DualListSelector
          title={t('settings.discographies')}
          triggerLabel={t('settings.discographies')}
          items={discographyItems}
          selectedIds={filters?.discographies ?? []}
          onSelectionChange={(ids) => {
            if (!filters) return;
            setFilters({ ...filters, discographies: ids.map(Number) });
          }}
          categories={categories}
        />
        {filters?.discographies && filters.discographies.length > 0 && (
          <HStack gap="2" pt="2" flexWrap="wrap">
            {filters.discographies.map((discId) => {
              const disc = discographyItems.find((d) => Number(d.id) === discId);
              if (!disc) return null;
              return (
                <Badge key={discId} variant="subtle" size="sm">
                  {disc.name}
                </Badge>
              );
            })}
          </HStack>
        )}
      </Stack>

      <HStack justifyContent="center">
        <Button onClick={deselectAll}>{t('settings.deselect_all')}</Button>
      </HStack>
    </Stack>
  );
}
