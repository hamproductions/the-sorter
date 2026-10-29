import { Text } from '../ui/text';
import { ItemThumbnail } from './ItemThumbnail';
import type { RankingItemDisplay } from './useRankingItems';
import type { LeaderboardEntry } from '~/types/global-ranking';
import { css } from 'styled-system/css';
import { Grid, Stack } from 'styled-system/jsx';

const isLightColor = (color: string) => {
  const hex = /^#([0-9a-f]{6})$/i.exec(color)?.[1];
  if (!hex) return false;
  const [r, g, b] = [0, 2, 4]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.179;
};

const PLACES = [
  { index: 1, height: css({ h: '9' }), order: 0 },
  { index: 0, height: css({ h: '12' }), order: 1 },
  { index: 2, height: css({ h: '6' }), order: 2 }
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
            <ItemThumbnail item={item} size={index === 0 ? '12' : '8'} />
            <Text w="full" fontSize="sm" fontWeight="medium" lineClamp={2}>
              {item.name}
            </Text>
            <Stack
              className={height}
              justifyContent="flex-start"
              borderTopRadius="l2"
              w="full"
              pt="1"
              color={item.color ? (isLightColor(item.color) ? 'black' : 'white') : 'fg.default'}
              fontWeight="bold"
              bg="var(--color)"
            >
              <Text>#{entry.rank}</Text>
            </Stack>
          </Stack>
        );
      })}
    </Grid>
  );
}
