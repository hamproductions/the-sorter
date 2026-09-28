import { join } from 'path-browserify';
import { useTranslation } from 'react-i18next';
import { FaCircleCheck, FaCircleExclamation, FaHourglassHalf } from 'react-icons/fa6';
import { Button } from '../ui/button';
import { Link } from '../ui/link';
import { Spinner } from '../ui/spinner';
import { Switch } from '../ui/switch';
import { Text } from '../ui/text';
import type { SubmissionStatus } from '~/types/global-ranking';
import { HStack, Stack } from 'styled-system/jsx';
import { token } from 'styled-system/tokens';

const STATUS_ICONS: Partial<Record<SubmissionStatus, React.ReactNode>> = {
  sending: <Spinner size="xs" />,
  removing: <Spinner size="xs" />,
  accepted: <FaCircleCheck color={token('colors.green.9')} />,
  pending_review: <FaHourglassHalf />,
  duplicate: <FaCircleCheck />,
  failed: <FaCircleExclamation color={token('colors.red.9')} />
};

export function GlobalRankingToggle({
  contribute,
  setContribute,
  status,
  onRetry,
  canRetry
}: {
  contribute: boolean;
  setContribute: (value: boolean) => void;
  status: SubmissionStatus;
  onRetry?: () => void;
  canRetry?: boolean;
}) {
  const { t } = useTranslation();
  const busy = status === 'sending' || status === 'removing';
  return (
    <Stack gap="1.5" alignItems="center" textAlign="center">
      <Switch
        checked={contribute}
        disabled={busy}
        onCheckedChange={(e) => setContribute(e.checked)}
        data-testid="global-ranking-toggle"
      >
        {t('global_ranking.contribute')}
      </Switch>
      <HStack
        data-testid="global-ranking-status"
        data-status={status}
        aria-live="polite"
        gap="1.5"
        minH="6"
        fontSize="sm"
      >
        {STATUS_ICONS[status]}
        <Text>{t(`global_ranking.status_${status}`)}</Text>
        {status === 'failed' && canRetry && onRetry && (
          <Button size="xs" variant="outline" onClick={onRetry}>
            {t('global_ranking.retry')}
          </Button>
        )}
      </HStack>
      <Text maxW="prose" fontSize="sm">
        {t('global_ranking.contribute_notice')}{' '}
        <Link href={join(import.meta.env.BASE_URL, '/leaderboard')}>
          {t('global_ranking.view_leaderboard')}
        </Link>
      </Text>
    </Stack>
  );
}
