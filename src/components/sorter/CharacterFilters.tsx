import { Dispatch, SetStateAction, useEffect } from 'react';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import * as Collapsible from '../ui/collapsible';
import { Text } from '../ui/text';

import school from '../../../data/school.json';
import series from '../../../data/series.json';
import units from '../../../data/units.json';

import { HStack, Stack, Wrap } from 'styled-system/jsx';

export interface FilterType {
  series: Record<string, boolean | undefined>;
  school: Record<string, boolean | undefined>;
  units: Record<string, boolean | undefined>;
}

export function CharacterFilters({
  filters,
  isDisabled,
  setFilters,
  isOpen,
  setOpen
}: {
  isOpen?: boolean;
  isDisabled?: boolean;
  setOpen?: (isOpen: boolean) => void;
  filters: FilterType | null | undefined;
  setFilters: Dispatch<SetStateAction<FilterType | null | undefined>>;
}) {
  const selectAll = (key: keyof FilterType) => () => {
    setFilters((f) => {
      const isAllSelected = Object.values(f?.[key] ?? {}).every((v) => v);
      return {
        ...f,
        [key]: Object.fromEntries(
          Object.entries(f?.[key] ?? {}).map(([k]) => [k, !isAllSelected])
        ) as Record<string, boolean>
      } as FilterType;
    });
  };

  const deselectAll = () => {
    setFilters((f) => {
      return {
        series: Object.fromEntries(
          Object.entries(f?.series ?? {}).map(([k]) => [k, false])
        ) as Record<string, boolean>,
        units: Object.fromEntries(
          Object.entries(f?.units ?? {}).map(([k]) => [k, false])
        ) as Record<string, boolean>,
        school: Object.fromEntries(
          Object.entries(f?.school ?? {}).map(([k]) => [k, false])
        ) as Record<string, boolean>
      };
    });
  };

  const initFilters = () => {
    const params = new URLSearchParams(location.search);
    const urlSeries = params.getAll('series');
    const urlSchool = params.getAll('school');
    const urlUnits = params.getAll('units');

    // const newUrl = `${location.protocol}//${location.host}`;
    // window.history.pushState({ path: newUrl }, '', newUrl);

    setFilters({
      series: Object.fromEntries(
        series.map((s) => [s, urlSeries.includes(s) || (filters?.series[s] ?? false)])
      ) as Record<string, boolean>,
      school: Object.fromEntries(
        school.map((s) => [s, urlSchool.includes(s) || (filters?.school[s] ?? false)])
      ) as Record<string, boolean>,
      units: Object.fromEntries(
        units.map((s) => [s.id, urlUnits.includes(s.id) || (filters?.units[s.id] ?? false)])
      ) as Record<string, boolean>
    });
  };

  useEffect(() => {
    if (filters === undefined) {
      initFilters();
    }
  }, [filters]);

  return (
    <Collapsible.Root
      open={!isDisabled && isOpen}
      onOpenChange={({ open }) => setOpen?.(open)}
      lazyMount
      unmountOnExit
      gap="2"
    >
      <Collapsible.Trigger asChild>
        <Button variant="subtle" disabled={isDisabled} mx="auto">
          Edit Settings
        </Button>
      </Collapsible.Trigger>
      <Collapsible.Content>
        <Stack border="1px solid" borderColor="border.default" rounded="l1" p="4">
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
                      setFilters((f) =>
                        f
                          ? {
                              ...f,
                              series: {
                                ...f.series,
                                [s]: c.checked === true
                              }
                            }
                          : null
                      );
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
                      setFilters((f) => {
                        if (!f) return f;
                        return {
                          ...f,
                          school: {
                            ...f.school,
                            [s]: c.checked === true
                          }
                        };
                      });
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
                      setFilters((f) =>
                        f
                          ? {
                              ...f,
                              units: {
                                ...f.units,
                                [s.id]: c.checked === true
                              }
                            }
                          : f
                      );
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
}
