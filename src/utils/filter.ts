import { FilterType } from '~/components/sorter/CharacterFilters';
import { Character } from '~/types';

export const hasFilter = (filters: FilterType) => {
  return Object.values(filters).some(
    (a) => Object.values(a).length >= 0 && Object.values(a).some((a) => !!a)
  );
};

export const matchFilter = (item: Character, filter: FilterType) => {
  if (!filter) return true;
  const { school, series, units } = filter;
  if (!isValidFilter(filter)) return true;
  return (
    school?.includes(item.school) ||
    series?.includes(item.series) ||
    item.units?.some((u) => units?.includes(u.id))
  );
};

export const isValidFilter = (filter?: FilterType | null): filter is FilterType => {
  if (!filter) return false;
  const { school, series, units } = filter;
  if (!Array.isArray(school) || !Array.isArray(series) || !Array.isArray(units)) return false;
  return true;
};

export const getFilterTitle = (filters?: FilterType | null, characters?: Character[]) => {
  if (!isValidFilter(filters)) return;
  const seriesName = filters?.series ?? [];
  const schoolName = filters?.school ?? [];
  const unitName =
    filters?.units?.map(
      (e) =>
        characters?.find((d) => d.units.find((u) => u.id === e))?.units.find((u) => u.id === e)
          ?.name
    ) ?? [];

  if (seriesName?.length + schoolName?.length + unitName?.length > 1) return;
  if (seriesName?.length === 1) {
    return seriesName[0];
  }
  if (schoolName?.length === 1) {
    return schoolName[0];
  }
  if (unitName?.length === 1) {
    return unitName[0];
  }
  return;
};
