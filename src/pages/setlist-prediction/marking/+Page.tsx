/**
 * Marking Mode Page
 * Compare prediction against actual setlist and calculate score
 */

import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Stack, Box, HStack, Grid } from 'styled-system/jsx';
import { Text, Button, Textarea } from '~/components/ui';
import { Metadata } from '~/components/layout/Metadata';
import { usePredictionStorage } from '~/hooks/setlist-prediction/usePredictionStorage';
import { join } from 'path-browserify';
import {
  usePerformance,
  usePerformanceSetlist
} from '~/hooks/setlist-prediction/usePerformanceData';
import { parseActualSetlist } from '~/utils/setlist-prediction/import';
import { calculateScore } from '~/utils/setlist-prediction/scoring';
import type {
  PerformanceSetlist,
  SetlistItemType,
  SetlistPrediction
} from '~/types/setlist-prediction';
import { isSongItem } from '~/types/setlist-prediction';
import { generateSetlistId } from '~/utils/setlist-prediction/id';
import { SetlistView } from '~/components/setlist-prediction/SetlistView';
import { usePageContext } from 'vike-react/usePageContext';
import { SITE_URL } from '~/utils/config';

export function Page() {
  const { t } = useTranslation();
  const { getPrediction, savePrediction } = usePredictionStorage();

  // When the page loads, get the prediction ID from the URL params
  // and set the predictionId state variable, which will trigger a re-render

  const { urlParsed } = usePageContext();
  const predictionId = urlParsed.search.prediction ?? '';

  // const predictionId = (pageContext.routeParams as { prediction?: string }).prediction ?? '';

  const [actualSetlistText, setActualSetlistText] = useState('');
  // State for user-parsed setlist (from textarea input)
  const [parsedActualSetlist, setParsedActualSetlist] = useState<PerformanceSetlist | null>(null);
  const [isScored, setIsScored] = useState(false);

  // Ref for scrolling to score section
  const scoreRef = useRef<HTMLDivElement>(null);

  const prediction = getPrediction(predictionId);
  const performance = usePerformance(prediction?.performanceId ?? '');

  // call the hook unconditionally (safe no-op if `performance?.id` is falsy)
  const { setlist } = usePerformanceSetlist(performance?.id ?? '');

  // Derive actualSetlist: prefer user-parsed, fallback to performance data
  const actualSetlist = useMemo(() => {
    // User-parsed setlist takes precedence
    if (parsedActualSetlist) return parsedActualSetlist;
    // Otherwise use setlist from the performance data if available
    if (performance?.hasSetlist && setlist) return setlist;
    return null;
  }, [parsedActualSetlist, performance?.hasSetlist, setlist]);

  // Create a fake prediction for the actual setlist so that we can display with PredictionView component
  const actualPrediction = {
    id: '012938109283',
    setlist: actualSetlist,
    name: performance ? performance.name : 'Actual Setlist'
  } as SetlistPrediction;

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

      setParsedActualSetlist(actualSetlistData);
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

    // Scroll to score section after state update
    setTimeout(() => {
      scoreRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 0);
  };

  // Build match result maps for color-coding comparison view
  const { predictionMatchResults, actualMatchResults } = useMemo(() => {
    const predMap = new Map<string, 'exact' | 'close' | 'present' | 'section'>();
    const actualMap = new Map<string, 'exact' | 'close' | 'present' | 'section'>();

    if (prediction?.score?.itemScores) {
      // First pass: build maps from scored matches
      for (const itemScore of prediction.score.itemScores) {
        if (itemScore.matched && itemScore.matchType) {
          predMap.set(itemScore.itemId, itemScore.matchType);
          actualMap.set(itemScore.actualItemId, itemScore.matchType);
        }
      }

      // Second pass: handle duplicate songs that weren't matched but exist in the other setlist
      // (This can happen if a the same song is in the actual or predicted setlist multiple times)
      // Then only the first gets matched, and the duplicate don't get marked.
      // This second pass marks the duplicates as 'present' if they exist anywhere in the other setlist. So that they are still highlighted.

      // Get all song IDs from each setlist
      const predSongIds = new Set(
        prediction.setlist.items.filter(isSongItem).map((item) => item.songId)
      );
      const actualSongIds = actualSetlist
        ? new Set(actualSetlist.items.filter(isSongItem).map((item) => item.songId))
        : new Set<string>();

      // Mark unmatched prediction songs as 'present' if they exist anywhere in actual
      for (const item of prediction.setlist.items) {
        if (isSongItem(item) && !predMap.has(item.id) && actualSongIds.has(item.songId)) {
          predMap.set(item.id, 'present');
        }
      }

      // Vice versa of above: Mark unmatched actual songs as 'present' if they exist anywhere in prediction
      if (actualSetlist) {
        for (const item of actualSetlist.items) {
          if (isSongItem(item) && !actualMap.has(item.id) && predSongIds.has(item.songId)) {
            actualMap.set(item.id, 'present');
          }
        }
      }
    }

    return { predictionMatchResults: predMap, actualMatchResults: actualMap };
  }, [prediction?.score?.itemScores, prediction?.setlist.items, actualSetlist]);

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
        canonical={`${SITE_URL}/setlist-prediction/marking`}
      />

      <Stack gap={4} w="full" maxW="6xl" mx="auto" p={4}>
        {/* Back Button */}
        <Box>
          <Button variant="ghost" size="sm" asChild>
            <a href={join(import.meta.env.BASE_URL, '/setlist-prediction')}>
              ←{' '}
              {t('setlistPrediction.backToPerformances', {
                defaultValue: 'Back to Performance List'
              })}
            </a>
          </Button>
        </Box>

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
        {actualSetlist && (
          <>
            {/* Calculate Score Button - Top */}
            {!isScored && (
              <Button size="lg" onClick={handleCalculateScore}>
                {t('setlistPrediction.calculateScore', { defaultValue: 'Calculate Score' })}
              </Button>
            )}

            {/* 2x2 Grid: Headers in row 1 (same height), Setlists in row 2 */}
            <Grid
              gap={0}
              gridTemplateColumns={{ base: '1fr', md: '1fr 1fr' }}
              gridTemplateRows={{ base: 'auto', md: 'auto 1fr' }}
              borderRadius="lg"
              borderWidth="1px"
              overflow="hidden"
            >
              {/* Row 1: Headers */}
              <Box
                borderRightWidth={{ base: '0', md: '1px' }}
                borderBottomWidth="1px"
                p={4}
                bgColor="bg.default"
              >
                <Text fontSize="lg" fontWeight="bold">
                  {t('setlistPrediction.yourPrediction', { defaultValue: 'Your Prediction' })}
                </Text>
                <Text color="fg.muted" fontSize="md">
                  {prediction.name}
                </Text>
                <Text color="fg.muted" fontSize="sm">
                  {prediction.setlist.items.filter((i) => i.type === 'song').length} songs
                </Text>
              </Box>

              <Box borderBottomWidth="1px" p={4} bgColor="bg.default">
                <Text fontSize="lg" fontWeight="bold">
                  {t('setlistPrediction.actualSetlist', { defaultValue: 'Actual Setlist' })}
                </Text>
                <Text color="fg.muted" fontSize="md">
                  {performance?.name || 'Actual Setlist'}
                </Text>
                <Text color="fg.muted" fontSize="sm">
                  {actualSetlist.items.filter((i) => i.type === 'song').length} songs
                </Text>
              </Box>

              {/* Row 2: Setlist items */}
              <Box borderRightWidth={{ base: '0', md: '1px' }} p={4} bgColor="bg.default">
                <SetlistView
                  prediction={prediction}
                  showHeader={false}
                  matchResults={isScored ? predictionMatchResults : undefined}
                />
              </Box>

              <Box p={4} bgColor="bg.default">
                <SetlistView
                  prediction={actualPrediction}
                  showHeader={false}
                  matchResults={isScored ? actualMatchResults : undefined}
                />
              </Box>
            </Grid>
          </>
        )}

        {/* Score Display */}
        {isScored && prediction.score && (
          <Box ref={scoreRef} borderRadius="lg" borderWidth="2px" p={6} bgColor="bg.emphasized">
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
                  window.location.href = join(
                    import.meta.env.BASE_URL,
                    `/setlist-prediction/builder/?${prediction.id}`
                  );
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
