import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaStopwatch } from 'react-icons/fa6';
import { HStack } from 'styled-system/jsx';
import { Text } from '~/components/ui/styled/text';
import { formatElapsed } from '~/utils/sort-timing';
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

  const startedAt = timing?.startedAt;

  useEffect(() => {
    if (startedAt === undefined || frozen) return;
    let timeoutId: ReturnType<typeof setTimeout>;
    // Re-align each tick to the next whole-second boundary relative to startedAt
    // so timer jitter never pushes two updates into the same second (4 -> 6 skip).
    const tick = () => {
      setNow(Date.now());
      const msIntoSecond = (Date.now() - startedAt) % 1000;
      timeoutId = setTimeout(tick, 1000 - msIntoSecond);
    };
    tick();
    return () => clearTimeout(timeoutId);
  }, [startedAt, frozen]);

  if (!timing) return null;

  const endpoint = frozen ? (timing.endedAt ?? timing.lastTickAt) : now;
  const elapsed = Math.max(0, endpoint - timing.startedAt);

  return (
    <HStack gap="1" justifyContent="center" color="fg.muted">
      <FaStopwatch />
      <Text>
        {t('sort.elapsed_time')}: {formatElapsed(elapsed)}
      </Text>
    </HStack>
  );
};
