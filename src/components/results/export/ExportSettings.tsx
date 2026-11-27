import { Portal } from '@ark-ui/react/portal';
import { useId, type ReactNode, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { FaXmark } from 'react-icons/fa6';
import { Stack } from 'styled-system/jsx';
import { Dialog } from '~/components/ui/dialog';
import { FormLabel } from '~/components/ui/form-label';
import { IconButton } from '~/components/ui/icon-button';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';

export function ExportSettingsDialog({
  open,
  onOpenChange,
  finalFocusEl,
  container,
  children
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  finalFocusEl: () => HTMLElement | null;
  container: RefObject<HTMLElement | null>;
  children: ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => onOpenChange(details.open)}
      finalFocusEl={finalFocusEl}
    >
      <Portal container={container}>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content w="calc(100% - 2rem)" minW="0" maxW="lg" maxH="90dvh" overflow="auto">
            <Stack gap="4" p="5" textAlign="start">
              <Dialog.Title>{t('results.export_settings')}</Dialog.Title>
              {children}
            </Stack>
            <Dialog.CloseTrigger asChild position="absolute" top="2" right="2">
              <IconButton aria-label={t('dialog.close')} variant="ghost" size="sm">
                <FaXmark />
              </IconButton>
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

export function ExportSettingsFields({
  title,
  onTitleChange,
  description,
  onDescriptionChange
}: {
  title: string;
  onTitleChange: (title: string) => void;
  description?: string;
  onDescriptionChange: (description: string) => void;
}) {
  const { t } = useTranslation();
  const id = useId();

  return (
    <Stack w="full">
      <Stack gap="1">
        <FormLabel htmlFor={`${id}-title`}>{t('results.title')}</FormLabel>
        <Input id={`${id}-title`} value={title} onChange={(e) => onTitleChange(e.target.value)} />
      </Stack>
      <Stack gap="1">
        <FormLabel htmlFor={`${id}-description`}>{t('results.description')}</FormLabel>
        <Textarea
          id={`${id}-description`}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
        />
      </Stack>
    </Stack>
  );
}
