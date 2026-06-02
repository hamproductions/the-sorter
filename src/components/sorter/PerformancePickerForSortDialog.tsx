import { useTranslation } from 'react-i18next';
import { useState, useMemo, useEffect } from 'react';
import { Box, HStack, Stack } from 'styled-system/jsx';
import { Button } from '~/components/ui/styled/button';
import { Text } from '~/components/ui/styled/text';
import { Input } from '~/components/ui/styled/input';
import { Checkbox } from '~/components/ui/checkbox';
import {
  usePerformanceData,
  usePerformanceSetlists
} from '~/hooks/setlist-prediction/usePerformanceData';
import { useSongData } from '~/hooks/useSongData';
import { getFullPerformanceName, getSongName } from '~/utils/names';
import { computeSortableSetlistLabels } from '~/utils/performance-sort';
import {
  Root as DialogRoot,
  Backdrop as DialogBackdrop,
  Positioner as DialogPositioner,
  Content as DialogContent,
  Title as DialogTitle,
  Description as DialogDescription,
  CloseTrigger as DialogCloseTrigger
} from '~/components/ui/styled/dialog';
import type { PerformanceSortMeta } from '~/types/performance-sort';
import type { Performance } from '~/types/setlist-prediction';

export interface PerformancePickerForSortDialogProps {
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
  onSelectPerformance: (songIds: string[], meta: PerformanceSortMeta) => void;
}

function getLegName(performance: Performance): string {
  const name = performance.performanceName?.trim();
  if (!name) return performance.tourName;

  const withoutSuffix = name
    .replace(/\s*[(（][^()（）]*[)）]\s*$/u, '')
    .replace(/\s*(?:Day\.?\s*\d+|DAY\s*\d+)$/u, '')
    .trim();

  return withoutSuffix || name;
}

function getSelectionLabel(performances: Performance[]): string {
  if (performances.length === 0) return '';
  if (performances.length === 1) return getFullPerformanceName(performances[0]);

  const tourNames = new Set(performances.map((performance) => performance.tourName));
  if (tourNames.size === 1) {
    const tourName = performances[0].tourName;
    const legNames = new Set(performances.map(getLegName));
    if (legNames.size === 1) {
      const legName = [...legNames][0];
      if (legName !== tourName) {
        return `${tourName} - ${legName} (${performances.length} performances)`;
      }
    }
    return `${tourName} (${performances.length} performances)`;
  }

  return `${performances.length} performances`;
}

function getPerformanceRowName(performance: Performance): string {
  return performance.performanceName?.trim() || performance.tourName;
}

export function PerformancePickerForSortDialog({
  open,
  onOpenChange,
  onSelectPerformance
}: PerformancePickerForSortDialogProps) {
  const { t, i18n } = useTranslation();
  const { performances, loading: performancesLoading } = usePerformanceData();
  const songs = useSongData();

  const [selectedPerformanceIds, setSelectedPerformanceIds] = useState<string[]>([]);
  const [expandedTourNames, setExpandedTourNames] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  const { setlistsByPerformanceId, loading: setlistsLoading } =
    usePerformanceSetlists(selectedPerformanceIds);

  const filteredPerformances = useMemo(() => {
    let filtered = performances.filter((p) => p.hasSetlist === true);

    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.tourName.toLowerCase().includes(searchLower) ||
          p.performanceName?.toLowerCase().includes(searchLower) ||
          p.venue?.toLowerCase().includes(searchLower)
      );
    }

    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return filtered;
  }, [performances, search]);

  const performanceGroups = useMemo(() => {
    const groups = new Map<
      string,
      {
        tourName: string;
        performances: Performance[];
        legs: Map<string, Performance[]>;
      }
    >();

    for (const performance of filteredPerformances) {
      let group = groups.get(performance.tourName);
      if (!group) {
        group = {
          tourName: performance.tourName,
          performances: [],
          legs: new Map()
        };
        groups.set(performance.tourName, group);
      }

      const legName = getLegName(performance);
      const leg = group.legs.get(legName) ?? [];
      leg.push(performance);
      group.legs.set(legName, leg);
      group.performances.push(performance);
    }

    return [...groups.values()];
  }, [filteredPerformances]);

  const selectedPerformances = useMemo(() => {
    const selectedIds = new Set(selectedPerformanceIds);
    return performances
      .filter((performance) => selectedIds.has(performance.id))
      .toSorted((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [performances, selectedPerformanceIds]);

  const setlistInfo = useMemo(() => {
    const orderEntries = selectedPerformances.flatMap((performance) => {
      const setlist = setlistsByPerformanceId.get(performance.id);
      if (!setlist) return [];

      return computeSortableSetlistLabels(setlist, songs).map((entry) => ({
        ...entry,
        label:
          selectedPerformances.length > 1
            ? `${performance.performanceName ?? performance.tourName} ${entry.label}`
            : entry.label,
        performanceId: performance.id,
        performanceName: performance.performanceName ?? performance.tourName,
        date: performance.date
      }));
    });
    const uniqueSongIds = [...new Set(orderEntries.map((entry) => entry.songId))];
    return { uniqueSongIds, orderEntries };
  }, [selectedPerformances, setlistsByPerformanceId, songs]);

  const songMap = useMemo(() => new Map(songs.map((song) => [song.id, song])), [songs]);
  const isSearching = search.trim().length > 0;

  const previewEntries = useMemo(() => {
    return setlistInfo.orderEntries
      .map((entry) => {
        const song = songMap.get(entry.songId);
        if (!song) return null;

        return {
          label: entry.label,
          name: getSongName(song.name, song.englishName, i18n.language)
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
  }, [setlistInfo.orderEntries, songMap, i18n.language]);

  const selectedIds = useMemo(() => new Set(selectedPerformanceIds), [selectedPerformanceIds]);
  const selectionLabel = getSelectionLabel(selectedPerformances);

  useEffect(() => {
    if (!open) {
      setSelectedPerformanceIds([]);
      setExpandedTourNames([]);
      setSearch('');
    }
  }, [open]);

  const toggleExpandedTour = (tourName: string) => {
    setExpandedTourNames((current) =>
      current.includes(tourName)
        ? current.filter((name) => name !== tourName)
        : [...current, tourName]
    );
  };

  const togglePerformanceIds = (ids: string[]) => {
    setSelectedPerformanceIds((current) => {
      const next = new Set(current);
      const shouldRemove = ids.every((id) => next.has(id));

      for (const id of ids) {
        if (shouldRemove) {
          next.delete(id);
        } else {
          next.add(id);
        }
      }

      return [...next];
    });
  };

  const getChecked = (ids: string[]) => {
    const selectedCount = ids.filter((id) => selectedIds.has(id)).length;
    if (selectedCount === 0) return false;
    if (selectedCount === ids.length) return true;
    return 'indeterminate';
  };

  const handleConfirm = () => {
    if (selectedPerformances.length === 0 || setlistInfo.uniqueSongIds.length === 0) return;
    const firstPerformance = selectedPerformances[0];
    const meta: PerformanceSortMeta = {
      performanceId: selectedPerformances.length === 1 ? selectedPerformances[0].id : undefined,
      performanceIds: selectedPerformances.map((performance) => performance.id),
      tourName: firstPerformance.tourName,
      performanceName:
        selectedPerformances.length === 1 ? firstPerformance.performanceName : selectionLabel,
      selectionLabel,
      date: firstPerformance.date,
      venue: selectedPerformances.length === 1 ? firstPerformance.venue : undefined,
      setlistOrder: setlistInfo.orderEntries
    };
    onSelectPerformance(setlistInfo.uniqueSongIds, meta);
    onOpenChange({ open: false });
  };

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent
          display="flex"
          flexDirection="column"
          maxW="960px"
          maxH="80vh"
          overflow="hidden"
        >
          <Stack flex={1} gap={4} minH={0} p={6} overflow="hidden">
            <DialogTitle>{t('dialog.performance_picker.title')}</DialogTitle>
            <DialogDescription>
              <Text fontSize="sm">{t('dialog.performance_picker.description')}</Text>
            </DialogDescription>

            <Box borderRadius="md" borderWidth="1px" p={3}>
              <Input
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                placeholder={t('dialog.performance_picker.search_placeholder')}
              />
            </Box>

            <Box
              display="grid"
              flex={1}
              gap={4}
              gridTemplateColumns={{ base: '1fr', md: 'minmax(0, 1fr) minmax(0, 1fr)' }}
              minH={0}
            >
              <Box minH="240px" overflow="auto">
                {performancesLoading ? (
                  <Text color="fg.muted" textAlign="center">
                    {t('common.loading')}
                  </Text>
                ) : performanceGroups.length === 0 ? (
                  <Text color="fg.muted" textAlign="center">
                    {t('dialog.performance_picker.no_performances')}
                  </Text>
                ) : (
                  <Stack gap={3}>
                    {performanceGroups.map((group) => {
                      const groupIds = group.performances.map((performance) => performance.id);
                      const legs = [...group.legs.entries()];
                      const isExpanded = isSearching || expandedTourNames.includes(group.tourName);

                      return (
                        <Box key={group.tourName} borderRadius="md" borderWidth="1px" p={3}>
                          <Stack gap={2}>
                            <HStack gap={3} justifyContent="space-between" alignItems="flex-start">
                              <Checkbox
                                checked={getChecked(groupIds)}
                                onCheckedChange={() => togglePerformanceIds(groupIds)}
                                aria-label={group.tourName}
                              >
                                <HStack gap={2} alignItems="baseline">
                                  <Text fontSize="sm" fontWeight="bold">
                                    {group.tourName}
                                  </Text>
                                  <Text color="fg.muted" fontSize="xs">
                                    {group.performances.length}
                                  </Text>
                                </HStack>
                              </Checkbox>
                              {!isSearching && (
                                <Button
                                  size="xs"
                                  variant="outline"
                                  onClick={() => toggleExpandedTour(group.tourName)}
                                >
                                  {isExpanded
                                    ? t('dialog.performance_picker.hide_details')
                                    : t('dialog.performance_picker.show_details')}
                                </Button>
                              )}
                            </HStack>

                            {isExpanded && (
                              <Stack gap={1} pl={4}>
                                {legs.map(([legName, legPerformances]) => {
                                  const legIds = legPerformances.map(
                                    (performance) => performance.id
                                  );
                                  const showLeg =
                                    legPerformances.length > 1 && legName !== group.tourName;
                                  const performanceRows = legPerformances.map((performance) => (
                                    <Checkbox
                                      key={performance.id}
                                      size="sm"
                                      checked={selectedIds.has(performance.id)}
                                      onCheckedChange={() => togglePerformanceIds([performance.id])}
                                      aria-label={getFullPerformanceName(performance)}
                                    >
                                      <Stack gap={0}>
                                        <Text fontSize="sm">
                                          {getPerformanceRowName(performance)}
                                        </Text>
                                        <Text color="fg.muted" fontSize="xs">
                                          {new Date(performance.date).toLocaleDateString()} •{' '}
                                          {performance.venue || 'TBA'}
                                        </Text>
                                      </Stack>
                                    </Checkbox>
                                  ));

                                  return (
                                    <Stack key={legName} gap={1}>
                                      {showLeg && (
                                        <Checkbox
                                          size="sm"
                                          checked={getChecked(legIds)}
                                          onCheckedChange={() => togglePerformanceIds(legIds)}
                                          aria-label={`${group.tourName} - ${legName}`}
                                        >
                                          <Text fontSize="sm" fontWeight="medium">
                                            {legName}
                                          </Text>
                                        </Checkbox>
                                      )}

                                      {showLeg ? (
                                        <Stack gap={1} pl={4}>
                                          {performanceRows}
                                        </Stack>
                                      ) : (
                                        <Stack gap={1}>{performanceRows}</Stack>
                                      )}
                                    </Stack>
                                  );
                                })}
                              </Stack>
                            )}
                          </Stack>
                        </Box>
                      );
                    })}
                  </Stack>
                )}
              </Box>

              <Box
                display="flex"
                flexDirection="column"
                borderRadius="md"
                borderWidth="1px"
                minH="240px"
                bg="bg.subtle"
                overflow="hidden"
              >
                {selectedPerformances.length > 0 ? (
                  <>
                    <Stack gap={1} borderBottomWidth="1px" p={3}>
                      <Text fontSize="sm" fontWeight="medium">
                        {selectionLabel}
                      </Text>
                      {setlistsLoading ? (
                        <Text color="fg.muted" fontSize="xs">
                          {t('dialog.performance_picker.loading_setlist')}
                        </Text>
                      ) : (
                        <Text color="fg.muted" fontSize="xs">
                          {t('dialog.performance_picker.song_count', {
                            count: setlistInfo.uniqueSongIds.length
                          })}
                        </Text>
                      )}
                    </Stack>

                    <Stack flex={1} gap={0} minH={0} p={2} overflow="auto">
                      {previewEntries.map((entry) => (
                        <Box key={`${entry.label}-${entry.name}`} borderRadius="sm" p={2}>
                          <Text fontFamily="mono" fontSize="xs" fontWeight="bold">
                            {entry.label}
                          </Text>
                          <Text fontSize="sm">{entry.name}</Text>
                        </Box>
                      ))}
                    </Stack>
                  </>
                ) : (
                  <Box p={3}>
                    <Text color="fg.muted" fontSize="sm">
                      {t('dialog.performance_picker.select_hint')}
                    </Text>
                  </Box>
                )}
              </Box>
            </Box>

            <Box
              display="flex"
              gap={2}
              justifyContent="flex-end"
              borderTopWidth="1px"
              mt={2}
              pt={4}
            >
              <DialogCloseTrigger asChild>
                <Button variant="outline">{t('common.cancel')}</Button>
              </DialogCloseTrigger>
              <Button
                onClick={handleConfirm}
                disabled={
                  selectedPerformances.length === 0 ||
                  setlistsLoading ||
                  setlistInfo.uniqueSongIds.length === 0
                }
              >
                {t('common.confirm')}
              </Button>
            </Box>
          </Stack>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
}
