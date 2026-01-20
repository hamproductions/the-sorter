/**
 * Setlist Prediction Builder Page
 * Main page for creating and editing predictions
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { join } from 'path-browserify';
import { BiDotsVerticalRounded } from 'react-icons/bi';
import { Stack, Box, HStack } from 'styled-system/jsx';
import { Text, Button, IconButton, Menu } from '~/components/ui';
import { Metadata } from '~/components/layout/Metadata';
import { usePerformance } from '~/hooks/setlist-prediction/usePerformanceData';
import { usePredictionStorage } from '~/hooks/setlist-prediction/usePredictionStorage';
import { PredictionBuilder } from '~/components/setlist-prediction/builder/PredictionBuilder';
import { LoadPredictionDialog } from '~/components/setlist-prediction/builder/LoadPredictionDialog';
import { NewPredictionDialog } from '~/components/setlist-prediction/builder/NewPredictionDialog';
import { PerformancePickerDialog } from '~/components/setlist-prediction/builder/PerformancePickerDialog';
import type { SetlistPrediction, CustomPerformance } from '~/types/setlist-prediction';

export function Page() {
  const { t } = useTranslation();
  const {
    savePrediction,
    getPrediction,
    deletePrediction,
    ready: predictionsReady
  } = usePredictionStorage();

  const searchParams = new URLSearchParams(
    typeof window !== 'undefined' ? window.location.search : ''
  );
  const performanceIdParam = searchParams.get('performance');
  const predictionIdParam = searchParams.get('prediction');

  const [currentPerformanceId, setCurrentPerformanceId] = useState<string | undefined>(
    performanceIdParam || undefined
  );
  const [currentPrediction, setCurrentPrediction] = useState<SetlistPrediction | undefined>(
    undefined
  );
  const [customPerformance, setCustomPerformance] = useState<CustomPerformance | undefined>(
    undefined
  );
  const [isInitialized, setIsInitialized] = useState(false);

  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [performancePickerOpen, setPerformancePickerOpen] = useState(false);

  const performance = usePerformance(currentPerformanceId || '');

  useEffect(() => {
    if (isInitialized) return;

    // Wait until predictions are loaded from storage before calling `getPrediction`.
    // otherwise we may not find the prediction even if it exists.
    if (!predictionsReady) return;
    if (performanceIdParam) {
      setCurrentPerformanceId(performanceIdParam);
    }
    if (predictionIdParam) {
      const prediction = getPrediction(predictionIdParam);
      if (prediction) {
        console.log('Loaded prediction for id param:', prediction);
        setCurrentPrediction(prediction);
        setCurrentPerformanceId(prediction.performanceId);
        setIsInitialized(true);
        return;
      }
    }

    if (performanceIdParam) {
      try {
        const stored = localStorage.getItem('setlist-predictions-v1');
        if (stored) {
          const allPredictions = JSON.parse(stored) as Record<string, SetlistPrediction>;
          const forPerformance = Object.values(allPredictions).filter(
            (p) => p.performanceId === performanceIdParam
          );

          if (forPerformance.length > 0) {
            const mostRecent = forPerformance.toSorted(
              (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            )[0];
            setCurrentPrediction(mostRecent);
          }
        }
      } catch (e) {
        console.error('Failed to load prediction:', e);
      }
      setCurrentPerformanceId(performanceIdParam);
      setIsInitialized(true);
      return;
    }

    // Try to restore last used prediction from localStorage
    try {
      const lastPredictionId = localStorage.getItem('setlist-builder-last-prediction');
      if (lastPredictionId) {
        const prediction = getPrediction(lastPredictionId);
        if (prediction) {
          setCurrentPrediction(prediction);
          setCurrentPerformanceId(prediction.performanceId);
          setIsInitialized(true);
          return;
        }
      }
    } catch (e) {
      console.error('Failed to restore last prediction:', e);
    }

    setLoadDialogOpen(true);
    setIsInitialized(true);
  }, [performanceIdParam, predictionIdParam, getPrediction, isInitialized, predictionsReady]);

  const handleSelectLoadPrediction = useCallback((prediction: SetlistPrediction) => {
    setCurrentPrediction(prediction);
    setCurrentPerformanceId(prediction.performanceId);
    setCustomPerformance(prediction.customPerformance);
    localStorage.setItem('setlist-builder-last-prediction', prediction.id);
  }, []);

  const handleCreateNew = useCallback(
    (options: { performanceId?: string; customPerformance?: CustomPerformance }) => {
      setCurrentPrediction(undefined);
      setCurrentPerformanceId(options.performanceId);
      setCustomPerformance(options.customPerformance);
      localStorage.removeItem('setlist-builder-last-prediction');
    },
    []
  );

  const handleChangePerformance = useCallback(
    (performanceId: string | undefined, newCustomPerformance?: CustomPerformance) => {
      setCurrentPerformanceId(performanceId);
      setCustomPerformance(performanceId ? undefined : newCustomPerformance);
    },
    []
  );

  const handleDeletePrediction = useCallback(
    (predictionId: string) => {
      deletePrediction(predictionId);
      if (currentPrediction?.id === predictionId) {
        setCurrentPrediction(undefined);
        setCurrentPerformanceId(undefined);
        setCustomPerformance(undefined);
      }
    },
    [deletePrediction, currentPrediction]
  );
  console.log('currentPerformanceId:', !currentPerformanceId);
  console.log('currentPrediction:', currentPrediction);
  console.log('customPerformance:', customPerformance);

  const showEmptyState = !currentPerformanceId && !currentPrediction && !customPerformance;

  return (
    <>
      <Metadata
        title={
          performance
            ? `${t('setlistPrediction.builder', { defaultValue: 'Builder' })} - ${performance.name}`
            : t('setlistPrediction.builder', { defaultValue: 'Setlist Builder' })
        }
        helmet
      />

      <Stack w="full" h="100vh" overflow="hidden">
        {/* Header */}
        <Box
          zIndex={10}
          position="sticky"
          top={0}
          borderBottomWidth="1px"
          p={{ base: 2, md: 4 }}
          bgColor="bg.default"
        >
          <HStack justifyContent="space-between" alignItems="center">
            {/* Left: Performance info + Change button */}
            <Stack flex={1} gap={{ base: 0, md: 1 }} minW={0}>
              {performance ? (
                <>
                  <HStack gap={2} alignItems="center">
                    <Text
                      fontSize={{ base: 'sm', md: 'lg' }}
                      fontWeight="bold"
                      textOverflow="ellipsis"
                      overflow="hidden"
                      whiteSpace="nowrap"
                    >
                      {performance.name}
                    </Text>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => setPerformancePickerOpen(true)}
                      hideBelow="md"
                    >
                      {t('setlistPrediction.changePerformance', { defaultValue: 'Change' })}
                    </Button>
                  </HStack>
                  <Text hideBelow="md" color="fg.muted" fontSize={{ base: 'xs', md: 'sm' }}>
                    {new Date(performance.date).toLocaleDateString()} • {performance.venue || 'TBA'}
                  </Text>
                </>
              ) : customPerformance || currentPrediction?.customPerformance ? (
                <>
                  <HStack gap={2} alignItems="center">
                    <Text
                      fontSize={{ base: 'sm', md: 'lg' }}
                      fontWeight="bold"
                      textOverflow="ellipsis"
                      overflow="hidden"
                      whiteSpace="nowrap"
                    >
                      {(customPerformance || currentPrediction?.customPerformance)?.name}
                    </Text>
                    <Text color="fg.muted" fontSize="xs">
                      ({t('setlistPrediction.custom', { defaultValue: 'Custom' })})
                    </Text>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => setPerformancePickerOpen(true)}
                      hideBelow="md"
                    >
                      {t('setlistPrediction.changePerformance', { defaultValue: 'Change' })}
                    </Button>
                  </HStack>
                  {((customPerformance || currentPrediction?.customPerformance)?.venue ||
                    (customPerformance || currentPrediction?.customPerformance)?.date) && (
                    <Text hideBelow="md" color="fg.muted" fontSize={{ base: 'xs', md: 'sm' }}>
                      {(customPerformance || currentPrediction?.customPerformance)?.date &&
                        new Date(
                          (customPerformance ?? currentPrediction?.customPerformance)?.date ?? ''
                        ).toLocaleDateString()}
                      {(customPerformance || currentPrediction?.customPerformance)?.venue &&
                        (customPerformance || currentPrediction?.customPerformance)?.date &&
                        ' • '}
                      {(customPerformance || currentPrediction?.customPerformance)?.venue}
                    </Text>
                  )}
                </>
              ) : (
                <Text color="fg.muted" fontSize={{ base: 'sm', md: 'lg' }}>
                  {t('setlistPrediction.noPredictionSelected', {
                    defaultValue: 'No prediction selected'
                  })}
                </Text>
              )}
            </Stack>

            {/* Right: New / Load / Back (Desktop) */}
            <HStack hideBelow="md" gap={2} flexShrink={0}>
              <Button
                size={{ base: 'xs', md: 'sm' }}
                variant="outline"
                onClick={() => setNewDialogOpen(true)}
              >
                {t('common.new', { defaultValue: 'New' })}
              </Button>
              <Button
                size={{ base: 'xs', md: 'sm' }}
                variant="outline"
                onClick={() => setLoadDialogOpen(true)}
              >
                {t('common.load', { defaultValue: 'Load' })}
              </Button>
              <Button
                size={{ base: 'xs', md: 'sm' }}
                variant="subtle"
                onClick={() =>
                  (window.location.href = join(import.meta.env.BASE_URL, '/setlist-prediction'))
                }
              >
                {t('common.back', { defaultValue: 'Back' })}
              </Button>
            </HStack>

            {/* Right: Menu (Mobile) */}
            <Box hideFrom="md">
              <Menu.Root positioning={{ placement: 'bottom-end' }}>
                <Menu.Trigger asChild>
                  <IconButton variant="ghost" size="sm">
                    <BiDotsVerticalRounded size={20} />
                  </IconButton>
                </Menu.Trigger>
                <Menu.Positioner>
                  <Menu.Content>
                    <Menu.Item value="change" onClick={() => setPerformancePickerOpen(true)}>
                      {t('setlistPrediction.changePerformance', {
                        defaultValue: 'Change Performance'
                      })}
                    </Menu.Item>
                    <Menu.Item value="new" onClick={() => setNewDialogOpen(true)}>
                      {t('common.new', { defaultValue: 'New' })}
                    </Menu.Item>
                    <Menu.Item value="load" onClick={() => setLoadDialogOpen(true)}>
                      {t('common.load', { defaultValue: 'Load' })}
                    </Menu.Item>
                    <Menu.Item
                      value="back"
                      onClick={() =>
                        (window.location.href = join(
                          import.meta.env.BASE_URL,
                          '/setlist-prediction'
                        ))
                      }
                    >
                      {t('common.back', { defaultValue: 'Back' })}
                    </Menu.Item>
                  </Menu.Content>
                </Menu.Positioner>
              </Menu.Root>
            </Box>
          </HStack>
        </Box>

        {/* Builder Component or Empty State */}
        <Box flex={1} overflow="hidden">
          {showEmptyState ? (
            <Stack justifyContent="center" alignItems="center" h="full" p={8}>
              <Box borderRadius="lg" borderWidth="1px" p={8} textAlign="center" bgColor="bg.muted">
                <Text mb={2} fontSize="lg" fontWeight="bold">
                  {t('setlistPrediction.welcomeBuilder', {
                    defaultValue: 'Welcome to Setlist Builder'
                  })}
                </Text>
                <Text mb={4} color="fg.muted" fontSize="sm">
                  {t('setlistPrediction.getStartedHint', {
                    defaultValue: 'Load a saved prediction or create a new one to get started.'
                  })}
                </Text>
                <HStack gap={2} justifyContent="center">
                  <Button variant="outline" onClick={() => setLoadDialogOpen(true)}>
                    {t('common.load', { defaultValue: 'Load' })}
                  </Button>
                  <Button onClick={() => setNewDialogOpen(true)}>
                    {t('common.new', { defaultValue: 'New' })}
                  </Button>
                </HStack>
              </Box>
            </Stack>
          ) : (
            <PredictionBuilder
              performanceId={currentPerformanceId}
              customPerformance={customPerformance}
              initialPrediction={currentPrediction}
              performance={performance || undefined}
              onSave={(prediction) => {
                savePrediction(prediction);
                localStorage.setItem('setlist-builder-last-prediction', prediction.id);
              }}
            />
          )}
        </Box>
      </Stack>

      {/* Load Prediction Dialog */}
      <LoadPredictionDialog
        open={loadDialogOpen}
        onOpenChange={setLoadDialogOpen}
        onSelectLoadPrediction={handleSelectLoadPrediction}
        onDeletePrediction={handleDeletePrediction}
      />

      {/* New Prediction Dialog */}
      <NewPredictionDialog
        open={newDialogOpen}
        onOpenChange={setNewDialogOpen}
        onCreateNew={handleCreateNew}
      />

      {/* Performance Picker Dialog (for changing/assigning performance) */}
      <PerformancePickerDialog
        open={performancePickerOpen}
        onOpenChange={setPerformancePickerOpen}
        onSelectPerformance={handleChangePerformance}
        currentPerformanceId={currentPerformanceId}
      />
    </>
  );
}
