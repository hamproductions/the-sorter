import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaArrowDown, FaArrowUp, FaEquals } from 'react-icons/fa6';
import { Button } from '../ui/button';
import { Text } from '../ui/text';
import { ItemThumbnail } from './ItemThumbnail';
import { useRankingItems } from './useRankingItems';
import type { AgreementResponse, RankingKind, RankingMode } from '~/types/global-ranking';
import { fetchAgreement } from '~/utils/global-ranking';
import { css } from 'styled-system/css';
import { Box, Grid, HStack, Stack } from 'styled-system/jsx';

export const AGREEMENT_MIN_ITEMS = 10;
const PREVIEW_COUNT = 5;
const GAUGE_ANCHORS = [
  { at: 0, key: 'gauge_opposite' },
  { at: 0.5, key: 'gauge_unrelated' },
  { at: 0.75, key: 'gauge_strong' },
  { at: 1, key: 'gauge_identical' }
] as const;

type ComparedItem = AgreementResponse['items'][number];

const TONES = {
  green: css({ color: 'green.11', bg: 'green.a3' }),
  red: css({ color: 'red.11', bg: 'red.a3' }),
  gray: css({ color: 'gray.11', bg: 'gray.a3' })
};

const byGap = (a: ComparedItem, b: ComparedItem) =>
  Math.abs(b.globalRank - b.yourRank) - Math.abs(a.globalRank - a.yourRank);

const formatRank = (rank: number) => (Number.isInteger(rank) ? String(rank) : rank.toFixed(1));

function DiffBadge({ item }: { item: ComparedItem }) {
  const { t } = useTranslation();
  const diff = Math.round(item.globalRank - item.yourRank);
  const tone = diff > 0 ? 'green' : diff < 0 ? 'red' : 'gray';
  return (
    <HStack
      className={TONES[tone]}
      data-testid="diff-badge"
      aria-label={
        diff === 0
          ? t('global_ranking.diff_same')
          : t(diff > 0 ? 'global_ranking.diff_higher' : 'global_ranking.diff_lower', {
              count: Math.abs(diff)
            })
      }
      gap="0.5"
      flexShrink={0}
      borderRadius="full"
      py="0.5"
      px="1.5"
      fontSize="xs"
      fontWeight="bold"
      fontVariantNumeric="tabular-nums"
    >
      {diff > 0 ? <FaArrowUp /> : diff < 0 ? <FaArrowDown /> : <FaEquals />}
      {diff !== 0 && Math.abs(diff)}
    </HStack>
  );
}

function ItemLine({
  itemId,
  kind,
  resolve,
  rank,
  highlight,
  children
}: {
  itemId: string;
  kind: RankingKind;
  resolve: ReturnType<typeof useRankingItems>;
  rank?: number;
  highlight?: boolean;
  children?: React.ReactNode;
}) {
  const item = resolve(itemId);
  return (
    <HStack
      data-shared={highlight || undefined}
      gap="2"
      borderRadius="l1"
      minW="0"
      py="0.5"
      px="1"
      bg={highlight ? 'bg.subtle' : undefined}
    >
      {rank !== undefined && (
        <Text
          flexShrink={0}
          w="5"
          color="fg.muted"
          fontSize="xs"
          fontWeight="bold"
          fontVariantNumeric="tabular-nums"
        >
          {rank}
        </Text>
      )}
      <ItemThumbnail item={item} size="8" />
      <Text
        style={kind === 'song' && item.color ? { color: item.color } : undefined}
        flex="1"
        minW="0"
        fontSize="sm"
        fontWeight={highlight ? 'bold' : 'medium'}
        truncate
      >
        {item.name}
      </Text>
      {children}
    </HStack>
  );
}

function AgreementGauge({ value }: { value: number }) {
  const { t } = useTranslation();
  return (
    <Stack data-testid="agreement-gauge" gap="1" w="full">
      <Box position="relative" borderRadius="full" h="2.5" bg="bg.muted">
        <Box
          style={{ width: `${value * 100}%` }}
          borderRadius="full"
          h="full"
          bgGradient="to-r"
          gradientFrom="red.9"
          gradientVia="amber.9"
          gradientTo="green.9"
        />
        <Box
          style={{ left: `${value * 100}%` }}
          position="absolute"
          top="-1"
          transform="translateX(-50%)"
          borderColor="bg.default"
          borderRadius="full"
          borderWidth="2px"
          w="4.5"
          h="4.5"
          bg="fg.default"
        />
      </Box>
      <Box position="relative" h="4" color="fg.muted" fontSize="2xs">
        {GAUGE_ANCHORS.map(({ at, key }) => (
          <Text
            key={key}
            style={{
              left: `${at * 100}%`,
              transform: at === 0 ? 'none' : at === 1 ? 'translateX(-100%)' : 'translateX(-50%)'
            }}
            position="absolute"
            whiteSpace="nowrap"
          >
            {Math.round(at * 100)}% {t(`global_ranking.${key}`)}
          </Text>
        ))}
      </Box>
    </Stack>
  );
}

function DifferenceList({
  title,
  items,
  kind,
  resolve
}: {
  title: string;
  items: ComparedItem[];
  kind: RankingKind;
  resolve: ReturnType<typeof useRankingItems>;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  if (items.length === 0) return null;
  const shown = expanded ? items : items.slice(0, PREVIEW_COUNT);
  return (
    <Stack gap="1" w="full" textAlign="start">
      <Text fontSize="sm" fontWeight="bold">
        {title}
      </Text>
      {shown.map((item) => (
        <ItemLine key={item.itemId} itemId={item.itemId} kind={kind} resolve={resolve}>
          <Text flexShrink={0} color="fg.muted" fontSize="xs" fontVariantNumeric="tabular-nums">
            {t('global_ranking.rank_comparison', {
              yours: formatRank(item.yourRank),
              global: formatRank(item.globalRank)
            })}
          </Text>
          <DiffBadge item={item} />
        </ItemLine>
      ))}
      {items.length > PREVIEW_COUNT && (
        <Button
          size="xs"
          variant="ghost"
          onClick={() => setExpanded((e) => !e)}
          alignSelf="flex-start"
        >
          {expanded
            ? t('global_ranking.show_less')
            : t('global_ranking.show_all', { count: items.length })}
        </Button>
      )}
    </Stack>
  );
}

export function AgreementPanel({
  kind,
  mode,
  ranking,
  submissionId
}: {
  kind: RankingKind;
  mode: RankingMode;
  ranking: string[][];
  submissionId?: string;
}) {
  const { t } = useTranslation();
  const resolve = useRankingItems(kind, mode);
  const [result, setResult] = useState<AgreementResponse>();
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  const compare = async () => {
    setStatus('loading');
    const res = await fetchAgreement(
      kind,
      mode,
      ranking.filter((group) => group.length > 0),
      submissionId
    );
    setResult(res);
    setStatus(res ? 'idle' : 'error');
  };

  const items = result?.items ?? [];
  const yourTop = items.toSorted((a, b) => a.yourRank - b.yourRank).slice(0, PREVIEW_COUNT);
  const globalTop = items.toSorted((a, b) => a.globalRank - b.globalRank).slice(0, PREVIEW_COUNT);
  const shared = new Set(
    yourTop.map((i) => i.itemId).filter((id) => globalTop.some((g) => g.itemId === id))
  );
  const higher = items.filter((i) => i.yourRank < i.globalRank).toSorted(byGap);
  const lower = items.filter((i) => i.yourRank > i.globalRank).toSorted(byGap);
  const smallSample = (result?.compared ?? 0) < AGREEMENT_MIN_ITEMS;

  return (
    <Stack data-testid="agreement-panel" gap="2" alignItems="center" w="full">
      {!result ? (
        <>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void compare()}
            disabled={status === 'loading'}
          >
            {status === 'loading' ? t('global_ranking.comparing') : t('global_ranking.compare')}
          </Button>
          {status === 'error' && (
            <Text color="fg.muted" fontSize="sm">
              {t('global_ranking.error')}
            </Text>
          )}
        </>
      ) : result.agreement === null ? (
        <Text color="fg.muted" fontSize="sm">
          {t('global_ranking.agreement_none')}
        </Text>
      ) : (
        <Stack gap="4" w="full" textAlign="center">
          <Stack gap="2" alignItems="center">
            <Text fontSize="4xl" fontWeight="bold" lineHeight="1">
              {Math.round(result.agreement * 100)}%
            </Text>
            <Text>{t('global_ranking.agreement', { count: result.compared })}</Text>
            <Box w="full" maxW="md" px="2">
              <AgreementGauge value={result.agreement} />
            </Box>
            {smallSample ? (
              <Text data-testid="agreement-small-sample" color="fg.muted" fontSize="sm">
                {t('global_ranking.agreement_small_sample', { count: AGREEMENT_MIN_ITEMS })}
              </Text>
            ) : (
              result.percentile !== null && (
                <Text color="fg.muted" fontSize="sm">
                  {t('global_ranking.agreement_percentile', {
                    value: Math.round(result.percentile * 100),
                    count: result.sampleSize
                  })}
                </Text>
              )
            )}
            <Text maxW="prose" color="fg.muted" fontSize="xs">
              {t('global_ranking.agreement_sample_note', {
                count: result.sampleSize,
                mode: t(`global_ranking.mode_${mode}`)
              })}
            </Text>
          </Stack>
          <Grid
            data-testid="agreement-top"
            gap="4"
            gridTemplateColumns={{ base: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }}
            textAlign="start"
          >
            {[
              { title: t('global_ranking.your_top'), list: yourTop, rankOf: 'yourRank' as const },
              {
                title: t('global_ranking.everyone_top'),
                list: globalTop,
                rankOf: 'globalRank' as const
              }
            ].map(({ title, list, rankOf }) => (
              <Stack key={rankOf} gap="1" minW="0">
                <Text fontSize="sm" fontWeight="bold">
                  {title}
                </Text>
                {list.map((item) => (
                  <ItemLine
                    key={item.itemId}
                    itemId={item.itemId}
                    kind={kind}
                    resolve={resolve}
                    rank={Math.round(item[rankOf])}
                    highlight={shared.has(item.itemId)}
                  />
                ))}
              </Stack>
            ))}
          </Grid>
          {shared.size > 0 && (
            <Text color="fg.muted" fontSize="xs">
              {t('global_ranking.shared_top', { count: shared.size })}
            </Text>
          )}
          <Grid
            gap="4"
            gridTemplateColumns={{ base: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }}
            textAlign="start"
          >
            <DifferenceList
              title={t('global_ranking.you_rank_higher')}
              items={higher}
              kind={kind}
              resolve={resolve}
            />
            <DifferenceList
              title={t('global_ranking.you_rank_lower')}
              items={lower}
              kind={kind}
              resolve={resolve}
            />
          </Grid>
        </Stack>
      )}
    </Stack>
  );
}
