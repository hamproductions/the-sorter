import { RankingViewListItem } from './RankingViewListItem';
import { RankingViewTopItem } from './RankingViewTopItem';
import { Grid, GridItem, Stack } from 'styled-system/jsx';
import { Character, WithRank } from '~/types';

export function RankingView({
  characters,
  isSeiyuu
}: {
  characters: WithRank<Character>[];
  isSeiyuu: boolean;
}) {
  return (
    <Stack p="2">
      <Grid alignItems="stretch" gridTemplateColumns="repeat(3, 1fr)">
        {characters.slice(0, 3).map((c) => {
          const { id } = c;
          return (
            <GridItem key={id}>
              <RankingViewTopItem character={c} isSeiyuu={isSeiyuu} />
            </GridItem>
          );
        })}
      </Grid>
      <Grid gridTemplateColumns="repeat(auto-fit, minmax(150px, 1fr))">
        {characters.slice(3).map((c) => {
          const { id } = c;
          return (
            <GridItem key={id}>
              <RankingViewListItem character={c} isSeiyuu={isSeiyuu} />
            </GridItem>
          );
        })}
      </Grid>
    </Stack>
  );
}
