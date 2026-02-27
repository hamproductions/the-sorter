import { useImperativeHandle, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCheck, FaChevronDown } from 'react-icons/fa6';
import { Stack } from 'styled-system/jsx';
import { Combobox, createListCollection } from '~/components/ui/combobox';
import { IconButton } from '~/components/ui/icon-button';
import { Input } from '~/components/ui/input';
import { useSongSearch } from '~/hooks/useSongSearch';
import { getSongName } from '~/utils/names';
import type { Song } from '~/types/songs';

export interface HeardleSongComboboxHandle {
  clearInput: () => void;
}

export interface HeardleSongComboboxProps {
  songInventory: Song[];
  onSelect: (songId: string, songName: string) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  comboboxRef?: React.Ref<HeardleSongComboboxHandle>;
}

function SongItem({
  item,
  lang
}: {
  item: { value: string; label: string; englishName?: string; artist?: string; color: string };
  lang: string;
}) {
  return (
    <Combobox.Item key={item.value} item={item} h="auto" minH={10}>
      <Combobox.ItemText>
        <Stack gap={0} py={0.5}>
          <span>{getSongName(item.label, item.englishName, lang)}</span>
          {item.artist && (
            <span style={{ fontSize: 'var(--font-sizes-xs)', color: item.color, fontWeight: 500 }}>
              {item.artist}
            </span>
          )}
        </Stack>
      </Combobox.ItemText>
      <Combobox.ItemIndicator>
        <FaCheck />
      </Combobox.ItemIndicator>
    </Combobox.Item>
  );
}

export function HeardleSongCombobox({
  songInventory,
  onSelect,
  inputRef,
  comboboxRef
}: HeardleSongComboboxProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [inputValue, setInputValue] = useState('');

  useImperativeHandle(comboboxRef, () => ({
    clearInput: () => setInputValue('')
  }));
  const emptyValue = useMemo(() => [] as string[], []);

  const { songMatches, artistMatches, items } = useSongSearch(songInventory, inputValue, lang);

  const collection = useMemo(() => createListCollection({ items }), [items]);

  const songItems = useMemo(
    () =>
      songMatches.map((r) => ({
        value: r.id,
        label: r.name,
        englishName: r.englishName,
        artist: r.artist,
        color: r.color
      })),
    [songMatches]
  );

  const artistItems = useMemo(
    () =>
      artistMatches.map((r) => ({
        value: r.id,
        label: r.name,
        englishName: r.englishName,
        artist: r.artist,
        color: r.color
      })),
    [artistMatches]
  );

  return (
    <Combobox.Root
      collection={collection}
      value={emptyValue}
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
      openOnClick
    >
      <Combobox.Control>
        <Combobox.Input placeholder={t('heardle.search_placeholder')} asChild>
          <Input ref={inputRef} />
        </Combobox.Input>
        <Combobox.Trigger asChild>
          <IconButton variant="link" aria-label="open" size="xs">
            <FaChevronDown />
          </IconButton>
        </Combobox.Trigger>
      </Combobox.Control>
      <Combobox.Positioner>
        <Combobox.Content>
          {songItems.length > 0 && (
            <Combobox.ItemGroup>
              <Combobox.ItemGroupLabel>{t('heardle.group_songs')}</Combobox.ItemGroupLabel>
              {songItems.map((item) => (
                <SongItem key={item.value} item={item} lang={lang} />
              ))}
            </Combobox.ItemGroup>
          )}
          {artistItems.length > 0 && (
            <Combobox.ItemGroup>
              <Combobox.ItemGroupLabel>{t('heardle.group_by_artist')}</Combobox.ItemGroupLabel>
              {artistItems.map((item) => (
                <SongItem key={item.value} item={item} lang={lang} />
              ))}
            </Combobox.ItemGroup>
          )}
        </Combobox.Content>
      </Combobox.Positioner>
    </Combobox.Root>
  );
}
