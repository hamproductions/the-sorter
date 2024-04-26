import { Stack, StackProps, styled } from 'styled-system/jsx';
import { Character } from '~/types';
import { Badge } from '../ui/badge';
import { Text } from '../ui/text';

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
      <Badge
        style={{ backgroundColor: character.seriesColor ?? undefined }}
        size="sm"
        color="colorPalette.fg"
        wordBreak="break-all"
      >
        {character.series}
      </Badge>
      <Text fontSize="sm">{character.school}</Text>
      <styled.img
        src={(isSeiyuu ? '/assets/seiyuu/' : '/assets/character/') + `${character.id}.webp`}
        w="auto"
        maxHeight="320px"
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
