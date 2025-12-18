import { useTranslation } from 'react-i18next';
import { HasuSongGridViewItem } from './HasuSongGridViewItem';
import { Grid, GridItem, Stack } from 'styled-system/jsx';
import type { WithRank } from '~/types';
import type { HasuSong } from '~/types/songs';

export function HasuSongGridView({
  songs,
  onSelect
}: {
  songs: WithRank<HasuSong>[];
  onSelect?: (character: WithRank<HasuSong>) => void;
}) {
  const { i18n } = useTranslation();
  return (
    <Stack p="2">
      <Grid gridGap={2} gridTemplateColumns="repeat(auto-fill, minmax(120px, 1fr))">
        {songs.map((c) => {
          const { id } = c;
          return (
            <GridItem
              key={id}
              onClick={onSelect && (() => onSelect(c))}
              cursor="pointer"
              rounded="l1"
              h="full"
              bgColor="bg.canvas"
              shadow={{ base: 'sm', _hover: 'md' }}
              overflow="hidden"
              transition="shadow"
            >
              <HasuSongGridViewItem song={c} locale={i18n.language} />
            </GridItem>
          );
        })}
      </Grid>
    </Stack>
  );
}
