import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuCheck } from 'react-icons/lu';
import { Dialog } from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Text } from '~/components/ui/text';
import { Badge } from '~/components/ui/badge';
import { Box, Center, Grid, HStack, Stack, styled } from 'styled-system/jsx';
import seriesInfo from '../../../data/series-info.json';
import type { Character } from '~/types';
import type { Locale } from '~/i18n';
import { getPicUrl } from '~/utils/assets';
import { getCastName, getFullName } from '~/utils/character';
import { fuzzySearch } from '~/utils/search';

interface CharacterGridSelectorProps {
  title: string;
  triggerLabel?: string;
  characters: Character[];
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
}

/** Emblem icon with a portrait-art fallback for characters that have no icon. */
function CharacterTileImage({ character, locale }: { character: Character; locale: Locale }) {
  // Tiles are keyed by character id, so a given instance never switches
  // characters — once an emblem 404s the fallback should stick for its lifetime.
  const [iconError, setIconError] = useState(false);

  const fullName = getFullName(character, locale);

  if (character.hasIcon && !iconError) {
    return (
      <styled.img
        src={getPicUrl(character.id, 'icons')}
        alt={`${fullName} Icon`}
        loading="lazy"
        onError={() => setIconError(true)}
        maxW="70%"
        maxH="70%"
        objectFit="contain"
      />
    );
  }

  // Full-body sprites: anchor to the top so the face stays visible instead of
  // being cropped out by a centered cover.
  return (
    <styled.img
      src={getPicUrl(character.id, 'character')}
      alt={fullName}
      loading="lazy"
      w="full"
      h="full"
      objectFit="cover"
      objectPosition="center top"
    />
  );
}

export function CharacterGridSelector({
  title,
  triggerLabel,
  characters,
  selectedIds,
  onSelectionChange
}: CharacterGridSelectorProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language as Locale;
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [tempSelectedIds, setTempSelectedIds] = useState<number[]>([]);

  const handleOpen = () => {
    setTempSelectedIds([...selectedIds]);
    setSearchQuery('');
    setSelectedCategory('ALL');
    setIsOpen(true);
  };

  const handleSave = () => {
    onSelectionChange(tempSelectedIds);
    setIsOpen(false);
  };

  const toggle = (id: number) => {
    setTempSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return characters;
    return characters.filter((c) =>
      fuzzySearch(
        {
          id: c.id,
          name: c.fullName,
          englishName: c.englishName ?? undefined,
          phoneticName: c.casts?.map((cast) => `${cast.seiyuu} ${cast.englishName ?? ''}`).join(' ')
        },
        searchQuery
      )
    );
  }, [characters, searchQuery]);

  // Series that actually have characters available — drives the tab list.
  // Based on the unfiltered `characters` so tabs stay stable while searching.
  const availableSeries = useMemo(
    () =>
      seriesInfo.filter((s) =>
        characters.some((c) => String(c.seriesId) === String(s.id))
      ),
    [characters]
  );

  // If the active franchise tab disappears (e.g. the series filter changes while
  // the dialog is open), fall back to "All" so the grid never goes empty.
  useEffect(() => {
    if (selectedCategory !== 'ALL' && !availableSeries.some((s) => s.id === selectedCategory)) {
      setSelectedCategory('ALL');
    }
  }, [availableSeries, selectedCategory]);

  // Group by series (canonical order), honoring the active franchise tab.
  const groups = useMemo(() => {
    return seriesInfo
      .filter((s) => selectedCategory === 'ALL' || s.id === selectedCategory)
      .map((s) => ({
        id: s.id,
        name: s.name,
        color: s.color,
        items: filtered.filter((c) => String(c.seriesId) === String(s.id))
      }))
      .filter((g) => g.items.length > 0);
  }, [filtered, selectedCategory]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => setIsOpen(e.open)}>
      <Dialog.Trigger asChild>
        <Button variant="outline" size="sm" onClick={handleOpen}>
          {triggerLabel || title}
          {selectedIds.length > 0 && <Badge ml="2">{selectedIds.length}</Badge>}
        </Button>
      </Dialog.Trigger>
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
            <HStack justifyContent="space-between" alignItems="center">
              <Dialog.Title>{title}</Dialog.Title>
              <Badge variant="solid" size="sm">
                {tempSelectedIds.length}
              </Badge>
            </HStack>

            <Input
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {availableSeries.length > 1 && (
              <HStack gap="2" pb="1" overflowX="auto">
                <Button
                  size="xs"
                  variant={selectedCategory === 'ALL' ? 'solid' : 'outline'}
                  onClick={() => setSelectedCategory('ALL')}
                  flexShrink="0"
                >
                  {t('common.all')}
                </Button>
                {availableSeries.map((s) => (
                  <Button
                    key={s.id}
                    size="xs"
                    variant={selectedCategory === s.id ? 'subtle' : 'outline'}
                    onClick={() => setSelectedCategory(s.id)}
                    flexShrink="0"
                    style={{
                      borderColor: s.color,
                      backgroundColor: selectedCategory === s.id ? s.color : undefined,
                      color: selectedCategory === s.id ? 'white' : s.color
                    }}
                  >
                    {s.name}
                  </Button>
                ))}
              </HStack>
            )}

            <Box flex="1" overflowY="auto" mx="-2" px="2">
              {groups.length === 0 ? (
                <Text py="4" color="fg.muted" textAlign="center">
                  {t('common.no_items')}
                </Text>
              ) : (
                <Stack gap="6">
                  {groups.map((group) => (
                    <Stack key={group.id} gap="3">
                      <HStack gap="2" alignItems="center" position="sticky" top="0" bg="bg.canvas" py="1" zIndex="1">
                        <Box w="1" h="5" rounded="full" style={{ backgroundColor: group.color }} />
                        <Text fontWeight="bold" style={{ color: group.color }}>
                          {group.name}
                        </Text>
                      </HStack>
                      <Grid gridGap="2" gridTemplateColumns="repeat(auto-fill, minmax(140px, 1fr))">
                        {group.items.map((c) => {
                          const id = Number(c.id);
                          const isSelected = tempSelectedIds.includes(id);
                          const color = c.colorCode ?? c.seriesColor ?? group.color;
                          return (
                            <styled.button
                              key={c.id}
                              type="button"
                              onClick={() => toggle(id)}
                              aria-pressed={isSelected}
                              cursor="pointer"
                              display="flex"
                              flexDirection="column"
                              gap="2"
                              p="2"
                              rounded="l2"
                              borderWidth="2px"
                              transition="all 0.15s"
                              alignItems="center"
                              textAlign="center"
                              bg="bg.canvas"
                              style={{
                                borderColor: isSelected ? color : 'transparent',
                                boxShadow: isSelected ? `0 0 0 1px ${color}` : undefined
                              }}
                              _hover={{ bg: 'bg.subtle' }}
                            >
                              <Center
                                position="relative"
                                w="full"
                                aspectRatio="1"
                                rounded="l1"
                                bg="bg.muted"
                                overflow="hidden"
                              >
                                <CharacterTileImage character={c} locale={locale} />
                                {isSelected && (
                                  <Center
                                    position="absolute"
                                    top="1"
                                    right="1"
                                    w="6"
                                    h="6"
                                    rounded="full"
                                    color="white"
                                    style={{ backgroundColor: color }}
                                  >
                                    <LuCheck />
                                  </Center>
                                )}
                              </Center>
                              <Stack gap="0.5" alignItems="center" w="full">
                                <Text
                                  fontWeight="bold"
                                  fontSize="sm"
                                  textAlign="center"
                                  truncate
                                  maxW="full"
                                >
                                  {getFullName(c, locale)}
                                </Text>
                                {c.casts?.[0] && (
                                  <Text fontSize="xs" color="fg.muted" textAlign="center">
                                    {getCastName(c.casts[0], locale)}
                                  </Text>
                                )}
                              </Stack>
                            </styled.button>
                          );
                        })}
                      </Grid>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Box>

            <HStack gap="4" justify="space-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTempSelectedIds([])}
                disabled={tempSelectedIds.length === 0}
              >
                {t('settings.deselect_all')}
              </Button>
              <HStack gap="4">
                <Dialog.CloseTrigger asChild>
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    {t('common.cancel')}
                  </Button>
                </Dialog.CloseTrigger>
                <Button onClick={handleSave}>{t('common.confirm')}</Button>
              </HStack>
            </HStack>
          </Stack>
          <Dialog.CloseTrigger />
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
