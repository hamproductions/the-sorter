import { useEffect, type Dispatch, type SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Group } from '../ui/styled/checkbox';
import { Text } from '../ui/text';

import series from '../../../data/series-info.json';
import artists from '../../../data/artists-info.json';
import character from '../../../data/character-info.json';

import { HStack, Stack, Wrap } from 'styled-system/jsx';
import { isValidSongFilter } from '~/utils/song-filter';

export type SongFilterType = {
  series: string[];
  artists: string[];
  types: ('group' | 'solo' | 'unit')[];
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
  types: ['group', 'solo', 'unit']
} satisfies Record<keyof SongFilterType, unknown>;

export function SongFilters({
  filters,
  setFilters
}: {
  filters: SongFilterType | null | undefined;
  setFilters: Dispatch<SetStateAction<SongFilterType | null | undefined>>;
}) {
  const { t, i18n: _i18n } = useTranslation();
  // const _lang = i18n.language;
  const selectAll = (key: keyof SongFilterType) => () => {
    setFilters((f) => {
      const isAllSelected = f?.[key]?.length === FILTER_VALUES[key].length;
      const res = isAllSelected ? [] : FILTER_VALUES[key];
      return {
        ...f,
        [key]: res
      } as SongFilterType;
    });
  };

  const deselectAll = () => {
    setFilters(() => {
      return {
        series: [],
        artists: [],
        types: []
      };
    });
  };

  const initFilters = () => {
    setFilters({
      series: [],
      artists: [],
      types: []
    });
  };

  useEffect(() => {
    if (filters === undefined || !isValidSongFilter(filters)) {
      initFilters();
    }
  }, [filters]);

  return (
    <Stack border="1px solid" borderColor="border.default" rounded="l1" p="4">
      <Stack>
        <HStack justifyContent="space-between">
          <Text fontWeight="bold">{t('settings.series')}</Text>
          <Button size="sm" onClick={selectAll('series')}>
            {t('settings.select_all')}
          </Button>
        </HStack>
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
                <Checkbox size="sm" key={s.id} value={s.id}>
                  {s.name}
                </Checkbox>
              );
            })}
          </Wrap>
        </Group>
      </Stack>
      <Stack>
        <HStack justifyContent="space-between">
          <Text fontWeight="bold">{t('settings.types')}</Text>
          <Button size="sm" onClick={selectAll('types')}>
            {t('settings.select_all')}
          </Button>
        </HStack>
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
            {FILTER_VALUES.types.map((s) => {
              return (
                <Checkbox size="sm" key={s} value={s}>
                  {t(`settings.type.${s}`)}
                </Checkbox>
              );
            })}
          </Wrap>
        </Group>
      </Stack>
      <Stack>
        <HStack justifyContent="space-between">
          <Text fontWeight="bold">{t('settings.artists')}</Text>
          <Button size="sm" onClick={selectAll('artists')}>
            {t('settings.select_all')}
          </Button>
        </HStack>
        <Group
          asChild
          defaultValue={[]}
          value={filters?.artists}
          onValueChange={(artists) => {
            if (!filters) return;
            setFilters({ ...filters, artists });
          }}
        >
          <Wrap>
            {artistsWithoutCharacters.map((s) => {
              return (
                <Checkbox size="sm" key={s.id} value={s.id}>
                  {s.name}
                </Checkbox>
              );
            })}
          </Wrap>
        </Group>
      </Stack>
      <HStack justifyContent="center">
        <Button onClick={deselectAll}>{t('settings.deselect_all')}</Button>
      </HStack>
    </Stack>
  );
}
