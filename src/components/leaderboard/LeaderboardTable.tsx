import { Fragment, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Table } from '../ui/table';
import { Text } from '../ui/text';
import { RankTrendChart } from './RankTrendChart';
import type { RankingItemDisplay } from './useRankingItems';
import type { ItemHistoryPoint, LeaderboardEntry } from '~/types/global-ranking';
import { type LeaderboardQuery, fetchItemHistory } from '~/utils/global-ranking';
import { Box, HStack, Stack, styled } from 'styled-system/jsx';

const percent = (value: number) => `${(value * 100).toFixed(1)}%`;

function TrendRow({
  itemId,
  query,
  color,
  colSpan
}: {
  itemId: string;
  query: LeaderboardQuery;
  color?: string;
  colSpan: number;
}) {
  const { t } = useTranslation();
  const [points, setPoints] = useState<ItemHistoryPoint[]>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setPoints(undefined);
    setFailed(false);
    const load = async () => {
      const res = await fetchItemHistory(itemId, query);
      if (cancelled) return;
      if (res) setPoints(res.points);
      else setFailed(true);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [itemId, query]);

  return (
    <Table.Row>
      <Table.Cell colSpan={colSpan}>
        <Stack alignItems="center" py="2">
          {failed ? (
            <Text color="fg.muted" fontSize="sm">
              {t('global_ranking.error')}
            </Text>
          ) : points ? (
            <RankTrendChart points={points} color={color} />
          ) : (
            <Text color="fg.muted" fontSize="sm">
              {t('global_ranking.loading')}
            </Text>
          )}
        </Stack>
      </Table.Cell>
    </Table.Row>
  );
}

export function LeaderboardTable({
  entries,
  resolve,
  query
}: {
  entries: LeaderboardEntry[];
  resolve: (id: string) => RankingItemDisplay;
  query: LeaderboardQuery;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<string>();

  useEffect(() => {
    setExpanded(undefined);
  }, [query]);

  return (
    <Table.Root size="sm" data-testid="leaderboard-table">
      <Table.Head>
        <Table.Row>
          <Table.Header>{t('global_ranking.rank')}</Table.Header>
          <Table.Header>{t('global_ranking.item')}</Table.Header>
          <Table.Header textAlign="end">{t('global_ranking.score')}</Table.Header>
          <Table.Header hideBelow="sm" textAlign="end">
            {t('global_ranking.appearances')}
          </Table.Header>
          <Table.Header hideBelow="sm" textAlign="end">
            {t('global_ranking.top1')}
          </Table.Header>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {entries.map((entry) => {
          const item = resolve(entry.itemId);
          const isOpen = expanded === entry.itemId;
          return (
            <Fragment key={entry.itemId}>
              <Table.Row
                style={{ ['--color' as 'color']: item.color ?? 'transparent' }}
                aria-expanded={isOpen}
                tabIndex={0}
                onClick={() => setExpanded(isOpen ? undefined : entry.itemId)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setExpanded(isOpen ? undefined : entry.itemId);
                  }
                }}
                cursor="pointer"
                borderLeft="6px solid"
                borderLeftColor="var(--color)"
                _focusVisible={{ outline: '2px solid', outlineColor: 'colorPalette.default' }}
              >
                <Table.Cell fontWeight="bold" fontVariantNumeric="tabular-nums">
                  {entry.rank}
                </Table.Cell>
                <Table.Cell>
                  <HStack gap="2">
                    {item.image && (
                      <styled.img src={item.image} alt="" objectFit="contain" w="8" h="8" />
                    )}
                    <Stack gap="0">
                      <Text fontWeight="medium">{item.name}</Text>
                      {item.subtitle && (
                        <Text color="fg.muted" fontSize="xs">
                          {item.subtitle}
                        </Text>
                      )}
                    </Stack>
                  </HStack>
                </Table.Cell>
                <Table.Cell fontVariantNumeric="tabular-nums" textAlign="end">
                  <Stack gap="1" alignItems="flex-end">
                    <Text>{percent(entry.score)}</Text>
                    <Box borderRadius="full" w="16" h="1" bg="bg.muted" overflow="hidden">
                      <Box style={{ width: percent(entry.score) }} h="full" bg="var(--color)" />
                    </Box>
                  </Stack>
                </Table.Cell>
                <Table.Cell hideBelow="sm" fontVariantNumeric="tabular-nums" textAlign="end">
                  {entry.appearances}
                </Table.Cell>
                <Table.Cell hideBelow="sm" fontVariantNumeric="tabular-nums" textAlign="end">
                  {entry.top1}
                </Table.Cell>
              </Table.Row>
              {isOpen && (
                <TrendRow itemId={entry.itemId} query={query} colSpan={5} color={item.color} />
              )}
            </Fragment>
          );
        })}
      </Table.Body>
    </Table.Root>
  );
}
