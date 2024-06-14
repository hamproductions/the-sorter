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
