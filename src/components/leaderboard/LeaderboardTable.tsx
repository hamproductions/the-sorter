import { Fragment, memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaArrowDown, FaArrowUp, FaCircleInfo } from 'react-icons/fa6';
import { IconButton } from '../ui/icon-button';
import { Popover } from '../ui/popover';
import { Skeleton } from '../ui/skeleton';
import { Table } from '../ui/table';
import { Text } from '../ui/text';
import { ItemThumbnail } from './ItemThumbnail';
import { RankTrendChart, TREND_CHART_ASPECT } from './RankTrendChart';
import type { RankingItemDisplay } from './useRankingItems';
import type { ItemHistoryPoint, LeaderboardEntry } from '~/types/global-ranking';
import { type LeaderboardQuery, fetchItemHistory } from '~/utils/global-ranking';
import { Box, HStack, Stack, styled } from 'styled-system/jsx';

export const SORT_KEYS = [
  'rank',
  'score',
  'appearances',
  'top1',
  'top3',
  'top10',
  'meanPercentile'
] as const;
export type SortKey = (typeof SORT_KEYS)[number];
export interface TableSort {
  key: SortKey;
  desc: boolean;
}

const percent = (value: number) => `${(value * 100).toFixed(1)}%`;
const historyCache = new Map<string, ItemHistoryPoint[]>();
const COLUMNS: { key: Exclude<SortKey, 'rank' | 'score'>; hideBelow: 'sm' | 'md' }[] = [
  { key: 'appearances', hideBelow: 'sm' },
  { key: 'top1', hideBelow: 'sm' },
  { key: 'top3', hideBelow: 'md' },
  { key: 'top10', hideBelow: 'md' },
  { key: 'meanPercentile', hideBelow: 'md' }
];

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
  const cacheKey = `${itemId}|${JSON.stringify(query)}`;
  const [points, setPoints] = useState(() => historyCache.get(cacheKey));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const cached = historyCache.get(cacheKey);
    setPoints(cached);
    setFailed(false);
    if (cached) return;
    let cancelled = false;
    const load = async () => {
      const res = await fetchItemHistory(itemId, query);
      if (cancelled) return;
      if (!res) {
        setFailed(true);
        return;
      }
      historyCache.set(cacheKey, res.points);
      setPoints(res.points);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [cacheKey, itemId, query]);

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
            <Skeleton
              data-testid="trend-skeleton"
              style={{ aspectRatio: TREND_CHART_ASPECT }}
              w="full"
              maxW="lg"
            />
          )}
        </Stack>
      </Table.Cell>
    </Table.Row>
  );
}

const LeaderboardRow = memo(function LeaderboardRow({
  entry,
  resolve,
  isOpen,
  onToggle,
  query
}: {
  entry: LeaderboardEntry;
  resolve: (id: string) => RankingItemDisplay;
  isOpen: boolean;
  onToggle: (id: string) => void;
  query: LeaderboardQuery;
}) {
  const item = resolve(entry.itemId);
  return (
    <Fragment>
      <Table.Row
        style={{ ['--color' as 'color']: item.color ?? 'transparent' }}
        aria-expanded={isOpen}
        tabIndex={0}
        onClick={() => onToggle(entry.itemId)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle(entry.itemId);
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
            <ItemThumbnail item={item} size="8" />
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
        {COLUMNS.map(({ key, hideBelow }) => (
          <Table.Cell
            key={key}
            hideBelow={hideBelow}
            fontVariantNumeric="tabular-nums"
            textAlign="end"
          >
            {key === 'meanPercentile' ? percent(entry[key]) : entry[key]}
          </Table.Cell>
        ))}
      </Table.Row>
      {isOpen && (
        <TrendRow
          itemId={entry.itemId}
          query={query}
          colSpan={COLUMNS.length + 3}
          color={item.color}
        />
      )}
    </Fragment>
  );
});

function ScoreInfo() {
  const { t } = useTranslation();
  return (
    <Popover.Root positioning={{ placement: 'bottom-end' }}>
      <Popover.Trigger asChild>
        <IconButton
          aria-label={t('global_ranking.score_info_label')}
          variant="ghost"
          size="xs"
          onClick={(e) => e.stopPropagation()}
        >
          <FaCircleInfo />
        </IconButton>
      </Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content maxW="xs" fontWeight="normal" textAlign="start">
          <Popover.Title fontWeight="bold">{t('global_ranking.score')}</Popover.Title>
          <Popover.Description>{t('global_ranking.score_info')}</Popover.Description>
        </Popover.Content>
      </Popover.Positioner>
    </Popover.Root>
  );
}

function SortHeader({
  sortKey,
  sort,
  onSort,
  children
}: {
  sortKey: SortKey;
  sort: TableSort;
  onSort: (key: SortKey) => void;
  children: React.ReactNode;
}) {
  const active = sort.key === sortKey;
  return (
    <styled.button
      type="button"
      onClick={() => onSort(sortKey)}
      cursor="pointer"
      display="inline-flex"
      gap="1"
      alignItems="center"
      fontWeight={active ? 'bold' : 'inherit'}
    >
      {children}
      {active && (sort.desc ? <FaArrowDown size="0.7em" /> : <FaArrowUp size="0.7em" />)}
    </styled.button>
  );
}

export function LeaderboardTable({
  entries,
  resolve,
  query,
  sort,
  onSort
}: {
  entries: LeaderboardEntry[];
  resolve: (id: string) => RankingItemDisplay;
  query: LeaderboardQuery;
  sort: TableSort;
  onSort: (key: SortKey) => void;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<string>();
  const onToggle = useCallback(
    (id: string) => setExpanded((current) => (current === id ? undefined : id)),
    []
  );

  useEffect(() => {
    setExpanded(undefined);
  }, [query]);

  const ariaSort = (key: SortKey) =>
    sort.key === key ? (sort.desc ? 'descending' : 'ascending') : undefined;

  return (
    <Table.Root size="sm" data-testid="leaderboard-table">
      <Table.Head>
        <Table.Row>
          <Table.Header aria-sort={ariaSort('rank')}>
            <SortHeader sortKey="rank" sort={sort} onSort={onSort}>
              {t('global_ranking.rank')}
            </SortHeader>
          </Table.Header>
          <Table.Header>{t('global_ranking.item')}</Table.Header>
          <Table.Header aria-sort={ariaSort('score')} textAlign="end">
            <HStack gap="0" justifyContent="flex-end">
              <SortHeader sortKey="score" sort={sort} onSort={onSort}>
                {t('global_ranking.score')}
              </SortHeader>
              <ScoreInfo />
            </HStack>
          </Table.Header>
          {COLUMNS.map(({ key, hideBelow }) => (
            <Table.Header key={key} aria-sort={ariaSort(key)} hideBelow={hideBelow} textAlign="end">
              <SortHeader sortKey={key} sort={sort} onSort={onSort}>
                {t(`global_ranking.${key}`)}
              </SortHeader>
            </Table.Header>
          ))}
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {entries.map((entry) => (
          <LeaderboardRow
            key={entry.itemId}
            entry={entry}
            resolve={resolve}
            isOpen={expanded === entry.itemId}
            onToggle={onToggle}
            query={query}
          />
        ))}
      </Table.Body>
    </Table.Root>
  );
}
