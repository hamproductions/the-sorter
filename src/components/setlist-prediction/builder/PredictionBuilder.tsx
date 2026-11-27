/**
 * Main Prediction Builder Component
 * Three-panel layout: Song Search | Setlist Editor | Context/Actions
 */

import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { closestCenter, DndContext, DragOverlay } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { BiPlus, BiSave, BiDotsVerticalRounded } from 'react-icons/bi';
import { AddItemDrawer } from './AddItemDrawer';
import { SetlistEditorPanel } from './SetlistEditorPanel';
import { SongSearchPanel } from './SongSearchPanel';
import { DraggableQuickAddItem } from './DraggableQuickAddItem';
import { ImportDialog } from './ImportDialog';
import { BuilderActionsPanel } from './BuilderActionsPanel';
import { BuilderDragPreview } from './BuilderDragPreview';
import { Drawer } from '~/components/ui/drawer';
import { Menu } from '~/components/ui/menu';

import { Box, Stack, HStack } from 'styled-system/jsx';
import { Button } from '~/components/ui/styled/button';
import { IconButton } from '~/components/ui/styled/icon-button';
import { Input } from '~/components/ui/styled/input';
import { Text } from '~/components/ui/styled/text';
import type { SetlistPrediction, Performance, CustomPerformance } from '~/types/setlist-prediction';
import { usePredictionBuilder } from '~/hooks/setlist-prediction/usePredictionBuilder';
import { useSetlistDragAndDrop } from '~/hooks/setlist-prediction/useSetlistDragAndDrop';
import { useSongData } from '~/hooks/useSongData';

export interface PredictionBuilderProps {
  performanceId?: string;
  customPerformance?: CustomPerformance;
  initialPrediction?: SetlistPrediction;
  performance?: Performance;
  onSave?: (prediction: SetlistPrediction) => void;
  onChangePerformance?: (performanceId: string | undefined) => void;
}

export function PredictionBuilder({
  performanceId,
  customPerformance,
  initialPrediction,
  performance,
  onSave
}: PredictionBuilderProps) {
  const { t } = useTranslation();
  const songData = useSongData();

  const {
    prediction,
    isDirty,
    addSong: _addSong,
    addNonSongItem,
    removeItem,
    updateItem,
    reorderItems,
    clearItems,
    updateMetadata,
    setPerformanceId,
    save,
    reset
  } = usePredictionBuilder({
    performanceId,
    customPerformance,
    initialPrediction,
    autosave: true,
    onSave
  });

  // Sync performanceId and customPerformance from props when they change externally
  const [prevPerformanceId, setPrevPerformanceId] = useState(performanceId);
  const [prevCustomPerformance, setPrevCustomPerformance] = useState(customPerformance);
  if (performanceId !== prevPerformanceId || customPerformance !== prevCustomPerformance) {
    setPrevPerformanceId(performanceId);
    setPrevCustomPerformance(customPerformance);
    setPerformanceId(performanceId, customPerformance);
  }

  const [predictionName, setPredictionName] = useState(prediction.name);
  // If the parent provides a new `initialPrediction`, reset the hook's internal
  // state and update UI fields (like `predictionName`) so the builder reflects
  // the newly selected prediction.
  useEffect(() => {
    // `reset` will set the hook's prediction state to `initialPrediction`.
    reset();
    if (initialPrediction) {
      setPredictionName(initialPrediction.name);
    }
  }, [initialPrediction, reset]);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [addItemDrawerOpen, setAddItemDrawerOpen] = useState(false);

  const {
    activeId,
    activeData,
    dropIndicator,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    sensors,
    measuring,
    dropAnimation
  } = useSetlistDragAndDrop({
    prediction,
    songData,
    addSong: _addSong,
    reorderItems,
    addNonSongItem
  });

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
    setPredictionName(imported.name);
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
        <Box zIndex={20} position="sticky" top={0} borderBottomWidth="1px" p={4} bgColor="bg.muted">
          {/* Desktop: Single Line */}
          <HStack hideBelow="md" gap={2} alignItems="center">
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
              <Button variant="outline" onClick={() => setRightSidebarOpen(true)} hideFrom="lg">
                {t('setlistPrediction.exportShare', { defaultValue: 'Export & Share' })}
              </Button>
            </HStack>
          </HStack>

          {/* Mobile: Single Line with Menu */}
          <HStack hideFrom="md" gap={2} alignItems="center">
            <IconButton
              variant="ghost"
              size="sm"
              onClick={() => setLeftSidebarOpen(true)}
              aria-label={t('setlistPrediction.songSearch', { defaultValue: 'Song Search' })}
            >
              <BiPlus size={20} />
            </IconButton>
            <Input
              value={predictionName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder={t('setlistPrediction.predictionNamePlaceholder', {
                defaultValue: 'Enter prediction name...'
              })}
              size="sm"
              flex={1}
            />
            <IconButton
              onClick={handleSave}
              disabled={!isDirty}
              size="sm"
              aria-label={t('common.save', { defaultValue: 'Save' })}
            >
              <BiSave size={18} />
            </IconButton>

            <Menu.Root positioning={{ placement: 'bottom-end' }}>
              <Menu.Trigger asChild>
                <IconButton variant="ghost" size="sm">
                  <BiDotsVerticalRounded size={20} />
                </IconButton>
              </Menu.Trigger>
              <Menu.Positioner>
                <Menu.Content>
                  <Menu.Item value="export" onClick={() => setRightSidebarOpen(true)}>
                    {t('setlistPrediction.exportShare', { defaultValue: 'Export & Share' })}
                  </Menu.Item>
                  <Menu.Item value="import" onClick={() => setImportDialogOpen(true)}>
                    {t('common.import', { defaultValue: 'Import' })}
                  </Menu.Item>
                  <Menu.Item value="clear" onClick={clearItems} color="fg.error">
                    {t('common.clear', { defaultValue: 'Clear' })}
                  </Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Menu.Root>
          </HStack>
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

          {/* Left Panel: Song Search - Mobile Drawer */}
          <Drawer.Root
            open={leftSidebarOpen}
            onOpenChange={(details) => setLeftSidebarOpen(details.open)}
          >
            <Drawer.Backdrop hideFrom="md" />
            <Drawer.Positioner hideFrom="md">
              <Drawer.Content>
                <Drawer.Header>
                  <Drawer.Title>
                    {t('setlistPrediction.songSearch', { defaultValue: 'Song Search' })}
                  </Drawer.Title>
                  <Drawer.CloseTrigger />
                </Drawer.Header>
                <Drawer.Body>
                  <Stack gap={3}>
                    <SongSearchPanel
                      onAddSong={handleAddSong}
                      onAddCustomSong={handleAddCustomSong}
                    />

                    {/* Quick Add Items */}
                    <Stack gap={2}>
                      <Text fontSize="sm" fontWeight="medium">
                        {t('setlistPrediction.quickAdd', { defaultValue: 'Quick Add' })}
                      </Text>
                      <Text color="fg.muted" fontSize="xs">
                        {t('setlistPrediction.quickAddHint', {
                          defaultValue: 'Drag items into setlist'
                        })}
                      </Text>
                      <DraggableQuickAddItem id="mc" title="MC①" type="mc" />
                      <DraggableQuickAddItem id="encore" title="━━ ENCORE ━━" type="other" />
                      <DraggableQuickAddItem
                        id="intermission"
                        title="━━ INTERMISSION ━━"
                        type="other"
                      />
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
            <Box hideFrom="md" zIndex={100} position="fixed" right={6} bottom={6}>
              <IconButton
                size="lg"
                onClick={() => setAddItemDrawerOpen(true)}
                borderRadius="full"
                color="accent.fg"
                bgColor="accent.default"
                shadow="lg"
                _hover={{ bgColor: 'accent.emphasized' }}
              >
                <BiPlus size={24} />
              </IconButton>
            </Box>
          </Box>

          <BuilderActionsPanel
            prediction={prediction}
            performance={performance}
            open={rightSidebarOpen}
            onOpenChange={setRightSidebarOpen}
          />
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
      <DragOverlay dropAnimation={dropAnimation}>
        {activeId ? <BuilderDragPreview activeData={activeData} /> : null}
      </DragOverlay>

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
