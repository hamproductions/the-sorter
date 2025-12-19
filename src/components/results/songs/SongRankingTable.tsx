import { useTranslation } from 'react-i18next';
import type { WithRank } from '~/types';
import { Stack } from 'styled-system/jsx';
import { Table } from '~/components/ui/table';
import { Text } from '~/components/ui/text';
import type { Artist, Song } from '~/types/songs';
import { getSongColor } from '~/utils/song';
import { useArtistsData } from '~/hooks/useArtistsData';
import { SchoolBadge } from '~/components/sorter/SchoolBadge';
import { getArtistName } from '~/utils/names';

function formatArtistsWithVariants(
  songArtists: Song['artists'],
  artistsData: Artist[],
  lang: string
): string {
  const grouped = new Map<string, { artist: Artist; variants: (string | null)[] }>();

  for (const sa of songArtists) {
    const artist = artistsData.find((a) => a.id === sa.id);
    if (!artist) continue;

    const existing = grouped.get(sa.id);
    if (existing) {
      existing.variants.push(sa.variant);
    } else {
      grouped.set(sa.id, { artist, variants: [sa.variant] });
    }
  }

  return Array.from(grouped.values())
    .map(({ artist, variants }) => {
      const name = getArtistName(artist.name, lang);
      const nonNullVariants = variants.filter((v): v is string => v !== null);
      if (nonNullVariants.length > 0) {
        return `${name} (${nonNullVariants.join('/')})`;
      }
      return name;
    })
    .join(', ');
}

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
          const { rank, name, artists: songArtists } = c;
          const colorCode = getSongColor(c);

          return (
            <Table.Row
              key={idx}
              style={{ ['--color' as 'color']: colorCode }}
              onClick={onSelectSong && (() => onSelectSong(c))}
              cursor="pointer"
              borderColor="var(--color)"
              borderLeft="8px solid"
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
                  <Text>{formatArtistsWithVariants(songArtists, artists, lang)}</Text>
                </Stack>
              </Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table.Root>
  );
}
