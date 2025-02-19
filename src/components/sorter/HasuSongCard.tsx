/* eslint-disable jsx-a11y/media-has-caption */
import { useTranslation } from 'react-i18next';
import { Text } from '../ui/text';
import type { StackProps } from 'styled-system/jsx';
import { Center, Stack, styled } from 'styled-system/jsx';
import type { HasuSong } from '~/types/songs';
import { getAudioUrl, getPicUrl } from '~/utils/assets';
import { getHasuSongColor } from '~/utils/song';

export function HasuSongCard({ song, ...rest }: { song?: HasuSong } & StackProps) {
  const { i18n: _i18n } = useTranslation();

  // const lang = i18n.language;

  if (!song) return null;

  return (
    <Stack
      style={{ ['--color' as 'color']: getHasuSongColor(song) ?? undefined }}
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
            <styled.img
              src={getPicUrl(`${song.id}`, 'thumbnail')}
              alt={song.title}
              minW={0}
              maxW="full"
              minH={0}
              maxH="full"
            />
          </Center>
        </Center>
      </Stack>
      <Text layerStyle="textStroke" color="var(--color)" fontSize="2xl" fontWeight="bold">
        {song.title}
      </Text>
      <Text fontSize="sm">{song.unit}</Text>
      <audio src={getAudioUrl(`${song.id}`)} controls preload="auto" />
    </Stack>
  );
}
