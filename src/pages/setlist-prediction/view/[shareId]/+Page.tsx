/**
 * View Shared Prediction Page
 * Display a prediction shared via compressed URL
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Stack, Box, HStack } from 'styled-system/jsx';
import { Text } from '~/components/ui/styled/text';
import { Button } from '~/components/ui/styled/button';
import { Metadata } from '~/components/layout/Metadata';
import { usePageContext } from 'vike-react/usePageContext';
import { decompressPrediction } from '~/utils/setlist-prediction/compression';
import { usePerformance } from '~/hooks/setlist-prediction/usePerformanceData';
import { usePredictionStorage } from '~/hooks/setlist-prediction/usePredictionStorage';
import type { SetlistPrediction } from '~/types/setlist-prediction';
import { isSongItem } from '~/types/setlist-prediction';

export function Page() {
  const { t } = useTranslation();
  const pageContext = usePageContext();
  const { savePrediction } = usePredictionStorage();

  const shareId = (pageContext.routeParams as { shareId: string }).shareId;

  const [prediction, setPrediction] = useState<SetlistPrediction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const performance = prediction ? usePerformance(prediction.performanceId) : null;

  useEffect(() => {
    if (!shareId) return;

    try {
      const decompressed = decompressPrediction(shareId);
      setPrediction(decompressed);
    } catch (err) {
      console.error('Failed to decompress prediction:', err);
      setError(t('setlistPrediction.invalidShareUrl', {
        defaultValue: 'Invalid or corrupted share URL'
      }));
    }
  }, [shareId, t]);

  const handleSave = () => {
    if (prediction) {
      savePrediction(prediction);
      alert(t('setlistPrediction.predictionSaved', {
        defaultValue: 'Prediction saved to your collection!'
      }));
    }
  };

  if (error) {
    return (
      <>
        <Metadata title={t('setlistPrediction.sharedPrediction', { defaultValue: 'Shared Prediction' })} helmet />
        <Stack alignItems="center" w="full" p={8}>
          <Box p={8} borderWidth="1px" borderRadius="lg" bgColor="bg.error" textAlign="center">
            <Text fontSize="lg" fontWeight="bold" mb={2} color="fg.error">
              {t('common.error', { defaultValue: 'Error' })}
            </Text>
            <Text fontSize="sm" color="fg.error">
              {error}
            </Text>
          </Box>
        </Stack>
      </>
    );
  }

  if (!prediction) {
    return (
      <>
        <Metadata title={t('setlistPrediction.sharedPrediction', { defaultValue: 'Shared Prediction' })} helmet />
        <Stack alignItems="center" w="full" p={8}>
          <Text>{t('common.loading', { defaultValue: 'Loading...' })}</Text>
        </Stack>
      </>
    );
  }

  return (
    <>
      <Metadata
        title={`${prediction.name} - ${t('setlistPrediction.sharedPrediction', { defaultValue: 'Shared Prediction' })}`}
        helmet
      />

      <Stack w="full" p={4} gap={4} alignItems="center">
        {/* Header */}
        <Box w="full" maxW="4xl">
          <Stack gap={2}>
            <HStack justifyContent="space-between" alignItems="center">
              <Stack gap={1}>
                <Text fontSize="2xl" fontWeight="bold">
                  {prediction.name}
                </Text>
                {performance && (
                  <Text fontSize="md" color="fg.muted">
                    {performance.name} • {new Date(performance.date).toLocaleDateString()}
                  </Text>
                )}
              </Stack>

              <Button onClick={handleSave}>
                {t('setlistPrediction.saveToMyCollection', { defaultValue: 'Save to My Collection' })}
              </Button>
            </HStack>

            {prediction.description && (
              <Text fontSize="sm" color="fg.muted">
                {prediction.description}
              </Text>
            )}
          </Stack>
        </Box>

        {/* Setlist Display */}
        <Box w="full" maxW="4xl" p={6} borderWidth="1px" borderRadius="lg" bgColor="bg.default">
          <Stack gap={3}>
            <HStack justifyContent="space-between" alignItems="center">
              <Text fontSize="lg" fontWeight="bold">
                {t('setlistPrediction.predictedSetlist', { defaultValue: 'Predicted Setlist' })}
              </Text>
              <Text fontSize="sm" color="fg.muted">
                {prediction.setlist.totalSongs} {t('setlistPrediction.songs', { defaultValue: 'songs' })}
              </Text>
            </HStack>

            {/* Items */}
            <Stack gap={1}>
              {prediction.setlist.items.map((item, index) => (
                <HStack key={item.id} gap={2} p={2} borderRadius="md" bgColor="bg.subtle">
                  <Text fontSize="sm" fontWeight="bold" color="fg.muted" minW="40px">
                    {index + 1}.
                  </Text>

                  <Stack gap={0} flex={1}>
                    {isSongItem(item) ? (
                      <>
                        <Text fontSize="sm" fontWeight="medium">
                          ♪ {item.isCustomSong ? item.customSongName : `Song ${item.songId}`}
                        </Text>
                        {item.remarks && (
                          <Text fontSize="xs" color="fg.muted">
                            {item.remarks}
                          </Text>
                        )}
                      </>
                    ) : (
                      <Text fontSize="sm" fontStyle="italic">
                        [{item.title}]
                      </Text>
                    )}
                  </Stack>

                  {item.section && (
                    <Text
                      fontSize="xs"
                      px={2}
                      py={0.5}
                      bgColor="bg.emphasized"
                      borderRadius="sm"
                    >
                      {item.section}
                    </Text>
                  )}
                </HStack>
              ))}
            </Stack>
          </Stack>
        </Box>

        {/* Footer */}
        <Box w="full" maxW="4xl" p={4} borderRadius="md" bgColor="bg.muted" textAlign="center">
          <Text fontSize="xs" color="fg.muted">
            {t('setlistPrediction.sharedVia', {
              defaultValue: 'Shared via LoveLive! Setlist Predictor'
            })}
          </Text>
          <Button
            size="sm"
            variant="link"
            mt={2}
            onClick={() => (window.location.href = '/setlist-prediction')}
          >
            {t('setlistPrediction.createYourOwn', {
              defaultValue: 'Create your own prediction'
            })}
          </Button>
        </Box>
      </Stack>
    </>
  );
}
