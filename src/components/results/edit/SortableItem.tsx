import type { UniqueIdentifier } from '@dnd-kit/core';
import { defaultAnimateLayoutChanges, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Text } from '../../ui/text';
import { CharacterIcon } from '../../sorter/CharacterIcon';
import { HStack, Stack, Wrap } from 'styled-system/jsx';
import type { Locale } from '~/i18n';
import type { Character, WithRank } from '~/types';
import { getCastName } from '~/utils/character';

export function SortableItem(props: {
  id: UniqueIdentifier;
  rank?: number;
  characters: WithRank<Character>[];
  isSeiyuu: boolean;
  locale: Locale;
}) {
  const { rank, id, characters, isSeiyuu, locale } = props;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.id,
    animateLayoutChanges: defaultAnimateLayoutChanges
  });

  return (
    <Stack
      style={{
        transform: CSS.Transform.toString(transform),
        transition
      }}
      ref={setNodeRef}
      data-active={isDragging === true ? 'true' : undefined}
      opacity={{ _active: 0.4 }}
      {...attributes}
      {...listeners}
    >
      {characters?.map((character) => {
        const { colorCode, seriesColor, casts = [], fullName } = character ?? {};

        return (
          <HStack
            style={{
              ['--color' as 'color']: (colorCode ?? seriesColor) as 'red',
              ['--seriesColor' as 'borderLeftColor']: seriesColor ?? colorCode
            }}
            alignItems="center"
            borderLeft="8px solid"
            borderColor="var(--seriesColor)"
            rounded="md"
            p="2"
            bgColor="bg.canvas"
            shadow="md"
          >
            {rank && (
              <Text color="var(--color)" fontSize="lg" fontWeight="bold">
                {rank}.
              </Text>
            )}
            <Wrap flex={1} gap="0.5" alignItems="center">
              <Stack gap="1">
                <Stack gap="1" alignItems="center">
                  <Text color="var(--color)" fontSize="md" fontWeight="bold">
                    {isSeiyuu ? getCastName(casts[0], locale) : fullName}
                  </Text>
                </Stack>
                {isSeiyuu ? (
                  <Text fontSize="xs">{fullName}</Text>
                ) : (
                  <Stack gap="1" alignItems="center">
                    {casts?.map((c) => {
                      return (
                        <Text key={c.seiyuu} fontSize="xs">
                          {getCastName(c, locale)}{' '}
                        </Text>
                      );
                    })}
                  </Stack>
                )}
              </Stack>
            </Wrap>
            <CharacterIcon locale={locale} character={character} rounded="full" h="8" />
          </HStack>
        );
      })}
    </Stack>
  );
}
