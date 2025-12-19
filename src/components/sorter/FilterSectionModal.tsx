import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FaXmark } from 'react-icons/fa6';
import { Dialog } from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
import { Group } from '~/components/ui/styled/checkbox';
import { IconButton } from '~/components/ui/icon-button';
import { Input } from '~/components/ui/input';
import { Text } from '~/components/ui/text';
import { HStack, Stack, Wrap } from 'styled-system/jsx';

type LogicType = 'and' | 'or';

interface FilterSectionModalProps {
  title: string;
  items: { id: string | number; name: string }[];
  selectedIds: (string | number)[];
  onSelectionChange: (ids: (string | number)[]) => void;
  logic?: LogicType;
  onLogicChange?: (logic: LogicType) => void;
  triggerLabel?: string;
}

export function FilterSectionModal({
  title,
  items,
  selectedIds,
  onSelectionChange,
  logic,
  onLogicChange,
  triggerLabel
}: FilterSectionModalProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    const lowerQuery = searchQuery.toLowerCase();
    return items.filter((item) => item.name.toLowerCase().includes(lowerQuery));
  }, [items, searchQuery]);

  const handleSelectAll = () => {
    // Select all currently visible items (filtered)
    const newSelected = new Set(selectedIds.map(String));
    filteredItems.forEach((item) => newSelected.add(String(item.id)));
    // Convert back to number if original was number, but component handles string value
    // We kept the IDs as whatever they were passed in, but Group value expects string[] often
    // Let's standardize on keeping strict types for output
    const isNumber = typeof items[0]?.id === 'number';
    const result = Array.from(newSelected).map((id) => (isNumber ? Number(id) : id));
    onSelectionChange(result);
  };

  const handleDeselectAll = () => {
    // Deselect all currently visible items
    const visibleIds = new Set(filteredItems.map((item) => String(item.id)));
    const remaining = selectedIds.filter((id) => !visibleIds.has(String(id)));
    onSelectionChange(remaining);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => setIsOpen(e.open)}>
      <Dialog.Trigger asChild>
        <Button variant="outline" size="sm" justifyContent="space-between" w="full">
          {title}
          <Text as="span" color="fg.subtle" fontSize="xs">
            {selectedIds.length > 0
              ? `${selectedIds.length} selected`
              : triggerLabel || t('settings.select_all')}
          </Text>
        </Button>
      </Dialog.Trigger>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content display="flex" flexDirection="column" maxW="2xl" h="80vh">
          <Stack gap="4" borderColor="border.default" borderBottom="1px solid" p="4">
            <HStack justifyContent="space-between" alignItems="center">
              <Dialog.Title>{title}</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <IconButton variant="ghost" size="sm">
                  <FaXmark />
                </IconButton>
              </Dialog.CloseTrigger>
            </HStack>

            <HStack gap="2">
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </HStack>

            <HStack gap="2" justifyContent="space-between" flexWrap="wrap">
              {logic && onLogicChange && (
                <Group value={[logic]} onValueChange={(val) => onLogicChange(val[0] as LogicType)}>
                  <HStack>
                    <Checkbox value="and">{t('settings.logic_and')}</Checkbox>
                    <Checkbox value="or">{t('settings.logic_or')}</Checkbox>
                  </HStack>
                </Group>
              )}
              <HStack>
                <Button size="xs" variant="outline" onClick={handleSelectAll}>
                  {t('settings.select_all')}
                </Button>
                <Button size="xs" variant="outline" onClick={handleDeselectAll}>
                  {t('settings.deselect_all')}
                </Button>
              </HStack>
            </HStack>
          </Stack>

          <Stack flex="1" p="4" overflowY="auto">
            <Group
              value={selectedIds.map(String)}
              onValueChange={(val) => {
                const isNumber = typeof items[0]?.id === 'number';
                onSelectionChange(val.map((v) => (isNumber ? Number(v) : v)));
              }}
            >
              <Wrap gap="4">
                {filteredItems.map((item) => (
                  <Checkbox key={item.id} value={String(item.id)}>
                    {item.name}
                  </Checkbox>
                ))}
              </Wrap>
            </Group>
            {filteredItems.length === 0 && (
              <Text py="8" color="fg.subtle" textAlign="center">
                No results found.
              </Text>
            )}
          </Stack>

          <Stack borderColor="border.default" borderTop="1px solid" p="4">
            <Button onClick={() => setIsOpen(false)}>{t('common.confirm')}</Button>
          </Stack>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
