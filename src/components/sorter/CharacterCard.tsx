import { useTranslation } from 'react-i18next';
import { Text } from '../ui/text';
import { CharacterIcon } from './CharacterIcon';
import { SchoolBadge } from './SchoolBadge';
import type { StackProps } from 'styled-system/jsx';
import { Box, Center, Stack, styled } from 'styled-system/jsx';
import { getPicUrl } from '~/utils/assets';
import type { Character } from '~/types';
import { getCastName, getFullName } from '~/utils/character';
import { getSchoolName } from '~/utils/names';

export function CharacterCard({
  character,
  isSeiyuu,
  ...rest
}: { character?: Character; isSeiyuu: boolean } & StackProps) {
  const { i18n } = useTranslation();

  const lang = i18n.language;

  if (!character) return null;

  return (
    <Stack
      style={{ ['--color' as 'color']: character.colorCode ?? undefined }}
      gap={1}
      alignItems="center"
      rounded="l1"
      w="full"
      p={2}
      backgroundColor={{ base: 'bg.default', _hover: 'bg.muted' }}
      shadow="md"
      transition="background-color"
      {...rest}
    >
      <SchoolBadge character={character} locale={lang} />
      <Text fontSize="sm">{getSchoolName(character.school, lang)}</Text>
      <Stack
        position="relative"
        flex={1}
        alignItems="center"
        w="full"
        minH={{ base: 0, sm: '240px' }}
      >
        <Center position="absolute" flex={1} h="full">
          <Box w="full" h="full">
            <styled.img
              src={getPicUrl(character.id, isSeiyuu ? 'seiyuu' : 'character')}
              alt={getFullName(character, lang)}
              minW={0}
              maxW="full"
              minH={0}
              maxH="full"
            />
          </Box>
          <CharacterIcon
            locale={lang}
            character={character}
            position="absolute"
            right="0"
            bottom="0"
            border="1px solid"
            borderColor="var(--color)"
            rounded="full"
            w={{ base: 8, md: 10 }}
            h={{ base: 8, md: 10 }}
            p="0.5"
            bgColor="bg.canvas"
            transform="translate(25%, 25%)"
          />
        </Center>
      </Stack>
      <Text layerStyle="textStroke" color="var(--color)" fontSize="2xl" fontWeight="bold">
        {isSeiyuu ? getCastName(character.casts[0], lang) : getFullName(character, lang)}
      </Text>
      {isSeiyuu ? (
        <Text fontSize="xs">{getFullName(character, lang)}</Text>
      ) : (
        <Stack gap="1" alignItems="center" textAlign="center">
          {character.casts.map((c) => {
            return (
              <Text key={c.seiyuu} w="full">
                {getCastName(c, lang)}{' '}
                {c.note && (
                  <Text as="span" fontSize="xs">
                    ({c.note})
                  </Text>
                )}
              </Text>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}
