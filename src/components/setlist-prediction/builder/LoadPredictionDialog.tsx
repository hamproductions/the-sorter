import { useTranslation } from 'react-i18next';
import { useState, useMemo, useEffect } from 'react';
import { css } from 'styled-system/css';
import { Box, Stack, HStack } from 'styled-system/jsx';
import { Button } from '~/components/ui/styled/button';
import { Text } from '~/components/ui/styled/text';
import { usePredictionStorage } from '~/hooks/setlist-prediction/usePredictionStorage';
import { usePerformance } from '~/hooks/setlist-prediction/usePerformanceData';
import type { SetlistPrediction } from '~/types/setlist-prediction';
import {
  Root as DialogRoot,
  Backdrop as DialogBackdrop,
  Positioner as DialogPositioner,
  Content as DialogContent,
  Title as DialogTitle,
  Description as DialogDescription,
  CloseTrigger as DialogCloseTrigger
} from '~/components/ui/styled/dialog';

// Props for the dialog. `performanceId` is optional — when provided the dialog
// should only display predictions that belong to that performance. This allows
// the parent page to open the dialog already filtered to a single performance
// (for example when the user clicks "Load Prediction" next to a specific show).
export interface LoadPredictionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPrediction: (prediction: SetlistPrediction) => void;
  onDeletePrediction?: (predictionId: string) => void;
  performanceId?: string;
}

function PredictionItem({
  prediction,
  onClick,
  onDelete,
  isSelected
}: {
  prediction: SetlistPrediction;
  onClick: () => void;
  onDelete?: () => void;
  isSelected: boolean;
}) {
  const performance = usePerformance(prediction.performanceId || '');

  // We display the associated performance name (if available) to give context
  // for saved predictions. `usePerformance` will return the performance object
  // for the prediction's `performanceId` when that data is loaded.

  return (
    <Box
      className={css({
        '&[data-selected=true]': { borderColor: 'border.accent', bgColor: 'bg.emphasized' }
      })}
      data-selected={isSelected}
      onClick={onClick}
      cursor="pointer"
      borderRadius="md"
      borderWidth="1px"
      p={3}
      _hover={{ bgColor: 'bg.subtle' }}
    >
      <HStack justifyContent="space-between" alignItems="start">
        <Stack flex={1} gap={0.5}>
          <Text fontSize="sm" fontWeight="medium">
            {prediction.name}
          </Text>
          <Text color="fg.muted" fontSize="xs">
            {performance ? performance.name : 'Custom Prediction'}
          </Text>
          <Text color="fg.muted" fontSize="xs">
            {prediction.setlist.items.filter((i) => i.type === 'song').length} songs •{' '}
            {new Date(prediction.updatedAt).toLocaleDateString()}
          </Text>
        </Stack>
        {onDelete && (
          <Button
            size="xs"
            variant="ghost"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            ✕
          </Button>
        )}
      </HStack>
    </Box>
  );
}

export function LoadPredictionDialog({
  open,
  onOpenChange,
  onSelectPrediction,
  onDeletePrediction,
  performanceId = undefined // optional filter
}: LoadPredictionDialogProps) {
  const { t } = useTranslation();
  const { predictions, deletePrediction } = usePredictionStorage();

  // Internal copy of predictions to allow optimistic UI updates when deleting.
  // We sync this internal array from the storage-backed `predictions` so other
  // parts of the app can still update storage while the dialog reflects changes
  // immediately.
  const [internalPredictions, setInternalPredictions] = useState<SetlistPrediction[]>(predictions);

  useEffect(() => {
    setInternalPredictions(predictions);
  }, [predictions]);

  const [selectedPredictionId, setSelectedPredictionId] = useState<string | null>(null);

  // build the set of predictions to display
  // Build the set of predictions to display in the dialog.
  // - If `performanceId` is provided by the parent, filter to predictions
  //   that match that performance. This is how the page shows only predictions
  //   for a particular performance when the user clicked "Load Prediction".
  // - Sort by `updatedAt` descending so most recent predictions appear first.
  // Use the internal copy here so deletions are visible instantly in the UI.
  const displayPredictions = useMemo(() => {
    let filtered = [...internalPredictions];
    if (performanceId) {
      filtered = filtered.filter((p) => p.performanceId === performanceId);
    }
    return filtered.toSorted(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [internalPredictions, performanceId]);

  const handleConfirm = () => {
    if (selectedPredictionId) {
      const prediction = predictions.find((p) => p.id === selectedPredictionId);
      if (prediction) {
        onSelectPrediction(prediction);
        onOpenChange(false);
      }
    }
  };

  return (
    <DialogRoot
      open={open}
      onOpenChange={(details: { open: boolean }) => onOpenChange(details.open)}
    >
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent
          display="flex"
          flexDirection="column"
          maxW="600px"
          maxH="80vh"
          overflow="hidden"
        >
          <Stack flex={1} gap={4} minH={0} p={6} overflow="hidden">
            <DialogTitle>
              {t('setlistPrediction.loadPrediction', { defaultValue: 'Load Prediction' })}
            </DialogTitle>

            <DialogDescription>
              <Text fontSize="sm">
                {t('setlistPrediction.loadPredictionDescription', {
                  defaultValue: 'Select a saved prediction to load into the builder.'
                })}
              </Text>
            </DialogDescription>

            <Box flex={1} minH={0} overflow="auto">
              <Stack gap={2}>
                {displayPredictions.length === 0 ? (
                  <Box
                    borderRadius="md"
                    borderWidth="1px"
                    p={6}
                    textAlign="center"
                    bgColor="bg.muted"
                  >
                    <Text color="fg.muted" fontSize="sm">
                      {t('setlistPrediction.noPredictions', {
                        defaultValue: 'No saved predictions yet'
                      })}
                    </Text>
                  </Box>
                ) : (
                  displayPredictions.map((prediction) => (
                    <PredictionItem
                      key={prediction.id}
                      prediction={prediction}
                      onClick={() => setSelectedPredictionId(prediction.id)}
                      onDelete={
                        onDeletePrediction
                          ? () => {
                              // 1) Tell parent to remove from persistent storage
                              // Prefer deleting via the storage hook directly so the
                              // dialog doesn't depend on the parent callback executing.
                              // This ensures deletion always happens even if the parent
                              // didn't pass a handler or it wasn't invoked for some reason.
                              if (deletePrediction) {
                                deletePrediction(prediction.id);
                              }
                              // Also call the parent's handler if provided for any
                              // additional side-effects the parent needs.
                              if (onDeletePrediction) {
                                onDeletePrediction(prediction.id);
                              }

                              // 3) Remove from internal list immediately so UI updates
                              setInternalPredictions((prev) =>
                                prev.filter((p) => p.id !== prediction.id)
                              );
                              // 3) Clear selection if we deleted the selected item
                              if (selectedPredictionId === prediction.id) {
                                setSelectedPredictionId(null);
                              }
                            }
                          : undefined
                      }
                      isSelected={selectedPredictionId === prediction.id}
                    />
                  ))
                )}
              </Stack>
            </Box>

            <Box
              display="flex"
              gap={2}
              justifyContent="flex-end"
              borderTopWidth="1px"
              mt={2}
              pt={4}
            >
              <DialogCloseTrigger asChild>
                <Button variant="outline">{t('common.cancel', { defaultValue: 'Cancel' })}</Button>
              </DialogCloseTrigger>
              <Button onClick={handleConfirm} disabled={!selectedPredictionId}>
                {t('common.load', { defaultValue: 'Load' })}
              </Button>
            </Box>
          </Stack>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
}
