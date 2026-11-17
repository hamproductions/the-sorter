import { useTranslation } from 'react-i18next';
import type { Character, WithRank } from '~/types';
import { Stack } from 'styled-system/jsx';
import { token } from 'styled-system/tokens';
import { Table } from '~/components/ui/table';
import { Text } from '~/components/ui/text';
import type { Artist, Song } from '~/types/songs';
import type { PerformanceSortMeta } from '~/types/performance-sort';
import { getDistinctSongPerformanceEntries } from '~/utils/performance-sort';
import { getSongColor } from '~/utils/song';
import { useArtistsData } from '~/hooks/useArtistsData';
import { useData } from '~/hooks/useData';
import { SchoolBadge } from '~/components/sorter/SchoolBadge';
import { CollabPerformersList } from '~/components/sorter/SongCard';
import { MiniDots } from '~/components/sorter/MiniDots';
import { getArtistName, getSongName } from '~/utils/names';
import type { GuessResult } from '~/hooks/useHeardleState';

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
  performanceMeta,
  onSelectSong,
  guessResults,
  maxAttempts
}: {
  songs: WithRank<Song>[];
  performanceMeta?: PerformanceSortMeta;
  onSelectSong?: (character: WithRank<Song>) => void;
  guessResults?: Record<string, GuessResult>;
  maxAttempts?: number;
}) {
  const artists = useArtistsData();
  const characters = useData() as unknown as Character[];
  const { t, i18n } = useTranslation();

  const lang = i18n.language;

  return (
    <Table.Root size="sm">
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
          const defaultArtistText = formatArtistsWithVariants(songArtists, artists, lang);
          const performanceEntries = performanceMeta
            ? getDistinctSongPerformanceEntries(c, performanceMeta.setlistOrder)
            : undefined;
          const hasCollab = Boolean(performanceEntries?.some((e) => Boolean(e.performers?.length)));

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
                  <Text>{defaultArtistText}</Text>
                  {hasCollab && performanceEntries && (
                    <Stack gap={1} alignItems="center" w="full" mt={1}>
                      {performanceEntries.map((entry, entryIdx) => (
                        <Stack
                          key={`${entry.dayLabel ?? 'single'}-${entry.label}-${entryIdx}`}
                          style={
                            entry.dayLabel
                              ? {
                                  border: `1px solid ${token('colors.border.default')}`,
                                  padding: '4px'
                                }
                              : undefined
                          }
                          gap={1}
                          alignItems="center"
                          borderRadius="md"
                          w="full"
                        >
                          {entry.dayLabel && (
                            <Text color="fg.muted" fontSize="xs" fontWeight="bold">
                              {entry.dayLabel}
                            </Text>
                          )}
                          {entry.performers && entry.performers.length > 0 ? (
                            <>
                              <Text color="fg.muted" fontSize="xs" fontWeight="bold">
                                {t('sort.collab_members', { defaultValue: 'Collab Members' })}
                              </Text>
                              <CollabPerformersList
                                performers={entry.performers}
                                characters={characters}
                                lang={lang}
                              />
                            </>
                          ) : (
                            entry.dayLabel && (
                              <Text fontSize="xs" fontWeight="medium" textAlign="center">
                                {defaultArtistText}
                              </Text>
                            )
                          )}
                        </Stack>
                      ))}
                    </Stack>
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
