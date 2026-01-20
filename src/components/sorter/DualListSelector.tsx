import { useMemo, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Portal } from '@ark-ui/react/portal';
import { LuArrowRight, LuArrowLeft, LuChevronsRight, LuChevronsLeft } from 'react-icons/lu';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Dialog, Button, Input, IconButton, Text, Badge, CloseButton } from '~/components/ui';
import { HStack, Stack, Box } from 'styled-system/jsx';

export interface Item {
  id: string | number;
  name: string;
  category?: string;
  color?: string;
  [key: string]: any;
}

interface DualListSelectorProps {
  title: string;
  triggerLabel?: string;
  items: Item[];
  selectedIds: (string | number)[];
  onSelectionChange: (ids: (string | number)[]) => void;
  categories?: { id: string; label: string; color?: string }[];
  searchFilter?: (item: Item, query: string) => boolean;
  /**
   * Optional function to calculate search score. If provided, results will be sorted by score descending.
   */
  getSearchScore?: (item: Item, query: string) => number;
}

interface VirtualListProps {
  items: Item[];
  onItemClick: (id: string | number) => void;
  icon: React.ReactNode;
  emptyText: string;
  reverse?: boolean;
}

function VirtualList({ items, onItemClick, icon, emptyText, reverse }: VirtualListProps) {
  'use no memo';

  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollElement,
    estimateSize: () => 40,
    overscan: 20
  });

  // Force re-measure when element or items change
  useEffect(() => {
    if (scrollElement) {
      virtualizer.measure();
    }
  }, [scrollElement, items.length, virtualizer]);

  if (items.length === 0) {
    return (
      <Box
        display="flex"
        flex="1"
        justifyContent="center"
        alignItems="center"
        borderColor="border.subtle"
        borderRadius="md"
        borderWidth="1px"
        bg="bg.subtle"
      >
        <Text py="4" color="fg.muted" textAlign="center">
          {emptyText}
        </Text>
      </Box>
    );
  }

  return (
    <Box
      ref={setScrollElement}
      flex="1"
      borderColor="border.subtle"
      borderRadius="md"
      borderWidth="1px"
      bg="bg.subtle"
      overflowY="auto"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative'
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const item = items[virtualRow.index];
          return (
            <div
              key={item.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`
              }}
            >
              <HStack
                onClick={() => onItemClick(item.id)}
                ref={virtualizer.measureElement}
                data-index={virtualRow.index}
                style={{
                  borderLeft: item.color && !reverse ? `4px solid ${item.color}` : undefined,
                  borderRight: item.color && reverse ? `4px solid ${item.color}` : undefined
                }}
                cursor="pointer"
                justifyContent="space-between"
                minH="10"
                py="2"
                px="2"
                _hover={{ bg: 'bg.subtle' }}
              >
                {reverse && icon}
                <Text flex={1} textAlign={reverse ? 'right' : 'left'} truncate lineClamp={1}>
                  {item.name}
                </Text>
                {!reverse && icon}
              </HStack>
            </div>
          );
        })}
      </div>
    </Box>
  );
}

export function DualListSelector({
  title,
  triggerLabel,
  items,
  selectedIds,
  onSelectionChange,
  categories,
  searchFilter,
  getSearchScore
}: DualListSelectorProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [tempSelectedIds, setTempSelectedIds] = useState<(string | number)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setTempSelectedIds([...selectedIds]);
    }
  }, [isOpen, selectedIds]);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleSave = () => {
    onSelectionChange(tempSelectedIds);
    setIsOpen(false);
  };

  const addItem = useCallback((id: string | number) => {
    setTempSelectedIds((prev) => [...prev, id]);
  }, []);

  const removeItem = useCallback((id: string | number) => {
    setTempSelectedIds((prev) => prev.filter((i) => i !== id));
  }, []);

  const availableItems = useMemo(() => {
    const filtered = items.filter((item) => {
      const isSelected = tempSelectedIds.includes(item.id);
      if (isSelected) return false;

      let matchesSearch = false;
      if (searchFilter) {
        matchesSearch = searchFilter(item, searchQuery);
      } else {
        matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      }

      const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    if (searchQuery && getSearchScore) {
      filtered.sort((a, b) => {
        const scoreA = getSearchScore(a, searchQuery);
        const scoreB = getSearchScore(b, searchQuery);
        return scoreB - scoreA;
      });
    }

    return filtered;
  }, [items, tempSelectedIds, searchQuery, selectedCategory, searchFilter, getSearchScore]);

  const selectedItemsList = useMemo(() => {
    return items.filter((item) => tempSelectedIds.includes(item.id));
  }, [items, tempSelectedIds]);

  const addAll = () => {
    const idsToAdd = availableItems.map((i) => i.id);
    setTempSelectedIds((prev) => [...prev, ...idsToAdd]);
  };

  const removeAll = () => {
    setTempSelectedIds([]);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => setIsOpen(e.open)}>
      <Dialog.Trigger asChild>
        <Button variant="outline" size="sm" onClick={handleOpen}>
          {triggerLabel || title}
          {selectedIds.length > 0 && <Badge ml="2">{selectedIds.length}</Badge>}
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            display="flex"
            flexDirection="column"
            w="100%"
            maxW="4xl"
            h="85vh"
            maxH="85vh"
          >
            <Stack gap="4" h="full" p="6">
              <Dialog.Title>{title}</Dialog.Title>

              <HStack flex="1" gap="4" alignItems="stretch" overflow="hidden">
                {/* LEFT: Available */}
                <Stack flex="1" gap="4" h="full" overflow="hidden">
                  <Stack gap="2">
                    <Text color="fg.subtle" fontSize="sm" fontWeight="bold">
                      {t('common.available')}
                    </Text>
                    <Input
                      placeholder={t('common.search')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </Stack>

                  {categories && categories.length > 0 && (
                    <HStack gap="2" pb="2" overflowX="auto">
                      <Button
                        size="xs"
                        variant={selectedCategory === 'ALL' ? 'solid' : 'outline'}
                        onClick={() => setSelectedCategory('ALL')}
                      >
                        {t('common.all')}
                      </Button>
                      {categories.map((cat) => (
                        <Button
                          key={cat.id}
                          size="xs"
                          variant={selectedCategory === cat.id ? 'subtle' : 'outline'}
                          onClick={() => setSelectedCategory(cat.id)}
                          style={
                            cat.color
                              ? {
                                  borderColor: cat.color,
                                  backgroundColor:
                                    selectedCategory === cat.id ? cat.color : undefined,
                                  color: selectedCategory === cat.id ? 'white' : cat.color
                                }
                              : undefined
                          }
                        >
                          {cat.label}
                        </Button>
                      ))}
                    </HStack>
                  )}

                  <VirtualList
                    items={availableItems}
                    onItemClick={addItem}
                    icon={<LuArrowRight />}
                    emptyText={t('common.no_items')}
                  />
                </Stack>

                {/* MIDDLE: Actions */}
                <Stack gap="4" justify="center" align="center" px="2">
                  <IconButton
                    aria-label="Add All"
                    onClick={addAll}
                    variant="ghost"
                    size="sm"
                    title="Add All"
                  >
                    <LuChevronsRight />
                  </IconButton>
                  <IconButton
                    aria-label="Remove All"
                    onClick={removeAll}
                    variant="ghost"
                    size="sm"
                    title="Remove All"
                    colorPalette="red"
                  >
                    <LuChevronsLeft />
                  </IconButton>
                </Stack>

                {/* RIGHT: Selected */}
                <Stack flex="1" gap="4" h="full" overflow="hidden">
                  <HStack justify="space-between" alignItems="center">
                    <Text color="fg.subtle" fontSize="sm" fontWeight="bold">
                      {t('common.selected')}
                    </Text>
                    <Badge variant="solid" size="sm">
                      {tempSelectedIds.length}
                    </Badge>
                  </HStack>
                  <VirtualList
                    items={selectedItemsList}
                    onItemClick={removeItem}
                    icon={<LuArrowLeft />}
                    emptyText={t('common.no_selection')}
                    reverse
                  />
                </Stack>
              </HStack>

              <HStack gap="4" justify="flex-end">
                <Dialog.ActionTrigger asChild>
                  <Button variant="outline">{t('common.cancel')}</Button>
                </Dialog.ActionTrigger>
                <Button onClick={handleSave}>{t('common.confirm')}</Button>
              </HStack>
            </Stack>
            <Dialog.CloseTrigger asChild position="absolute" top="2" right="2">
              <CloseButton />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
