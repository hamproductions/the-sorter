import { useTranslation } from 'react-i18next';
import { FaXmark } from 'react-icons/fa6';
import { Stack } from 'styled-system/jsx';
import { Button } from '~/components/ui/styled/button';
import * as Dialog from '~/components/ui/styled/dialog';
import { IconButton } from '~/components/ui/styled/icon-button';

const createConfirmDialog = (key: 'mid_sort_confirm' | 'ended_confirm') => {
  return function ConfirmDialog(props: Dialog.RootProps & { onConfirm: () => void }) {
    const { onConfirm, ...rest } = props;
    const { t } = useTranslation();
    return (
      <Dialog.Root {...rest}>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Stack gap="8" p="6">
              <Stack gap="1">
                <Dialog.Title>{t(`dialog.${key}.title`)}</Dialog.Title>
                <Dialog.Description>{t(`dialog.${key}.description`)}</Dialog.Description>
              </Stack>
              <Stack gap="3" direction="row" width="full">
                <Dialog.CloseTrigger asChild>
                  <Button variant="outline" width="full">
                    {t('dialog.cancel')}
                  </Button>
                </Dialog.CloseTrigger>
                <Button onClick={onConfirm} width="full">
                  {t('dialog.proceed')}
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
  };
};

export const ConfirmMidSortDialog = createConfirmDialog('mid_sort_confirm');
export const ConfirmEndedDialog = createConfirmDialog('ended_confirm');
