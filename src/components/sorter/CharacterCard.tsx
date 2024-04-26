import { Stack, StackProps, styled, Box } from 'styled-system/jsx';
import { Character } from '~/types';
import { Text } from '../ui/text';
import { SchoolBadge } from './SchoolBadge';

export const CharacterCard = ({
  character,
  isSeiyuu,
  ...rest
}: { character?: Character; isSeiyuu: boolean } & StackProps) => {
  if (!character) return null;

  return (
    <Stack
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
        <styled.img
          src={(isSeiyuu ? '/assets/seiyuu/' : '/assets/character/') + `${character.id}.webp`}
          position="absolute"
          flex={1}
          minW={0}
          maxW="full"
          minH={0}
          maxH="full"
        />
      </Stack>
      <Text style={{ color: character.colorCode ?? undefined }} fontSize="2xl" fontWeight="bold">
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
