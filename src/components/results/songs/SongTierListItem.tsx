import { memo } from 'react';
import { Box, Center, Stack, Wrap, styled } from 'styled-system/jsx';
import { getPicUrl } from '~/utils/assets';

import type { Locale } from '~/i18n';
import type { WithRank } from '~/types';
import { token } from 'styled-system/tokens';
import type { Song } from '~/types/songs';
import { Text } from '~/components/ui/styled/text';

function _TierListItem({
  song,
  locale: _locale,
  showInfo,
  showName,
  showRank
}: {
  song: WithRank<Song>;
  locale: Locale;
  showName?: boolean;
  showInfo?: boolean;
  showRank?: boolean;
}) {
  const { id, rank, title, unit } = song;
  const imageSize = rank === 0 ? '125px' : '80px';

  // const fullName = getFullName(character, locale);

  return (
    <Stack
      style={{
        // ['--color' as 'color']: (colorCode ?? seriesColor) as 'red',
        // ['--seriesColor' as 'borderLeftColor']: seriesColor ?? colorCode,
        ['--padding' as 'padding']: token(`spacing.${showRank ? '4' : '1'}`),
        ['--padding-top' as 'paddingTop']: token(`spacing.${showRank ? '4' : '2'}`)
      }}
      justifyContent="flex-end"
      borderTop="4px solid"
      borderColor="var(--seriesColor)"
      h="full"
      p="var(--padding)"
      pt="var(--padding-top)"
    >
      <Stack flex="1" gap="1" alignItems="center">
        <Center position="relative" mb="4">
          {showRank && (
            <Box
              display="flex"
              position="absolute"
              top="0"
              left="0"
              justifyContent="center"
              alignItems="center"
              rounded="full"
              w="6"
              h="6"
              p="3"
              color="white"
              fontSize="sm"
              fontWeight="bold"
              bgColor="var(--color)"
              transform="translate(-50%, -50%)"
            >
              {rank}
            </Box>
          )}
          <styled.img
            src={getPicUrl(`${id}`, 'thumbnail')}
            alt={title}
            style={{ maxHeight: imageSize }}
            width="auto"
          />
        </Center>
        {showName && (
          <Wrap gap="0.5" justifyContent="center" alignItems="center" w="full">
            <Stack gap="1">
              <Stack gap="1" alignItems="center">
                <Text
                  layerStyle="textStroke"
                  color="var(--color)"
                  textAlign="center"
                  fontSize="sm"
                  fontWeight="bold"
                >
                  {title}
                </Text>
              </Stack>
              {showInfo && (
                <Text textAlign="center" fontSize="xs">
                  {unit}
                </Text>
              )}
            </Stack>
          </Wrap>
        )}
      </Stack>
    </Stack>
  );
}

export const SongTierListItem = memo(_TierListItem);
