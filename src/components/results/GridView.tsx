import { useTranslation } from 'react-i18next';
import { GridViewItem } from './GridViewItem';
import { Grid, GridItem, Stack } from 'styled-system/jsx';
import type { Character, WithRank } from '~/types';

export function GridView({
  characters,
  isSeiyuu
}: {
  characters: WithRank<Character>[];
  isSeiyuu: boolean;
}) {
  const { i18n } = useTranslation();
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
              shadow={{ base: 'sm', _hover: 'md' }}
              transition="shadow"
              overflow="hidden"
            >
              <GridViewItem character={c} isSeiyuu={isSeiyuu} locale={i18n.language} />
            </GridItem>
          );
        })}
      </Grid>
    </Stack>
  );
}
