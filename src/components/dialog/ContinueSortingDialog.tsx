import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaXmark } from 'react-icons/fa6';
import { Stack } from 'styled-system/jsx';
import { Button } from '~/components/ui/button';
import { Dialog } from '~/components/ui/dialog';
import { IconButton } from '~/components/ui/icon-button';
import { Textarea } from '~/components/ui/textarea';
import { Text } from '~/components/ui/text';

export interface ContinueSortingDialogProps extends Dialog.RootProps {
  onContinue: (results: string[][]) => void;
}

const parseResults = (text: string): string[][] | null => {
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed) && parsed.every((item) => Array.isArray(item))) {
      return parsed as string[][];
    }
  } catch {
    const lines = text.split('\n').filter((line) => line.trim());
    const results: string[][] = [];
    for (const line of lines) {
      const items = line
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item);
      if (items.length > 0) {
        results.push(items);
      }
    }
    if (results.length > 0) {
      return results;
    }
  }
  return null;
};

export function ContinueSortingDialog({ onContinue, ...rest }: ContinueSortingDialogProps) {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [error, setError] = useState<string>();

  const handleContinue = () => {
    const results = parseResults(input);
    if (!results || results.length === 0) {
      setError(t('dialog.continue_sorting_dialog.invalid_format'));
      return;
    }
    setError(undefined);
    onContinue(results);
    setInput('');
  };

  const handleClose = () => {
    setInput('');
    setError(undefined);
  };

  return (
    <Dialog.Root
      {...rest}
      onOpenChange={(e) => {
        if (!e.open) handleClose();
        rest.onOpenChange?.(e);
      }}
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Stack gap="4" p="6">
            <Stack gap="1">
              <Dialog.Title>{t('dialog.continue_sorting_dialog.title')}</Dialog.Title>
              <Dialog.Description>
                {t('dialog.continue_sorting_dialog.description')}
              </Dialog.Description>
            </Stack>
            <Stack gap="2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('dialog.continue_sorting_dialog.placeholder')}
                rows={6}
              />
              {error && (
                <Text color="red" fontSize="sm">
                  {error}
                </Text>
              )}
            </Stack>
            <Stack gap="3" direction="row" width="full">
              <Dialog.CloseTrigger asChild>
                <Button variant="outline" flex={1}>
                  {t('dialog.cancel')}
                </Button>
              </Dialog.CloseTrigger>
              <Button onClick={handleContinue} flex={1}>
                {t('dialog.continue_sorting_dialog.continue')}
              </Button>
            </Stack>
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
