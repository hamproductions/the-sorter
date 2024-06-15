import { useTranslation } from 'react-i18next';
import { RankingViewListItem } from './RankingViewListItem';
import { RankingViewTopItem } from './RankingViewTopItem';
import { Grid, GridItem, Stack } from 'styled-system/jsx';
import type { Character, WithRank } from '~/types';

export function RankingView({
  characters,
  isSeiyuu
}: {
  characters: WithRank<Character>[];
  isSeiyuu: boolean;
}) {
  const { i18n } = useTranslation();
  const locale = i18n.language;
  return (
    <Stack p="2">
      <Grid alignItems="stretch" gridTemplateColumns="repeat(3, 1fr)">
        {characters.slice(0, 3).map((c) => {
          const { id } = c;
          return (
            <GridItem key={id}>
              <RankingViewTopItem locale={locale} character={c} isSeiyuu={isSeiyuu} />
            </GridItem>
          );
        })}
      </Grid>
      <Grid alignItems="stretch" gridTemplateColumns="repeat(auto-fit, minmax(150px, 1fr))">
        {characters.slice(3).map((c) => {
          const { id } = c;
          return (
            <GridItem key={id}>
              <RankingViewListItem locale={locale} character={c} isSeiyuu={isSeiyuu} />
            </GridItem>
          );
        })}
      </Grid>
    </Stack>
  );
}