import { useMemo } from 'react';
import { FaCheck, FaChevronDown } from 'react-icons/fa6';
import { Select, createListCollection } from '../ui/select';
import { Text } from '../ui/text';
import { Box } from 'styled-system/jsx';

export interface LeaderboardSelectOption {
  value: string;
  label: string;
  group?: string;
  indent?: boolean;
  count?: number;
}

const renderItem = (item: LeaderboardSelectOption) => (
  <Select.Item key={item.value} item={item} pl={item.indent ? '6' : undefined}>
    <Select.ItemText>{item.label}</Select.ItemText>
    {item.count !== undefined && (
      <Text ml="auto" color="fg.muted" fontSize="xs" fontVariantNumeric="tabular-nums">
        {item.count}
      </Text>
    )}
    <Box flexShrink={0} w="4" ml="2">
      <Select.ItemIndicator>
        <FaCheck />
      </Select.ItemIndicator>
    </Box>
  </Select.Item>
);

export function LeaderboardSelect({
  label,
  value,
  options,
  onChange,
  width = '44'
}: {
  label: string;
  value: string;
  options: LeaderboardSelectOption[];
  onChange: (value: string) => void;
  width?: string;
}) {
  const collection = useMemo(() => createListCollection({ items: options }), [options]);
  const groups = useMemo(
    () =>
      options.reduce<{ group?: string; items: LeaderboardSelectOption[] }[]>((acc, option) => {
        const last = acc.at(-1);
        if (last && last.group === option.group) last.items.push(option);
        else acc.push({ group: option.group, items: [option] });
        return acc;
      }, []),
    [options]
  );

  return (
    <Select.Root
      collection={collection}
      value={[value]}
      onValueChange={(e) => {
        if (e.value[0]) onChange(e.value[0]);
      }}
      positioning={{ sameWidth: true }}
      size="sm"
      width={width}
    >
      <Select.Label>{label}</Select.Label>
      <Select.Control>
        <Select.Trigger>
          <Select.ValueText />
          <FaChevronDown />
        </Select.Trigger>
      </Select.Control>
      <Select.Positioner>
        <Select.Content maxH="72" overflowY="auto">
          {groups.map(({ group, items }, idx) =>
            group ? (
              <Select.ItemGroup key={group}>
                <Select.ItemGroupLabel>{group}</Select.ItemGroupLabel>
                {items.map(renderItem)}
              </Select.ItemGroup>
            ) : (
              <Select.ItemGroup key={`ungrouped-${idx}`}>{items.map(renderItem)}</Select.ItemGroup>
            )
          )}
        </Select.Content>
      </Select.Positioner>
    </Select.Root>
  );
}
