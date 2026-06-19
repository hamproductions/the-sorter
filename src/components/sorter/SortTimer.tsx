import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaStopwatch } from 'react-icons/fa6';
import { HStack } from 'styled-system/jsx';
import { Text } from '~/components/ui/styled/text';
import { formatDuration } from '~/utils/sort-timing';
import type { SortTimingData } from '~/utils/sort-timing';

interface SortTimerProps {
  timing?: SortTimingData;
  /** When true, the timer stops advancing and shows the final elapsed time. */
  frozen?: boolean;
}

/**
 * Live running timer shown during a song ranking session. Ticks once per second
 * while sorting, then freezes on the final elapsed time when the sort ends.
 */
export const SortTimer = ({ timing, frozen }: SortTimerProps) => {
  const { t } = useTranslation();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!timing || frozen) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [timing, frozen]);

  if (!timing) return null;

  const endpoint = frozen ? timing.endedAt ?? timing.lastTickAt : now;
  const elapsed = Math.max(0, endpoint - timing.startedAt);

  return (
    <HStack gap="1" justifyContent="center" color="fg.muted">
      <FaStopwatch />
      <Text>
        {t('sort.elapsed_time')}: {formatDuration(elapsed)}
      </Text>
    </HStack>
  );
};
