import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Stack } from 'styled-system/jsx';
import { Combobox, createListCollection } from '~/components/ui/combobox';
import { Text } from '../ui/text';
import { useSongSearch } from '~/hooks/useSongSearch';
import { getSongName } from '~/utils/names';
import type { Song } from '~/types/songs';

export interface HeardleSongComboboxProps {
  songInventory: Song[];
  onSelect: (songId: string, songName: string) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export function HeardleSongCombobox({
  songInventory,
  onSelect,
  inputRef
}: HeardleSongComboboxProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [inputValue, setInputValue] = useState('');

  const { items } = useSongSearch(songInventory, inputValue, lang);

  const collection = useMemo(() => createListCollection({ items }), [items]);

  return (
    <Combobox.Root
      collection={collection}
      inputValue={inputValue}
      inputBehavior="none"
      onInputValueChange={({ inputValue: v }) => setInputValue(v)}
      onValueChange={({ items: selected }) => {
        if (selected.length > 0) {
          onSelect(
            selected[0].value,
            getSongName(selected[0].label, selected[0].englishName, lang)
          );
          setInputValue('');
        }
      }}
      positioning={{ sameWidth: true, strategy: 'fixed' }}
      openOnClick={false}
    >
      <Combobox.Control>
        <Combobox.Input ref={inputRef} placeholder={t('heardle.search_placeholder')} />
      </Combobox.Control>
      <Combobox.Positioner>
        <Combobox.Content>
          {items.length === 0 && inputValue.trim() !== '' && (
            <Box p={3} textAlign="center">
              <Text color="fg.muted" fontSize="sm">
                {t('heardle.no_results')}
              </Text>
            </Box>
          )}
          {items.map((item) => (
            <Combobox.Item key={item.value} item={item}>
              <Combobox.ItemText>
                <Stack gap={0} py={0.5}>
                  <Text fontSize="sm" fontWeight="medium">
                    {getSongName(item.label, item.englishName, lang)}
                  </Text>
                  {lang === 'en' && item.englishName && (
                    <Text color="fg.muted" fontSize="xs">
                      {item.label}
                    </Text>
                  )}
                  {item.artist && (
                    <Text
                      style={{ '--song-color': item.color } as React.CSSProperties}
                      color="var(--song-color)"
                      fontSize="xs"
                      fontWeight="medium"
                    >
                      {item.artist}
                    </Text>
                  )}
                </Stack>
              </Combobox.ItemText>
            </Combobox.Item>
          ))}
        </Combobox.Content>
      </Combobox.Positioner>
    </Combobox.Root>
  );
}
