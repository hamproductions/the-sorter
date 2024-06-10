import { Box, Center, Grid, GridItem, HStack, Stack, styled } from 'styled-system/jsx';
import { Character, WithRank } from '~/types';
import { Text } from '../ui/text';
import { getPicUrl } from '~/utils/assets';
import { SchoolBadge } from './SchoolBadge';

export const RankingView = ({
  characters,
  isSeiyuu
}: {
  characters: WithRank<Character>[];
  isSeiyuu: boolean;
}) => {
  return (
    <Stack p="2">
      <Grid alignItems="stretch" gridTemplateColumns="repeat(3, 1fr)">
        {characters.slice(0, 3).map((c, idx) => {
          const { rank, casts, fullName, id, colorCode, seriesColor } = c;
          const imageSize = idx === 0 ? '125px' : '80px';
          return (
            <GridItem
              key={id}
              style={{ ['--color' as 'color']: (colorCode ?? seriesColor) as 'red' }}
            >
              <Stack justifyContent="flex-end" h="full">
                <Stack gap="1" alignItems="center">
                  <Center position="relative">
                    <Box
                      display="flex"
                      position="absolute"
                      top="0"
                      left="0"
                      justifyContent="center"
                      alignItems="center"
                      rounded="full"
                      w="8"
                      h="8"
                      p="4"
                      color="white"
                      fontSize="lg"
                      fontWeight="bold"
                      bgColor="var(--color)"
                      transform="translate(-50%, -50%)"
                    >
                      {rank}.
                    </Box>
                    <styled.img
                      src={getPicUrl(id, isSeiyuu)}
                      style={{ maxHeight: imageSize }}
                      width="auto"
                    />
                  </Center>
                  <Stack gap="1">
                    <SchoolBadge character={c} hideBelow="sm" />
                    <Stack gap="1" alignItems="center">
                      <Text color="var(--color)" fontSize="lg" fontWeight="bold">
                        {isSeiyuu ? casts[0].seiyuu : fullName}
                      </Text>
                    </Stack>
                    {isSeiyuu ? (
                      <Text textAlign="center" fontSize="xs">
                        {fullName}
                      </Text>
                    ) : (
                      <Stack gap="1" alignItems="center">
                        {casts.map((c) => {
                          return (
                            <Text key={c.seiyuu} fontSize="xs">
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
                </Stack>
              </Stack>
            </GridItem>
          );
        })}
      </Grid>
      <Grid gridTemplateColumns="repeat(auto-fit, minmax(150px, 1fr))">
        {characters.slice(3).map((c) => {
          const { rank, id, colorCode, casts, fullName, seriesColor } = c;
          return (
            <GridItem
              key={id}
              style={{
                ['--color' as 'color']: colorCode as 'red',
                ['--seriesColor' as 'borderLeftColor']: seriesColor ?? colorCode
              }}
              borderLeft="4px solid"
              borderBottom="1px solid"
              borderColor="var(--seriesColor)"
              px="2"
            >
              <HStack alignItems="flex-start">
                <Text color="var(--color)" fontSize="sm" fontWeight="bold">
                  {rank}.
                </Text>
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
            </GridItem>
          );
        })}
      </Grid>
    </Stack>
  );
};
