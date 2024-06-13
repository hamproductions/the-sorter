import { Text } from '../ui/text';
import { CharacterIcon } from './CharacterIcon';
import { HStack, Stack } from 'styled-system/jsx';

import { Character, WithRank } from '~/types';

export function RankingViewListItem({
  character,
  isSeiyuu
}: {
  character: WithRank<Character>;
  isSeiyuu: boolean;
}) {
  const { rank, colorCode, casts, fullName, seriesColor } = character;

  return (
    <HStack
      style={{
        ['--color' as 'color']: colorCode ?? (seriesColor as 'red'),
        ['--seriesColor' as 'borderLeftColor']: seriesColor ?? colorCode
      }}
      alignItems="flex-start"
      borderLeft="4px solid"
      borderBottom="1px solid"
      borderColor="var(--seriesColor)"
      px="2"
    >
      <Text color="var(--color)" fontSize="sm" fontWeight="bold">
        {rank}.
      </Text>
      <HStack gap="0.5" alignItems="center">
        <CharacterIcon character={character} w="auto" h="8" />
        <Stack gap="0.5">
          <Text color="var(--color)" fontSize="sm" fontWeight="bold">
            {isSeiyuu ? casts[0].seiyuu : fullName}
          </Text>
          {isSeiyuu ? (
            <Text fontSize="xs">{fullName}</Text>
          ) : (
            <Stack gap="1">
              {casts.map((c) => {
                return (
                  <Text key={c.seiyuu} fontSize="xs">
                    {c.seiyuu}
                  </Text>
                );
              })}
            </Stack>
          )}
        </Stack>
      </HStack>
    </HStack>
  );
}
