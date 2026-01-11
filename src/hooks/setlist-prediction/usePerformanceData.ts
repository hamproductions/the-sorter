import { useEffect, useMemo, useState } from 'react';
import type {
  Performance,
  PerformanceFilters,
  PerformanceSetlist
} from '~/types/setlist-prediction';

// Global caches to prevent re-fetching/re-importing
let cachedMetadata: Performance[] | null = null;
let cachedSetlists: Record<string, PerformanceSetlist> | null = null;
// Shared in-flight promise so concurrent callers reuse the same import
let cachedMetadataPromise: Promise<Performance[]> | null = null;

/**
 * Loads performance metadata (300KB)
 */
async function loadPerformanceMetadata(): Promise<Performance[]> {
  if (cachedMetadata) return cachedMetadata;
  if (cachedMetadataPromise) return cachedMetadataPromise;

  cachedMetadataPromise = import('../../../data/performance-info.json').then((data) => {
    cachedMetadata = data.default as unknown as Performance[];
    return cachedMetadata;
  });

  return cachedMetadataPromise;
}

/**
 * Loads all setlists (1.3MB)
 */
async function loadAllSetlists(): Promise<Record<string, PerformanceSetlist>> {
  if (cachedSetlists) return cachedSetlists;
  const data = await import('../../../data/performance-setlists.json');
  cachedSetlists = data.default as unknown as Record<string, PerformanceSetlist>;
  return cachedSetlists;
}

/**
 * Hook to load performance metadata
 */
export function usePerformanceData() {
  const [performances, setPerformances] = useState<Performance[]>(cachedMetadata ?? []);
  const [loading, setLoading] = useState(!cachedMetadata);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // If another consumer already populated the module cache while this hook
    // was mounting, make sure local state reflects that and clear loading.
    if (cachedMetadata) {
      setPerformances(cachedMetadata);
      setLoading(false);
      return;
    }

    loadPerformanceMetadata()
      .then((data) => {
        setPerformances(data);
        return data;
      })
      .catch((err) => {
        console.error('Failed to load performance metadata:', err);
        cachedMetadataPromise = null; // Clear promise so future calls can retry
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => setLoading(false));
  }, []);

  return { performances, loading, error };
}

/**
 * Hook to load a specific performance's setlist lazily
 */
export function usePerformanceSetlist(performanceId: string | undefined) {
  const [setlist, setSetlist] = useState<PerformanceSetlist | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!performanceId) {
      setSetlist(null);
      return;
    }

    // If already in cache (globally)
    if (cachedSetlists?.[performanceId]) {
      setSetlist(cachedSetlists[performanceId]);
      return;
    }

    setLoading(true);
    setError(null);

    loadAllSetlists()
      .then((allSetlists) => {
        const found = allSetlists[performanceId];
        if (found) {
          setSetlist(found);
        } else {
          setError(new Error(`Setlist not found for performance ${performanceId}`));
        }
        return allSetlists;
      })
      .catch((err) => {
        console.error(`Failed to load setlist for ${performanceId}:`, err);
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => setLoading(false));
  }, [performanceId]);

  return { setlist, loading, error };
}

export function useFilteredPerformances(filters: PerformanceFilters) {
  const { performances } = usePerformanceData();

  const filtered = useMemo(() => {
    return performances.filter((perf) => {
      // Filter by series
      if (filters.seriesIds.length > 0) {
        const hasMatchingSeries = perf.seriesIds.some((id) => filters.seriesIds.includes(id));
        if (!hasMatchingSeries) return false;
      }

      // Filter by status
      if (filters.status.length > 0) {
        if (!filters.status.includes(perf.status)) return false;
      }

      // Filter by date range
      if (filters.dateRange) {
        const perfDate = new Date(perf.date);

        if (filters.dateRange.start) {
          const startDate = new Date(filters.dateRange.start);
          if (perfDate < startDate) return false;
        }

        if (filters.dateRange.end) {
          const endDate = new Date(filters.dateRange.end);
          if (perfDate > endDate) return false;
        }
      }

      // Filter by search
      if (filters.search && filters.search.trim() !== '') {
        const searchLower = filters.search.toLowerCase();
        const matchesName = perf.name.toLowerCase().includes(searchLower);
        const matchesVenue = perf.venue?.toLowerCase().includes(searchLower);

        if (!matchesName && !matchesVenue) {
          return false;
        }
      }

      return true;
    });
  }, [performances, filters]);

  return {
    performances: filtered,
    totalCount: performances.length,
    filteredCount: filtered.length
  };
}

export function usePerformance(performanceId: string | undefined) {
  const { performances } = usePerformanceData();

  const performance = useMemo(() => {
    if (!performanceId) return undefined;
    return performances.find((p) => p.id === performanceId);
  }, [performances, performanceId]);

  return performance;
}

export function usePerformanceSearch(query: string) {
  const { performances } = usePerformanceData();
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  // Debounce search query
  useMemo(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const results = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.trim() === '') {
      return performances;
    }

    const searchLower = debouncedQuery.toLowerCase();

    return performances.filter((perf) => {
      const matchesName = perf.name.toLowerCase().includes(searchLower);
      const matchesVenue = perf.venue?.toLowerCase().includes(searchLower);

      return matchesName || matchesVenue;
    });
  }, [performances, debouncedQuery]);

  return {
    results,
    query: debouncedQuery
  };
}
