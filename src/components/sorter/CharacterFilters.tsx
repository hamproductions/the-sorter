import type { Dispatch, SetStateAction } from 'react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Group } from '../ui/styled/checkbox';
import { Checkbox } from '../ui/checkbox';
import { Text } from '../ui/text';

import school from '../../../data/school.json';
import series from '../../../data/series.json';
import units from '../../../data/units.json';

import { HStack, Stack, Wrap } from 'styled-system/jsx';
import { getSchoolName, getSeriesName, getUnitName } from '~/utils/names';

export interface FilterType {
  series?: string[];
  school?: string[];
  units?: string[];
}

const DATA = {
  series: Object.keys(series),
  school: Object.keys(school),
  units
} as const;

export function CharacterFilters({
  filters,
  setFilters
}: {
  filters: FilterType | null | undefined;
  setFilters: Dispatch<SetStateAction<FilterType | null | undefined>>;
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const selectAll = (key: keyof FilterType) => () => {
    setFilters((f) => {
      const isAllSelected = f?.[key]?.length === DATA[key].length;
      const res = isAllSelected ? [] : key === 'units' ? DATA[key].map((k) => k.id) : DATA[key];
      return {
        ...f,
        [key]: res
      } as FilterType;
    });
  };

  const deselectAll = () => {
    setFilters(() => {
      return {
        series: [],
        units: [],
        school: []
      };
    });
  };

  const initFilters = () => {
    const params = new URLSearchParams(location.search);
    const urlSeries = params.getAll('series');
    const urlSchool = params.getAll('school');
    const urlUnits = params.getAll('units');

    setFilters({
      series: urlSeries.filter((s) => DATA.series.includes(s)),
      school: urlSchool.filter((s) => DATA.school.includes(s)),
      units: urlUnits.filter((unitId) => units?.some((s) => s.id === unitId))
    });
  };

  useEffect(() => {
    if (filters === undefined) {
      initFilters();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    series: selectedSeries = [],
    school: selectedSchools = [],
    units: selectedUnits = []
  } = filters ?? {};

  return (
    <Stack border="1px solid" borderColor="border.default" rounded="l1" p="4">
      <Stack>
        <HStack justifyContent="space-between">
          <Text fontWeight="bold">{t('settings.school')}</Text>
          <Button size="sm" onClick={selectAll('school')}>
            {t('settings.select_all')}
          </Button>
        </HStack>
        <Group
          asChild
          defaultValue={[]}
          value={selectedSchools}
          onValueChange={(school) => {
            if (!filters) return;
            setFilters({ ...filters, school });
          }}
        >
          <Wrap>
            {DATA.school.map((s) => {
              return (
                <Checkbox size="sm" key={s} value={s}>
                  {getSchoolName(s, lang)}
                </Checkbox>
              );
            })}
          </Wrap>
        </Group>
      </Stack>
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
          value={selectedSeries}
          onValueChange={(series) => {
            if (!filters) return;
            setFilters({ ...filters, series });
          }}
        >
          <Wrap>
            {DATA.series.map((s) => {
              return (
                <Checkbox size="sm" key={s} value={s}>
                  {getSeriesName(s, lang)}
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
          value={selectedUnits}
          onValueChange={(units) => {
            if (!filters) return;
            setFilters({ ...filters, units });
          }}
        >
          <Wrap>
            {units.map((s) => {
              return (
                <Checkbox size="sm" key={s.id} value={s.id}>
                  {getUnitName(s.name, lang)}
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
