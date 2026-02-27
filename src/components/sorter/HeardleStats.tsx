import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { HStack, Stack } from 'styled-system/jsx';
import { HeardleStatsDialog } from './HeardleStatsDialog';
import { Text } from '~/components/ui/text';
import type { Song } from '~/types/songs';
import type { GuessResult } from '~/hooks/useHeardleState';

interface HeardleStatsProps {
  guessResults: Record<string, GuessResult>;
  songs: Song[];
  lang: string;
  maxAttempts: number;
}

export const HeardleStats = ({ guessResults, songs, lang, maxAttempts }: HeardleStatsProps) => {
  const { t } = useTranslation();

  const { correctCount, failedCount, passedCount } = useMemo(() => {
    const entries = Object.values(guessResults);
    return {
      correctCount: entries.filter((r) => r.result === 'correct').length,
      failedCount: entries.filter((r) => r.result === 'failed').length,
      passedCount: entries.filter((r) => r.result === 'no-audio').length
    };
  }, [guessResults]);

  const total = correctCount + failedCount + passedCount;
  if (total === 0) return null;

  return (
    <Stack gap="2" alignItems="center" w="full">
      <HStack gap="3" flexWrap="wrap">
        <Text color="green.500" fontSize="sm" fontWeight="bold">
          {correctCount} {t('heardle.tab_correct')}
        </Text>
        <Text color="red.500" fontSize="sm" fontWeight="bold">
          {failedCount} {t('heardle.tab_failed')}
        </Text>
        {passedCount > 0 && (
          <Text color="fg.muted" fontSize="sm" fontWeight="bold">
            {passedCount} {t('heardle.tab_passed')}
          </Text>
        )}
      </HStack>
      <HeardleStatsDialog
        guessResults={guessResults}
        songs={songs}
        lang={lang}
        maxAttempts={maxAttempts}
      />
    </Stack>
  );
};
