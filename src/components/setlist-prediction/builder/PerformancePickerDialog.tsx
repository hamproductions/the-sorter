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

export interface PerformancePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPerformance: (
    performanceId: string | undefined,
    customPerformance?: CustomPerformance
  ) => void;
  currentPerformanceId?: string;
}

export function PerformancePickerDialog({
  open,
  onOpenChange,
  onSelectPerformance,
  currentPerformanceId
}: PerformancePickerDialogProps) {
  const { t } = useTranslation();
  const { performances } = usePerformanceData();

  const [selectedPerformanceId, setSelectedPerformanceId] = useState<string | undefined>(
    currentPerformanceId
  );
  const [search, setSearch] = useState('');
  const [customName, setCustomName] = useState('');
  const [customVenue, setCustomVenue] = useState('');
  const [customDate, setCustomDate] = useState('');

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
    onSelectPerformance(selectedPerformanceId);
    onOpenChange(false);
  };

  const handleCustomConfirm = () => {
    if (customName.trim()) {
      const customPerformance: CustomPerformance = {
        name: customName.trim(),
        venue: customVenue.trim() || undefined,
        date: customDate || undefined
      };
      onSelectPerformance(undefined, customPerformance);
      onOpenChange(false);
    }
  };

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
              {t('setlistPrediction.changePerformance', { defaultValue: 'Change Performance' })}
            </DialogTitle>

            <DialogDescription>
              <Text fontSize="sm">
                {t('setlistPrediction.changePerformanceDescription', {
                  defaultValue: 'Select a performance to assign to this prediction.'
                })}
              </Text>
            </DialogDescription>

            <Box borderRadius="md" borderWidth="1px" p={3}>
              <Text mb={2} fontSize="sm" fontWeight="medium">
                {t('setlistPrediction.customPerformance', { defaultValue: 'Custom Performance' })}
              </Text>
              <Stack gap={2}>
                <Input
                  value={customName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCustomName(e.target.value)
                  }
                  placeholder={t('setlistPrediction.performanceName', {
                    defaultValue: 'Performance name *'
                  })}
                />
                <HStack gap={2}>
                  <Input
                    value={customVenue}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCustomVenue(e.target.value)
                    }
                    placeholder={t('setlistPrediction.venue', {
                      defaultValue: 'Venue (optional)'
                    })}
                    flex={1}
                  />
                  <Input
                    type="date"
                    value={customDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCustomDate(e.target.value)
                    }
                    placeholder={t('setlistPrediction.date', {
                      defaultValue: 'Date'
                    })}
                    flex={1}
                  />
                </HStack>
                <Button
                  size="sm"
                  onClick={handleCustomConfirm}
                  disabled={!customName.trim()}
                  alignSelf="flex-end"
                >
                  {t('common.set', { defaultValue: 'Set Custom' })}
                </Button>
              </Stack>
            </Box>

            <Text color="fg.muted" fontSize="xs" textAlign="center">
              {t('setlistPrediction.orSelectBelow', {
                defaultValue: '— or select from list below —'
              })}
            </Text>

            <Box borderRadius="md" borderWidth="1px" p={3}>
              <Input
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                placeholder={t('setlistPrediction.searchPerformances', {
                  defaultValue: 'Search Performances'
                })}
              />
            </Box>

            <Box flex={1} minH={0} overflow="auto">
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
                        {perf.name}
                      </Text>
                      <Text color="fg.muted" fontSize="xs">
                        {new Date(perf.date).toLocaleDateString()} • {perf.venue || 'TBA'}
                      </Text>
                    </Stack>
                  </Box>
                ))}
              </Stack>
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
              <Button onClick={handleConfirm} disabled={!selectedPerformanceId}>
                {t('common.confirm', { defaultValue: 'Confirm' })}
              </Button>
            </Box>
          </Stack>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
}
