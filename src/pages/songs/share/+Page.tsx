import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { decompressFromEncodedURIComponent } from 'lz-string';
import { Link } from '~/components/ui/link';
import { Text } from '~/components/ui/text';
import { Container, Stack } from 'styled-system/jsx';
import { SongResultsView } from '~/components/results/songs/SongResultsView';
import { Button } from '~/components/ui/button';
import { Metadata } from '~/components/layout/Metadata';
import { useSongData } from '~/hooks/useSongData';
import {
  addSongPerformanceParams,
  addSongPresetParams,
  getAllCommaSeparated,
  getSongPerformanceParams
} from '~/utils/share';
import type { GuessResult } from '~/hooks/useHeardleState';
import type { PerformanceSortMeta } from '~/types/performance-sort';

const MAX_ATTEMPTS = 5;

export function Page() {
  const songs = useSongData();
  const { t } = useTranslation();

  const params = new URLSearchParams(import.meta.env.SSR ? '' : location.search);
  const urlData = params.get('data');

  const {
    results,
    guessResults,
    performanceMeta
  }: {
    results: string[][];
    guessResults?: Record<string, GuessResult>;
    performanceMeta?: PerformanceSortMeta;
  } =
    JSON.parse(urlData !== null ? (decompressFromEncodedURIComponent(urlData) ?? '{}') : '{}') ??
    {};

  const filters = {
    series: getAllCommaSeparated(params, 'series'),
    artists: getAllCommaSeparated(params, 'artists'),
    types: getAllCommaSeparated(params, 'types') as ('group' | 'solo' | 'unit')[],
    characters: getAllCommaSeparated(params, 'characters').map(Number),
    discographies: getAllCommaSeparated(params, 'discographies').map(Number),
    songs: getAllCommaSeparated(params, 'songs').map(Number),
    years: getAllCommaSeparated(params, 'years').map(Number)
  };
  const performanceParams = getSongPerformanceParams(params);
  const displayPerformanceMeta = performanceMeta ?? performanceParams?.meta;

  const failedSongs = useMemo(() => {
    if (!guessResults) return undefined;
    const failedIds = Object.entries(guessResults)
      .filter(([, r]) => r.result === 'failed')
      .map(([id]) => id);
    if (failedIds.length === 0) return undefined;
    return songs.filter((s) => failedIds.includes(s.id));
  }, [guessResults, songs]);

  const title = t('title', { titlePrefix: t('songs') });
  const hasData =
    (results?.length > 0 || (failedSongs && failedSongs.length > 0)) && songs?.length > 0;

  const getSortUrl = () => {
    const p = addSongPresetParams(new URLSearchParams(), filters);
    addSongPerformanceParams(p, performanceParams?.songIds, displayPerformanceMeta);
    if (guessResults) p.append('heardle', 'true');
    return `/songs?${p.toString()}`;
  };

  return (
    <>
      <Metadata title={title} helmet />
      <Container zIndex="1" flex={1} w="full" py={4} px={4}>
        <Stack alignItems="center" w="full">
          <Text fontSize="3xl" fontWeight="bold" textAlign="center">
            {title}
          </Text>
          <Text textAlign="center">{t('description')}</Text>
          <Link href={getSortUrl()}>
            <Button>{t('share.create_your_own')}</Button>
          </Link>
          {hasData && (
            <>
              <SongResultsView
                songsData={songs}
                performanceMeta={displayPerformanceMeta}
                failedSongs={failedSongs}
                guessResults={guessResults}
                maxAttempts={guessResults ? MAX_ATTEMPTS : undefined}
                readOnly
                w="full"
                order={results}
              />
              <Link href={getSortUrl()}>
                <Button>{t('share.create_your_own')}</Button>
              </Link>
            </>
          )}
        </Stack>
      </Container>
    </>
  );
}
