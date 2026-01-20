import { useEffect, type Dispatch, type SetStateAction, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Checkbox, Text } from '../ui';

import songs from '../../../data/hasu-songs.json';

import { HStack, Stack, Wrap } from 'styled-system/jsx';
import { isValidSongFilter } from '~/utils/hasu-song-filter';

export interface HasuSongFilterType {
  generations?: string[];
  units?: string[];
  types?: ('original' | 'covers' | '104ver' | '105ver' | 'nver')[];
}

const DATA = {
  generations: ['103', '104', '105'],
  units: Array.from(new Set(songs.data.map((s) => s.unit))),
  types: ['original', 'covers', '104ver', '105ver', 'nver']
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

  const initFilters = useCallback(() => {
    const params = new URLSearchParams(location.search);
    const urlGenerations = params.getAll('generations');
    const urlUnits = params.getAll('units');
    const urlTypes = params.getAll('types');

    if (urlGenerations.length > 0 || urlUnits.length > 0 || urlTypes.length > 0) {
      setFilters({
        generations: urlGenerations.filter((s) => DATA.generations.includes(s as '103' | '104')),
        units: urlUnits.filter((s) => DATA.units.includes(s)),
        types: urlTypes.filter((s) =>
          DATA.types.includes(s as 'original' | 'covers' | '104ver' | '105ver' | 'nver')
        ) as ('original' | 'covers' | '104ver' | '105ver' | 'nver')[]
      });
      return;
    }

    setFilters({
      generations: [],
      units: [],
      types: []
    });
  }, [setFilters]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (
      params.has('generations') ||
      params.has('units') ||
      params.has('types') ||
      filters === undefined ||
      !isValidSongFilter(filters)
    ) {
      initFilters();
    }
  }, [filters, initFilters]);

  return (
    <Stack border="1px solid" borderColor="border.default" rounded="l1" p="4">
      <Stack>
        <HStack justifyContent="space-between">
          <Text fontWeight="bold">{t('settings.generations')}</Text>
          <Button size="sm" onClick={selectAll('generations')}>
            {t('settings.select_all')}
          </Button>
        </HStack>
        <Checkbox.Group
          asChild
          defaultValue={[]}
          value={filters?.generations}
          onValueChange={(value: string[]) => {
            if (!filters) return;
            setFilters({ ...filters, generations: value });
          }}
        >
          <Wrap>
            {DATA.generations.map((s) => {
              return (
                <Checkbox.Root size="sm" key={s} value={s}>
                  <Checkbox.HiddenInput />
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <Checkbox.Label>{t(`settings.generation.${s}`)}</Checkbox.Label>
                </Checkbox.Root>
              );
            })}
          </Wrap>
        </Checkbox.Group>
      </Stack>
      <Stack>
        <HStack justifyContent="space-between">
          <Text fontWeight="bold">{t('settings.types')}</Text>
          <Button size="sm" onClick={selectAll('types')}>
            {t('settings.select_all')}
          </Button>
        </HStack>
        <Checkbox.Group
          asChild
          defaultValue={[]}
          value={filters?.types}
          onValueChange={(value: string[]) => {
            if (!filters) return;
            setFilters({ ...filters, types: value as ('original' | 'covers')[] });
          }}
        >
          <Wrap>
            {DATA.types.map((s) => {
              return (
                <Checkbox.Root size="sm" key={s} value={s}>
                  <Checkbox.HiddenInput />
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <Checkbox.Label>{t(`settings.type.${s}`)}</Checkbox.Label>
                </Checkbox.Root>
              );
            })}
          </Wrap>
        </Checkbox.Group>
      </Stack>
      <Stack>
        <HStack justifyContent="space-between">
          <Text fontWeight="bold">{t('settings.units')}</Text>
          <Button size="sm" onClick={selectAll('units')}>
            {t('settings.select_all')}
          </Button>
        </HStack>
        <Checkbox.Group
          asChild
          defaultValue={[]}
          value={filters?.units}
          onValueChange={(value: string[]) => {
            if (!filters) return;
            setFilters({ ...filters, units: value });
          }}
        >
          <Wrap>
            {DATA.units.map((s) => {
              return (
                <Checkbox.Root size="sm" key={s} value={s}>
                  <Checkbox.HiddenInput />
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <Checkbox.Label>{s}</Checkbox.Label>
                </Checkbox.Root>
              );
            })}
          </Wrap>
        </Checkbox.Group>
      </Stack>
      <HStack justifyContent="center">
        <Button onClick={deselectAll}>{t('settings.deselect_all')}</Button>
      </HStack>
    </Stack>
  );
}
