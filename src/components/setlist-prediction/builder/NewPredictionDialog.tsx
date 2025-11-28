import { useTranslation } from 'react-i18next';
import { useState, useMemo } from 'react';
import { css } from 'styled-system/css';
import { Box, HStack, Stack } from 'styled-system/jsx';
import { Button } from '~/components/ui/styled/button';
import { Text } from '~/components/ui/styled/text';
import { Input } from '~/components/ui/styled/input';
import { usePerformanceData } from '~/hooks/setlist-prediction/usePerformanceData';
import {
  Root as DialogRoot,
  Backdrop as DialogBackdrop,
  Positioner as DialogPositioner,
  Content as DialogContent,
  Title as DialogTitle,
  Description as DialogDescription,
  CloseTrigger as DialogCloseTrigger
} from '~/components/ui/styled/dialog';
import type { CustomPerformance } from '~/types/setlist-prediction';

type NewMode = 'performance' | 'custom';

export interface NewPredictionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateNew: (options: { performanceId?: string; customPerformance?: CustomPerformance }) => void;
}

export function NewPredictionDialog({ open, onOpenChange, onCreateNew }: NewPredictionDialogProps) {
  const { t } = useTranslation();
  const { performances } = usePerformanceData();

  const [mode, setMode] = useState<NewMode>('performance');
  const [selectedPerformanceId, setSelectedPerformanceId] = useState<string | null>(null);
  const [customName, setCustomName] = useState('');
  const [customVenue, setCustomVenue] = useState('');
  const [customDate, setCustomDate] = useState('');
  const [search, setSearch] = useState('');

  const filteredPerformances = useMemo(() => {
    let filtered = performances.filter((p) => p.status === 'upcoming' || p.status === 'completed');

    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) || p.venue?.toLowerCase().includes(searchLower)
      );
    }

    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return filtered.slice(0, 30);
  }, [performances, search]);

  const handleConfirm = () => {
    if (mode === 'performance' && selectedPerformanceId) {
      onCreateNew({ performanceId: selectedPerformanceId });
      onOpenChange(false);
    } else if (mode === 'custom' && customName.trim()) {
      const customPerformance: CustomPerformance = {
        name: customName.trim(),
        venue: customVenue.trim() || undefined,
        date: customDate || undefined
      };
      onCreateNew({ customPerformance });
      onOpenChange(false);
    }
  };

  const isConfirmDisabled =
    (mode === 'performance' && !selectedPerformanceId) || (mode === 'custom' && !customName.trim());

  return (
    <DialogRoot
      open={open}
      onOpenChange={(details: { open: boolean }) => onOpenChange(details.open)}
    >
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
            <DialogTitle>
              {t('setlistPrediction.newPrediction', { defaultValue: 'New Prediction' })}
            </DialogTitle>

            <DialogDescription>
              <Text fontSize="sm">
                {t('setlistPrediction.newPredictionDescription', {
                  defaultValue: 'Create a new prediction for a performance or a custom setlist.'
                })}
              </Text>
            </DialogDescription>

            <Stack gap={2}>
              <Box display="flex" gap={2}>
                <Button
                  size="sm"
                  variant={mode === 'performance' ? 'solid' : 'outline'}
                  onClick={() => setMode('performance')}
                >
                  {t('setlistPrediction.forPerformance', { defaultValue: 'For Performance' })}
                </Button>
                <Button
                  size="sm"
                  variant={mode === 'custom' ? 'solid' : 'outline'}
                  onClick={() => setMode('custom')}
                >
                  {t('setlistPrediction.customPrediction', { defaultValue: 'Custom' })}
                </Button>
              </Box>
            </Stack>

            <Box flex={1} minH={0} overflow="auto">
              {mode === 'performance' && (
                <Stack gap={3}>
                  <Input
                    value={search}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                    placeholder={t('setlistPrediction.searchPerformances', {
                      defaultValue: 'Search performances...'
                    })}
                  />
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
                        borderRadius="md"
                        borderWidth="1px"
                        p={3}
                        cursor="pointer"
                        _hover={{ bgColor: 'bg.subtle' }}
                      >
                        <Stack gap={0.5}>
                          <Text fontSize="sm" fontWeight="medium">
                            {perf.name}
                          </Text>
                          <Text color="fg.muted" fontSize="xs">
                            {new Date(perf.date).toLocaleDateString()} • {perf.venue || 'TBA'}
                          </Text>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                </Stack>
              )}

              {mode === 'custom' && (
                <Stack gap={3}>
                  <Box>
                    <Text mb={2} fontSize="sm" fontWeight="medium">
                      {t('setlistPrediction.performanceName', { defaultValue: 'Performance Name' })} *
                    </Text>
                    <Input
                      value={customName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCustomName(e.target.value)
                      }
                      placeholder={t('setlistPrediction.enterPerformanceName', {
                        defaultValue: 'Enter performance name...'
                      })}
                    />
                  </Box>
                  <HStack gap={2}>
                    <Box flex={1}>
                      <Text mb={2} fontSize="sm" fontWeight="medium">
                        {t('setlistPrediction.venue', { defaultValue: 'Venue' })}
                      </Text>
                      <Input
                        value={customVenue}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCustomVenue(e.target.value)
                        }
                        placeholder={t('setlistPrediction.optional', { defaultValue: 'Optional' })}
                      />
                    </Box>
                    <Box flex={1}>
                      <Text mb={2} fontSize="sm" fontWeight="medium">
                        {t('setlistPrediction.date', { defaultValue: 'Date' })}
                      </Text>
                      <Input
                        type="date"
                        value={customDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCustomDate(e.target.value)
                        }
                      />
                    </Box>
                  </HStack>
                </Stack>
              )}
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
                <Button variant="outline">{t('common.cancel', { defaultValue: 'Cancel' })}</Button>
              </DialogCloseTrigger>
              <Button onClick={handleConfirm} disabled={isConfirmDisabled}>
                {t('common.create', { defaultValue: 'Create' })}
              </Button>
            </Box>
          </Stack>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
}
