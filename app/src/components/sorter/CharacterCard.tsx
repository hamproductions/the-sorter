import { Center, Stack, StackProps, styled } from 'styled-system/jsx';
import { Character } from '~/types';
import { getPicUrl } from '~/utils/assets';
import { Text } from '../ui/text';
import { CharacterIcon } from './CharacterIcon';
import { SchoolBadge } from './SchoolBadge';

export const CharacterCard = ({
  character,
  isSeiyuu,
  ...rest
}: { character?: Character; isSeiyuu: boolean } & StackProps) => {
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
        {isSeiyuu ? character.casts[0].seiyuu : character.fullName}
      </Text>
      {isSeiyuu ? (
        <Text fontSize="xs">{character.fullName}</Text>
      ) : (
        <Stack gap="1" alignItems="center">
          {character.casts.map((c) => {
            return (
              <Text key={c.seiyuu} w="full">
                {c.seiyuu}{' '}
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
};
