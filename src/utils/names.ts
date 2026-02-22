import artists from '../../data/artists-info.json';
import schools from '../../data/school.json';
import series from '../../data/series.json';
import units from '../../data/units.json';
import type { Locale } from '~/i18n';

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
export const getArtistName = (artist: string, locale: Locale | undefined) => {
  const found = artists.find((a) => a.name === artist);
  if (locale === 'en' && found?.englishName) return found.englishName;
  return artist;
};

export const getSongName = (
  name: string,
  englishName: string | undefined,
  locale: Locale | undefined
): string => {
  if (locale === 'en' && englishName) return englishName;
  return name;
};

export function getFullPerformanceName(perf: {
  tourName: string;
  performanceName?: string;
}): string {
  if (!perf.performanceName) return perf.tourName;
  return `${perf.tourName} - ${perf.performanceName}`;
}
