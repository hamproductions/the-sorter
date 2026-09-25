import { join } from 'path-browserify';
import { useTranslation } from 'react-i18next';
import { Link } from '../ui/link';
import { Switch } from '../ui/switch';
import { Text } from '../ui/text';
import { Stack } from 'styled-system/jsx';

export function GlobalRankingToggle({
  contribute,
  setContribute
}: {
  contribute: boolean;
  setContribute: (value: boolean) => void;
}) {
  const { t } = useTranslation();
  return (
    <Stack gap="1" alignItems="center" textAlign="center">
      <Switch
        checked={contribute}
        onCheckedChange={(e) => setContribute(e.checked)}
        data-testid="global-ranking-toggle"
      >
        {t('global_ranking.contribute')}
      </Switch>
      <Text color="fg.muted" fontSize="xs">
        {t('global_ranking.contribute_notice')}{' '}
        <Link href={join(import.meta.env.BASE_URL, '/leaderboard')}>
          {t('global_ranking.view_leaderboard')}
        </Link>
      </Text>
    </Stack>
  );
}
