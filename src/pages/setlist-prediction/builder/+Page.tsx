/**
 * Setlist Prediction Builder Page
 * Main page for creating and editing predictions
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Stack, Box, HStack } from 'styled-system/jsx';
import { Text } from '~/components/ui/styled/text';
import { Button } from '~/components/ui/styled/button';
import { Metadata } from '~/components/layout/Metadata';
import { usePerformance } from '~/hooks/setlist-prediction/usePerformanceData';
import { usePredictionBuilder } from '~/hooks/setlist-prediction/usePredictionBuilder';
import { usePredictionStorage } from '~/hooks/setlist-prediction/usePredictionStorage';
import { PredictionBuilder } from '~/components/setlist-prediction/builder/PredictionBuilder';
import { usePageContext } from 'vike-react/usePageContext';

export function Page() {
  const { t } = useTranslation();
  const pageContext = usePageContext();

  // Get performance ID from URL query params
  const searchParams = new URLSearchParams(
    typeof window !== 'undefined' ? window.location.search : ''
  );
  const performanceId = searchParams.get('performance');

  // Get prediction ID if editing
  const predictionId = searchParams.get('prediction');

  const performance = usePerformance(performanceId || '');
  const { savePrediction, getPrediction } = usePredictionStorage();

  // Load existing prediction if editing
  const [initialPrediction, setInitialPrediction] = useState(
    predictionId ? getPrediction(predictionId) : undefined
  );

  useEffect(() => {
    if (predictionId) {
      const pred = getPrediction(predictionId);
      setInitialPrediction(pred || undefined);
    }
  }, [predictionId, getPrediction]);

  if (!performanceId) {
    return (
      <>
        <Metadata title="Setlist Prediction Builder" helmet />
        <Stack alignItems="center" w="full" p={8}>
          <Box
            p={8}
            borderWidth="1px"
            borderRadius="lg"
            bgColor="bg.muted"
            textAlign="center"
          >
            <Text fontSize="lg" fontWeight="bold" mb={2}>
              {t('setlistPrediction.noPerformanceSelected', {
                defaultValue: 'No performance selected'
              })}
            </Text>
            <Text fontSize="sm" color="fg.muted" mb={4}>
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
          p={4}
          borderBottomWidth="1px"
          bgColor="bg.default"
          position="sticky"
          top={0}
          zIndex={10}
        >
          <HStack justifyContent="space-between" alignItems="center">
            <Stack gap={1}>
              <Text fontSize="lg" fontWeight="bold">
                {performance.name}
              </Text>
              <Text fontSize="sm" color="fg.muted">
                {new Date(performance.date).toLocaleDateString()} •{' '}
                {performance.venue || 'TBA'}
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
            initialPrediction={initialPrediction}
            performance={performance}
            onSave={savePrediction}
          />
        </Box>
      </Stack>
    </>
  );
}
