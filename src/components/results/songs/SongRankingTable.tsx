import { useTranslation } from 'react-i18next';
import { uniq } from 'lodash-es';
import type { WithRank } from '~/types';
import { Stack } from 'styled-system/jsx';
import { Table } from '~/components/ui/table';
import { Text } from '~/components/ui/text';
import type { Song } from '~/types/songs';
import { getSongColor } from '~/utils/song';
import { useArtistsData } from '~/hooks/useArtistsData';
import { SchoolBadge } from '~/components/sorter/SchoolBadge';

export function SongRankingTable({
  songs,
  onSelectSong
}: {
  songs: WithRank<Song>[];
  onSelectSong?: (character: WithRank<Song>) => void;
}) {
  const artists = useArtistsData();
  const { t, i18n } = useTranslation();

  const lang = i18n.language;

  const getArtistFromId = (id: string) => {
    return artists.find((a) => a.id === id);
  };

  return (
    <Table.Root size="sm">
      <Table.Head>
        <Table.Row>
          <Table.Header textAlign={'center'}>{t('ranking')}</Table.Header>
          <Table.Header textAlign={'center'}>{t('song-name')}</Table.Header>
          <Table.Header textAlign={'center'}>{t('artist')}</Table.Header>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {songs.map((c, idx) => {
          const { rank, name, artists } = c;
          const colorCode = getSongColor(c);
          const artist = uniq(artists).map((a) => getArtistFromId(a));

          return (
            <Table.Row
              key={idx}
              style={{ ['--color' as 'color']: colorCode }}
              onClick={onSelectSong && (() => onSelectSong(c))}
              cursor="pointer"
              borderLeft="8px solid"
              borderColor="var(--color)"
            >
              <Table.Cell>{rank}</Table.Cell>
              <Table.Cell>
                <Text layerStyle="textStroke" color="var(--color)" fontSize="md" fontWeight="bold">
                  {name}
                </Text>
              </Table.Cell>
              <Table.Cell>
                <Stack gap="1" alignItems="center" w="full" py="2">
                  <SchoolBadge locale={lang} song={c} />
                  <Text>{artist.map((a) => a?.name).join(',')}</Text>
                </Stack>
              </Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table.Root>
  );
}
