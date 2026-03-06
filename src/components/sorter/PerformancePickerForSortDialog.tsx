import { useTranslation } from 'react-i18next';
import { useState, useMemo, useEffect } from 'react';
import { css } from 'styled-system/css';
import { Box, Stack } from 'styled-system/jsx';
import { Button } from '~/components/ui/styled/button';
import { Text } from '~/components/ui/styled/text';
import { Input } from '~/components/ui/styled/input';
import {
  usePerformanceData,
  usePerformanceSetlist
} from '~/hooks/setlist-prediction/usePerformanceData';
import { getFullPerformanceName } from '~/utils/names';
import { computeSetlistLabels } from '~/utils/performance-sort';
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

export interface PerformancePickerForSortDialogProps {
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
  onSelectPerformance: (songIds: string[], meta: PerformanceSortMeta) => void;
}

export function PerformancePickerForSortDialog({
  open,
  onOpenChange,
  onSelectPerformance
}: PerformancePickerForSortDialogProps) {
  const { t } = useTranslation();
  const { performances, loading: performancesLoading } = usePerformanceData();

  const [selectedPerformanceId, setSelectedPerformanceId] = useState<string | undefined>();
  const [search, setSearch] = useState('');

  const { setlist, loading: setlistLoading } = usePerformanceSetlist(selectedPerformanceId);

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

    // Group by tourName, most recent first
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return filtered;
  }, [performances, search]);

  // Compute deduplicated song IDs and full setlist order with M01/EN01 labels
  const setlistInfo = useMemo(() => {
    if (!setlist) return null;
    const orderEntries = computeSetlistLabels(setlist);
    const uniqueSongIds = [...new Set(orderEntries.map((e) => e.songId))];
    return { uniqueSongIds, orderEntries };
  }, [setlist]);

  // Reset selection when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedPerformanceId(undefined);
      setSearch('');
    }
  }, [open]);

  const selectedPerformance = performances.find((p) => p.id === selectedPerformanceId);

  const handleConfirm = () => {
    if (!selectedPerformance || !setlistInfo) return;
    const meta: PerformanceSortMeta = {
      performanceId: selectedPerformance.id,
      tourName: selectedPerformance.tourName,
      performanceName: selectedPerformance.performanceName,
      date: selectedPerformance.date,
      venue: selectedPerformance.venue,
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
          maxW="600px"
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

            <Box flex={1} minH={0} overflow="auto">
              {performancesLoading ? (
                <Text color="fg.muted" textAlign="center">
                  {t('common.loading')}
                </Text>
              ) : filteredPerformances.length === 0 ? (
                <Text color="fg.muted" textAlign="center">
                  {t('dialog.performance_picker.no_performances')}
                </Text>
              ) : (
                <Stack gap={2}>
                  {filteredPerformances.map((perf) => (
                    <Box
                      className={css({
                        '&[data-selected=true]': {
                          borderColor: 'border.accent',
                          bgColor: 'bg.emphasized'
                        }
                      })}
                      key={perf.id}
                      data-selected={selectedPerformanceId === perf.id}
                      onClick={() => setSelectedPerformanceId(perf.id)}
                      cursor="pointer"
                      borderRadius="md"
                      borderWidth="1px"
                      p={3}
                      _hover={{ bgColor: 'bg.subtle' }}
                    >
                      <Stack gap={0.5}>
                        <Text fontSize="sm" fontWeight="medium">
                          {getFullPerformanceName(perf)}
                        </Text>
                        <Text color="fg.muted" fontSize="xs">
                          {new Date(perf.date).toLocaleDateString()} • {perf.venue || 'TBA'}
                        </Text>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>

            {selectedPerformance && (
              <Box borderRadius="md" borderWidth="1px" p={3} bg="bg.subtle">
                <Text fontSize="sm" fontWeight="medium">
                  {getFullPerformanceName(selectedPerformance)}
                </Text>
                {setlistLoading ? (
                  <Text color="fg.muted" fontSize="xs">
                    {t('dialog.performance_picker.loading_setlist')}
                  </Text>
                ) : setlistInfo ? (
                  <Text color="fg.muted" fontSize="xs">
                    {t('dialog.performance_picker.song_count', {
                      count: setlistInfo.uniqueSongIds.length
                    })}
                  </Text>
                ) : null}
              </Box>
            )}

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
                disabled={!selectedPerformance || !setlistInfo || setlistLoading}
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
