import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { join } from 'path-browserify';
import { Stack, Box, HStack } from 'styled-system/jsx';
import { Text } from '~/components/ui/styled/text';
import { Button } from '~/components/ui/styled/button';
import { Metadata } from '~/components/layout/Metadata';
import { decompressPrediction } from '~/utils/setlist-prediction/compression';
import { usePerformance } from '~/hooks/setlist-prediction/usePerformanceData';
import { usePredictionStorage } from '~/hooks/setlist-prediction/usePredictionStorage';
import { SetlistView } from '~/components/setlist-prediction/SetlistView';
import { useToaster } from '~/context/ToasterContext';
import type { SetlistPrediction } from '~/types/setlist-prediction';

export function Page() {
  const { t } = useTranslation();
  const { savePrediction } = usePredictionStorage();
  const { toast } = useToaster();

  const [prediction, setPrediction] = useState<SetlistPrediction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const performance = usePerformance(prediction?.performanceId ?? '');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const data = params.get('data');

    if (!data) {
      setError(
        t('setlistPrediction.noShareData', {
          defaultValue: 'No share data provided'
        })
      );
      return;
    }

    try {
      const decompressed = decompressPrediction(data);
      setPrediction(decompressed);
    } catch (err) {
      console.error('Failed to decompress prediction:', err);
      setError(
        t('setlistPrediction.invalidShareUrl', {
          defaultValue: 'Invalid or corrupted share URL'
        })
      );
    }
  }, [t]);

  const handleSave = () => {
    if (prediction) {
      savePrediction(prediction);
      toast({
        title: t('setlistPrediction.predictionSaved', {
          defaultValue: 'Prediction saved!'
        }),
        description: t('setlistPrediction.viewInBuilder', {
          defaultValue: 'View it in the prediction builder'
        })
      });
    }
  };

  if (error) {
    return (
      <>
        <Metadata
          title={t('setlistPrediction.sharedPrediction', { defaultValue: 'Shared Prediction' })}
          helmet
        />
        <Stack alignItems="center" w="full" p={8}>
          <Box borderRadius="lg" borderWidth="1px" p={8} textAlign="center" bgColor="bg.error">
            <Text mb={2} color="fg.error" fontSize="lg" fontWeight="bold">
              {t('common.error', { defaultValue: 'Error' })}
            </Text>
            <Text color="fg.error" fontSize="sm">
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
        <Metadata
          title={t('setlistPrediction.sharedPrediction', { defaultValue: 'Shared Prediction' })}
          helmet
        />
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

      <Stack gap={4} alignItems="center" w="full" p={4}>
        <Box w="full" maxW="4xl">
          <Stack gap={2}>
            <HStack justifyContent="space-between" alignItems="center">
              <Stack gap={1}>
                <Text fontSize="2xl" fontWeight="bold">
                  {prediction.name}
                </Text>
                {performance ? (
                  <Text color="fg.muted" fontSize="md">
                    {performance.name} • {new Date(performance.date).toLocaleDateString()}
                  </Text>
                ) : prediction.customPerformance ? (
                  <Text color="fg.muted" fontSize="md">
                    {prediction.customPerformance.name}
                    {prediction.customPerformance.date &&
                      ` • ${new Date(prediction.customPerformance.date).toLocaleDateString()}`}
                    {prediction.customPerformance.venue &&
                      ` • ${prediction.customPerformance.venue}`}
                  </Text>
                ) : null}
              </Stack>

              <Button onClick={handleSave}>
                {t('setlistPrediction.saveToMyCollection', {
                  defaultValue: 'Save to My Collection'
                })}
              </Button>
            </HStack>

            {prediction.description && (
              <Text color="fg.muted" fontSize="sm">
                {prediction.description}
              </Text>
            )}
          </Stack>
        </Box>

        <Box borderRadius="lg" borderWidth="1px" w="full" maxW="4xl" p={6} bgColor="bg.default">
          <Text mb={4} fontSize="lg" fontWeight="bold">
            {t('setlistPrediction.predictedSetlist', { defaultValue: 'Predicted Setlist' })}
          </Text>

          <SetlistView
            prediction={prediction}
            performance={performance || undefined}
            showHeader={false}
            compact={false}
          />
        </Box>

        <Box borderRadius="md" w="full" maxW="4xl" p={4} textAlign="center" bgColor="bg.muted">
          <Text color="fg.muted" fontSize="xs">
            {t('setlistPrediction.sharedVia', {
              defaultValue: 'Shared via LoveLive! Setlist Predictor'
            })}
          </Text>
          <Button
            size="sm"
            variant="link"
            onClick={() =>
              (window.location.href = join(import.meta.env.BASE_URL, '/setlist-prediction'))
            }
            mt={2}
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
