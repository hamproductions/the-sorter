import { useTranslation } from 'react-i18next';
import { Text } from '../ui/text';
import type { StackProps } from 'styled-system/jsx';
import { Center, Stack } from 'styled-system/jsx';
import type { Artist, Song } from '~/types/songs';
import { getSongColor } from '~/utils/song';

export function SongCard({
  song,
  artists,
  ...rest
}: { song?: Song; artists: Artist[] } & StackProps) {
  const { i18n: _i18n } = useTranslation();

  // const lang = i18n.language;

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
      >
        <Center position="absolute" flex={1} w="full" h="full">
          <Center w="full" h="full">
            {song.musicVideo && (
              <iframe
                height="240"
                src={`https://www.youtube-nocookie.com/embed/${song.musicVideo.videoId}/?start=${song.musicVideo.videoOffset}`}
                title="YouTube video player"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerpolicy="strict-origin-when-cross-origin"
                allowfullscreen
              ></iframe>
            )}
          </Center>
        </Center>
      </Stack>
      <Text layerStyle="textStroke" color="var(--color)" fontSize="2xl" fontWeight="bold">
        {song.name}
      </Text>
      <Text fontSize="sm">{artists?.map((a) => a.name).join(', ')}</Text>
    </Stack>
  );
}
