import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Table } from '~/components/ui/table';
import { Text } from '~/components/ui/text';
import { useArtistsData } from '~/hooks/useArtistsData';
import { useSongData } from '~/hooks/useSongData';
import { getArtistName, getSongName } from '~/utils/names';
import type { PerformanceSortMeta } from '~/types/performance-sort';

function getRankColor(rank: number, total: number): string {
  if (total <= 1) return 'hsl(120, 70%, 50%)';
  const t = (rank - 1) / (total - 1);
  return `hsl(${120 * (1 - t)}, 70%, 50%)`;
}

export function PerformanceOrderView({
  performanceMeta,
  order
}: {
  performanceMeta: PerformanceSortMeta;
  order: string[][];
}) {
  const songs = useSongData();
  const artists = useArtistsData();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  // Build rank map from sort results
  const rankMap = useMemo(() => {
    const map: Record<string, number> = {};
    let rank = 1;
    for (const group of order) {
      for (const id of group) {
        map[`${id}`] = rank;
      }
      rank += group.length;
    }
    return map;
  }, [order]);

  const totalRanked = useMemo(() => {
    return order.reduce((sum, group) => sum + group.length, 0);
  }, [order]);

  // Build rows from the full setlist order (including duplicates)
  const rows = useMemo(() => {
    return performanceMeta.setlistOrder
      .map((songId, idx) => {
        const song = songs.find((s) => s.id === songId);
        if (!song) return null;
        const rank = rankMap[songId];
        if (rank === undefined) return null;
        const songArtists = song.artists
          .map((art) => artists.find((a) => a.id === art.id))
          .filter(Boolean);
        return {
          position: idx + 1,
          song,
          rank,
          artistNames: songArtists.map((a) => (a ? getArtistName(a.name, lang) : '')).join(', ')
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);
  }, [performanceMeta.setlistOrder, songs, rankMap, artists, lang]);

  return (
    <Table.Root size="sm">
      <Table.Head>
        <Table.Row>
          <Table.Header textAlign="center">#</Table.Header>
          <Table.Header textAlign="center">{t('song-name')}</Table.Header>
          <Table.Header textAlign="center">{t('artist')}</Table.Header>
          <Table.Header textAlign="center">{t('ranking')}</Table.Header>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {rows.map((row, idx) => {
          const color = getRankColor(row.rank, totalRanked);
          return (
            <Table.Row
              key={idx}
              style={{ backgroundColor: `${color}20` }}
              borderLeft="4px solid"
              borderLeftColor={color}
            >
              <Table.Cell textAlign="center">
                <Text fontWeight="bold">{row.position}</Text>
              </Table.Cell>
              <Table.Cell>
                <Text fontWeight="bold">
                  {getSongName(row.song.name, row.song.englishName, lang)}
                </Text>
              </Table.Cell>
              <Table.Cell>
                <Text>{row.artistNames}</Text>
              </Table.Cell>
              <Table.Cell textAlign="center">
                <Text
                  fontWeight="bold"
                  style={{ color }}
                >
                  #{row.rank}
                </Text>
              </Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table.Root>
  );
}
