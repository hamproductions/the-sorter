import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuArrowRight, LuArrowLeft, LuChevronsRight, LuChevronsLeft } from 'react-icons/lu';
import { Dialog } from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { IconButton } from '~/components/ui/icon-button';
import { Text } from '~/components/ui/text';
import { Badge } from '~/components/ui/badge';
import { HStack, Stack, Box } from 'styled-system/jsx';

interface Item {
  id: string | number;
  name: string;
  category?: string;
}

interface DualListSelectorProps {
  title: string;
  triggerLabel?: string;
  items: Item[];
  selectedIds: (string | number)[];
  onSelectionChange: (ids: (string | number)[]) => void;
  categories?: { id: string; label: string }[];
}

export function DualListSelector({
  title,
  triggerLabel,
  items,
  selectedIds,
  onSelectionChange,
  categories
}: DualListSelectorProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [tempSelectedIds, setTempSelectedIds] = useState<(string | number)[]>([]);

  const handleOpen = () => {
    setTempSelectedIds([...selectedIds]);
    setIsOpen(true);
  };

  const handleSave = () => {
    onSelectionChange(tempSelectedIds);
    setIsOpen(false);
  };

  const addItem = (id: string | number) => {
    setTempSelectedIds((prev) => [...prev, id]);
  };

  const removeItem = (id: string | number) => {
    setTempSelectedIds((prev) => prev.filter((i) => i !== id));
  };

  const availableItems = useMemo(() => {
    return items.filter((item) => {
      const isSelected = tempSelectedIds.includes(item.id);
      if (isSelected) return false;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, tempSelectedIds, searchQuery, selectedCategory]);

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
      {/* Removed Portal due to export issues in previous interactions, verifying if Backdrop works without it */}
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
                        variant={selectedCategory === cat.id ? 'solid' : 'outline'}
                        onClick={() => setSelectedCategory(cat.id)}
                      >
                        {cat.label}
                      </Button>
                    ))}
                  </HStack>
                )}

                <Box
                  flex="1"
                  borderColor="border.subtle"
                  borderRadius="md"
                  borderWidth="1px"
                  p="2"
                  bg="bg.subtle"
                  overflowY="auto"
                >
                  {availableItems.length === 0 ? (
                    <Text py="4" color="fg.muted" textAlign="center">
                      {t('common.no_items')}
                    </Text>
                  ) : (
                    <Stack gap="1">
                      {availableItems.map((item) => (
                        <HStack
                          key={item.id}
                          onClick={() => addItem(item.id)}
                          cursor="pointer"
                          justifyContent="space-between"
                          p="2"
                          _hover={{ bg: 'bg.subtle' }}
                        >
                          <Text truncate lineClamp={1}>
                            {item.name}
                          </Text>
                          <LuArrowRight />
                        </HStack>
                      ))}
                    </Stack>
                  )}
                </Box>
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
                <Box flex="1" borderRadius="md" borderWidth="1px" p="2" overflowY="auto">
                  {selectedItemsList.length === 0 ? (
                    <Text py="4" color="fg.muted" textAlign="center">
                      {t('common.no_selection')}
                    </Text>
                  ) : (
                    <Stack gap="1">
                      {selectedItemsList.map((item) => (
                        <HStack
                          key={item.id}
                          onClick={() => removeItem(item.id)}
                          cursor="pointer"
                          justifyContent="space-between"
                          p="2"
                          _hover={{ bg: 'bg.subtle' }}
                        >
                          <LuArrowLeft />
                          <Text truncate lineClamp={1}>
                            {item.name}
                          </Text>
                        </HStack>
                      ))}
                    </Stack>
                  )}
                </Box>
              </Stack>
            </HStack>

            <HStack gap="4" justify="flex-end">
              <Dialog.CloseTrigger asChild>
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  {t('common.cancel')}
                </Button>
              </Dialog.CloseTrigger>
              <Button onClick={handleSave}>{t('common.confirm')}</Button>
            </HStack>
          </Stack>
          <Dialog.CloseTrigger />
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
