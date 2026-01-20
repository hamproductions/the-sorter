import { useVirtualizer } from '@tanstack/react-virtual';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, HStack, Stack } from 'styled-system/jsx';
import { Dialog, CloseButton, Input, Text } from '~/components/ui';

export function SortingPreviewDialog<T extends { id: string | number }>(
  props: Dialog.RootProps & {
    items: T[];
    getItemName?: (item: T) => string;
    getItemColor?: (item: T) => string | undefined;
  }
) {
  'use no memo';

  const { items, getItemName, getItemColor, ...rest } = props;
  const { t } = useTranslation();
  const [parentEl, setParentEl] = useState<HTMLDivElement | null>(null);
  const [search, setSearch] = useState('');

  const getName = useCallback(
    (item: T) => {
      if (getItemName) return getItemName(item);
      const i = item as unknown as { name?: string; fullName?: string };
      return i.name || i.fullName || String(item.id);
    },
    [getItemName]
  );

  const getColor = useCallback(
    (item: T) => {
      if (getItemColor) return getItemColor(item);
      const i = item as unknown as { color?: string };
      return i.color;
    },
    [getItemColor]
  );

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items.map((item, idx) => ({ item, originalIndex: idx }));
    const query = search.toLowerCase();
    return items
      .map((item, idx) => ({ item, originalIndex: idx }))
      .filter(({ item }) => getName(item).toLowerCase().includes(query));
  }, [getName, items, search]);

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
              <Box
                style={{ height: `${virtualizer.getTotalSize()}px` }}
                position="relative"
                w="full"
              >
                {virtualizer.getVirtualItems().map((virtualItem) => {
                  const { item, originalIndex } = filteredItems[virtualItem.index];
                  const color = getColor(item);
                  return (
                    <HStack
                      key={virtualItem.key}
                      style={{
                        transform: `translateY(${virtualItem.start}px)`,
                        height: `${virtualItem.size}px`,
                        borderLeft: color ? `4px solid ${color}` : undefined
                      }}
                      position="absolute"
                      top={0}
                      left={0}
                      rounded="l2"
                      w="full"
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
            <CloseButton />
          </Dialog.CloseTrigger>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
