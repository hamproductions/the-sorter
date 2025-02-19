import { useEffect, type Dispatch, type SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Group } from '../ui/styled/checkbox';
import { Text } from '../ui/text';

import songs from '../../../data/hasu-songs.json';

import { HStack, Stack, Wrap } from 'styled-system/jsx';
import { isValidSongFilter } from '~/utils/song-filter';

export interface HasuSongFilterType {
  generations?: string[];
  units?: string[];
  types?: ('original' | 'covers' | '104ver' | 'nver')[];
}

const DATA = {
  generations: ['103', '104'],
  units: Array.from(new Set(songs.data.map((s) => s.unit))),
  types: ['original', 'covers', '104ver', 'nver']
} as const;

export function HasuSongFilters({
  filters,
  setFilters
}: {
  filters: HasuSongFilterType | null | undefined;
  setFilters: Dispatch<SetStateAction<HasuSongFilterType | null | undefined>>;
}) {
  const { t, i18n: _i18n } = useTranslation();
  // const _lang = i18n.language;
  const selectAll = (key: keyof HasuSongFilterType) => () => {
    setFilters((f) => {
      const isAllSelected = f?.[key]?.length === DATA[key].length;
      const res = isAllSelected ? [] : DATA[key];
      return {
        ...f,
        [key]: res
      } as HasuSongFilterType;
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
        <Group
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
                  {t(`settings.generation.${s}`)}
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
            setFilters({ ...filters, types: types as ('original' | 'covers')[] });
          }}
        >
          <Wrap>
            {DATA.types.map((s) => {
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
          <Text fontWeight="bold">{t('settings.units')}</Text>
          <Button size="sm" onClick={selectAll('units')}>
            {t('settings.select_all')}
          </Button>
        </HStack>
        <Group
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
        </Group>
      </Stack>
      <HStack justifyContent="center">
        <Button onClick={deselectAll}>{t('settings.deselect_all')}</Button>
      </HStack>
    </Stack>
  );
}
