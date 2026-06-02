import type { FilterType } from '~/components/sorter/CharacterFilters';
import type { HasuSongFilterType } from '~/components/sorter/HasuSongFilters';
import type { SongFilterType } from '~/components/sorter/SongFilters';
import type { PerformanceSortMeta } from '~/types/performance-sort';

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

export const getAllCommaSeparated = (params: URLSearchParams, key: string): string[] => {
  return params
    .getAll(key)
    .flatMap((v) => v.split(','))
    .filter((v) => v !== '');
};

export const addSongPresetParams = (params: URLSearchParams, filters: SongFilterType) => {
  for (const key of [
    'series',
    'artists',
    'types',
    'characters',
    'discographies',
    'songs',
    'years'
  ] as const) {
    const list = filters?.[key];
    if (list && list?.length > 0) {
      // Use comma separated values for shorter URLs
      params.append(key, list.join(','));
    }
  }

  return params;
};

export const addSongPerformanceParams = (
  params: URLSearchParams,
  performanceMeta: PerformanceSortMeta | null | undefined
) => {
  if (!performanceMeta) return params;

  if (performanceMeta.performanceIds?.length) {
    params.append('performanceIds', performanceMeta.performanceIds.join(','));
  } else if (performanceMeta.performanceId) {
    params.append('performanceIds', performanceMeta.performanceId);
  }

  return params;
};

export const getSongPerformanceParams = (params: URLSearchParams) => {
  const songIds = getAllCommaSeparated(params, 'performanceSongs');
  const performanceIds = getAllCommaSeparated(params, 'performanceIds');
  if (songIds.length === 0 && performanceIds.length === 0) return undefined;

  const label = params.get('performanceLabel') ?? 'Performances';
  const meta: PerformanceSortMeta = {
    performanceId: performanceIds.length === 1 ? performanceIds[0] : undefined,
    performanceIds: performanceIds.length > 0 ? performanceIds : undefined,
    tourName: label,
    performanceName: performanceIds.length === 1 ? label : undefined,
    selectionLabel: label,
    setlistOrder: []
  };

  return {
    songIds: songIds.length > 0 ? songIds : undefined,
    performanceIds,
    meta
  };
};
