/**
 * Setlist Prediction - Performance List Page
 * Users browse and select performances to create predictions for
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Stack, Box } from 'styled-system/jsx';
import { Text } from '~/components/ui/styled/text';
import { Button } from '~/components/ui/styled/button';
import { Metadata } from '~/components/layout/Metadata';
import { useFilteredPerformances } from '~/hooks/setlist-prediction/usePerformanceData';
import type { PerformanceFilters } from '~/types/setlist-prediction';

export function Page() {
  const { t } = useTranslation();

  const [filters] = useState<PerformanceFilters>({
    seriesIds: [],
    status: ['upcoming', 'completed'],
    search: ''
  });

  const { performances, filteredCount, totalCount } = useFilteredPerformances(filters);

  return (
    <>
      <Metadata
        title={t('setlistPrediction.title', { defaultValue: 'Setlist Prediction' })}
        helmet
      />

      <Stack alignItems="center" w="full" p={4} gap={4}>
        <Stack alignItems="center" gap={2}>
          <Text textAlign="center" fontSize="3xl" fontWeight="bold">
            {t('setlistPrediction.title', { defaultValue: 'Setlist Prediction' })}
          </Text>
          <Text textAlign="center" fontSize="md" color="fg.muted">
            {t('setlistPrediction.description', {
              defaultValue: 'Fantasy football for Love Live! setlists - Predict performances and compete with friends!'
            })}
          </Text>
        </Stack>

        {/* Filters Section - TODO */}
        <Box
          w="full"
          maxW="4xl"
          p={4}
          borderWidth="1px"
          borderRadius="lg"
          bgColor="bg.muted"
        >
          <Text fontSize="sm" color="fg.muted">
            {t('setlistPrediction.filtersPlaceholder', {
              defaultValue: 'Filters coming soon...'
            })}
          </Text>
        </Box>

        {/* Performance Count */}
        <Text fontSize="sm" fontWeight="medium">
          {t('setlistPrediction.performanceCount', {
            count: filteredCount,
            total: totalCount,
            defaultValue: `Showing ${filteredCount} of ${totalCount} performances`
          })}
        </Text>

        {/* Performance List */}
        {performances.length === 0 ? (
          <Box
            w="full"
            maxW="4xl"
            p={8}
            borderWidth="1px"
            borderRadius="lg"
            bgColor="bg.muted"
            textAlign="center"
          >
            <Text fontSize="lg" fontWeight="medium" mb={2}>
              {t('setlistPrediction.noPerformances', {
                defaultValue: 'No performances found'
              })}
            </Text>
            <Text fontSize="sm" color="fg.muted">
              {t('setlistPrediction.noPerformancesHint', {
                defaultValue:
                  'Performance data will be loaded from LLFans. Check back soon!'
              })}
            </Text>
          </Box>
        ) : (
          <Stack w="full" maxW="4xl" gap={3}>
            {performances.map((performance) => (
              <Box
                key={performance.id}
                p={4}
                borderWidth="1px"
                borderRadius="lg"
                bgColor="bg.default"
                _hover={{ bgColor: 'bg.muted' }}
                cursor="pointer"
              >
                <Stack gap={2}>
                  <Text fontSize="lg" fontWeight="bold">
                    {performance.name}
                  </Text>

                  <Text fontSize="sm" color="fg.muted">
                    {new Date(performance.date).toLocaleDateString()} •{' '}
                    {performance.venue || 'TBA'}
                  </Text>

                  {performance.description && (
                    <Text fontSize="sm">{performance.description}</Text>
                  )}

                  <Box>
                    <Button
                      size="sm"
                      onClick={() => {
                        // TODO: Navigate to builder
                        window.location.href = `/setlist-prediction/builder?performance=${performance.id}`;
                      }}
                    >
                      {t('setlistPrediction.createPrediction', {
                        defaultValue: 'Create Prediction'
                      })}
                    </Button>
                  </Box>
                </Stack>
              </Box>
            ))}
          </Stack>
        )}

        {/* Info Box */}
        <Box
          w="full"
          maxW="4xl"
          p={4}
          borderWidth="1px"
          borderRadius="lg"
          bgColor="bg.emphasized"
          mt={4}
        >
          <Text fontSize="sm" fontWeight="bold" mb={2}>
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
