import { Box, Center, Stack, Wrap, styled } from 'styled-system/jsx';
import { getPicUrl } from '~/utils/assets';

import type { Locale } from '~/i18n';
import type { WithRank } from '~/types';
import type { HasuSong } from '~/types/songs';
import { Text } from '~/components/ui/text';
import { getHasuSongColor } from '~/utils/song';

export function HasuSongGridViewItem({
  song,
  locale: _locale
}: {
  song: WithRank<HasuSong>;
  locale: Locale;
}) {
  const { id, rank, title, unit } = song;
  const imageSize = rank === 0 ? '125px' : '80px';

  // const fullName = getFullName(character, locale);

  return (
    <Stack
      style={{
        ['--color' as 'color']: getHasuSongColor(song) as 'red',
        ['--seriesColor' as 'borderLeftColor']: getHasuSongColor(song)
      }}
      justifyContent="flex-end"
      borderTop="8px solid"
      borderColor="var(--seriesColor)"
      h="full"
      p="2"
      pt="6"
    >
      <Stack flex="1" gap="1" alignItems="center">
        <Center position="relative" mb="4">
          <Box
            display="flex"
            position="absolute"
            top="0"
            left="0"
            justifyContent="center"
            alignItems="center"
            rounded="full"
            w="8"
            h="8"
            p="4"
            color="white"
            fontSize="lg"
            fontWeight="bold"
            bgColor="var(--color)"
            transform="translate(-50%, -50%)"
          >
            {rank}
          </Box>
          <styled.img
            src={getPicUrl(`${id}`, 'thumbnail')}
            alt={title}
            style={{ maxHeight: imageSize }}
            width="auto"
          />
        </Center>
        <Wrap gap="0.5" justifyContent="center" alignItems="center" w="full">
          <Stack gap="1">
            <Stack gap="1" alignItems="center">
              <Text
                layerStyle="textStroke"
                color="var(--color)"
                textAlign="center"
                fontSize="lg"
                fontWeight="bold"
              >
                {title}
              </Text>
            </Stack>
            <Text textAlign="center" fontSize="xs">
              {unit}
            </Text>
          </Stack>
        </Wrap>
      </Stack>
    </Stack>
  );
}
