import { HStack, Stack } from 'styled-system/jsx';
import { Text } from '~/components/ui/styled/text';
import { getSongColor } from '~/utils/song';
import { getSongName } from '~/utils/names';
import type { Song } from '~/types/songs';

interface HeardleStatsProps {
  correctCount: number;
  failedSongs: Song[];
  lang: string;
}

export const HeardleStats = ({ correctCount, failedSongs, lang }: HeardleStatsProps) => {
  const total = correctCount + failedSongs.length;
  const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  if (total === 0) return null;

  return (
    <Stack gap="2" w="full" alignItems="center">
      <Text fontSize="sm">
        {correctCount}/{total} ({percent}%) correct
      </Text>
      {failedSongs.length > 0 && (
        <Stack gap="2" w="full" maxW="lg">
          <Text fontSize="sm" fontWeight="bold">
            Heardle Failed ({failedSongs.length})
          </Text>
          <Stack gap="2" maxH="520px" overflow="auto">
            {failedSongs.map((song) => {
              const color = getSongColor(song);
              return (
                <HStack
                  key={song.id}
                  style={{ borderLeft: color ? `4px solid ${color}` : undefined }}
                  rounded="l2"
                  p="2"
                  bg="bg.subtle"
                >
                  <Text fontWeight="medium" lineClamp={1}>
                    {getSongName(song.name, song.englishName, lang)}
                  </Text>
                </HStack>
              );
            })}
          </Stack>
        </Stack>
      )}
    </Stack>
  );
};
