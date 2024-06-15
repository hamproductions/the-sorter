import schools from '../../data/school.json';
import series from '../../data/series.json';
import units from '../../data/units.json';
import type { Character } from '~/types';
import type { FilterType } from '~/components/sorter/CharacterFilters';
import type { Locale } from '~/i18n';

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

export const getSchoolName = (school: string, locale: Locale | undefined) => {
  if (locale === 'en' && school in schools) return schools[school as keyof typeof schools];
  return school;
};
export const getSeriesName = (serie: string, locale: Locale | undefined) => {
  if (locale === 'en' && serie in series) return series[serie as keyof typeof series];
  return serie;
};
export const getUnitName = (unit: string, locale: Locale | undefined) => {
  const tmp = units.find((u) => u.name === unit);
  if (locale === 'en' && tmp?.englishName) return tmp.englishName;
  return unit;
};

export const getFilterTitle = (
  filters?: FilterType | null,
  characters?: Character[],
  locale?: Locale
) => {
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
    return getSeriesName(seriesName[0], locale);
  }
  if (schoolName?.length === 1) {
    return getSchoolName(schoolName[0], locale);
  }
  if (unitName?.length === 1 && unitName[0]) {
    return getUnitName(unitName[0], locale);
  }
  return;
};
