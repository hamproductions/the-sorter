import { CharacterIcon } from '../sorter/CharacterIcon';
import { Text } from '../ui';
import { HStack, Stack } from 'styled-system/jsx';

import type { Locale } from '~/i18n';
import type { Character, WithRank } from '~/types';
import { getCastName, getFullName } from '~/utils/character';

export function RankingViewListItem({
  character,
  isSeiyuu,
  locale
}: {
  character: WithRank<Character>;
  isSeiyuu: boolean;
  locale: Locale;
}) {
  const { rank, colorCode, casts, seriesColor } = character;

  const fullName = getFullName(character, locale);

  return (
    <HStack
      style={{
        ['--color' as 'color']: colorCode ?? (seriesColor as 'red'),
        ['--seriesColor' as 'borderLeftColor']: seriesColor ?? colorCode
      }}
      alignItems="flex-start"
      borderLeft="4px solid"
      borderBottom="1px solid"
      borderLeftColor="var(--color)"
      borderBottomColor="var(--color)"
      h="full"
      py="0.5"
      px="2"
    >
      <Text layerStyle="textStroke" color="var(--color)" fontSize="sm" fontWeight="bold">
        {rank}.
      </Text>
      <HStack gap="0.5" textAlign="start">
        <CharacterIcon locale={locale} character={character} w="auto" h="8" />
        <Stack gap="0.5">
          <Text layerStyle="textStroke" color="var(--color)" fontSize="sm" fontWeight="bold">
            {isSeiyuu ? getCastName(casts[0], locale) : fullName}
          </Text>
          {isSeiyuu ? (
            <Text fontSize="xs">{fullName}</Text>
          ) : (
            <Stack gap="1">
              {casts.map((c) => {
                return (
                  <Text key={c.seiyuu} fontSize="xs">
                    {getCastName(c, locale)}
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
