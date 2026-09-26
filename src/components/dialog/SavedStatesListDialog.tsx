import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaXmark, FaTrash } from 'react-icons/fa6';
import { Stack, HStack, Box } from 'styled-system/jsx';
import { Button } from '~/components/ui/button';
import { Dialog } from '~/components/ui/dialog';
import { IconButton } from '~/components/ui/icon-button';
import { Text } from '~/components/ui/text';
import { Progress } from '~/components/ui/progress';
import { SavedResultsDialog } from './SavedResultsDialog';
import type { SavedSortState } from '~/types/save-state';

export interface SavedStatesListDialogProps extends Dialog.RootProps {
  saves: SavedSortState[];
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
}

export function SavedStatesListDialog({
  saves,
  onLoad,
  onDelete,
  ...rest
}: SavedStatesListDialogProps) {
  const { t, i18n } = useTranslation();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string>();
  const [viewing, setViewing] = useState<SavedSortState>();

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Dialog.Root
        {...rest}
        onOpenChange={(e) => {
          if (!e.open) setConfirmDeleteId(undefined);
          rest.onOpenChange?.(e);
        }}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxH="80vh" overflow="auto">
            <Stack gap="4" p="6">
              <Stack gap="1">
                <Dialog.Title>{t('dialog.saved_states.title')}</Dialog.Title>
                <Dialog.Description>{t('dialog.saved_states.description')}</Dialog.Description>
              </Stack>
              {saves.length === 0 ? (
                <Stack gap="2" alignItems="center" py="8">
                  <Text color="fg.muted">{t('dialog.saved_states.empty')}</Text>
                  <Text color="fg.muted" fontSize="sm">
                    {t('dialog.saved_states.empty_hint')}
                  </Text>
                </Stack>
              ) : (
                <Stack gap="3">
                  {saves.map((save) => (
                    <Box
                      key={save.id}
                      borderColor="border.default"
                      borderRadius="md"
                      borderWidth="1px"
                      p="4"
                    >
                      <Stack gap="2">
                        <HStack justifyContent="space-between">
                          <Text fontWeight="medium">{save.name}</Text>
                          <Text color="fg.muted" fontSize="xs">
                            {save.isCompleted
                              ? t('dialog.saved_states.completed')
                              : t('dialog.saved_states.in_progress')}
                          </Text>
                        </HStack>
                        <Text color="fg.muted" fontSize="xs">
                          {formatDate(save.date)} ·{' '}
                          {t('dialog.saved_states.items', { count: save.itemCount })} ·{' '}
                          {t('dialog.saved_states.comparisons', { count: save.history.length })}
                        </Text>
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
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setConfirmDeleteId(undefined)}
                              >
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
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setViewing(save)}
                                >
                                  {t('dialog.saved_states.view_results')}
                                </Button>
                              )}
                              <Button size="sm" onClick={() => onLoad(save.id)}>
                                {t('dialog.saved_states.load')}
                              </Button>
                            </>
                          )}
                        </HStack>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              )}
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
