import { memo } from 'react';
import { CharacterIcon } from '../sorter/CharacterIcon';
import { Text } from '../ui/text';
import { Box, Center, Stack, Wrap, styled } from 'styled-system/jsx';
import { getPicUrl } from '~/utils/assets';

import type { Locale } from '~/i18n';
import type { Character, WithRank } from '~/types';
import { getCastName, getFullName } from '~/utils/character';
import { token } from 'styled-system/tokens';

function _TierListItem({
  character,
  isSeiyuu,
  locale,
  showInfo,
  showName,
  showRank
}: {
  character: WithRank<Character>;
  isSeiyuu: boolean;
  locale: Locale;
  showName?: boolean;
  showInfo?: boolean;
  showRank?: boolean;
}) {
  const { id, rank, colorCode, casts, seriesColor } = character;
  const imageSize = rank === 0 ? '125px' : '80px';

  const fullName = getFullName(character, locale);

  return (
    <Stack
      style={{
        ['--color' as 'color']: (colorCode ?? seriesColor) as 'red',
        ['--seriesColor' as 'borderLeftColor']: seriesColor ?? colorCode,
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
            src={getPicUrl(id, isSeiyuu ? 'seiyuu' : 'character')}
            alt={fullName}
            style={{ maxHeight: imageSize }}
            width="auto"
          />
          <CharacterIcon
            locale={locale}
            character={character}
            position="absolute"
            right="0"
            bottom="0"
            border="1px solid"
            borderColor="var(--color)"
            rounded="full"
            w="8"
            h="8"
            p="0.5"
            bgColor="bg.canvas"
            transform="translate(25%, 25%)"
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
                  {isSeiyuu ? getCastName(casts[0], locale) : fullName}
                </Text>
              </Stack>
              {showInfo &&
                (isSeiyuu ? (
                  <Text textAlign="center" fontSize="xs">
                    {fullName}
                  </Text>
                ) : (
                  <Stack gap="1" alignItems="center">
                    {casts?.map((c) => {
                      return (
                        <Text key={c.seiyuu} fontSize="xs">
                          {getCastName(c, locale)}{' '}
                          {/* {c.note && (
                        <Text as="span" fontSize="xs">
                          ({c.note})
                        </Text>
                      )} */}
                        </Text>
                      );
                    })}
                  </Stack>
                ))}
            </Stack>
          </Wrap>
        )}
      </Stack>
    </Stack>
  );
}

export const TierListItem = memo(_TierListItem);
