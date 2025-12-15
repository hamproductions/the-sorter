/**
 * Save Slot Manager Component
 * Manage multiple predictions for a performance
 */

import { useTranslation } from 'react-i18next';
import { BiTrash, BiStar } from 'react-icons/bi';
import { MdEdit } from 'react-icons/md';
import { Stack, Box, HStack } from 'styled-system/jsx';
import { Text } from '~/components/ui/styled/text';
import { Button } from '~/components/ui/styled/button';
import { IconButton } from '~/components/ui/styled/icon-button';
import { useSaveSlots } from '~/hooks/setlist-prediction/useSaveSlots';
import { usePredictionStorage } from '~/hooks/setlist-prediction/usePredictionStorage';

export interface SaveSlotManagerProps {
  performanceId: string;
  onSelectPrediction?: (predictionId: string) => void;
  onCreateNew?: () => void;
}

export function SaveSlotManager({
  performanceId,
  onSelectPrediction,
  onCreateNew
}: SaveSlotManagerProps) {
  const { t } = useTranslation();
  const { getSlotForPerformance } = useSaveSlots();
  const {
    getPredictionsForPerformance,
    deletePrediction,
    activePredictionId,
    setActivePrediction
  } = usePredictionStorage();

  const slot = getSlotForPerformance(performanceId);
  const predictions = getPredictionsForPerformance(performanceId);

  const handleSelect = (predictionId: string) => {
    setActivePrediction(predictionId);
    if (onSelectPrediction) {
      onSelectPrediction(predictionId);
    }
  };

  const handleDelete = (predictionId: string) => {
    if (window.confirm(t('common.confirmDelete', { defaultValue: 'Are you sure?' }))) {
      deletePrediction(predictionId);
    }
  };

  return (
    <Stack gap={3}>
      <HStack justifyContent="space-between" alignItems="center">
        <Text fontSize="md" fontWeight="bold">
          {t('setlistPrediction.savedPredictions', { defaultValue: 'Saved Predictions' })}
        </Text>
        <Button size="sm" onClick={onCreateNew}>
          {t('setlistPrediction.newPrediction', { defaultValue: '+ New' })}
        </Button>
      </HStack>

      {predictions.length === 0 ? (
        <Box borderRadius="md" borderWidth="1px" p={4} textAlign="center" bgColor="bg.muted">
          <Text color="fg.muted" fontSize="sm">
            {t('setlistPrediction.noPredictions', {
              defaultValue: 'No predictions yet'
            })}
          </Text>
        </Box>
      ) : (
        <Stack gap={2}>
          {predictions.map((prediction) => {
            const isActive = activePredictionId === prediction.id;
            return (
              <Box
                key={prediction.id}
                onClick={() => handleSelect(prediction.id)}
                cursor="pointer"
                borderRadius="md"
                borderWidth="1px"
                p={3}
                // eslint-disable-next-line @pandacss/no-dynamic-styling
                bgColor={isActive ? 'bg.emphasized' : 'bg.default'}
                _hover={{ bgColor: 'bg.muted' }}
              >
                <HStack justifyContent="space-between" alignItems="center">
                  <Stack flex={1} gap={0}>
                    <HStack gap={1} alignItems="center">
                      {prediction.isFavorite && <BiStar color="gold" />}
                      <Text fontSize="sm" fontWeight="medium">
                        {prediction.name}
                      </Text>
                    </HStack>
                    <Text color="fg.muted" fontSize="xs">
                      {prediction.setlist.totalSongs} songs •{' '}
                      {new Date(prediction.updatedAt).toLocaleString()}
                    </Text>
                    {prediction.score && (
                      <Text color="green.600" fontSize="xs">
                        Score: {prediction.score.totalScore} ({prediction.score.accuracy.toFixed(1)}
                        %)
                      </Text>
                    )}
                  </Stack>

                  <HStack gap={1}>
                    <IconButton
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(prediction.id);
                      }}
                      aria-label={t('common.edit', { defaultValue: 'Edit' })}
                    >
                      <MdEdit />
                    </IconButton>
                    <IconButton
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(prediction.id);
                      }}
                      aria-label={t('common.delete', { defaultValue: 'Delete' })}
                    >
                      <BiTrash />
                    </IconButton>
                  </HStack>
                </HStack>
              </Box>
            );
          })}
        </Stack>
      )}

      {slot && (
        <Box borderRadius="md" p={2} bgColor="bg.subtle">
          <Text color="fg.muted" fontSize="xs">
            Slot {slot.slot} • {predictions.length} prediction(s)
          </Text>
        </Box>
      )}
    </Stack>
  );
}
