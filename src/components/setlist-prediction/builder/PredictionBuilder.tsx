/**
 * Main Prediction Builder Component
 * Three-panel layout: Song Search | Setlist Editor | Context/Actions
 */

import { useTranslation } from 'react-i18next';
import { useState, useCallback, useMemo } from 'react';
import { MeasuringStrategy, closestCenter, DndContext, DragOverlay, useSensors, useSensor, PointerSensor, TouchSensor, KeyboardSensor, DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { BiPlus } from 'react-icons/bi';
import { AddItemDrawer } from './AddItemDrawer';
import { MdDragIndicator } from 'react-icons/md';
import artistsData from '../../../../data/artists-info.json';
import { SetlistEditorPanel } from './SetlistEditorPanel';
import { SongSearchPanel } from './SongSearchPanel';
import { DraggableQuickAddItem } from './DraggableQuickAddItem';
import { ImportDialog } from './ImportDialog';
import { ExportShareTools } from './ExportShareTools';
import { Drawer } from '~/components/ui/drawer';

import { Box, Stack, HStack } from 'styled-system/jsx';
import { Button } from '~/components/ui/styled/button';
import { IconButton } from '~/components/ui/styled/icon-button';
import { Input } from '~/components/ui/styled/input';
import { Text } from '~/components/ui/styled/text';
import type {
  SetlistPrediction,
  Performance,
  SetlistItem as SetlistItemType
} from '~/types/setlist-prediction';
import { usePredictionBuilder } from '~/hooks/setlist-prediction/usePredictionBuilder';
import { useSongData } from '~/hooks/useSongData';
import { getSongColor } from '~/utils/song';
import type { Song } from '~/types';

export interface PredictionBuilderProps {
  performanceId: string;
  initialPrediction?: SetlistPrediction;
  performance?: Performance;
  onSave?: (prediction: SetlistPrediction) => void;
}

/**
 * Drag Preview Component - rendered inside DragOverlay
 */
function DragPreview({ activeData }: { activeData: Record<string, unknown> | null }) {
  const songData = useSongData();

  if (!activeData) {
    return null;
  }

  const sourceData = activeData;

  // Handle search result preview
  if (sourceData.type === 'search-result') {
    const songId = sourceData.songId as string;
    const songName = sourceData.songName as string;
    const songs = Array.isArray(songData) ? songData : [];
    const songDetails = songs.find((song: Song) => String(song.id) === String(songId));
    const songColor = songDetails ? getSongColor(songDetails) : undefined;

    // Get artist name
    const artistId = songDetails?.artists?.[0];
    const artist = artistId ? artistsData.find((a) => a.id === artistId) : null;

    return (
      <Box
        borderLeft={songColor ? '4px solid' : undefined}
        borderColor={songColor ? songColor : undefined}
        borderRadius="md"
        minW="250px"
        py={2}
        px={3}
        opacity={0.95}
        bgColor="bg.default"
        shadow="lg"
        cursor="grabbing"
      >
        <HStack gap={2} alignItems="flex-start">
          <Box pt={1}>
            <MdDragIndicator size={16} />
          </Box>
          <Stack flex={1} gap={0.5}>
            <Text fontSize="sm" fontWeight="medium">
              {songName}
            </Text>
            {artist?.name && (
              <Text style={{ color: songColor }} fontSize="xs" fontWeight="medium">
                {artist.name}
              </Text>
            )}
          </Stack>
        </HStack>
      </Box>
    );
  }

  // Handle setlist item preview
  if (sourceData.type === 'setlist-item') {
    const item = sourceData.item as SetlistItemType;
    const songDetails = sourceData.songDetails as Song | undefined;
    const songColor = songDetails ? getSongColor(songDetails) : undefined;

    // Get artist name
    const artistId = songDetails?.artists?.[0];
    const artist = artistId ? artistsData.find((a) => a.id === artistId) : null;

    return (
      <Box
        borderLeft={item.type === 'song' && songColor ? '4px solid' : undefined}
        borderColor={item.type === 'song' && songColor ? songColor : undefined}
        borderRadius="md"
        minW="250px"
        py={2}
        px={3}
        opacity={0.95}
        bgColor="bg.default"
        shadow="lg"
        cursor="grabbing"
      >
        <HStack gap={2} alignItems="flex-start">
          <Box pt={1}>
            <MdDragIndicator size={16} />
          </Box>
          <Stack flex={1} gap={0.5}>
            {item.type === 'song' ? (
              <>
                <Text fontSize="sm" fontWeight="medium">
                  {item.isCustomSong
                    ? item.customSongName
                    : songDetails?.name || item.customSongName || `Song ${item.songId}`}
                </Text>
                {!item.isCustomSong && (item.remarks || artist?.name) && (
                  <Text color="fg.muted" fontSize="xs">
                    {item.remarks || artist?.name}
                  </Text>
                )}
              </>
            ) : (
              <>
                <Text fontSize="sm" fontWeight="medium">
                  {item.title}
                </Text>
                {item.remarks && (
                  <Text color="fg.muted" fontSize="xs">
                    {item.remarks}
                  </Text>
                )}
              </>
            )}
          </Stack>
        </HStack>
      </Box>
    );
  }

  // Handle quick-add item preview
  if (sourceData.type === 'quick-add-item') {
    const title = sourceData.title as string;

    return (
      <Box
        borderRadius="md"
        minW="250px"
        py={2}
        px={3}
        opacity={0.95}
        bgColor="bg.default"
        shadow="lg"
        cursor="grabbing"
      >
        <HStack gap={2} alignItems="flex-start">
          <Box pt={1}>
            <MdDragIndicator size={16} />
          </Box>
          <Stack flex={1} gap={0.5}>
            <Text fontSize="sm" fontWeight="medium">
              {title}
            </Text>
          </Stack>
        </HStack>
      </Box>
    );
  }

  return null;
}

export function PredictionBuilder({
  performanceId,
  initialPrediction,
  performance,
  onSave
}: PredictionBuilderProps) {
  const { t } = useTranslation();
  const songData = useSongData();

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
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [addItemDrawerOpen, setAddItemDrawerOpen] = useState(false);

  // Track active drag state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeData, setActiveData] = useState<Record<string, unknown> | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  // Calculate drop indicator for visual feedback (without triggering reorders)
  const dropIndicator = useMemo(() => {
    if (!activeId || !overId || !activeData) return null;

    // Skip if we're dragging over the drop zone itself
    if (overId === 'setlist-drop-zone') return null;

    const overData = prediction.setlist.items.find((item) => item.id === overId);
    if (!overData) return null;

    // Show indicator for cross-list dragging (search to setlist)
    if (activeData.type === 'search-result') {
      const songs = Array.isArray(songData) ? songData : [];
      const songId = activeData.songId as string;
      const songDetails = songs.find((song: Song) => String(song.id) === String(songId));

      const tempItem: SetlistItemType = {
        id: `temp-${songId}`,
        type: 'song' as const,
        songId: String(songId),
        isCustomSong: false,
        position: 0
      };

      return {
        itemId: overId,
        position: 'top' as const,
        draggedItem: tempItem,
        songDetails
      };
    }

    // Show indicator for quick-add items (MC/Encore/Other)
    if (activeData.type === 'quick-add-item') {
      const title = activeData.title as string;
      const itemType = activeData.itemType as 'mc' | 'other';

      const tempItem: SetlistItemType = {
        id: `temp-quick-add`,
        type: itemType,
        title: title,
        position: 0
      };

      return {
        itemId: overId,
        position: 'top' as const,
        draggedItem: tempItem,
        songDetails: undefined
      };
    }

    return null;
  }, [activeId, overId, activeData, prediction.setlist.items, songData]);

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
    setActiveData((event.active.data.current as Record<string, unknown>) || null);
  }, []);

  // Handle drag over - only track position, don't update items yet
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    setOverId(over ? String(over.id) : null);
  }, []);

  // Handle drag end - commit changes
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      // Clear active state
      setActiveId(null);
      setActiveData(null);
      setOverId(null);

      const { active, over } = event;

      // If no target, don't do anything
      if (!over) {
        return;
      }

      const activeData = active.data.current;
      const overData = over.data.current;

      // Handle cross-list dragging (search to setlist)
      if (activeData?.type === 'search-result') {
        const { songId } = activeData;
        const currentItems = prediction.setlist.items;
        let insertPosition = currentItems.length;

        // Find insert position if dropping over an item
        if (over.id !== 'setlist-drop-zone') {
          const overIndex = currentItems.findIndex((item) => item.id === over.id);
          if (overIndex !== -1) {
            insertPosition = overIndex;
          }
        }

        // Add the song at the correct position
        _addSong(songId, insertPosition);
        return;
      }

      // Handle quick-add items (MC/Encore/Other)
      if (activeData?.type === 'quick-add-item') {
        const { title, itemType } = activeData;
        const currentItems = prediction.setlist.items;
        let insertPosition = currentItems.length;

        // Find insert position if dropping over an item
        if (over.id !== 'setlist-drop-zone') {
          const overIndex = currentItems.findIndex((item) => item.id === over.id);
          if (overIndex !== -1) {
            insertPosition = overIndex;
          }
        }

        // Add the non-song item at the correct position
        addNonSongItem(title as string, itemType as 'mc' | 'other', insertPosition);
        return;
      }

      // Handle within-list reordering
      if (activeData?.type === 'setlist-item' && overData?.type === 'setlist-item') {
        const draggedItem = activeData.item;
        const currentItems = prediction.setlist.items;
        const activeIndex = currentItems.findIndex((item) => item.id === draggedItem.id);
        const overIndex = currentItems.findIndex((item) => item.id === over.id);

        if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
          const newItems = arrayMove(currentItems, activeIndex, overIndex);
          reorderItems(newItems);
        }
      }
    },
    [prediction.setlist.items, _addSong, reorderItems]
  );

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

  const handleAddQuickItem = (title: string, type: 'mc' | 'other') => {
    addNonSongItem(title, type, prediction.setlist.items.length);
  };

  const handleImport = (imported: SetlistPrediction) => {
    // Replace current prediction with imported one
    reorderItems(imported.setlist.items);
    updateMetadata({ name: imported.name });
  };

  const moveItemUp = (index: number) => {
    if (index <= 0) return;
    const currentItems = prediction.setlist.items;
    const newItems = arrayMove(currentItems, index, index - 1);
    reorderItems(newItems);
  };

  const moveItemDown = (index: number) => {
    const currentItems = prediction.setlist.items;
    if (index >= currentItems.length - 1) return;
    const newItems = arrayMove(currentItems, index, index + 1);
    reorderItems(newItems);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 0,
        tolerance: 5
      }
    }),
    useSensor(KeyboardSensor)
  );

  // Measuring configuration for better performance
  const measuring = useMemo(
    () => ({
      droppable: {
        strategy: MeasuringStrategy.WhileDragging
      }
    }),
    []
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      measuring={measuring}
    >
      <Stack gap={0} w="full" h="full">
        {/* Prediction Name Bar */}
        <Box 
          borderBottomWidth="1px" 
          p={4} 
          bgColor="bg.muted"
          position="sticky"
          top={0}
          zIndex={20}
        >
          {/* Desktop: Single Line */}
          <HStack gap={2} alignItems="center" hideBelow="md">
            <Input
              value={predictionName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder={t('setlistPrediction.predictionNamePlaceholder', {
                defaultValue: 'Enter prediction name...'
              })}
              flex={1}
            />
            
            <HStack gap={2}>
              <Button onClick={handleSave} disabled={!isDirty}>
                {t('common.save', { defaultValue: 'Save' })}
              </Button>
              <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
                {t('common.import', { defaultValue: 'Import' })}
              </Button>
              <Button variant="subtle" onClick={clearItems}>
                {t('common.clear', { defaultValue: 'Clear' })}
              </Button>
            </HStack>
          </HStack>

          {/* Mobile: Two Lines */}
          <Stack gap={2} hideFrom="md">
            {/* Line 1: Menu + Input + Save */}
            <HStack gap={2} alignItems="center">
              <IconButton
                variant="ghost"
                size="sm"
                onClick={() => setLeftSidebarOpen(true)}
                aria-label="Open song search"
              >
                <BiPlus size={20} />
              </IconButton>
              <Input
                value={predictionName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder={t('setlistPrediction.predictionNamePlaceholder', {
                  defaultValue: 'Enter prediction name...'
                })}
                flex={1}
              />
              <Button onClick={handleSave} disabled={!isDirty} size="sm">
                {t('common.save', { defaultValue: 'Save' })}
              </Button>
            </HStack>

            {/* Line 2: Import + Clear */}
            <HStack gap={2}>
              <Button variant="outline" onClick={() => setImportDialogOpen(true)} size="sm" flex={1}>
                {t('common.import', { defaultValue: 'Import' })}
              </Button>
              <Button variant="subtle" onClick={clearItems} size="sm" flex={1}>
                {t('common.clear', { defaultValue: 'Clear' })}
              </Button>
            </HStack>
          </Stack>
        </Box>

        {/* Main Content - Three Panel Layout */}
        <HStack position="relative" flex={1} gap={0} alignItems="stretch" overflow="hidden">
          {/* Left Panel: Song Search - Desktop */}
          <Box
            hideBelow="md"
            borderRightWidth="1px"
            w="300px"
            p={4}
            bgColor="bg.default"
            overflow="auto"
          >
            <Stack gap={3}>
              <SongSearchPanel onAddSong={handleAddSong} onAddCustomSong={handleAddCustomSong} />

              {/* Quick Add Items */}
              <Stack gap={2}>
                <Text fontSize="sm" fontWeight="medium">
                  {t('setlistPrediction.quickAdd', { defaultValue: 'Quick Add' })}
                </Text>
                <Text color="fg.muted" fontSize="xs">
                  {t('setlistPrediction.quickAddHint', { defaultValue: 'Drag items into setlist' })}
                </Text>
                <DraggableQuickAddItem id="mc" title="MC①" type="mc" />
                <DraggableQuickAddItem id="encore" title="━━ ENCORE ━━" type="other" />
                <DraggableQuickAddItem id="intermission" title="━━ INTERMISSION ━━" type="other" />
              </Stack>
            </Stack>
          </Box>

          {/* Left Panel: Song Search - Mobile Drawer */}
          <Drawer.Root 
            open={leftSidebarOpen} 
            onOpenChange={(details) => setLeftSidebarOpen(details.open)}
          >
            <Drawer.Backdrop hideFrom="md" />
            <Drawer.Positioner hideFrom="md">
              <Drawer.Content>
                <Drawer.Header>
                  <Drawer.Title>{t('setlistPrediction.songSearch', { defaultValue: 'Song Search' })}</Drawer.Title>
                  <Drawer.CloseTrigger />
                </Drawer.Header>
                <Drawer.Body>
                  <Stack gap={3}>
                    <SongSearchPanel onAddSong={handleAddSong} onAddCustomSong={handleAddCustomSong} />

                    {/* Quick Add Items */}
                    <Stack gap={2}>
                      <Text fontSize="sm" fontWeight="medium">
                        {t('setlistPrediction.quickAdd', { defaultValue: 'Quick Add' })}
                      </Text>
                      <Text color="fg.muted" fontSize="xs">
                        {t('setlistPrediction.quickAddHint', { defaultValue: 'Drag items into setlist' })}
                      </Text>
                      <DraggableQuickAddItem id="mc" title="MC①" type="mc" />
                      <DraggableQuickAddItem id="encore" title="━━ ENCORE ━━" type="other" />
                      <DraggableQuickAddItem id="intermission" title="━━ INTERMISSION ━━" type="other" />
                    </Stack>
                  </Stack>
                </Drawer.Body>
              </Drawer.Content>
            </Drawer.Positioner>
          </Drawer.Root>

          {/* Center Panel: Setlist Editor */}
          <Box flex={1} bgColor="bg.subtle" overflow="auto">
            <SetlistEditorPanel
              items={prediction.setlist.items}
              onReorder={reorderItems}
              onRemove={removeItem}
              onUpdate={updateItem}
              onMoveUp={moveItemUp}
              onMoveDown={moveItemDown}
              onOpenImport={() => setImportDialogOpen(true)}
              dropIndicator={dropIndicator}
            />
            {/* Mobile Add Button (FAB) */}
            <Box
              position="fixed"
              bottom={6}
              right={6}
              zIndex={100}
              hideFrom="md"
            >
              <IconButton
                size="lg"
                onClick={() => setAddItemDrawerOpen(true)}
                shadow="lg"
                borderRadius="full"
                bgColor="accent.default"
                color="accent.fg"
                _hover={{ bgColor: 'accent.emphasized' }}
              >
                <BiPlus size={24} />
              </IconButton>
            </Box>
          </Box>

          {/* Right Panel: Actions - Desktop */}
          <Box
            hideBelow="lg"
            borderLeftWidth="1px"
            w="300px"
            p={4}
            bgColor="bg.default"
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

          {/* Right Panel: Actions - Mobile Drawer */}
          <Drawer.Root 
            open={rightSidebarOpen} 
            onOpenChange={(details) => setRightSidebarOpen(details.open)}
          >
            <Drawer.Backdrop hideFrom="lg" />
            <Drawer.Positioner hideFrom="lg">
              <Drawer.Content>
                <Drawer.Header>
                  <Drawer.Title>{t('setlistPrediction.actions', { defaultValue: 'Actions' })}</Drawer.Title>
                  <Drawer.CloseTrigger />
                </Drawer.Header>
                <Drawer.Body>
                  <Stack gap={4}>
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
                </Drawer.Body>
              </Drawer.Content>
            </Drawer.Positioner>
          </Drawer.Root>
        </HStack>

        {/* Import Dialog */}
        <ImportDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          onImport={handleImport}
          performanceId={performanceId}
        />
      </Stack>

      {/* Drag Overlay - provides visual feedback during drag */}
      <DragOverlay>{activeId ? <DragPreview activeData={activeData} /> : null}</DragOverlay>

      <AddItemDrawer
        isOpen={addItemDrawerOpen}
        onClose={() => setAddItemDrawerOpen(false)}
        onAddSong={handleAddSong}
        onAddCustomSong={handleAddCustomSong}
        onAddQuickItem={handleAddQuickItem}
      />
    </DndContext>
  );
}
