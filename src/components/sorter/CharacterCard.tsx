import { useTranslation } from 'react-i18next';
import { Text } from '../ui/text';
import { CharacterIcon } from './CharacterIcon';
import { SchoolBadge } from './SchoolBadge';
import { Center, Stack, StackProps, styled } from 'styled-system/jsx';
import { getPicUrl } from '~/utils/assets';
import { Character } from '~/types';
import { getCastName, getFullName } from '~/utils/character';

export function CharacterCard({
  character,
  isSeiyuu,
  ...rest
}: { character?: Character; isSeiyuu: boolean } & StackProps) {
  const { i18n } = useTranslation();

  const lang = i18n.language as 'en';

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
      <SchoolBadge character={character} />
      <Text fontSize="sm">{character.school}</Text>
      <Stack
        position="relative"
        flex={1}
        alignItems="center"
        w="full"
        minH={{ base: 0, sm: '240px' }}
      >
        <Center position="absolute" flex={1} h="full">
          <styled.img
            src={getPicUrl(character.id, isSeiyuu ? 'seiyuu' : 'character')}
            alt={getFullName(character, lang)}
            minW={0}
            maxW="full"
            minH={0}
            maxH="full"
          />
          <CharacterIcon
            character={character}
            position="absolute"
            right="0"
            bottom="0"
            border="1px solid"
            borderColor="var(--color)"
            rounded="full"
            w={{ base: 8, md: 10 }}
            h={{ base: 8, md: 10 }}
            bgColor="white"
            transform="translate(25%, 25%)"
          />
        </Center>
      </Stack>
      <Text color="var(--color)" fontSize="2xl" fontWeight="bold">
        {isSeiyuu ? getCastName(character.casts[0], lang) : getFullName(character, lang)}
      </Text>
      {isSeiyuu ? (
        <Text fontSize="xs">{getFullName(character, lang)}</Text>
      ) : (
        <Stack gap="1" alignItems="center">
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
