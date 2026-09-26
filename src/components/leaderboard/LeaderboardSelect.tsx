import { useMemo } from 'react';
import { FaCheck, FaChevronDown } from 'react-icons/fa6';
import { Select, createListCollection } from '../ui/select';

export interface LeaderboardSelectOption {
  value: string;
  label: string;
}

export function LeaderboardSelect({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: LeaderboardSelectOption[];
  onChange: (value: string) => void;
}) {
  const collection = useMemo(() => createListCollection({ items: options }), [options]);
  return (
    <Select.Root
      collection={collection}
      value={[value]}
      onValueChange={(e) => {
        if (e.value[0]) onChange(e.value[0]);
      }}
      positioning={{ sameWidth: true }}
      size="sm"
      width="44"
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
          {collection.items.map((item) => (
            <Select.Item key={item.value} item={item}>
              <Select.ItemText>{item.label}</Select.ItemText>
              <Select.ItemIndicator>
                <FaCheck />
              </Select.ItemIndicator>
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Positioner>
    </Select.Root>
  );
}
