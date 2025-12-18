import { useTranslation } from 'react-i18next';
import { FaXmark } from 'react-icons/fa6';
import { Stack } from 'styled-system/jsx';
import { Button } from '~/components/ui/button';
import { Dialog } from '~/components/ui/dialog';
import { IconButton } from '~/components/ui/icon-button';

const createConfirmDialog = (
  key: 'mid_sort_confirm' | 'ended_confirm' | 'new_session_confirm',
  confirmLabelKey = 'dialog.proceed',
  cancelLabelKey = 'dialog.cancel'
) => {
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
                  <Button variant="outline" flex={1}>
                    {t(cancelLabelKey)}
                  </Button>
                </Dialog.CloseTrigger>
                <Button onClick={onConfirm} flex={1}>
                  {t(confirmLabelKey)}
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
export const ConfirmNewSessionDialog = createConfirmDialog(
  'new_session_confirm',
  'dialog.start_new_session',
  'dialog.continue_sorting'
);
