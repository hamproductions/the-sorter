/**
 * Main Prediction Builder Component
 * Three-panel layout: Song Search | Setlist Editor | Context/Actions
 */

import { useTranslation } from 'react-i18next';
import { useState, useCallback, useMemo } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  DragOverlay,
  closestCenter,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  MeasuringStrategy
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { BiMenu, BiX } from 'react-icons/bi';
import { MdDragIndicator } from 'react-icons/md';
import artistsData from '../../../../data/artists-info.json';
import { SetlistEditorPanel } from './SetlistEditorPanel';
import { ExportShareTools } from './ExportShareTools';
import { SongSearchPanel } from './SongSearchPanel';
import { ImportDialog } from './ImportDialog';
import { DraggableQuickAddItem } from './DraggableQuickAddItem';
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

  // Track active drag state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeData, setActiveData] = useState<Record<string, unknown> | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  // Calculate drop indicator for visual feedback (without triggering reorders)
  const dropIndicator = useMemo(() => {
    if (!activeId || !overId || !activeData) return null;

    // Handle end position droppable (invisible elements after setlist)
    // Need both setlist-drop-zone and setlist-drop-zone-end since
    // setlist-drop-zone only seems to cover the area far below the last item
    // but setlist-drop-zone-end fills in the gap between the last item and the setlist-drop-zone
    if (overId === 'setlist-drop-zone-end' || overId === 'setlist-drop-zone') {
      // set overid to be the last item's id
      const overId = prediction.setlist.items[prediction.setlist.items.length - 1]?.id;
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

        // render at bottom of last item
        return {
          itemId: overId,
          position: 'bottom' as const,
          draggedItem: tempItem,
          songDetails
        };
      }

      if (activeData.type === 'quick-add-item') {
        const title = activeData.title as string;
        const itemType = activeData.itemType as 'mc' | 'other';

        const tempItem: SetlistItemType = {
          id: `temp-quick-add`,
          type: itemType,
          title: title,
          position: 0
        };

        // render at bottom of last item
        return {
          itemId: overId,
          position: 'bottom' as const,
          draggedItem: tempItem,
          songDetails: undefined
        };
      }

      return null;
    }

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

        // Find insert position if dropping over an item (not the zone itself or end droppable)
        if (over.id !== 'setlist-drop-zone' && over.id !== 'setlist-drop-zone-end') {
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

        // Find insert position if dropping over an item (not the zone itself or end droppable)
        if (over.id !== 'setlist-drop-zone' && over.id !== 'setlist-drop-zone-end') {
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

  const handleImport = (imported: SetlistPrediction) => {
    // Replace current prediction with imported one
    reorderItems(imported.setlist.items);
    updateMetadata({ name: imported.name });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
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
      },
      draggable: {
        measure: (element: HTMLElement) => element.getBoundingClientRect()
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

              {/* Quick Add Items */}
              <Stack gap={2}>
                <Text fontSize="sm" fontWeight="medium">
                  {t('setlistPrediction.quickAdd', { defaultValue: 'Quick Add' })}
                </Text>
                <Text color="fg.muted" fontSize="xs">
                  {t('setlistPrediction.quickAddHint', {
                    defaultValue: 'Drag into setlist or double-click to add to bottom'
                  })}
                </Text>
                <DraggableQuickAddItem
                  id="mc"
                  title="MC"
                  type="mc"
                  onDoubleClick={() => addNonSongItem('MC', 'mc', prediction.setlist.items.length)}
                />
                <DraggableQuickAddItem
                  id="encore"
                  title="━━ ENCORE ━━"
                  type="other"
                  onDoubleClick={() =>
                    addNonSongItem('━━ ENCORE ━━', 'other', prediction.setlist.items.length)
                  }
                />
                <DraggableQuickAddItem
                  id="intermission"
                  title="━━ INTERMISSION ━━"
                  type="other"
                  onDoubleClick={() =>
                    addNonSongItem('━━ INTERMISSION ━━', 'other', prediction.setlist.items.length)
                  }
                />
              </Stack>
            </Stack>
          </Box>

          {/* Center Panel: Setlist Editor */}
          <Box flex={1} bgColor="bg.subtle" overflow="auto">
            <SetlistEditorPanel
              items={prediction.setlist.items}
              onReorder={reorderItems}
              onRemove={removeItem}
              onUpdate={updateItem}
              onOpenImport={() => setImportDialogOpen(true)}
              dropIndicator={dropIndicator}
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

      {/* Drag Overlay - provides visual feedback during drag */}
      <DragOverlay>{activeId ? <DragPreview activeData={activeData} /> : null}</DragOverlay>
    </DndContext>
  );
}
