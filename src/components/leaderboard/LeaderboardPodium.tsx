import { Text } from '../ui/text';
import { ItemThumbnail } from './ItemThumbnail';
import type { RankingItemDisplay } from './useRankingItems';
import type { LeaderboardEntry } from '~/types/global-ranking';
import { css } from 'styled-system/css';
import { Grid, Stack } from 'styled-system/jsx';

const PLACES = [
  { index: 1, height: css({ h: '16' }), order: 0 },
  { index: 0, height: css({ h: '24' }), order: 1 },
  { index: 2, height: css({ h: '10' }), order: 2 }
];

export function LeaderboardPodium({
  entries,
  resolve
}: {
  entries: LeaderboardEntry[];
  resolve: (id: string) => RankingItemDisplay;
}) {
  if (entries.length < 3) return null;
  return (
    <Grid
      data-testid="leaderboard-podium"
      gap="3"
      alignItems="end"
      gridTemplateColumns="repeat(3, minmax(0, 1fr))"
      w="full"
      maxW="lg"
    >
      {PLACES.map(({ index, height, order }) => {
        const entry = entries[index];
        const item = resolve(entry.itemId);
        return (
          <Stack
            key={entry.itemId}
            style={{ order, ['--color' as 'color']: item.color ?? 'var(--colors-bg-muted)' }}
            gap="1.5"
            alignItems="center"
            minW="0"
            textAlign="center"
          >
            <ItemThumbnail item={item} size={index === 0 ? '16' : '12'} />
            <Text w="full" fontSize="sm" fontWeight="medium" lineClamp={2}>
              {item.name}
            </Text>
            <Stack
              className={height}
              justifyContent="flex-start"
              borderTopRadius="l2"
              w="full"
              pt="1"
              color="white"
              fontWeight="bold"
              bg="var(--color)"
            >
              <Text textShadow="0 1px 2px rgba(0,0,0,0.5)">#{entry.rank}</Text>
            </Stack>
          </Stack>
        );
      })}
    </Grid>
  );
}
