/**
 * Setlist Prediction - Performance List Page
 * Users browse and select performances to create predictions for
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { join } from 'path-browserify';
import { Stack, Box, HStack } from 'styled-system/jsx';
import { Text } from '~/components/ui/styled/text';
import { Button } from '~/components/ui/styled/button';
import { Input } from '~/components/ui/styled/input';
import { Checkbox } from '~/components/ui/checkbox';
import { Metadata } from '~/components/layout/Metadata';
import { useFilteredPerformances } from '~/hooks/setlist-prediction/usePerformanceData';
import type { PerformanceFilters, Performance } from '~/types/setlist-prediction';

type SortOption = 'date-asc' | 'date-desc' | 'name-asc' | 'name-desc' | 'upcoming-first';

export function Page() {
  const { t } = useTranslation();

  const [filters, setFilters] = useState<PerformanceFilters>({
    seriesIds: [],
    status: ['upcoming'],
    search: ''
  });

  const [sortBy, setSortBy] = useState<SortOption>('upcoming-first');
  const [hideCompleted, setHideCompleted] = useState(true);

  const {
    performances: rawPerformances,
    filteredCount,
    totalCount
  } = useFilteredPerformances(filters);

  // Sort performances
  const sortedPerformances = useMemo(() => {
    const sorted = [...rawPerformances];

    switch (sortBy) {
      case 'upcoming-first':
        sorted.sort((a, b) => {
          // Upcoming first, then by date ascending
          const aDate = new Date(a.date);
          const bDate = new Date(b.date);
          const now = new Date();

          const aIsUpcoming = aDate >= now;
          const bIsUpcoming = bDate >= now;

          if (aIsUpcoming && !bIsUpcoming) return -1;
          if (!aIsUpcoming && bIsUpcoming) return 1;

          return aDate.getTime() - bDate.getTime();
        });
        break;
      case 'date-asc':
        sorted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case 'date-desc':
        sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case 'name-asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }

    return sorted;
  }, [rawPerformances, sortBy]);

  // Extract tour name from performance name
  const getTourName = (perfName: string): string => {
    // Remove patterns like " - XXX公演 (Day.X)" or " (Day.X)"
    return perfName
      .replace(/\s*-\s*.*公演\s*\(.*?\)$/g, '') // Remove " - XXX公演 (Day.X)"
      .replace(/\s*\(Day\.\d+\)$/g, '') // Remove " (Day.X)"
      .replace(/\s*\(.*?\)$/g, '') // Remove any trailing (...)
      .replace(/\s*-\s*.*公演$/g, '') // Remove " - XXX公演"
      .trim();
  };

  // Group performances by tour/event
  const groupedByTour = useMemo(() => {
    const tourGroups: Record<string, Performance[]> = {};

    sortedPerformances.forEach((perf) => {
      const tourName = getTourName(perf.name);
      if (!tourGroups[tourName]) {
        tourGroups[tourName] = [];
      }
      tourGroups[tourName].push(perf);
    });

    return Object.entries(tourGroups).map(([tourName, performances]) => ({
      tourName,
      performances: performances.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      )
    }));
  }, [sortedPerformances]);

  const displayGroups = groupedByTour;

  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const handleHideCompletedChange = (checked: boolean) => {
    setHideCompleted(checked);
    setFilters((prev) => ({
      ...prev,
      status: checked ? ['upcoming'] : ['upcoming', 'completed']
    }));
  };

  const performances = sortedPerformances;

  return (
    <>
      <Metadata
        title={t('setlistPrediction.title', { defaultValue: 'Setlist Prediction' })}
        helmet
      />

      <Stack gap={4} alignItems="center" w="full" p={4}>
        {/* Header with My Predictions button */}
        <HStack justifyContent="space-between" alignItems="flex-start" w="full" maxW="4xl">
          <Stack flex={1} gap={1}>
            <Text fontSize="3xl" fontWeight="bold">
              {t('setlistPrediction.title', { defaultValue: 'Setlist Prediction' })}
            </Text>
            <Text color="fg.muted" fontSize="md">
              {t('setlistPrediction.description', {
                defaultValue:
                  'Fantasy football for Love Live! setlists - Predict performances and compete with friends!'
              })}
            </Text>
          </Stack>
          <Button
            onClick={() =>
              (window.location.href = join(import.meta.env.BASE_URL, '/setlist-prediction/builder'))
            }
            flexShrink={0}
          >
            {t('setlistPrediction.myPredictions', { defaultValue: 'My Predictions' })}
          </Button>
        </HStack>

        {/* Filters Section */}
        <Stack
          gap={3}
          borderRadius="lg"
          borderWidth="1px"
          w="full"
          maxW="4xl"
          p={4}
          bgColor="bg.muted"
        >
          {/* Search */}
          <Box>
            <Text mb={2} fontSize="sm" fontWeight="medium">
              {t('setlistPrediction.search', { defaultValue: 'Search' })}
            </Text>
            <Input
              value={filters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={t('setlistPrediction.searchPlaceholder', {
                defaultValue: 'Search performances, venues...'
              })}
            />
          </Box>

          {/* Filters & Options */}
          <HStack gap={3} flexWrap="wrap">
            {/* Hide Completed */}
            <Checkbox
              checked={hideCompleted}
              onCheckedChange={(details: { checked: boolean | 'indeterminate' }) =>
                handleHideCompletedChange(details.checked === true)
              }
            >
              {t('setlistPrediction.hideCompleted', { defaultValue: 'Hide ended events' })}
            </Checkbox>

            {/* Sort By */}
            <Box>
              <Text mb={1} fontSize="xs" fontWeight="medium">
                {t('setlistPrediction.sortBy', { defaultValue: 'Sort by' })}
              </Text>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  borderWidth: '1px',
                  fontSize: '14px'
                }}
              >
                <option value="upcoming-first">
                  {t('setlistPrediction.upcomingFirst', { defaultValue: 'Upcoming first' })}
                </option>
                <option value="date-asc">
                  {t('setlistPrediction.dateOldest', { defaultValue: 'Date (oldest)' })}
                </option>
                <option value="date-desc">
                  {t('setlistPrediction.dateNewest', { defaultValue: 'Date (newest)' })}
                </option>
                <option value="name-asc">
                  {t('setlistPrediction.nameAZ', { defaultValue: 'Name (A-Z)' })}
                </option>
                <option value="name-desc">
                  {t('setlistPrediction.nameZA', { defaultValue: 'Name (Z-A)' })}
                </option>
              </select>
            </Box>
          </HStack>
        </Stack>

        {/* Performance Count */}
        <Text fontSize="sm" fontWeight="medium">
          {t('setlistPrediction.performanceCount', {
            count: filteredCount,
            total: totalCount,
            defaultValue: `Showing ${filteredCount} of ${totalCount} performances`
          })}
        </Text>

        {/* Tour/Event List */}
        {performances.length === 0 ? (
          <Box
            borderRadius="lg"
            borderWidth="1px"
            w="full"
            maxW="4xl"
            p={8}
            textAlign="center"
            bgColor="bg.muted"
          >
            <Text mb={2} fontSize="lg" fontWeight="medium">
              {t('setlistPrediction.noPerformances', {
                defaultValue: 'No performances found'
              })}
            </Text>
            <Text color="fg.muted" fontSize="sm">
              {t('setlistPrediction.noPerformancesHint', {
                defaultValue: 'Performance data will be loaded from LLFans. Check back soon!'
              })}
            </Text>
          </Box>
        ) : (
          <Stack gap={4} w="full" maxW="4xl">
            {displayGroups.map((tour, tourIdx) => (
              <Box
                key={tourIdx}
                borderRadius="lg"
                borderWidth="2px"
                p={5}
                bgColor="bg.default"
                _hover={{ borderColor: 'border.emphasized' }}
              >
                <Stack gap={3}>
                  {/* Tour Name */}
                  <Text fontSize="xl" fontWeight="bold">
                    {tour.tourName}
                  </Text>

                  {/* Tour Tags */}
                  {tour.performances[0]?.tags && tour.performances[0].tags.length > 0 && (
                    <HStack gap={2} flexWrap="wrap">
                      {tour.performances[0].tags.map((tag, idx) => (
                        <Text
                          key={idx}
                          display="inline-block"
                          borderRadius="sm"
                          py={0.5}
                          px={2}
                          fontSize="xs"
                          bgColor="bg.emphasized"
                        >
                          {tag}
                        </Text>
                      ))}
                    </HStack>
                  )}

                  {/* Performances (Venues/Days) */}
                  <Stack gap={2} mt={2}>
                    <Text color="fg.muted" fontSize="sm" fontWeight="medium">
                      {t('setlistPrediction.selectPerformance', {
                        defaultValue: 'Select performance:'
                      })}
                    </Text>
                    {tour.performances.map((performance) => (
                      <Box
                        key={performance.id}
                        borderRadius="md"
                        borderWidth="1px"
                        p={3}
                        bgColor="bg.subtle"
                        cursor="pointer"
                        _hover={{ bgColor: 'bg.muted', borderColor: 'border.emphasized' }}
                      >
                        <a
                          href={join(
                            import.meta.env.BASE_URL,
                            `/setlist-prediction/builder?performance=${performance.id}`
                          )}
                        >
                          <HStack justifyContent="space-between" alignItems="center">
                            <Stack flex={1} gap={0.5}>
                              <Text fontSize="sm" fontWeight="medium">
                                {performance.nameJa && performance.nameJa !== 'null'
                                  ? performance.nameJa
                                  : performance.description || 'Performance'}
                              </Text>
                              <Text color="fg.muted" fontSize="xs">
                                {new Date(performance.date).toLocaleDateString()} •{' '}
                                {performance.venue || 'TBA'}
                              </Text>
                            </Stack>
                            <Button size="sm">
                              {t('setlistPrediction.createPrediction', {
                                defaultValue: 'Create Prediction'
                              })}
                            </Button>
                          </HStack>
                        </a>
                      </Box>
                    ))}
                  </Stack>
                </Stack>
              </Box>
            ))}
          </Stack>
        )}

        {/* Info Box */}
        <Box
          borderRadius="lg"
          borderWidth="1px"
          w="full"
          maxW="4xl"
          mt={4}
          p={4}
          bgColor="bg.emphasized"
        >
          <Text mb={2} fontSize="sm" fontWeight="bold">
            {t('setlistPrediction.howItWorks', { defaultValue: 'How it works' })}
          </Text>
          <Stack gap={1}>
            <Text fontSize="xs">
              1. {t('setlistPrediction.step1', { defaultValue: 'Select a performance' })}
            </Text>
            <Text fontSize="xs">
              2.{' '}
              {t('setlistPrediction.step2', {
                defaultValue: 'Drag songs to build your prediction'
              })}
            </Text>
            <Text fontSize="xs">
              3.{' '}
              {t('setlistPrediction.step3', {
                defaultValue: 'Share with friends via URL or image'
              })}
            </Text>
            <Text fontSize="xs">
              4.{' '}
              {t('setlistPrediction.step4', {
                defaultValue: 'Score your prediction after the show!'
              })}
            </Text>
          </Stack>
        </Box>
      </Stack>
    </>
  );
}
