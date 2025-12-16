import { useTranslation } from 'react-i18next';
import { Fragment, useMemo } from 'react';
import { Text } from '../ui/text';
import { TierListItem } from './TierListItem';
import { Grid, GridItem, Stack } from 'styled-system/jsx';
import type { Character, WithRank } from '~/types';

export const DEFAULT_TIERS: string[] = ['S', 'A', 'B', 'C', 'D'];

export type TierListSettings = {
  tiers: string[];
  tierRanks?: number[];
  showName?: boolean;
  showInfo?: boolean;
  showRank?: boolean;
  hideBottomTier?: boolean;
};

export function TierList({
  characters,
  isSeiyuu,
  settings,
  onSelectCharacter
}: {
  characters: WithRank<Character>[];
  isSeiyuu: boolean;
  settings?: TierListSettings | null;
  onSelectCharacter?: (character: WithRank<Character>) => void;
}) {
  const { tiers, tierRanks, showName, showInfo, showRank, hideBottomTier } = settings ?? {
    tiers: DEFAULT_TIERS
  };
  const { i18n } = useTranslation();

  const data = useMemo(() => {
    const ranksList = characters.map((c) => c.rank);
    const rankMinIdxMap: Record<number, number> = {};
    ranksList.forEach((rank, idx) => {
      if (!(rank in rankMinIdxMap)) {
        rankMinIdxMap[rank] = idx;
      }
    });

    return tiers.slice(0, hideBottomTier ? -1 : undefined).map((tier, idx) => {
      const minRank = tierRanks?.[idx - 1] ?? 0;
      const maxRank = tierRanks?.[idx] ?? 0;
      return {
        label: tier,
        items: characters.filter(
          (a) => rankMinIdxMap[a.rank] >= minRank && rankMinIdxMap[a.rank] < maxRank
        )
      };
    });
  }, [characters, tiers, tierRanks, hideBottomTier]);

  if (!tiers) return;

  return (
    <Grid
      gap="0"
      gridTemplateColumns="120px 1fr"
      border="1px solid"
      borderColor="border.default"
      rounded="l1"
    >
      {data
        .filter(({ items }) => items.length > 0)
        .map(({ label, items }, index) => {
          return (
            <Fragment key={index}>
              <Stack
                justifyContent="flex-start"
                borderRight="1px solid"
                borderBottom="1px solid"
                borderRightColor="border.default"
                borderBottomColor="border.default"
                minW="100px"
                py="4"
                px="2"
              >
                <Text w="full" textAlign="center" fontSize="xl" fontWeight="bold" whiteSpace="wrap">
                  {label}
                </Text>
              </Stack>
              <Grid
                flex="1"
                alignItems="flex-start"
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
                      onClick={onSelectCharacter && (() => onSelectCharacter(c))}
                      rounded="l1"
                      bgColor="bg.canvas"
                      shadow={{ base: 'md', _hover: 'lg' }}
                      transition="shadow"
                      cursor="pointer"
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
            </Fragment>
          );
        })}
    </Grid>
  );
}
