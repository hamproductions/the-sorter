import { useEffect, type Dispatch, type SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/styled/button';
import { Checkbox, CheckboxGroup } from '../ui/styled/checkbox';
import { Text } from '../ui/styled/text';

import songs from '../../../data/hasu-songs.json';

import { HStack, Stack, Wrap } from 'styled-system/jsx';
import { isValidSongFilter } from '~/utils/song-filter';

export interface SongFilterType {
  generations?: string[];
  units?: string[];
  types?: ('original' | 'covers')[];
}

const DATA = {
  generations: ['103', '104'],
  units: Array.from(new Set(songs.data.map((s) => s.unit))),
  types: ['original', 'covers']
} as const;

export function SongFilters({
  filters,
  setFilters
}: {
  filters: SongFilterType | null | undefined;
  setFilters: Dispatch<SetStateAction<SongFilterType | null | undefined>>;
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const selectAll = (key: keyof SongFilterType) => () => {
    setFilters((f) => {
      const isAllSelected = f?.[key]?.length === DATA[key].length;
      const res = isAllSelected ? [] : DATA[key];
      return {
        ...f,
        [key]: res
      } as SongFilterType;
    });
  };

  const deselectAll = () => {
    setFilters(() => {
      return {
        generations: [],
        units: [],
        types: []
      };
    });
  };

  const initFilters = () => {
    setFilters({
      generations: [],
      units: [],
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
          <Text fontWeight="bold">{t('settings.generations')}</Text>
          <Button size="sm" onClick={selectAll('generations')}>
            {t('settings.select_all')}
          </Button>
        </HStack>
        <CheckboxGroup
          asChild
          defaultValue={[]}
          value={filters?.generations}
          onValueChange={(generations) => {
            if (!filters) return;
            setFilters({ ...filters, generations });
          }}
        >
          <Wrap>
            {DATA.generations.map((s) => {
              return (
                <Checkbox size="sm" key={s} value={s}>
                  {t(s)}
                </Checkbox>
              );
            })}
          </Wrap>
        </CheckboxGroup>
      </Stack>
      <Stack>
        <HStack justifyContent="space-between">
          <Text fontWeight="bold">{t('settings.types')}</Text>
          <Button size="sm" onClick={selectAll('types')}>
            {t('settings.select_all')}
          </Button>
        </HStack>
        <CheckboxGroup
          asChild
          defaultValue={[]}
          value={filters?.types}
          onValueChange={(types) => {
            if (!filters) return;
            setFilters({ ...filters, types: types as ('original' | 'covers')[] });
          }}
        >
          <Wrap>
            {DATA.types.map((s) => {
              return (
                <Checkbox size="sm" key={s} value={s}>
                  {t(s)}
                </Checkbox>
              );
            })}
          </Wrap>
        </CheckboxGroup>
      </Stack>
      <Stack>
        <HStack justifyContent="space-between">
          <Text fontWeight="bold">{t('settings.units')}</Text>
          <Button size="sm" onClick={selectAll('units')}>
            {t('settings.select_all')}
          </Button>
        </HStack>
        <CheckboxGroup
          asChild
          defaultValue={[]}
          value={filters?.units}
          onValueChange={(units) => {
            if (!filters) return;
            setFilters({ ...filters, units });
          }}
        >
          <Wrap>
            {DATA.units.map((s) => {
              return (
                <Checkbox size="sm" key={s} value={s}>
                  {s}
                </Checkbox>
              );
            })}
          </Wrap>
        </CheckboxGroup>
      </Stack>
      <HStack justifyContent="center">
        <Button onClick={deselectAll}>{t('settings.deselect_all')}</Button>
      </HStack>
    </Stack>
  );
}
