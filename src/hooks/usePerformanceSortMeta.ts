import { useEffect, useState } from 'react';
import { useSongData } from './useSongData';
import type { PerformanceSortMeta } from '~/types/performance-sort';
import type { Performance, PerformanceSetlist } from '~/types/setlist-prediction';
import { buildPerformanceSortSelection } from '~/utils/performance-sort';

export function usePerformanceSortMeta(meta?: PerformanceSortMeta | null) {
  const songs = useSongData();
  const [resolved, setResolved] = useState<{
    source: PerformanceSortMeta;
    value: PerformanceSortMeta;
  }>();

  useEffect(() => {
    if (!meta || meta.contextVersion === 1) return;
    const ids = meta.performanceIds ?? (meta.performanceId ? [meta.performanceId] : []);
    if (!ids.length) return;
    let cancelled = false;
    void Promise.all([
      import('../../data/performance-info.json'),
      import('../../data/performance-setlists.json')
    ])
      .then(([performances, setlists]) => {
        const data = setlists.default as unknown as Record<string, PerformanceSetlist>;
        const selection = buildPerformanceSortSelection(
          ids,
          performances.default as unknown as Performance[],
          new Map(ids.flatMap((id) => (data[id] ? [[id, data[id]] as const] : []))),
          songs
        );
        if (!cancelled && selection) setResolved({ source: meta, value: selection.meta });
        return undefined;
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [meta, songs]);

  return resolved && resolved.source === meta ? resolved.value : (meta ?? undefined);
}
