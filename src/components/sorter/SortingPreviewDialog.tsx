import { useTranslation } from 'react-i18next';
import { FaXmark } from 'react-icons/fa6';
import { HStack, Stack } from 'styled-system/jsx';
import { Dialog } from '~/components/ui/dialog';
import { IconButton } from '~/components/ui/icon-button';
import { Text } from '~/components/ui/text';

export function SortingPreviewDialog<T extends { id: string | number }>(
  props: Dialog.RootProps & { items: T[]; getItemName?: (item: T) => string }
) {
  const { items, getItemName, ...rest } = props;
  const { t } = useTranslation();

  const getName = (item: T) => {
    if (getItemName) return getItemName(item);
    const i = item as unknown as { name?: string; fullName?: string };
    return i.name || i.fullName || String(item.id);
  };

  return (
    <Dialog.Root {...rest}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content maxW="lg" h="80vh">
          <Stack gap="4" h="full" p="6">
            <Stack gap="1">
              <Dialog.Title>{t('sort.preview_title')}</Dialog.Title>
              <Dialog.Description>
                {t('sort.preview_description', { count: items.length })}
              </Dialog.Description>
            </Stack>
            <Stack flex="1" gap="2" overflowY="auto">
              {items.map((item, index) => (
                <HStack key={item.id} rounded="l2" p="2" bg="bg.subtle">
                  <Text minW="6" color="fg.subtle" fontSize="sm">
                    {index + 1}
                  </Text>
                  <Text lineClamp={1} fontWeight="medium">
                    {getName(item)}
                  </Text>
                </HStack>
              ))}
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
