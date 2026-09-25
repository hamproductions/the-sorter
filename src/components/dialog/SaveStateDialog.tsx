import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaXmark } from 'react-icons/fa6';
import { Stack, HStack, Box } from 'styled-system/jsx';
import { Button } from '~/components/ui/button';
import { Dialog } from '~/components/ui/dialog';
import { IconButton } from '~/components/ui/icon-button';
import { Input } from '~/components/ui/input';
import { Text } from '~/components/ui/text';
import { SegmentGroup } from '~/components/ui/segment-group';
import type { SavedSortState } from '~/types/save-state';

export interface SaveStateDialogProps extends Dialog.RootProps {
  defaultName: string;
  onSave: (name: string) => void;
  existingSaves?: SavedSortState[];
  onOverwrite?: (id: string) => void;
}

export function SaveStateDialog({
  defaultName,
  onSave,
  existingSaves,
  onOverwrite,
  ...rest
}: SaveStateDialogProps) {
  const { t, i18n } = useTranslation();
  const [name, setName] = useState(defaultName);
  const [mode, setMode] = useState<'new' | 'overwrite'>('new');
  const [confirmOverwriteId, setConfirmOverwriteId] = useState<string>();

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim());
  };

  useEffect(() => {
    if (!rest.open) return;
    setName(defaultName);
    setMode('new');
    setConfirmOverwriteId(undefined);
  }, [rest.open, defaultName]);

  const hasExistingSaves = existingSaves && existingSaves.length > 0 && onOverwrite;

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString(i18n.language, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog.Root {...rest}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Stack gap="4" p="6">
            <Stack gap="1">
              <Dialog.Title>{t('dialog.save_state.title')}</Dialog.Title>
              <Dialog.Description>{t('dialog.save_state.description')}</Dialog.Description>
            </Stack>
            {hasExistingSaves && (
              <SegmentGroup.Root
                value={mode}
                onValueChange={(e) => {
                  setMode(e.value as 'new' | 'overwrite');
                  setConfirmOverwriteId(undefined);
                }}
                size="sm"
              >
                <SegmentGroup.Indicator />
                <SegmentGroup.Item value="new">
                  <SegmentGroup.ItemText>{t('dialog.save_state.new_save')}</SegmentGroup.ItemText>
                  <SegmentGroup.ItemHiddenInput />
                </SegmentGroup.Item>
                <SegmentGroup.Item value="overwrite">
                  <SegmentGroup.ItemText>{t('dialog.save_state.overwrite')}</SegmentGroup.ItemText>
                  <SegmentGroup.ItemHiddenInput />
                </SegmentGroup.Item>
              </SegmentGroup.Root>
            )}
            {mode === 'new' ? (
              <>
                <Stack gap="2">
                  <Text fontSize="sm" fontWeight="medium">
                    {t('dialog.save_state.name_label')}
                  </Text>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('dialog.save_state.name_placeholder')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSave();
                    }}
                  />
                </Stack>
                <Stack gap="3" direction="row" width="full">
                  <Dialog.CloseTrigger asChild>
                    <Button variant="outline" flex={1}>
                      {t('dialog.cancel')}
                    </Button>
                  </Dialog.CloseTrigger>
                  <Button onClick={handleSave} disabled={!name.trim()} flex={1}>
                    {t('dialog.save_state.save')}
                  </Button>
                </Stack>
              </>
            ) : (
              <Stack gap="3" maxH="300px" overflow="auto">
                {existingSaves?.map((save) => (
                  <Box
                    key={save.id}
                    borderColor="border.default"
                    borderRadius="md"
                    borderWidth="1px"
                    p="3"
                  >
                    <HStack justifyContent="space-between">
                      <Stack flex="1" gap="0.5" minW="0">
                        <Text fontSize="sm" fontWeight="medium" truncate>
                          {save.name}
                        </Text>
                        <Text color="fg.muted" fontSize="xs">
                          {formatDate(save.date)}
                        </Text>
                      </Stack>
                      {confirmOverwriteId === save.id ? (
                        <HStack gap="2">
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => setConfirmOverwriteId(undefined)}
                          >
                            {t('dialog.cancel')}
                          </Button>
                          <Button
                            size="xs"
                            onClick={() => {
                              onOverwrite?.(save.id);
                              setConfirmOverwriteId(undefined);
                            }}
                            colorPalette="red"
                          >
                            {t('dialog.save_state.overwrite')}
                          </Button>
                        </HStack>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmOverwriteId(save.id)}
                        >
                          {t('dialog.save_state.overwrite')}
                        </Button>
                      )}
                    </HStack>
                  </Box>
                ))}
              </Stack>
            )}
          </Stack>
          <Dialog.CloseTrigger asChild position="absolute" top="2" right="2">
            <IconButton aria-label="Close Dialog" variant="ghost" size="sm">
              <FaXmark />
            </IconButton>
          </Dialog.CloseTrigger>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
