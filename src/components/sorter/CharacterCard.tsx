import { Stack, StackProps, styled } from 'styled-system/jsx';
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
      flex="1"
      gap={1}
      alignItems="center"
      rounded="l1"
      p={2}
      backgroundColor={{ base: 'bg.default', _hover: 'bg.muted' }}
      shadow="md"
      transition="background-color"
      {...rest}
    >
      <SchoolBadge character={character} />
      <Text fontSize="sm">{character.school}</Text>
      <styled.img
        src={(isSeiyuu ? '/assets/seiyuu/' : '/assets/character/') + `${character.id}.webp`}
        w="auto"
        maxWidth="240px"
        maxHeight="240px"
      />
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
