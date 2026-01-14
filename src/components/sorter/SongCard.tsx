import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from '../ui/text';
import type { StackProps } from 'styled-system/jsx';
import { Center, Stack } from 'styled-system/jsx';
import type { Artist, Song } from '~/types/songs';
import { getSongColor } from '~/utils/song';
import { getArtistName, getSongName } from '~/utils/names';
import { useArtistsData } from '~/hooks/useArtistsData';

function useAudioBlobUrl(url: string | undefined): string | null {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setBlobUrl(null);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;

    fetch(url, { referrerPolicy: 'no-referrer' })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      })
      .catch((err) => {
        console.error('Failed to fetch audio:', err);
        if (!cancelled) setBlobUrl(null);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  return blobUrl;
}

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

export function SongCard({
  song,
  artists: _artists,
  heardleMode,
  ...rest
}: { song?: Song; artists?: Artist[]; heardleMode?: boolean } & StackProps) {
  const { i18n } = useTranslation();
  const artistsData = useArtistsData();
  const audioBlobUrl = useAudioBlobUrl(heardleMode ? song?.wikiAudioUrl : undefined);

  const lang = i18n.language;

  if (!song) return null;

  return (
    <Stack
      style={{ ['--color' as 'color']: getSongColor(song) ?? undefined }}
      gap={1}
      alignItems="center"
      rounded="l1"
      w="full"
      p={2}
      py={4}
      backgroundColor={{ base: 'bg.default', _hover: 'bg.muted' }}
      shadow="md"
      transition="background-color"
      {...rest}
    >
      {/* <SchoolBadge character={character} locale={lang} /> */}
      <Stack
        position="relative"
        flex={1}
        alignItems="center"
        w="full"
        minH={{ base: 0, sm: '240px' }}
        overflow="hidden"
      >
        <Center position="absolute" flex={1} w="full" h="full" overflow="hidden">
          <Center w="full" maxW="full" h="full">
            {heardleMode && audioBlobUrl && (
              <audio src={audioBlobUrl} controls style={{ width: '100%' }} />
            )}
            {!heardleMode && song.musicVideo && (
              <iframe
                style={{ maxWidth: '100%' }}
                height="240"
                src={`https://www.youtube-nocookie.com/embed/${song.musicVideo.videoId}/?start=${song.musicVideo.videoOffset}&html5=1`}
                title="YouTube video player"
                //@ts-expect-error wtf
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerpolicy="strict-origin-when-cross-origin"
                // oxlint-disable-next-line iframe-missing-sandbox shut up linter
                sandbox="allow-scripts allow-same-origin"
                allowfullscreen
              ></iframe>
            )}
          </Center>
        </Center>
      </Stack>
      <Stack gap={0} alignItems="center">
        <Text layerStyle="textStroke" color="var(--color)" fontSize="2xl" fontWeight="bold">
          {!heardleMode && getSongName(song.name, song.englishName, lang)}
        </Text>
        {lang === 'en' && song.englishName && (
          <Text color="fg.muted" fontSize="xs">
            {song.name}
          </Text>
        )}
        <Text fontSize="sm" textAlign="center">
          {!heardleMode && formatArtistsWithVariants(song.artists, artistsData, lang)}
        </Text>
      </Stack>
    </Stack>
  );
}
