import type { FilterType } from '~/components/sorter/CharacterFilters';

export const serializeData = async (data: Record<string, unknown>) => {
  const compress = (await import('lz-string')).compressToEncodedURIComponent;
  return compress(JSON.stringify(data));
};

export const addPresetParams = (
  params: URLSearchParams,
  filters: FilterType,
  isSeiyuu: boolean
) => {
  for (const key of ['series', 'school', 'units'] as const) {
    const list = filters?.[key];
    if (list && list?.length > 0) {
      list.forEach((item) => params.append(key, item));
    }
  }
  if (isSeiyuu) {
    params.append('seiyuu', isSeiyuu.toString());
  }
  return params;
};
