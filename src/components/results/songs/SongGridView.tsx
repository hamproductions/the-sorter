import { useTranslation } from 'react-i18next';
import { SongGridViewItem } from './SongGridViewItem';
import { Grid, GridItem, Stack } from 'styled-system/jsx';
import type { WithRank } from '~/types';
import type { Song } from '~/types/songs';

export function SongGridView({
  songs,
  onSelect
}: {
  songs: WithRank<Song>[];
  onSelect?: (character: WithRank<Song>) => void;
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
              rounded="l1"
              bgColor="bg.canvas"
              shadow={{ base: 'sm', _hover: 'md' }}
              transition="shadow"
              cursor="pointer"
              overflow="hidden"
            >
              <SongGridViewItem song={c} locale={i18n.language} />
            </GridItem>
          );
        })}
      </Grid>
    </Stack>
  );
}
