/**
 * Marking Mode Page
 * Compare prediction against actual setlist and calculate score
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePageContext } from 'vike-react/usePageContext';
import { Stack, Box, HStack, Grid } from 'styled-system/jsx';
import { Text } from '~/components/ui/styled/text';
import { Button } from '~/components/ui/styled/button';
import { Textarea } from '~/components/ui/styled/textarea';
import { Metadata } from '~/components/layout/Metadata';
import { usePredictionStorage } from '~/hooks/setlist-prediction/usePredictionStorage';
import {
  usePerformance,
  usePerformanceSetlist
} from '~/hooks/setlist-prediction/usePerformanceData';
import { parseActualSetlist } from '~/utils/setlist-prediction/import';
import { calculateScore } from '~/utils/setlist-prediction/scoring';
import type { PerformanceSetlist, SetlistItemType, SetlistPrediction } from '~/types/setlist-prediction';
import { generateSetlistId } from '~/utils/setlist-prediction/id';
import { isSongItem } from '~/types/setlist-prediction';
import { SetlistView } from '~/components/setlist-prediction/SetlistView';

export function Page() {
  const { t } = useTranslation();
  const pageContext = usePageContext();
  const { getPrediction, savePrediction } = usePredictionStorage();

  const predictionId = (pageContext.routeParams as { prediction?: string }).prediction ?? '';
  const prediction = getPrediction(predictionId);
  const performance = usePerformance(prediction?.performanceId ?? '');
  console.log('performance', performance);

  const [actualSetlistText, setActualSetlistText] = useState('');
  const [actualSetlist, setActualSetlist] = useState<PerformanceSetlist | null>(null);
  const [isScored, setIsScored] = useState(false);

  const actualPrediction = {
    id: '012938109283',
    setlist: actualSetlist,
    name: "Actual Setlist"
  } as SetlistPrediction;
  // call the hook unconditionally (safe no-op if `performance?.id` is falsy)
  const { setlist } = usePerformanceSetlist(performance?.id ?? '');

  // update actual setlist only when we have a setlist and the performance indicates it has one
  useEffect(() => {
    if (performance?.hasSetlist && setlist) {
      console.log('Setting actual setlist from loaded setlist', setlist);
      setActualSetlist(setlist);
    }
  }, [performance?.id, performance?.hasSetlist, setlist]);

  const handleParseActual = () => {
    try {
      const parsed = parseActualSetlist(actualSetlistText);

      // Convert to PerformanceSetlist format
      const actualSetlistData: PerformanceSetlist = {
        id: generateSetlistId(prediction!.performanceId),
        performanceId: prediction!.performanceId,
        items: parsed.items.map((item, index) => {
          const itemType = item.type as SetlistItemType;
          if (itemType === 'song') {
            return {
              id: `actual-${index}`,
              type: 'song' as const,
              position: index,
              songId: item.songId || item.title || '',
              remarks: item.remarks
            };
          } else {
            return {
              id: `actual-${index}`,
              type: itemType,
              position: index,
              title: item.title || '',
              remarks: item.remarks
            };
          }
        }),
        sections: [],
        isActual: true
      };

      setActualSetlist(actualSetlistData);
    } catch {
      alert(
        t('setlistPrediction.failedToParse', {
          defaultValue: 'Failed to parse setlist. Please check the format.'
        })
      );
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

  console.log('actualSetlist', actualSetlist);

  if (!prediction) {
    return (
      <>
        <Metadata
          title={t('setlistPrediction.markingMode', { defaultValue: 'Marking Mode' })}
          helmet
        />
        <Stack alignItems="center" w="full" p={8}>
          <Text>
            {t('setlistPrediction.predictionNotFound', { defaultValue: 'Prediction not found' })}
          </Text>
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

      <Stack gap={4} w="full" maxW="6xl" mx="auto" p={4}>
        {/* Header */}
        <Box>
          <Text mb={2} fontSize="2xl" fontWeight="bold">
            {t('setlistPrediction.markingMode', { defaultValue: 'Marking Mode' })}
          </Text>
          <Text color="fg.muted" fontSize="md">
            {prediction.name}
          </Text>
          {performance && (
            <Text color="fg.muted" fontSize="sm">
              {performance.name} • {new Date(performance.date).toLocaleDateString()}
            </Text>
          )}
        </Box>

        {/* Import Actual Setlist */}
        {!actualSetlist && (
          <Box borderRadius="lg" borderWidth="1px" p={4} bgColor="bg.default">
            <Stack gap={3}>
              <Text fontSize="lg" fontWeight="bold">
                {t('setlistPrediction.importActualSetlist', {
                  defaultValue: 'Import Actual Setlist'
                })}
              </Text>
              <Text color="fg.muted" fontSize="sm">
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
        {
        actualSetlist && (
          <Grid gap={4} gridTemplateColumns={{ base: '1fr', md: '1fr 1fr' }}>
            {/* Prediction */}
            <Box borderRadius="lg" borderWidth="1px" p={4} bgColor="bg.default">
              <Text mb={3} fontSize="lg" fontWeight="bold">
                {t('setlistPrediction.yourPrediction', { defaultValue: 'Your Prediction' })}
              </Text>
              <Stack gap={1}>
                <SetlistView prediction={prediction} />
                
                {/* {prediction.setlist.items.map((item, index) => (
                  <HStack key={item.id} gap={2} borderRadius="sm" p={2} bgColor="bg.subtle">
                    <Text minW="30px" color="fg.muted" fontSize="sm" fontWeight="bold">
                      {index + 1}.
                    </Text>
                    <Text fontSize="sm">
                      {isSongItem(item) ? `♪ Song ${item.songId}` : `[${item.title}]`}
                    </Text>
                  </HStack>
                ))} */}

              </Stack>
            </Box>

            {/* Actual */}
            <Box borderRadius="lg" borderWidth="1px" p={4} bgColor="bg.default">
              <Text mb={3} fontSize="lg" fontWeight="bold">
                {t('setlistPrediction.actualSetlist', { defaultValue: 'Actual Setlist' })}
              </Text>
              <Stack gap={1}>
                <SetlistView prediction={actualPrediction} />
              </Stack>
            </Box>
          </Grid>
        )}

        {/* Score Display */}
        {isScored && prediction.score && (
          <Box borderRadius="lg" borderWidth="2px" p={6} bgColor="bg.emphasized">
            <Stack gap={3} alignItems="center">
              <Text fontSize="2xl" fontWeight="bold">
                {t('setlistPrediction.yourScore', { defaultValue: 'Your Score' })}
              </Text>

              <Text color="green.600" fontSize="4xl" fontWeight="bold">
                {prediction.score.totalScore} / {prediction.score.maxPossibleScore}
              </Text>

              <Text fontSize="xl">
                {t('setlistPrediction.accuracy', { defaultValue: 'Accuracy' })}:{' '}
                {prediction.score.accuracy.toFixed(1)}%
              </Text>

              <Box borderRadius="md" w="full" p={4} bgColor="bg.default">
                <Text mb={2} fontSize="md" fontWeight="bold">
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
