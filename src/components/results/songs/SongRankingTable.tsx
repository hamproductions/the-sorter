import { useTranslation } from 'react-i18next';
import type { WithRank } from '~/types';
import { Stack } from 'styled-system/jsx';
import { Table } from '~/components/ui/table';
import { Text } from '~/components/ui/text';
import type { Artist, Song } from '~/types/songs';
import { getSongColor } from '~/utils/song';
import { useArtistsData } from '~/hooks/useArtistsData';
import { SchoolBadge } from '~/components/sorter/SchoolBadge';
import { MiniDots } from '~/components/sorter/MiniDots';
import { getArtistName, getSongName } from '~/utils/names';
import type { GuessResult } from '~/hooks/useHeardleState';
import type { PerformanceSortMeta } from '~/types/performance-sort';
import { SongPerformanceContext } from '~/components/sorter/SongPerformanceContext';
import { getPerformanceDisplayPerformers } from '~/utils/performance-sort';

export function formatArtistsWithVariants(
  songArtists: Song['artists'],
  artistsData: Artist[],
  lang: string,
  shortName?: (name: string) => string | undefined
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
      const name = shortName?.(artist.name) ?? getArtistName(artist.name, lang);
      const nonNullVariants = variants.filter((v): v is string => v !== null);
      if (nonNullVariants.length > 0) {
        return `${name} (${nonNullVariants.join('/')})`;
      }
      return name;
    })
    .join(', ');
}

export const isOriginalRecording = (song: Song, performanceMeta?: PerformanceSortMeta) =>
  !!performanceMeta?.setlistOrder.some(
    (entry) =>
      entry.songId === song.id && getPerformanceDisplayPerformers(song, entry.performers).length > 0
  );

export function SongRankingTable({
  songs,
  onSelectSong,
  guessResults,
  maxAttempts,
  performanceMeta
}: {
  songs: WithRank<Song>[];
  onSelectSong?: (character: WithRank<Song>) => void;
  guessResults?: Record<string, GuessResult>;
  maxAttempts?: number;
  performanceMeta?: PerformanceSortMeta;
}) {
  const artists = useArtistsData();
  const { t, i18n } = useTranslation();

  const lang = i18n.language;

  return (
    <Table.Root size="sm" minW={performanceMeta ? '720px' : undefined}>
      <Table.Head>
        <Table.Row>
          <Table.Header textAlign={'center'}>{t('ranking')}</Table.Header>
          <Table.Header textAlign={'center'}>{t('song-name')}</Table.Header>
          <Table.Header textAlign={'center'}>{t('artist')}</Table.Header>
          {guessResults && (
            <Table.Header textAlign={'center'}>{t('heardle.heardle_column')}</Table.Header>
          )}
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {songs.map((c, idx) => {
          const { rank, name, englishName, artists: songArtists } = c;
          const colorCode = getSongColor(c);

          return (
            <Table.Row
              key={idx}
              style={{ ['--color' as 'color']: colorCode }}
              onClick={onSelectSong && (() => onSelectSong(c))}
              cursor="pointer"
              borderLeft="8px solid"
              borderLeftColor="var(--color)"
              borderBottomColor="var(--color)"
            >
              <Table.Cell>{rank}</Table.Cell>
              <Table.Cell>
                <Text layerStyle="textStroke" color="var(--color)" fontSize="md" fontWeight="bold">
                  {getSongName(name, englishName, lang)}
                </Text>
              </Table.Cell>
              <Table.Cell>
                <Stack gap="1" alignItems="center" w="full" py="2">
                  <SchoolBadge locale={lang} song={c} />
                  <Text>
                    {isOriginalRecording(c, performanceMeta) &&
                      `${t('performance.original_recording')}: `}
                    {formatArtistsWithVariants(songArtists, artists, lang)}
                  </Text>
                  {performanceMeta && (
                    <SongPerformanceContext song={c} entries={performanceMeta.setlistOrder} />
                  )}
                </Stack>
              </Table.Cell>
              {guessResults && maxAttempts && (
                <Table.Cell>
                  {guessResults[c.id] && guessResults[c.id].result !== 'no-audio' && (
                    <MiniDots result={guessResults[c.id]} maxAttempts={maxAttempts} />
                  )}
                </Table.Cell>
              )}
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table.Root>
  );
}
