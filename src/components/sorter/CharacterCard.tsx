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
      h="full"
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
      >
        {character.series}
      </Badge>
      <styled.img
        src={(isSeiyuu ? '/assets/seiyuu/' : '/assets/character/') + `${character.id}.webp`}
        maxHeight="320px"
      />
      <Text style={{ color: character.colorCode ?? undefined }} fontSize="2xl" fontWeight="bold">
        {isSeiyuu ? character.seiyuu : character.fullName}
      </Text>
      <Text fontSize="xs">
        {isSeiyuu ? (
          character.fullName
        ) : (
          <>
            {character.castTitle}: {character.seiyuu}
          </>
        )}
      </Text>
      <Text>{character.school}</Text>
    </Stack>
  );
};
