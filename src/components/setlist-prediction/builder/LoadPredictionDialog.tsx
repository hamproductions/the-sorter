import { useTranslation } from 'react-i18next';
import { useState, useMemo } from 'react';
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

export interface LoadPredictionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPrediction: (prediction: SetlistPrediction) => void;
  onDeletePrediction?: (predictionId: string) => void;
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
  onDeletePrediction
}: LoadPredictionDialogProps) {
  const { t } = useTranslation();
  const { predictions } = usePredictionStorage();

  const [selectedPredictionId, setSelectedPredictionId] = useState<string | null>(null);

  const sortedPredictions = useMemo(() => {
    return [...predictions].toSorted(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [predictions]);

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
                {sortedPredictions.length === 0 ? (
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
                  sortedPredictions.map((prediction) => (
                    <PredictionItem
                      key={prediction.id}
                      prediction={prediction}
                      onClick={() => setSelectedPredictionId(prediction.id)}
                      onDelete={
                        onDeletePrediction ? () => onDeletePrediction(prediction.id) : undefined
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
