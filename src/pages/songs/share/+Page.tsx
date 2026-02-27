import { useTranslation } from 'react-i18next';
import { decompressFromEncodedURIComponent } from 'lz-string';
import { Link } from '~/components/ui/link';
import { Text } from '~/components/ui/text';
import { Container, Stack } from 'styled-system/jsx';
import { SongResultsView } from '~/components/results/songs/SongResultsView';
import { Button } from '~/components/ui/button';
import { Metadata } from '~/components/layout/Metadata';
import { useSongData } from '~/hooks/useSongData';
import { addSongPresetParams } from '~/utils/share';
import type { GuessResult } from '~/hooks/useHeardleState';

const MAX_ATTEMPTS = 5;

export function Page() {
  const songs = useSongData();
  const { t } = useTranslation();

  const params = new URLSearchParams(import.meta.env.SSR ? '' : location.search);
  const urlData = params.get('data');

  const {
    results,
    guessResults
  }: {
    results: string[][];
    guessResults?: Record<string, GuessResult>;
  } =
    JSON.parse(urlData !== null ? (decompressFromEncodedURIComponent(urlData) ?? '{}') : '{}') ??
    {};

  const filters = {
    series: params.getAll('series'),
    artists: params.getAll('artists'),
    types: params.getAll('types') as ('group' | 'solo' | 'unit')[],
    characters: params.getAll('characters').map(Number),
    discographies: params.getAll('discographies').map(Number),
    songs: params.getAll('songs').map(Number),
    years: params.getAll('years').map(Number)
  };

  const title = t('title', { titlePrefix: t('songs') });

  const getSortUrl = () => {
    const p = addSongPresetParams(new URLSearchParams(), filters);
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
          {songs?.length > 0 && results?.length > 0 && (
            <>
              <SongResultsView
                songsData={songs}
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
