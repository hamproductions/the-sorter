import type { FilterType } from '~/components/sorter/CharacterFilters';
import type { HasuSongFilterType } from '~/components/sorter/HasuSongFilters';
import type { SongFilterType } from '~/components/sorter/SongFilters';

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

export const addHasuSongPresetParams = (params: URLSearchParams, filters: HasuSongFilterType) => {
  for (const key of ['generations', 'units', 'types'] as const) {
    const list = filters?.[key];
    if (list && list?.length > 0) {
      list.forEach((item) => params.append(key, item));
    }
  }
  return params;
};

export const addSongPresetParams = (params: URLSearchParams, filters: SongFilterType) => {
  for (const key of ['series', 'artists', 'types', 'characters', 'discographies'] as const) {
    const list = filters?.[key];
    if (list && list?.length > 0) {
      list.forEach((item) => params.append(key, String(item)));
    }
  }
  // Removed logic params appending as they are no longer part of SongFilterType

  return params;
};
