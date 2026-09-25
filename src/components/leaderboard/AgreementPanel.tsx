import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Text } from '../ui/text';
import { useRankingItems } from './useRankingItems';
import type { AgreementResponse, RankingKind, RankingMode } from '~/types/global-ranking';
import { fetchAgreement } from '~/utils/global-ranking';
import { Box, HStack, Stack } from 'styled-system/jsx';

const formatRank = (rank: number) => (Number.isInteger(rank) ? String(rank) : rank.toFixed(1));

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

  const differences = (result?.items ?? [])
    .map((item) => ({ ...item, gap: Math.abs(item.yourRank - item.globalRank) }))
    .filter((item) => item.gap > 0)
    .toSorted((a, b) => b.gap - a.gap)
    .slice(0, 5);

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
        <Box
          borderColor="border.default"
          borderRadius="l2"
          borderWidth="1px"
          w="full"
          maxW="md"
          p="4"
        >
          <Stack gap="3" alignItems="center" textAlign="center">
            <Text fontSize="4xl" fontWeight="bold" lineHeight="1">
              {Math.round(result.agreement * 100)}%
            </Text>
            <Text>{t('global_ranking.agreement', { count: result.compared })}</Text>
            {result.percentile !== null && (
              <Text color="fg.muted" fontSize="sm">
                {t('global_ranking.agreement_percentile', {
                  value: Math.round(result.percentile * 100),
                  count: result.sampleSize
                })}
              </Text>
            )}
            {differences.length > 0 && (
              <Stack gap="1" w="full" textAlign="start">
                <Text fontSize="sm" fontWeight="bold">
                  {t('global_ranking.biggest_differences')}
                </Text>
                {differences.map((item) => (
                  <HStack key={item.itemId} justifyContent="space-between" fontSize="sm">
                    <Text>{resolve(item.itemId).name}</Text>
                    <Text flexShrink={0} color="fg.muted" fontVariantNumeric="tabular-nums">
                      {t('global_ranking.rank_comparison', {
                        yours: formatRank(item.yourRank),
                        global: formatRank(item.globalRank)
                      })}
                    </Text>
                  </HStack>
                ))}
              </Stack>
            )}
          </Stack>
        </Box>
      )}
    </Stack>
  );
}
