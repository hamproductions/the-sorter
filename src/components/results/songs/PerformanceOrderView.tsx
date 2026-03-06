import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Stack } from 'styled-system/jsx';
import { Table } from '~/components/ui/table';
import { Text } from '~/components/ui/text';
import type { Song } from '~/types/songs';
import { getSongColor } from '~/utils/song';
import { useArtistsData } from '~/hooks/useArtistsData';
import { useSongData } from '~/hooks/useSongData';
import { SchoolBadge } from '~/components/sorter/SchoolBadge';
import { getArtistName, getSongName } from '~/utils/names';
import type { PerformanceSortMeta } from '~/types/performance-sort';

function getRankColor(rank: number, total: number): string {
  if (total <= 1) return 'hsl(120, 70%, 50%)';
  const t = (rank - 1) / (total - 1);
  return `hsl(${120 * (1 - t)}, 70%, 50%)`;
}

function formatArtistsWithVariants(
  songArtists: Song['artists'],
  artistsData: { id: string; name: string; englishName?: string }[],
  lang: string
): string {
  const grouped = new Map<string, { name: string; variants: (string | null)[] }>();

  for (const sa of songArtists) {
    const artist = artistsData.find((a) => a.id === sa.id);
    if (!artist) continue;

    const existing = grouped.get(sa.id);
    if (existing) {
      existing.variants.push(sa.variant);
    } else {
      grouped.set(sa.id, { name: getArtistName(artist.name, lang), variants: [sa.variant] });
    }
  }

  return Array.from(grouped.values())
    .map(({ name, variants }) => {
      const nonNullVariants = variants.filter((v): v is string => v !== null);
      if (nonNullVariants.length > 0) {
        return `${name} (${nonNullVariants.join('/')})`;
      }
      return name;
    })
    .join(', ');
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

  const rows = useMemo(() => {
    return performanceMeta.setlistOrder
      .map((entry, idx) => {
        // Handle old format where setlistOrder was string[] of songIds
        const songId = typeof entry === 'string' ? entry : entry.songId;
        const label = typeof entry === 'string' ? `${idx + 1}` : entry.label;
        const song = songs.find((s) => s.id === songId);
        if (!song) return null;
        const rank = rankMap[songId];
        if (rank === undefined) return null;
        return { label, song, rank };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);
  }, [performanceMeta.setlistOrder, songs, rankMap]);

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
          const { rank, song, label } = row;
          const seriesColor = getSongColor(song);
          const rankColor = getRankColor(rank, totalRanked);

          return (
            <Table.Row
              key={idx}
              style={{
                ['--color' as 'color']: seriesColor,
                backgroundColor: `${rankColor}20`
              }}
              borderLeft="8px solid"
              borderLeftColor="var(--color)"
              borderBottomColor="var(--color)"
            >
              <Table.Cell textAlign="center">
                <Text fontWeight="bold" fontSize="xs" fontFamily="mono">
                  {label}
                </Text>
              </Table.Cell>
              <Table.Cell>
                <Text layerStyle="textStroke" color="var(--color)" fontSize="md" fontWeight="bold">
                  {getSongName(song.name, song.englishName, lang)}
                </Text>
              </Table.Cell>
              <Table.Cell>
                <Stack gap="1" alignItems="center" w="full" py="2">
                  <SchoolBadge locale={lang} song={song} />
                  <Text>{formatArtistsWithVariants(song.artists, artists, lang)}</Text>
                </Stack>
              </Table.Cell>
              <Table.Cell textAlign="center">
                <Text fontWeight="bold" style={{ color: rankColor }}>
                  #{rank}
                </Text>
              </Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table.Root>
  );
}
