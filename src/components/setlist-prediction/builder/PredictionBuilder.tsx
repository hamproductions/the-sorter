/**
 * Main Prediction Builder Component
 * Three-panel layout: Song Search | Setlist Editor | Context/Actions
 */

import { useTranslation } from 'react-i18next';
import { useState, useRef, useEffect } from 'react';
import { DragDropProvider, KeyboardSensor, PointerSensor } from '@dnd-kit/react';
import { BiMenu, BiX } from 'react-icons/bi';
import { SetlistEditorPanel } from './SetlistEditorPanel';
import { ExportShareTools } from './ExportShareTools';
import { SongSearchPanel } from './SongSearchPanel';
import { ImportDialog } from './ImportDialog';
import { Box, Stack, HStack } from 'styled-system/jsx';
import { Button } from '~/components/ui/styled/button';
import { IconButton } from '~/components/ui/styled/icon-button';
import { Input } from '~/components/ui/styled/input';
import { Text } from '~/components/ui/styled/text';
import type { SetlistPrediction, Performance } from '~/types/setlist-prediction';
import { usePredictionBuilder } from '~/hooks/setlist-prediction/usePredictionBuilder';

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
    addSong: _addSong,
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
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [otherItemText, setOtherItemText] = useState('');
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

  // State for drag operations
  const [items, setItems] = useState(prediction.setlist.items);
  const [previewItem, setPreviewItem] = useState<any>(null);
  const lastOverRef = useRef<any>(null);

  // Sync items with prediction
  useEffect(() => {
    setItems(prediction.setlist.items);
  }, [prediction.setlist.items]);

  // Handle drag over - only for cross-list preview
  const handleDragOver = (event: any) => {
    const active = event?.operation?.source;
    const over = event?.operation?.target;

    lastOverRef.current = over;

    if (!active || !over) {
      setPreviewItem(null);
      return;
    }

    // Only handle preview for cross-list dragging (search to setlist)
    if (active.data?.type === 'search-result') {
      if (over.id === 'setlist-drop-zone') {
        setPreviewItem({
          songId: active.data.songId,
          songName: active.data.songName,
          insertIndex: items.length
        });
      } else {
        const overIndex = items.findIndex((item) => item.id === over.id);
        if (overIndex !== -1) {
          setPreviewItem({
            songId: active.data.songId,
            songName: active.data.songName,
            insertIndex: overIndex
          });
        }
      }
    } else {
      // For within-list, let useSortable handle the visual reordering
      setPreviewItem(null);
    }
  };

  // Handle drag end - commit changes or revert on cancel
  const handleDragEnd = (event: any) => {
    console.log('[DRAG END] Called!', event);
    console.log('[DRAG END] Full event:', JSON.stringify(event, null, 2));
    const active = event?.operation?.source;
    const over = lastOverRef.current;

    // Debug logging to window object so we can inspect it
    if (!window.__dragDebug) window.__dragDebug = [];
    window.__dragDebug.push({
      timestamp: Date.now(),
      activeType: active?.data?.type,
      hasOver: !!over,
      overId: over?.id,
      eventCanceled: event?.canceled,
      hasActive: !!active,
      fullEvent: event
    });

    setPreviewItem(null);
    lastOverRef.current = null;

    // If drag was cancelled, don't do anything
    if (event?.canceled) {
      console.log('[DRAG END] Cancelled');
      window.__dragDebug.push({ action: 'CANCELLED' });
      return;
    }

    if (!active) {
      console.log('[DRAG END] No active', { active });
      window.__dragDebug.push({ action: 'NO_ACTIVE' });
      return;
    }

    console.log('[DRAG END] Active type:', active.data?.type);
    console.log('[DRAG END] Active data:', active.data);
    console.log('[DRAG END] Over:', over);
    window.__dragDebug.push({ action: 'PROCESSING', activeType: active.data?.type });

    // Handle cross-list dragging (search to setlist)
    if (active.data?.type === 'search-result') {
      if (!over) {
        console.log('[DRAG END] No over target for cross-list drag');
        return;
      }

      const { songId } = active.data;
      let insertPosition = items.length;

      if (over.id !== 'setlist-drop-zone') {
        const overIndex = items.findIndex((item) => item.id === over.id);
        if (overIndex !== -1) {
          insertPosition = overIndex;
        }
      }

      _addSong(songId, insertPosition);
      return;
    }

    // Handle within-list reordering
    if (active.data?.type === 'setlist-item') {
      console.log('[DRAG END] Within-list reorder detected');
      window.__dragDebug.push({ action: 'WITHIN_LIST_DETECTED' });

      if (!over) {
        console.log('[DRAG END] No over target for within-list drag');
        window.__dragDebug.push({ action: 'NO_OVER' });
        return;
      }

      // Get the dragged item and the target item
      const draggedItem = active.data.item;
      const activeIndex = items.findIndex((item) => item.id === draggedItem.id);
      const overIndex = items.findIndex((item) => item.id === over.id);

      console.log('[DRAG END] Active index:', activeIndex, 'Over index:', overIndex);
      window.__dragDebug.push({
        action: 'INDICES',
        activeIndex,
        overIndex,
        draggedItemId: draggedItem.id,
        overItemId: over.id
      });

      if (activeIndex === -1 || overIndex === -1) {
        console.log('[DRAG END] Could not find indices');
        window.__dragDebug.push({ action: 'INVALID_INDICES' });
        return;
      }

      if (activeIndex === overIndex) {
        console.log('[DRAG END] Same position, no change needed');
        window.__dragDebug.push({ action: 'SAME_POSITION' });
        return;
      }

      // Create new array with reordered items
      const newItems = [...items];
      const [removed] = newItems.splice(activeIndex, 1);
      newItems.splice(overIndex, 0, removed);

      console.log('[DRAG END] Calling reorderItems!');
      console.log('[DRAG END] Moved from index', activeIndex, 'to', overIndex);
      window.__dragDebug.push({ action: 'CALLING_REORDER', from: activeIndex, to: overIndex });
      reorderItems(newItems);
      window.__dragDebug.push({ action: 'REORDER_CALLED' });
    }
  };

  const handleSave = () => {
    updateMetadata({ name: predictionName });
    save();
  };

  const handleNameChange = (name: string) => {
    setPredictionName(name);
    updateMetadata({ name });
  };

  const handleAddSong = (songId: string, _songTitle: string) => {
    _addSong(songId, prediction.setlist.items.length);
  };

  const handleAddCustomSong = (customName: string) => {
    // Generate a unique ID for the custom song
    const customSongId = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    _addSong(customSongId, prediction.setlist.items.length, {
      isCustomSong: true,
      customSongName: customName
    });
  };

  const handleImport = (imported: SetlistPrediction) => {
    // Replace current prediction with imported one
    reorderItems(imported.setlist.items);
    updateMetadata({ name: imported.name });
  };

  const sensors = [
    PointerSensor.configure({
      activatorElements(source) {
        return [source.element, source.handle];
      }
    }),
    KeyboardSensor
  ];

  return (
    <DragDropProvider
      sensors={sensors}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <Stack gap={0} w="full" h="full">
        {/* Prediction Name Bar */}
        <Box borderBottomWidth="1px" p={4} bgColor="bg.muted">
          <HStack gap={2} alignItems="center">
            <Input
              value={predictionName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder={t('setlistPrediction.predictionNamePlaceholder', {
                defaultValue: 'Enter prediction name...'
              })}
              flex={1}
            />
            <Button onClick={handleSave} disabled={!isDirty}>
              {t('common.save', { defaultValue: 'Save' })}
            </Button>
            <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
              {t('common.import', { defaultValue: 'Import' })}
            </Button>
            <Button variant="subtle" onClick={clearItems}>
              {t('common.clear', { defaultValue: 'Clear' })}
            </Button>
            {/* Toggle for left sidebar (song search) on small screens */}
            <IconButton
              variant="outline"
              onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
              aria-label="Toggle song search panel"
              hideFrom="md"
            >
              {leftSidebarOpen ? <BiX size={20} /> : <BiMenu size={20} />}
            </IconButton>
            {/* Toggle for right sidebar on small screens */}
            <IconButton
              variant="outline"
              onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
              aria-label="Toggle actions panel"
              hideFrom="lg"
            >
              {rightSidebarOpen ? <BiX size={20} /> : <BiMenu size={20} />}
            </IconButton>
          </HStack>

          {/* Validation Messages */}
          {!isValid && (
            <Box borderRadius="md" mt={2} p={2} bgColor="bg.error">
              <Text color="fg.error" fontSize="xs">
                {validation.errors[0]}
              </Text>
            </Box>
          )}

          {/* Dirty indicator */}
          {isDirty && (
            <Text mt={2} color="fg.muted" fontSize="xs">
              {t('common.unsavedChanges', { defaultValue: 'Unsaved changes' })}
            </Text>
          )}
        </Box>

        {/* Main Content - Three Panel Layout */}
        <HStack position="relative" flex={1} gap={0} alignItems="stretch" overflow="hidden">
          {/* Backdrop for mobile sidebar */}
          {(leftSidebarOpen || rightSidebarOpen) && (
            <Box
              onClick={() => {
                setLeftSidebarOpen(false);
                setRightSidebarOpen(false);
              }}
              hideFrom={{ base: leftSidebarOpen ? 'md' : 'lg', md: 'lg' }}
              zIndex={9}
              position="absolute"
              inset={0}
              opacity={0.5}
              bgColor="black"
            />
          )}

          {/* Left Panel: Song Search */}
          <Box
            display={{
              base: leftSidebarOpen ? 'block' : 'none',
              md: 'block'
            }}
            zIndex={{
              base: 10,
              md: 'auto'
            }}
            position={{
              base: 'absolute',
              md: 'relative'
            }}
            top={{
              base: 0,
              md: 'auto'
            }}
            left={{
              base: 0,
              md: 'auto'
            }}
            bottom={{
              base: 0,
              md: 'auto'
            }}
            borderRightWidth="1px"
            w="300px"
            p={4}
            bgColor="bg.default"
            shadow={{
              base: 'lg',
              md: 'none'
            }}
            overflow="auto"
          >
            <Stack gap={3}>
              <SongSearchPanel onAddSong={handleAddSong} onAddCustomSong={handleAddCustomSong} />

              {/* Quick Add Buttons */}
              <Stack gap={2}>
                <Text fontSize="sm" fontWeight="medium">
                  {t('setlistPrediction.quickAdd', { defaultValue: 'Quick Add' })}
                </Text>
                <Button
                  size="sm"
                  onClick={() => addNonSongItem('MC①', 'mc', prediction.setlist.items.length)}
                >
                  + MC
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    addNonSongItem('━━ ENCORE ━━', 'other', prediction.setlist.items.length)
                  }
                >
                  + Encore Break
                </Button>
                <HStack gap={1}>
                  <Input
                    size="sm"
                    value={otherItemText}
                    onChange={(e) => setOtherItemText(e.target.value)}
                    placeholder="VTR, Opening, etc..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && otherItemText.trim()) {
                        addNonSongItem(
                          otherItemText.trim(),
                          'other',
                          prediction.setlist.items.length
                        );
                        setOtherItemText('');
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (otherItemText.trim()) {
                        addNonSongItem(
                          otherItemText.trim(),
                          'other',
                          prediction.setlist.items.length
                        );
                        setOtherItemText('');
                      }
                    }}
                    disabled={!otherItemText.trim()}
                  >
                    +
                  </Button>
                </HStack>
              </Stack>
            </Stack>
          </Box>

          {/* Center Panel: Setlist Editor */}
          <Box flex={1} bgColor="bg.subtle" overflow="auto">
            <SetlistEditorPanel
              items={prediction.setlist.items}
              previewItem={previewItem}
              onReorder={reorderItems}
              onRemove={removeItem}
              onUpdate={updateItem}
              onOpenImport={() => setImportDialogOpen(true)}
            />
          </Box>

          {/* Right Panel: Context/Actions */}
          <Box
            display={{
              base: rightSidebarOpen ? 'block' : 'none',
              lg: 'block'
            }}
            zIndex={{
              base: 10,
              lg: 'auto'
            }}
            position={{
              base: 'absolute',
              lg: 'relative'
            }}
            top={{
              base: 0,
              lg: 'auto'
            }}
            right={{
              base: 0,
              lg: 'auto'
            }}
            bottom={{
              base: 0,
              lg: 'auto'
            }}
            borderLeftWidth="1px"
            w="300px"
            p={4}
            bgColor="bg.default"
            shadow={{
              base: 'lg',
              lg: 'none'
            }}
            overflow="auto"
          >
            <Stack gap={4}>
              <Text fontSize="lg" fontWeight="bold">
                {t('setlistPrediction.actions', { defaultValue: 'Actions' })}
              </Text>

              {/* Stats */}
              <Box borderRadius="md" borderWidth="1px" p={3} bgColor="bg.muted">
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
              <Box borderRadius="md" borderWidth="1px" p={3} bgColor="bg.emphasized">
                <Text color="fg.muted" fontSize="xs">
                  {t('setlistPrediction.builderHelp', {
                    defaultValue:
                      'Drag songs from the left panel to build your prediction. Reorder by dragging items in the center panel.'
                  })}
                </Text>
              </Box>
            </Stack>
          </Box>
        </HStack>

        {/* Import Dialog */}
        <ImportDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          onImport={handleImport}
          performanceId={performanceId}
        />
      </Stack>
    </DragDropProvider>
  );
}
