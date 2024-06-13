import { Grid, GridItem, Stack } from 'styled-system/jsx';
import { Character, WithRank } from '~/types';
import { GridViewItem } from './GridViewItem';

export function GridView({
  characters,
  isSeiyuu
}: {
  characters: WithRank<Character>[];
  isSeiyuu: boolean;
}) {
  return (
    <Stack p="2">
      <Grid gridGap={2} gridTemplateColumns="repeat(auto-fill, minmax(120px, 1fr))">
        {characters.map((c) => {
          const { id } = c;
          return (
            <GridItem
              key={id}
              rounded="l1"
              bgColor="bg.canvas"
              shadow={{ base: 'md', _hover: 'lg' }}
              transition="shadow"
              overflow="hidden"
            >
              <GridViewItem character={c} isSeiyuu={isSeiyuu} />
            </GridItem>
          );
        })}
      </Grid>
    </Stack>
  );
}
