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
  return school[item.school] || series[item.series] || item.units.some((u) => units[u.id]);
};
