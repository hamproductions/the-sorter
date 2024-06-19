import { useTranslation } from 'react-i18next';
import { max, sortBy } from 'lodash-es';
import { useMemo } from 'react';
import { Text } from '../ui/text';
import { TierListItem } from './TierListItem';
import { Grid, GridItem, Stack } from 'styled-system/jsx';
import type { Character, WithRank } from '~/types';

export const DEFAULT_TIERS: string[] = ['S', 'A', 'B', 'C', 'D'];

export type TierListSettings = {
  tiers: string[];
  showName?: boolean;
  showInfo?: boolean;
  showRank?: boolean;
};

export function TierList({
  characters,
  isSeiyuu,
  settings
}: {
  characters: WithRank<Character>[];
  isSeiyuu: boolean;
  settings?: TierListSettings | null;
}) {
  const { tiers, showName, showInfo, showRank } = settings ?? { tiers: DEFAULT_TIERS };
  const { i18n } = useTranslation();

  const data = useMemo(() => {
    const ranksList = characters.map((c) => c.rank);
    const rankMinIdxMap: Record<number, number> = {};

    ranksList.forEach((rank, idx) => {
      if (!(rank in rankMinIdxMap)) {
        rankMinIdxMap[rank] = idx;
      }
    });
    const totalRank = max(ranksList) ?? ranksList.length;

    return sortBy(tiers, 'percentile').map((tier, idx) => {
      const minIndex = (idx / tiers.length) * totalRank;
      const maxIndex = ((idx + 1) / tiers.length) * totalRank;
      return {
        label: tier,
        items: characters.filter(
          (a) => rankMinIdxMap[a.rank] >= minIndex && rankMinIdxMap[a.rank] < maxIndex
        )
      };
    });
  }, [characters, tiers]);

  if (!tiers) return;
  return (
    <Grid
      gap="0"
      gridTemplateColumns="100px 1fr"
      border="1px solid"
      borderColor="border.default"
      rounded="l1"
    >
      {data
        .filter(({ items }) => items.length > 0)
        .map(({ label, items }) => {
          return (
            <>
              <Stack
                justifyContent="flex-start"
                borderRight="1px solid"
                borderBottom="1px solid"
                borderRightColor="border.default"
                borderBottomColor="border.default"
                minW="100px"
                py="4"
              >
                <Text w="full" textAlign="center" fontSize="xl" fontWeight="bold" whiteSpace="wrap">
                  {label}
                </Text>
              </Stack>
              <Grid
                flex="1"
                gridGap={2}
                gridTemplateColumns="repeat(auto-fill, minmax(100px, 1fr))"
                borderBottom="1px solid"
                borderBottomColor="border.default"
                p="2"
              >
                {items.map((c) => {
                  const { id } = c;
                  return (
                    <GridItem
                      key={id}
                      rounded="l1"
                      bgColor="bg.canvas"
                      shadow={{ base: 'md', _hover: 'lg' }}
                      transition="shadow"
                      overflow="hidden"
                    >
                      <TierListItem
                        character={c}
                        isSeiyuu={isSeiyuu}
                        locale={i18n.language}
                        showName={showName}
                        showInfo={showInfo}
                        showRank={showRank}
                      />
                    </GridItem>
                  );
                })}
              </Grid>
            </>
          );
        })}
    </Grid>
  );
}
