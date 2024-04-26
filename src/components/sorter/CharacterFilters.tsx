import uniqBy from 'lodash/uniqBy';
import { Dispatch, SetStateAction, useEffect, useMemo } from 'react';
import { HStack, Stack, Wrap } from 'styled-system/jsx';
import { useData } from '~/hooks/useData';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Text } from '../ui/text';
import * as Collapsible from '../ui/collapsible';

export interface FilterType {
  series: Record<string, boolean | undefined>;
  school: Record<string, boolean | undefined>;
  units: Record<string, boolean | undefined>;
}

export const CharacterFilters = ({
  filters,
  setFilters
}: {
  filters: FilterType | null;
  setFilters: Dispatch<SetStateAction<FilterType>>;
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

  const deselectAll = () => {
    setFilters((f) => {
      return {
        series: Object.fromEntries(Object.entries(f.series).map(([k]) => [k, false])) as Record<
          string,
          boolean
        >,
        units: Object.fromEntries(Object.entries(f.units).map(([k]) => [k, false])) as Record<
          string,
          boolean
        >,
        school: Object.fromEntries(Object.entries(f.school).map(([k]) => [k, false])) as Record<
          string,
          boolean
        >
      };
    });
  };

  useEffect(() => {
    if (!filters) return;
    const filtersInitiialized = Object.values(filters).some((a) => Object.values(a).length >= 0);

    if (!filtersInitiialized) {
      setFilters((f) => ({
        series: Object.fromEntries(series.map((s) => [s, false])) as Record<string, boolean>,
        school: Object.fromEntries(school.map((s) => [s, false])) as Record<string, boolean>,
        units: Object.fromEntries(units.map((s) => [s.id, false])) as Record<string, boolean>
      }));
    }
  }, [filters]);

  return (
    <Collapsible.Root>
      <Collapsible.Trigger asChild>
        <Button variant="subtle" w="full">
          View Filters
        </Button>
      </Collapsible.Trigger>
      <Collapsible.Content>
        <Stack>
          <Stack>
            <HStack justifyContent="space-between">
              <Text fontWeight="bold">シリーズ</Text>
              <Button size="sm" onClick={selectAll('series')}>
                Select All
              </Button>
            </HStack>
            <Wrap>
              {series.map((s) => {
                return (
                  <Checkbox
                    size="sm"
                    key={s}
                    checked={filters?.series[s]}
                    onCheckedChange={(c) => {
                      setFilters((f) => ({
                        ...f,
                        series: {
                          ...f.series,
                          [s]: c.checked === true
                        }
                      }));
                    }}
                  >
                    {s}
                  </Checkbox>
                );
              })}
            </Wrap>
          </Stack>
          <Stack>
            <HStack justifyContent="space-between">
              <Text fontWeight="bold">学校</Text>
              <Button size="sm" onClick={selectAll('school')}>
                Select All
              </Button>
            </HStack>
            <Wrap>
              {school.map((s) => {
                return (
                  <Checkbox
                    size="sm"
                    key={s}
                    checked={filters?.school[s]}
                    onCheckedChange={(c) => {
                      setFilters((f) => ({
                        ...f,
                        school: {
                          ...f.school,
                          [s]: c.checked === true
                        }
                      }));
                    }}
                  >
                    {s}
                  </Checkbox>
                );
              })}
            </Wrap>
          </Stack>
          <Stack>
            <HStack justifyContent="space-between">
              <Text fontWeight="bold">ユニット</Text>
              <Button size="sm" onClick={selectAll('units')}>
                Select All
              </Button>
            </HStack>
            <Wrap>
              {units.map((s) => {
                return (
                  <Checkbox
                    size="sm"
                    key={s.id}
                    checked={filters?.units[s.id]}
                    onCheckedChange={(c) => {
                      setFilters((f) => ({
                        ...f,
                        units: {
                          ...f.units,
                          [s.id]: c.checked === true
                        }
                      }));
                    }}
                  >
                    {s.name}
                  </Checkbox>
                );
              })}
            </Wrap>
          </Stack>
          <HStack justifyContent="center">
            <Button onClick={deselectAll}>Deselect All</Button>
          </HStack>
        </Stack>
      </Collapsible.Content>
    </Collapsible.Root>
  );
};
