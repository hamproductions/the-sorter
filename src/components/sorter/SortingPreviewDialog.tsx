import { useVirtualizer } from '@tanstack/react-virtual';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaXmark } from 'react-icons/fa6';
import { Box, HStack, Stack } from 'styled-system/jsx';
import { Dialog } from '~/components/ui/dialog';
import { IconButton } from '~/components/ui/icon-button';
import { Input } from '~/components/ui/input';
import { Text } from '~/components/ui/text';

export function SortingPreviewDialog<T extends { id: string | number }>(
  props: Dialog.RootProps & { items: T[]; getItemName?: (item: T) => string }
) {
  'use no memo';

  const { items, getItemName, ...rest } = props;
  const { t } = useTranslation();
  const [parentEl, setParentEl] = useState<HTMLDivElement | null>(null);
  const [search, setSearch] = useState('');

  const getName = (item: T) => {
    if (getItemName) return getItemName(item);
    const i = item as unknown as { name?: string; fullName?: string };
    return i.name || i.fullName || String(item.id);
  };

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items.map((item, idx) => ({ item, originalIndex: idx }));
    const query = search.toLowerCase();
    return items
      .map((item, idx) => ({ item, originalIndex: idx }))
      .filter(({ item }) => getName(item).toLowerCase().includes(query));
  }, [items, search]);

  const virtualizer = useVirtualizer({
    count: filteredItems.length,
    getScrollElement: () => parentEl,
    estimateSize: () => 44,
    gap: 8
  });

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
            <Input
              placeholder={t('sort.preview_search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Box ref={setParentEl} h="calc(80vh - 200px)" overflow="auto">
              <Box position="relative" w="full" h={`${virtualizer.getTotalSize()}px`}>
                {virtualizer.getVirtualItems().map((virtualItem) => {
                  const { item, originalIndex } = filteredItems[virtualItem.index];
                  return (
                    <HStack
                      key={virtualItem.key}
                      style={{ transform: `translateY(${virtualItem.start}px)` }}
                      position="absolute"
                      top={0}
                      left={0}
                      rounded="l2"
                      w="full"
                      h={`${virtualItem.size}px`}
                      p="2"
                      bg="bg.subtle"
                    >
                      <Text minW="6" color="fg.subtle" fontSize="sm">
                        {originalIndex + 1}
                      </Text>
                      <Text fontWeight="medium" lineClamp={1}>
                        {getName(item)}
                      </Text>
                    </HStack>
                  );
                })}
              </Box>
            </Box>
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
