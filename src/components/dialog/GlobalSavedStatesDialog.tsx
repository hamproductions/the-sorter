import { useState } from 'react';
import { join } from 'path-browserify';
import { useTranslation } from 'react-i18next';
import { FaXmark, FaTrash, FaPen } from 'react-icons/fa6';
import { Stack, HStack, Box } from 'styled-system/jsx';
import { Button } from '~/components/ui/button';
import { Dialog } from '~/components/ui/dialog';
import { IconButton } from '~/components/ui/icon-button';
import { Text } from '~/components/ui/text';
import { Progress } from '~/components/ui/progress';
import { Tabs } from '~/components/ui/tabs';
import { Badge } from '~/components/ui/badge';
import { Input } from '~/components/ui/input';
import { SavedResultsDialog } from './SavedResultsDialog';
import type { SavedSortState, SorterType } from '~/types/save-state';
import { SORTER_TYPE_ROUTES } from '~/utils/save-state';
import { useSaveLoadContext } from '~/context/SaveLoadContext';

export interface GlobalSavedStatesDialogProps extends Dialog.RootProps {
  saves: SavedSortState[];
  currentSorterType?: SorterType;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

const SORTER_TYPE_LABELS: Record<SorterType, string> = {
  characters: 'dialog.saved_states.type_characters',
  songs: 'dialog.saved_states.type_songs',
  'hasu-songs': 'dialog.saved_states.type_hasu_songs'
};

const TAB_VALUES = ['all', 'characters', 'songs', 'hasu-songs'] as const;

export function GlobalSavedStatesDialog({
  saves,
  currentSorterType,
  onDelete,
  onRename,
  ...rest
}: GlobalSavedStatesDialogProps) {
  const { t, i18n } = useTranslation();
  const { requestLoad } = useSaveLoadContext();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string>();
  const [viewing, setViewing] = useState<SavedSortState>();
  const [editingId, setEditingId] = useState<string>();
  const [editName, setEditName] = useState('');

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleLoad = (save: SavedSortState) => {
    requestLoad(save.id);
    if (save.sorterType !== currentSorterType) {
      window.location.assign(join(import.meta.env.BASE_URL, SORTER_TYPE_ROUTES[save.sorterType]));
    }
    rest.onOpenChange?.({ open: false });
  };

  const handleStartRename = (save: SavedSortState) => {
    setEditingId(save.id);
    setEditName(save.name);
  };

  const handleSubmitRename = () => {
    if (editingId && editName.trim()) {
      onRename(editingId, editName.trim());
    }
    setEditingId(undefined);
    setEditName('');
  };

  const filterSaves = (tab: string) => {
    if (tab === 'all') return saves;
    return saves.filter((s) => s.sorterType === tab);
  };

  const renderSaveCard = (save: SavedSortState, showType: boolean) => (
    <Box key={save.id} borderColor="border.default" borderRadius="md" borderWidth="1px" p="4">
      <Stack gap="2">
        <HStack gap="1" justifyContent="space-between" flexWrap="wrap">
          {editingId === save.id ? (
            <HStack flex="1" gap="2">
              <Input
                size="sm"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmitRename();
                  if (e.key === 'Escape') setEditingId(undefined);
                }}
                ref={(el) => el?.focus()}
              />
              <Button size="sm" onClick={handleSubmitRename}>
                {t('dialog.ok')}
              </Button>
            </HStack>
          ) : (
            <HStack flex="1" gap="2" minW="0">
              <Text fontWeight="medium" truncate>
                {save.name}
              </Text>
              <IconButton
                aria-label={t('dialog.saved_states.rename')}
                variant="ghost"
                size="xs"
                onClick={() => handleStartRename(save)}
              >
                <FaPen />
              </IconButton>
            </HStack>
          )}
          <HStack gap="1">
            {showType && (
              <Badge size="sm" variant="outline">
                {t(SORTER_TYPE_LABELS[save.sorterType])}
              </Badge>
            )}
            <Badge size="sm" variant={save.isCompleted ? 'solid' : 'outline'}>
              {save.isCompleted
                ? t('dialog.saved_states.completed')
                : t('dialog.saved_states.in_progress')}
            </Badge>
          </HStack>
        </HStack>
        <Text color="fg.muted" fontSize="xs">
          {formatDate(save.date)} · {t('dialog.saved_states.items', { count: save.itemCount })} ·{' '}
          {t('dialog.saved_states.comparisons', { count: save.history.length })}
        </Text>
        {save.filterSummary && (
          <Text color="fg.muted" fontSize="xs" truncate>
            {save.filterSummary}
          </Text>
        )}
        {!save.isCompleted && (
          <Progress
            value={save.progress}
            min={0}
            max={1}
            translations={{ value: (d) => `${d.percent}%` }}
          />
        )}
        <HStack gap="2" justifyContent="flex-end">
          {confirmDeleteId === save.id ? (
            <>
              <Text fontSize="sm">{t('dialog.saved_states.delete_confirm')}</Text>
              <Button size="sm" variant="outline" onClick={() => setConfirmDeleteId(undefined)}>
                {t('dialog.cancel')}
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  onDelete(save.id);
                  setConfirmDeleteId(undefined);
                }}
                colorPalette="red"
              >
                {t('dialog.saved_states.delete')}
              </Button>
            </>
          ) : (
            <>
              <IconButton
                aria-label={t('dialog.saved_states.delete')}
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDeleteId(save.id)}
              >
                <FaTrash />
              </IconButton>
              {save.isCompleted && (
                <Button size="sm" variant="outline" onClick={() => setViewing(save)}>
                  {t('dialog.saved_states.view_results')}
                </Button>
              )}
              <Button size="sm" onClick={() => handleLoad(save)}>
                {t('dialog.saved_states.load')}
              </Button>
            </>
          )}
        </HStack>
      </Stack>
    </Box>
  );

  const renderEmpty = () => (
    <Stack gap="2" alignItems="center" py="8">
      <Text color="fg.muted">{t('dialog.saved_states.empty')}</Text>
      <Text color="fg.muted" fontSize="sm">
        {t('dialog.saved_states.empty_hint')}
      </Text>
    </Stack>
  );

  return (
    <>
      <Dialog.Root
        {...rest}
        onOpenChange={(e) => {
          if (!e.open) {
            setConfirmDeleteId(undefined);
            setEditingId(undefined);
          }
          rest.onOpenChange?.(e);
        }}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="lg" maxH="80vh" overflow="auto">
            <Stack gap="4" p="6">
              <Stack gap="1">
                <Dialog.Title>{t('dialog.saved_states.title')}</Dialog.Title>
                <Dialog.Description>{t('dialog.saved_states.description')}</Dialog.Description>
              </Stack>
              <Tabs.Root defaultValue="all" size="sm">
                <Tabs.List>
                  {TAB_VALUES.map((tab) => (
                    <Tabs.Trigger key={tab} value={tab}>
                      {tab === 'all'
                        ? t('dialog.saved_states.all')
                        : t(SORTER_TYPE_LABELS[tab as SorterType])}
                    </Tabs.Trigger>
                  ))}
                  <Tabs.Indicator />
                </Tabs.List>
                {TAB_VALUES.map((tab) => {
                  const filtered = filterSaves(tab);
                  return (
                    <Tabs.Content key={tab} value={tab}>
                      {filtered.length === 0 ? (
                        renderEmpty()
                      ) : (
                        <Stack gap="3">
                          {filtered.map((save) => renderSaveCard(save, tab === 'all'))}
                        </Stack>
                      )}
                    </Tabs.Content>
                  );
                })}
              </Tabs.Root>
              <Dialog.CloseTrigger asChild>
                <Button variant="outline" width="full">
                  {t('dialog.close')}
                </Button>
              </Dialog.CloseTrigger>
            </Stack>
            <Dialog.CloseTrigger asChild position="absolute" top="2" right="2">
              <IconButton aria-label="Close Dialog" variant="ghost" size="sm">
                <FaXmark />
              </IconButton>
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
      <SavedResultsDialog
        open={!!viewing}
        lazyMount
        unmountOnExit
        save={viewing}
        onOpenChange={({ open }) => {
          if (!open) setViewing(undefined);
        }}
      />
    </>
  );
}
