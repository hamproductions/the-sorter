/**
 * Setlist Prediction Builder Page
 * Main page for creating and editing predictions
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Stack, Box, HStack } from 'styled-system/jsx';
import { Text } from '~/components/ui/styled/text';
import { Button } from '~/components/ui/styled/button';
import { Metadata } from '~/components/layout/Metadata';
import { usePerformance } from '~/hooks/setlist-prediction/usePerformanceData';
import { usePredictionStorage } from '~/hooks/setlist-prediction/usePredictionStorage';
import { PredictionBuilder } from '~/components/setlist-prediction/builder/PredictionBuilder';
import type { SetlistPrediction } from '~/types/setlist-prediction';

export function Page() {
  const { t } = useTranslation();

  // Get performance ID from URL query params
  const searchParams = new URLSearchParams(
    typeof window !== 'undefined' ? window.location.search : ''
  );
  const performanceId = searchParams.get('performance');

  const performance = usePerformance(performanceId || '');
  const { savePrediction } = usePredictionStorage();

  // Auto-load the most recent prediction for this performance directly from localStorage
  const [initialPrediction] = useState<SetlistPrediction | undefined>(() => {
    if (!performanceId || typeof window === 'undefined') return undefined;

    try {
      const stored = localStorage.getItem('setlist-predictions-v1');
      if (!stored) return undefined;

      const allPredictions = JSON.parse(stored) as Record<string, SetlistPrediction>;
      const forPerformance = Object.values(allPredictions).filter(
        (p) => p.performanceId === performanceId
      );

      if (forPerformance.length > 0) {
        return forPerformance.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )[0];
      }
    } catch (e) {
      console.error('Failed to load prediction:', e);
    }

    return undefined;
  });

  if (!performanceId) {
    return (
      <>
        <Metadata title="Setlist Prediction Builder" helmet />
        <Stack alignItems="center" w="full" p={8}>
          <Box borderRadius="lg" borderWidth="1px" p={8} textAlign="center" bgColor="bg.muted">
            <Text mb={2} fontSize="lg" fontWeight="bold">
              {t('setlistPrediction.noPerformanceSelected', {
                defaultValue: 'No performance selected'
              })}
            </Text>
            <Text mb={4} color="fg.muted" fontSize="sm">
              {t('setlistPrediction.selectPerformanceHint', {
                defaultValue: 'Please select a performance to create a prediction for'
              })}
            </Text>
            <Button onClick={() => (window.location.href = '/setlist-prediction')}>
              {t('setlistPrediction.backToList', {
                defaultValue: 'Back to Performance List'
              })}
            </Button>
          </Box>
        </Stack>
      </>
    );
  }

  if (!performance) {
    return (
      <>
        <Metadata title="Setlist Prediction Builder" helmet />
        <Stack alignItems="center" w="full" p={8}>
          <Text>{t('common.loading', { defaultValue: 'Loading...' })}</Text>
        </Stack>
      </>
    );
  }

  return (
    <>
      <Metadata
        title={`${t('setlistPrediction.builder', { defaultValue: 'Builder' })} - ${performance.name}`}
        helmet
      />

      <Stack w="full" h="100vh" overflow="hidden">
        {/* Header */}
        <Box
          zIndex={10}
          position="sticky"
          top={0}
          borderBottomWidth="1px"
          p={4}
          bgColor="bg.default"
        >
          <HStack justifyContent="space-between" alignItems="center">
            <Stack gap={1}>
              <Text fontSize="lg" fontWeight="bold">
                {performance.name}
              </Text>
              <Text color="fg.muted" fontSize="sm">
                {new Date(performance.date).toLocaleDateString()} • {performance.venue || 'TBA'}
              </Text>
            </Stack>

            <Button
              size="sm"
              variant="subtle"
              onClick={() => (window.location.href = '/setlist-prediction')}
            >
              {t('common.back', { defaultValue: 'Back' })}
            </Button>
          </HStack>
        </Box>

        {/* Builder Component */}
        <Box flex={1} overflow="hidden">
          <PredictionBuilder
            performanceId={performanceId}
            initialPrediction={initialPrediction ?? undefined}
            performance={performance}
            onSave={savePrediction}
          />
        </Box>
      </Stack>
    </>
  );
}
