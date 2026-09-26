import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaStopwatch } from 'react-icons/fa6';
import { HStack } from 'styled-system/jsx';
import { Text } from '~/components/ui/styled/text';
import { formatElapsed } from '~/utils/sort-timing';

interface SortTimerProps {
  /** Whether a timed session currently exists. */
  active?: boolean;
  /** Returns the elapsed *active* time in ms (excludes time the tab was hidden). */
  getElapsedMs: () => number;
  /** When true, the timer stops advancing and shows the final elapsed time. */
  frozen?: boolean;
}

/**
 * Live running timer shown during a song ranking session. The displayed value is
 * derived from the timer's active-time getter, so it counts only foregrounded
 * time and pauses while the tab is hidden. The interval is just a re-render pulse.
 */
export const SortTimer = ({ active, getElapsedMs, frozen }: SortTimerProps) => {
  const { t } = useTranslation();
  const [elapsed, setElapsed] = useState(() => getElapsedMs());

  useEffect(() => {
    if (!active) return;
    const update = () => setElapsed(getElapsedMs());
    update();
    if (frozen) return;
    // Tick 4x/second so every whole-second boundary is caught (no skips). Refresh
    // immediately on visibility change so the resumed value shows without delay.
    const id = setInterval(update, 250);
    document.addEventListener('visibilitychange', update);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', update);
    };
  }, [active, frozen, getElapsedMs]);

  if (!active) return null;

  return (
    <HStack gap="1" justifyContent="center" color="fg.muted">
      <FaStopwatch />
      <Text>
        {t('sort.elapsed_time')}: {formatElapsed(elapsed)}
      </Text>
    </HStack>
  );
};
