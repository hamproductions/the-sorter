import { useTranslation } from 'react-i18next';
import { GridViewItem } from './GridViewItem';
import { Grid, GridItem, Stack } from 'styled-system/jsx';
import type { Character, WithRank } from '~/types';

export function GridView({
  characters,
  isSeiyuu,
  onSelectCharacter
}: {
  characters: WithRank<Character>[];
  isSeiyuu: boolean;
  onSelectCharacter?: (character: WithRank<Character>) => void;
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
              onClick={onSelectCharacter && (() => onSelectCharacter(c))}
              rounded="l1"
              bgColor="bg.canvas"
              shadow={{ base: 'sm', _hover: 'md' }}
              overflow="hidden"
              transition="shadow"
              cursor="pointer"
            >
              <GridViewItem character={c} isSeiyuu={isSeiyuu} locale={i18n.language} />
            </GridItem>
          );
        })}
      </Grid>
    </Stack>
  );
}
