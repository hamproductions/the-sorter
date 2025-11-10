/**
 * Marking Mode Page
 * Compare prediction against actual setlist and calculate score
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Stack, Box, HStack, Grid } from 'styled-system/jsx';
import { Text } from '~/components/ui/styled/text';
import { Button } from '~/components/ui/styled/button';
import { Textarea } from '~/components/ui/styled/textarea';
import { Metadata } from '~/components/layout/Metadata';
import { usePageContext } from 'vike-react/usePageContext';
import { usePredictionStorage } from '~/hooks/setlist-prediction/usePredictionStorage';
import { usePerformance } from '~/hooks/setlist-prediction/usePerformanceData';
import { parseActualSetlist } from '~/utils/setlist-prediction/import';
import { calculateScore } from '~/utils/setlist-prediction/scoring';
import type { PerformanceSetlist } from '~/types/setlist-prediction';
import { generateSetlistId } from '~/utils/setlist-prediction/id';
import { isSongItem } from '~/types/setlist-prediction';

export function Page() {
  const { t } = useTranslation();
  const pageContext = usePageContext();
  const { getPrediction, savePrediction } = usePredictionStorage();

  const predictionId = (pageContext.routeParams as { predictionId: string }).predictionId;
  const prediction = getPrediction(predictionId);
  const performance = prediction ? usePerformance(prediction.performanceId) : null;

  const [actualSetlistText, setActualSetlistText] = useState('');
  const [actualSetlist, setActualSetlist] = useState<PerformanceSetlist | null>(null);
  const [isScored, setIsScored] = useState(false);

  const handleParseActual = () => {
    try {
      const parsed = parseActualSetlist(actualSetlistText);

      // Convert to PerformanceSetlist format
      const actualSetlistData: PerformanceSetlist = {
        id: generateSetlistId(prediction!.performanceId),
        performanceId: prediction!.performanceId,
        items: parsed.items.map((item, index) => ({
          id: `actual-${index}`,
          type: item.type as any,
          position: index,
          songId: item.songId,
          title: item.title,
          remarks: item.remarks
        })),
        sections: [],
        totalSongs: parsed.items.filter((i) => i.type === 'song').length,
        isActual: true
      };

      setActualSetlist(actualSetlistData);
    } catch (error) {
      alert(t('setlistPrediction.failedToParse', {
        defaultValue: 'Failed to parse setlist. Please check the format.'
      }));
    }
  };

  const handleCalculateScore = () => {
    if (!prediction || !actualSetlist) return;

    const score = calculateScore(prediction.setlist, actualSetlist);

    const updatedPrediction = {
      ...prediction,
      score: {
        ...score,
        predictionId: prediction.id
      }
    };

    savePrediction(updatedPrediction);
    setIsScored(true);
  };

  if (!prediction) {
    return (
      <>
        <Metadata title={t('setlistPrediction.markingMode', { defaultValue: 'Marking Mode' })} helmet />
        <Stack alignItems="center" w="full" p={8}>
          <Text>{t('setlistPrediction.predictionNotFound', { defaultValue: 'Prediction not found' })}</Text>
        </Stack>
      </>
    );
  }

  return (
    <>
      <Metadata
        title={`${t('setlistPrediction.markingMode', { defaultValue: 'Marking Mode' })} - ${prediction.name}`}
        helmet
      />

      <Stack w="full" p={4} gap={4} maxW="6xl" mx="auto">
        {/* Header */}
        <Box>
          <Text fontSize="2xl" fontWeight="bold" mb={2}>
            {t('setlistPrediction.markingMode', { defaultValue: 'Marking Mode' })}
          </Text>
          <Text fontSize="md" color="fg.muted">
            {prediction.name}
          </Text>
          {performance && (
            <Text fontSize="sm" color="fg.muted">
              {performance.name} • {new Date(performance.date).toLocaleDateString()}
            </Text>
          )}
        </Box>

        {/* Import Actual Setlist */}
        {!actualSetlist && (
          <Box p={4} borderWidth="1px" borderRadius="lg" bgColor="bg.default">
            <Stack gap={3}>
              <Text fontSize="lg" fontWeight="bold">
                {t('setlistPrediction.importActualSetlist', {
                  defaultValue: 'Import Actual Setlist'
                })}
              </Text>
              <Text fontSize="sm" color="fg.muted">
                {t('setlistPrediction.importActualHint', {
                  defaultValue: 'Paste the actual setlist (one song per line)'
                })}
              </Text>

              <Textarea
                value={actualSetlistText}
                onChange={(e) => setActualSetlistText(e.target.value)}
                placeholder={t('setlistPrediction.actualSetlistPlaceholder', {
                  defaultValue: '1. Song Name\n2. Song Name\n[MC①]\n3. Song Name...'
                })}
                rows={15}
              />

              <Button onClick={handleParseActual}>
                {t('setlistPrediction.parseSetlist', { defaultValue: 'Parse Setlist' })}
              </Button>
            </Stack>
          </Box>
        )}

        {/* Comparison View */}
        {actualSetlist && (
          <Grid gridTemplateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
            {/* Prediction */}
            <Box p={4} borderWidth="1px" borderRadius="lg" bgColor="bg.default">
              <Text fontSize="lg" fontWeight="bold" mb={3}>
                {t('setlistPrediction.yourPrediction', { defaultValue: 'Your Prediction' })}
              </Text>
              <Stack gap={1}>
                {prediction.setlist.items.map((item, index) => (
                  <HStack key={item.id} gap={2} p={2} borderRadius="sm" bgColor="bg.subtle">
                    <Text fontSize="sm" fontWeight="bold" color="fg.muted" minW="30px">
                      {index + 1}.
                    </Text>
                    <Text fontSize="sm">
                      {isSongItem(item) ? `♪ Song ${item.songId}` : `[${item.title}]`}
                    </Text>
                  </HStack>
                ))}
              </Stack>
            </Box>

            {/* Actual */}
            <Box p={4} borderWidth="1px" borderRadius="lg" bgColor="bg.default">
              <Text fontSize="lg" fontWeight="bold" mb={3}>
                {t('setlistPrediction.actualSetlist', { defaultValue: 'Actual Setlist' })}
              </Text>
              <Stack gap={1}>
                {actualSetlist.items.map((item, index) => (
                  <HStack key={item.id} gap={2} p={2} borderRadius="sm" bgColor="bg.subtle">
                    <Text fontSize="sm" fontWeight="bold" color="fg.muted" minW="30px">
                      {index + 1}.
                    </Text>
                    <Text fontSize="sm">
                      {isSongItem(item) ? `♪ Song ${item.songId || item.title}` : `[${item.title}]`}
                    </Text>
                  </HStack>
                ))}
              </Stack>
            </Box>
          </Grid>
        )}

        {/* Score Display */}
        {isScored && prediction.score && (
          <Box p={6} borderWidth="2px" borderRadius="lg" bgColor="bg.emphasized">
            <Stack gap={3} alignItems="center">
              <Text fontSize="2xl" fontWeight="bold">
                {t('setlistPrediction.yourScore', { defaultValue: 'Your Score' })}
              </Text>

              <Text fontSize="4xl" fontWeight="bold" color="green.600">
                {prediction.score.totalScore} / {prediction.score.maxPossibleScore}
              </Text>

              <Text fontSize="xl">
                {t('setlistPrediction.accuracy', { defaultValue: 'Accuracy' })}:{' '}
                {prediction.score.accuracy.toFixed(1)}%
              </Text>

              <Box w="full" p={4} borderRadius="md" bgColor="bg.default">
                <Text fontSize="md" fontWeight="bold" mb={2}>
                  {t('setlistPrediction.breakdown', { defaultValue: 'Breakdown' })}
                </Text>
                <Stack gap={1}>
                  <HStack justifyContent="space-between">
                    <Text fontSize="sm">
                      {t('setlistPrediction.exactMatches', { defaultValue: 'Exact Matches' })}
                    </Text>
                    <Text fontSize="sm" fontWeight="bold">
                      {prediction.score.breakdown.exactMatches} (+
                      {prediction.score.breakdown.exactMatchPoints})
                    </Text>
                  </HStack>
                  <HStack justifyContent="space-between">
                    <Text fontSize="sm">
                      {t('setlistPrediction.closeMatches', { defaultValue: 'Close Matches' })}
                    </Text>
                    <Text fontSize="sm" fontWeight="bold">
                      {prediction.score.breakdown.closeMatches} (+
                      {prediction.score.breakdown.closeMatchPoints})
                    </Text>
                  </HStack>
                  <HStack justifyContent="space-between">
                    <Text fontSize="sm">
                      {t('setlistPrediction.presentMatches', { defaultValue: 'Present Matches' })}
                    </Text>
                    <Text fontSize="sm" fontWeight="bold">
                      {prediction.score.breakdown.presentMatches} (+
                      {prediction.score.breakdown.presentMatchPoints})
                    </Text>
                  </HStack>
                </Stack>
              </Box>

              <Button
                onClick={() => {
                  window.location.href = `/setlist-prediction/builder?performance=${prediction.performanceId}&prediction=${prediction.id}`;
                }}
              >
                {t('setlistPrediction.backToBuilder', { defaultValue: 'Back to Builder' })}
              </Button>
            </Stack>
          </Box>
        )}

        {/* Calculate Score Button */}
        {actualSetlist && !isScored && (
          <Button size="lg" onClick={handleCalculateScore}>
            {t('setlistPrediction.calculateScore', { defaultValue: 'Calculate Score' })}
          </Button>
        )}
      </Stack>
    </>
  );
}
