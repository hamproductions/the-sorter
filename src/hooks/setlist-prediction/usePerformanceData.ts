/**
 * Hook for loading and filtering performance data
 */

import { useMemo, useState } from 'react';
import performancesData from '../../../data/performances/performances.json';
import type { Performance, PerformanceFilters } from '~/types/setlist-prediction';

export function usePerformanceData() {
  const allPerformances = performancesData as Performance[];

  return {
    performances: allPerformances,
    loading: false,
    error: null
  };
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
        const matchesDescription = perf.description?.toLowerCase().includes(searchLower);

        if (!matchesName && !matchesVenue && !matchesDescription) {
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

export function usePerformance(performanceId: string) {
  const { performances } = usePerformanceData();

  const performance = useMemo(() => {
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
      const matchesDescription = perf.description?.toLowerCase().includes(searchLower);

      return matchesName || matchesVenue || matchesDescription;
    });
  }, [performances, debouncedQuery]);

  return {
    results,
    query: debouncedQuery
  };
}
