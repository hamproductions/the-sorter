import { useTranslation } from 'react-i18next';
import { FaStopwatch } from 'react-icons/fa6';
import { Box, Grid, HStack, Stack } from 'styled-system/jsx';
import { Heading } from '~/components/ui/heading';
import { Text } from '~/components/ui/text';
import { formatDuration } from '~/utils/sort-timing';
import type { SortTimingStats } from '~/utils/sort-timing';

interface SongSortTimeStatsProps {
  stats: SortTimingStats;
}

/**
 * Summary of session timing shown on the results screen: total time to complete
 * the ranking plus per-comparison breakdown statistics.
 */
export const SongSortTimeStats = ({ stats }: SongSortTimeStatsProps) => {
  const { t } = useTranslation();

  const items: { label: string; value: string }[] = [
    { label: t('results.timing.total'), value: formatDuration(stats.totalMs) },
    { label: t('results.timing.comparisons'), value: `${stats.comparisons}` },
    { label: t('results.timing.average'), value: formatDuration(stats.averageMs) },
    { label: t('results.timing.median'), value: formatDuration(stats.medianMs) },
    { label: t('results.timing.fastest'), value: formatDuration(stats.fastestMs) },
    { label: t('results.timing.slowest'), value: formatDuration(stats.slowestMs) }
  ];

  return (
    <Stack w="full" mt="4">
      <HStack justifyContent="center" gap="2">
        <FaStopwatch />
        <Heading fontSize="xl" fontWeight="bold">
          {t('results.timing.heading')}
        </Heading>
      </HStack>
      <Grid columns={{ base: 2, md: 3 }} gap="3" w="full">
        {items.map((item) => (
          <Box
            key={item.label}
            border="1px solid"
            borderColor="border.subtle"
            borderRadius="md"
            p="3"
            bg="bg.subtle"
            textAlign="center"
          >
            <Text fontSize="sm" color="fg.muted">
              {item.label}
            </Text>
            <Text fontSize="lg" fontWeight="bold">
              {item.value}
            </Text>
          </Box>
        ))}
      </Grid>
    </Stack>
  );
};
