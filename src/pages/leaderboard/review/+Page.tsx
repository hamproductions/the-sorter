import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Metadata } from '~/components/layout/Metadata';
import { useRankingItems } from '~/components/leaderboard/useRankingItems';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Text } from '~/components/ui/text';
import type { ReviewItem } from '~/types/global-ranking';
import { fetchReviews, isGlobalRankingEnabled, resolveReview } from '~/utils/global-ranking';
import { Box, HStack, Stack } from 'styled-system/jsx';

function ReviewCard({
  item,
  onResolve
}: {
  item: ReviewItem;
  onResolve: (action: 'approve' | 'reject') => void;
}) {
  const { t, i18n } = useTranslation();
  const resolve = useRankingItems(item.kind, item.mode);
  return (
    <Box borderColor="border.default" borderRadius="l2" borderWidth="1px" w="full" p="4">
      <Stack gap="2">
        <HStack justifyContent="space-between" flexWrap="wrap">
          <Text fontWeight="bold">
            {t(`global_ranking.kind_${item.kind}`)} / {t(`global_ranking.mode_${item.mode}`)}
          </Text>
          <Text color="fg.muted" fontSize="sm">
            {new Date(item.createdAt).toLocaleString(i18n.language)}
          </Text>
        </HStack>
        <Text fontSize="sm">{t(`global_ranking.reason_${item.reason}`)}</Text>
        <Text color="fg.muted" fontSize="sm">
          {item.ranking
            .slice(0, 10)
            .map((group, idx) => `${idx + 1}. ${group.map((id) => resolve(id).name).join(' = ')}`)
            .join('  ')}
        </Text>
        <HStack justifyContent="flex-end">
          <Button size="sm" variant="outline" onClick={() => onResolve('reject')}>
            {t('global_ranking.reject')}
          </Button>
          <Button size="sm" onClick={() => onResolve('approve')}>
            {t('global_ranking.approve')}
          </Button>
        </HStack>
      </Stack>
    </Box>
  );
}

export function Page() {
  const { t } = useTranslation();
  const [token, setToken] = useState('');
  const [items, setItems] = useState<ReviewItem[]>();
  const [failed, setFailed] = useState(false);

  const load = async () => {
    const res = await fetchReviews(token);
    setFailed(!res);
    setItems(res);
  };

  const handleResolve = async (id: string, action: 'approve' | 'reject') => {
    const res = await resolveReview(token, id, action);
    if (res) setItems((current) => current?.filter((item) => item.id !== id));
    else setFailed(true);
  };

  const title = t('global_ranking.review_title');

  return (
    <>
      <Metadata title={title} helmet />
      <Stack gap="4" alignItems="center" w="full" maxW="2xl" mx="auto">
        <Text fontSize="3xl" fontWeight="bold">
          {title}
        </Text>
        {!isGlobalRankingEnabled ? (
          <Text color="fg.muted">{t('global_ranking.disabled')}</Text>
        ) : (
          <>
            <HStack w="full">
              <Input
                type="password"
                autoComplete="off"
                value={token}
                placeholder={t('global_ranking.review_token')}
                aria-label={t('global_ranking.review_token')}
                onChange={(e) => setToken(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void load();
                }}
              />
              <Button onClick={() => void load()} disabled={!token}>
                {t('global_ranking.review_load')}
              </Button>
            </HStack>
            {failed && <Text color="red">{t('global_ranking.review_failed')}</Text>}
            {items && items.length === 0 && (
              <Text color="fg.muted">{t('global_ranking.review_empty')}</Text>
            )}
            {items?.map((item) => (
              <ReviewCard
                key={item.id}
                item={item}
                onResolve={(action) => void handleResolve(item.id, action)}
              />
            ))}
          </>
        )}
      </Stack>
    </>
  );
}
