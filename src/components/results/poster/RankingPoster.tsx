import type { ReactNode } from 'react';
import { Box, Grid, HStack, Stack } from 'styled-system/jsx';

export interface PosterEntry {
  key: string;
  rank: number;
  color: string;
  title: string;
  subtitle: string;
  media?: ReactNode;
  details?: ReactNode;
}

type EntryProps = Omit<PosterEntry, 'key'>;

function LeadEntry({ rank, color, title, subtitle, media, details }: EntryProps) {
  return (
    <Grid
      as="li"
      style={{ ['--color' as 'color']: color }}
      gap="0"
      alignItems="center"
      gridTemplateColumns="minmax(4.75rem, auto) minmax(0, 1fr)"
      borderLeft="6px solid"
      borderBottom="1px solid"
      borderLeftColor="var(--color)"
      borderBottomColor="border.default"
      py="3.5"
      pr="1"
      bg="bg.subtle"
    >
      <Box
        fontSize="48px"
        fontWeight="bold"
        fontVariantNumeric="tabular-nums"
        lineHeight="1"
        textAlign="center"
      >
        {rank}
      </Box>
      <HStack gap="3" minW="0">
        {media}
        <Box minW="0">
          <Box fontSize="23px" fontWeight="bold" lineHeight="1.25">
            {title}
          </Box>
          <Box fontSize="15px">{subtitle}</Box>
          {details && (
            <Box color="fg.muted" fontSize="14px">
              {details}
            </Box>
          )}
        </Box>
      </HStack>
    </Grid>
  );
}

function Entry({ rank, color, title, subtitle, media, details }: EntryProps) {
  return (
    <Grid
      as="li"
      style={{ ['--color' as 'color']: color }}
      gap="0"
      alignContent="start"
      gridTemplateColumns="minmax(2.125rem, auto) minmax(0, 1fr)"
      borderLeft="6px solid"
      borderBottom="1px solid"
      borderLeftColor="var(--color)"
      borderBottomColor="border.default"
      py="2"
      pr="0.5"
    >
      <Box
        px="1"
        fontSize="18px"
        fontWeight="bold"
        fontVariantNumeric="tabular-nums"
        lineHeight="22px"
        textAlign="center"
      >
        {rank}
      </Box>
      <Stack gap="1" minW="0">
        {media}
        <Box minW="0">
          <Box fontSize="17px" fontWeight="bold" lineHeight="1.3">
            {title}
          </Box>
          <Box color="fg.muted" fontSize="14px">
            {subtitle}
          </Box>
          {details && (
            <Box color="fg.muted" fontSize="13px">
              {details}
            </Box>
          )}
        </Box>
      </Stack>
    </Grid>
  );
}

export function RankingPoster({ entries }: { entries: PosterEntry[] }) {
  return (
    <Stack gap="0" textAlign="start" overflowWrap="anywhere">
      <Stack as="ol" gap="2" mb="2" listStyleType="none">
        {entries.slice(0, 3).map(({ key, ...entry }) => (
          <LeadEntry key={key} {...entry} />
        ))}
      </Stack>
      <Grid
        as="ol"
        columnGap="2"
        rowGap="0"
        gridTemplateColumns="repeat(2, minmax(0, 1fr))"
        listStyleType="none"
      >
        {entries.slice(3).map(({ key, ...entry }) => (
          <Entry key={key} {...entry} />
        ))}
      </Grid>
    </Stack>
  );
}
