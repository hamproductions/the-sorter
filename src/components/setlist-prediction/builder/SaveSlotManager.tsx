/**
 * Save Slot Manager Component
 * Manage multiple predictions for a performance
 */

import { useTranslation } from 'react-i18next';
import { Stack, Box, HStack } from 'styled-system/jsx';
import { Text } from '~/components/ui/styled/text';
import { Button } from '~/components/ui/styled/button';
import { IconButton } from '~/components/ui/styled/icon-button';
import { useSaveSlots } from '~/hooks/setlist-prediction/useSaveSlots';
import { usePredictionStorage } from '~/hooks/setlist-prediction/usePredictionStorage';
import { BiTrash, BiStar } from 'react-icons/bi';
import { MdEdit } from 'react-icons/md';

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
        <Box p={4} borderWidth="1px" borderRadius="md" bgColor="bg.muted" textAlign="center">
          <Text fontSize="sm" color="fg.muted">
            {t('setlistPrediction.noPredictions', {
              defaultValue: 'No predictions yet'
            })}
          </Text>
        </Box>
      ) : (
        <Stack gap={2}>
          {predictions.map((prediction) => (
            <Box
              key={prediction.id}
              p={3}
              borderWidth="1px"
              borderRadius="md"
              bgColor={
                activePredictionId === prediction.id ? 'bg.emphasized' : 'bg.default'
              }
              cursor="pointer"
              onClick={() => handleSelect(prediction.id)}
              _hover={{ bgColor: 'bg.muted' }}
            >
              <HStack justifyContent="space-between" alignItems="center">
                <Stack gap={0} flex={1}>
                  <HStack gap={1} alignItems="center">
                    {prediction.isFavorite && <BiStar color="gold" />}
                    <Text fontSize="sm" fontWeight="medium">
                      {prediction.name}
                    </Text>
                  </HStack>
                  <Text fontSize="xs" color="fg.muted">
                    {prediction.setlist.totalSongs} songs •{' '}
                    {new Date(prediction.updatedAt).toLocaleString()}
                  </Text>
                  {prediction.score && (
                    <Text fontSize="xs" color="green.600">
                      Score: {prediction.score.totalScore} (
                      {prediction.score.accuracy.toFixed(1)}%)
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
          ))}
        </Stack>
      )}

      {slot && (
        <Box p={2} borderRadius="md" bgColor="bg.subtle">
          <Text fontSize="xs" color="fg.muted">
            Slot {slot.slot} • {predictions.length} prediction(s)
          </Text>
        </Box>
      )}
    </Stack>
  );
}
