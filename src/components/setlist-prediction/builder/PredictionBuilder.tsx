/**
 * Main Prediction Builder Component
 * Three-panel layout: Song Search | Setlist Editor | Context/Actions
 */

import { useTranslation } from 'react-i18next';
import { Box, Stack, HStack } from 'styled-system/jsx';
import { Button } from '~/components/ui/styled/button';
import { Input } from '~/components/ui/styled/input';
import { Text } from '~/components/ui/styled/text';
import type { SetlistPrediction, Performance } from '~/types/setlist-prediction';
import { usePredictionBuilder } from '~/hooks/setlist-prediction/usePredictionBuilder';
import { SetlistEditorPanel } from './SetlistEditorPanel';
import { ExportShareTools } from './ExportShareTools';
import { useState } from 'react';

export interface PredictionBuilderProps {
  performanceId: string;
  initialPrediction?: SetlistPrediction;
  performance?: Performance;
  onSave?: (prediction: SetlistPrediction) => void;
}

export function PredictionBuilder({
  performanceId,
  initialPrediction,
  performance,
  onSave
}: PredictionBuilderProps) {
  const { t } = useTranslation();

  const {
    prediction,
    isDirty,
    isValid,
    validation,
    addSong,
    addNonSongItem,
    removeItem,
    updateItem,
    reorderItems,
    clearItems,
    updateMetadata,
    save
  } = usePredictionBuilder({
    performanceId,
    initialPrediction,
    autosave: true,
    onSave
  });

  const [predictionName, setPredictionName] = useState(prediction.name);

  const handleSave = () => {
    updateMetadata({ name: predictionName });
    save();
  };

  return (
    <Stack w="full" h="full" gap={0}>
      {/* Prediction Name Bar */}
      <Box p={4} borderBottomWidth="1px" bgColor="bg.muted">
        <HStack gap={2} alignItems="center">
          <Input
            value={predictionName}
            onChange={(e) => setPredictionName(e.target.value)}
            placeholder={t('setlistPrediction.predictionNamePlaceholder', {
              defaultValue: 'Enter prediction name...'
            })}
            flex={1}
          />
          <Button onClick={handleSave} disabled={!isDirty}>
            {t('common.save', { defaultValue: 'Save' })}
          </Button>
          <Button variant="subtle" onClick={clearItems}>
            {t('common.clear', { defaultValue: 'Clear' })}
          </Button>
        </HStack>

        {/* Validation Messages */}
        {!isValid && (
          <Box mt={2} p={2} bgColor="bg.error" borderRadius="md">
            <Text fontSize="xs" color="fg.error">
              {validation.errors[0]}
            </Text>
          </Box>
        )}

        {/* Dirty indicator */}
        {isDirty && (
          <Text fontSize="xs" color="fg.muted" mt={2}>
            {t('common.unsavedChanges', { defaultValue: 'Unsaved changes' })}
          </Text>
        )}
      </Box>

      {/* Main Content - Three Panel Layout */}
      <HStack flex={1} overflow="hidden" gap={0} alignItems="stretch">
        {/* Left Panel: Song Search */}
        <Box
          w="300px"
          borderRightWidth="1px"
          overflow="auto"
          p={4}
          bgColor="bg.default"
          hideBelow="md"
        >
          <Stack gap={3}>
            <Text fontSize="lg" fontWeight="bold">
              {t('setlistPrediction.songSearch', { defaultValue: 'Song Search' })}
            </Text>

            <Input
              placeholder={t('setlistPrediction.searchSongs', {
                defaultValue: 'Search songs...'
              })}
            />

            <Box p={4} borderWidth="1px" borderRadius="md" bgColor="bg.muted">
              <Text fontSize="sm" color="fg.muted">
                {t('setlistPrediction.songSearchPlaceholder', {
                  defaultValue: 'Song search coming soon...'
                })}
              </Text>
            </Box>

            {/* Quick Add Buttons */}
            <Stack gap={2}>
              <Text fontSize="sm" fontWeight="medium">
                {t('setlistPrediction.quickAdd', { defaultValue: 'Quick Add' })}
              </Text>
              <Button
                size="sm"
                onClick={() =>
                  addNonSongItem('MC①', 'mc', prediction.setlist.items.length)
                }
              >
                + MC
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  addNonSongItem('VTR', 'vtr', prediction.setlist.items.length)
                }
              >
                + VTR
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  addNonSongItem('Opening', 'opening', prediction.setlist.items.length)
                }
              >
                + Opening
              </Button>
            </Stack>
          </Stack>
        </Box>

        {/* Center Panel: Setlist Editor */}
        <Box flex={1} overflow="auto" bgColor="bg.subtle">
          <SetlistEditorPanel
            items={prediction.setlist.items}
            onReorder={reorderItems}
            onRemove={removeItem}
            onUpdate={updateItem}
          />
        </Box>

        {/* Right Panel: Context/Actions */}
        <Box
          w="300px"
          borderLeftWidth="1px"
          overflow="auto"
          p={4}
          bgColor="bg.default"
          hideBelow="lg"
        >
          <Stack gap={4}>
            <Text fontSize="lg" fontWeight="bold">
              {t('setlistPrediction.actions', { defaultValue: 'Actions' })}
            </Text>

            {/* Stats */}
            <Box p={3} borderWidth="1px" borderRadius="md" bgColor="bg.muted">
              <Stack gap={1}>
                <Text fontSize="sm" fontWeight="medium">
                  {t('setlistPrediction.stats', { defaultValue: 'Stats' })}
                </Text>
                <Text fontSize="xs">
                  {t('setlistPrediction.totalSongs', {
                    count: prediction.setlist.totalSongs,
                    defaultValue: `${prediction.setlist.totalSongs} songs`
                  })}
                </Text>
                <Text fontSize="xs">
                  {t('setlistPrediction.totalItems', {
                    count: prediction.setlist.items.length,
                    defaultValue: `${prediction.setlist.items.length} total items`
                  })}
                </Text>
              </Stack>
            </Box>

            {/* Export/Share */}
            <ExportShareTools prediction={prediction} performance={performance} />

            {/* Help */}
            <Box p={3} borderWidth="1px" borderRadius="md" bgColor="bg.emphasized">
              <Text fontSize="xs" color="fg.muted">
                {t('setlistPrediction.builderHelp', {
                  defaultValue:
                    'Drag songs from the left panel to build your prediction. Reorder by dragging items in the center panel.'
                })}
              </Text>
            </Box>
          </Stack>
        </Box>
      </HStack>
    </Stack>
  );
}
