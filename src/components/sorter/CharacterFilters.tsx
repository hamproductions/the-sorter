import { Stack, Wrap, HStack } from 'styled-system/jsx';
import { useData } from '~/hooks/useData';
import uniqBy from 'lodash/uniqBy';
import { Text } from '../ui/text';
import { Checkbox } from '../ui/checkbox';
import { useEffect, useMemo } from 'react';
import { Button } from '../ui/button';

export interface FilterType {
  series: Record<string, boolean | undefined>;
  school: Record<string, boolean | undefined>;
  units: Record<string, boolean | undefined>;
}

export const CharacterFilters = ({
  filters,
  setFilters
}: {
  filters: FilterType;
  setFilters: (data: FilterType | ((prev: FilterType) => FilterType)) => void;
}) => {
  const data = useData();
  const series = useMemo(() => Array.from(new Set(data.map((d) => d.series))), []);
  const school = useMemo(() => Array.from(new Set(data.map((d) => d.school))), []);
  const units = useMemo(() => {
    const names = Array.from(new Set(data.map((d) => d.fullName)));
    return uniqBy(
      data.flatMap((d) => d.units),
      (u) => u.id
    ).filter((u) => names.every((n) => !u.name.includes(n)));
  }, []);

  const selectAll = (key: keyof FilterType) => () => {
    setFilters((f) => {
      const isAllSelected = Object.values(f[key]).every((v) => v);
      return {
        ...f,
        [key]: Object.fromEntries(
          Object.entries(f[key]).map(([k]) => [k, !isAllSelected])
        ) as Record<string, boolean>
      };
    });
  };

  useEffect(() => {
    setFilters((f) => ({
      ...f,
      series: Object.fromEntries(series.map((s) => [s, undefined])) as Record<string, boolean>
    }));
  }, [series]);

  useEffect(() => {
    setFilters((f) => ({
      ...f,
      school: Object.fromEntries(school.map((s) => [s, undefined])) as Record<string, boolean>
    }));
  }, [school]);

  useEffect(() => {
    setFilters((f) => ({
      ...f,
      units: Object.fromEntries(units.map((s) => [s.id, undefined])) as Record<string, boolean>
    }));
  }, [units]);

  return (
    <Stack>
      <Stack>
        <HStack justifyContent="space-between">
          <Text fontWeight="bold">シリーズ</Text>
          <Button onClick={selectAll('series')}>Select All</Button>
        </HStack>
        <Wrap>
          {series.map((s) => {
            return (
              <Checkbox size="sm" key={s} checked={filters.series[s]}>
                {s}
              </Checkbox>
            );
          })}
        </Wrap>
      </Stack>
      <Stack>
        <HStack justifyContent="space-between">
          <Text fontWeight="bold">学校</Text>
          <Button onClick={selectAll('school')}>Select All</Button>
        </HStack>
        <Wrap>
          {school.map((s) => {
            return (
              <Checkbox size="sm" key={s} checked={filters.school[s]}>
                {s}
              </Checkbox>
            );
          })}
        </Wrap>
      </Stack>
      <Stack>
        <HStack justifyContent="space-between">
          <Text fontWeight="bold">ユニット</Text>
          <Button onClick={selectAll('units')}>Select All</Button>
        </HStack>
        <Wrap>
          {units.map((s) => {
            return (
              <Checkbox size="sm" key={s.id} checked={filters.units[s.id]}>
                {s.name}
              </Checkbox>
            );
          })}
        </Wrap>
      </Stack>
    </Stack>
  );
};
