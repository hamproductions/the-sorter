import { Stack } from 'styled-system/jsx';
import { HeardleStatsDialog } from './HeardleStatsDialog';
import type { Song } from '~/types/songs';
import type { GuessResult } from '~/hooks/useHeardleState';

interface HeardleStatsProps {
  guessResults: Record<string, GuessResult>;
  songs: Song[];
  lang: string;
  maxAttempts: number;
}

export const HeardleStats = ({ guessResults, songs, lang, maxAttempts }: HeardleStatsProps) => {
  return (
    <Stack gap="2" alignItems="center" w="full">
      <HeardleStatsDialog
        guessResults={guessResults}
        songs={songs}
        lang={lang}
        maxAttempts={maxAttempts}
      />
    </Stack>
  );
};
