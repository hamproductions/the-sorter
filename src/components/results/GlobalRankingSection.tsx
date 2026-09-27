import { useTranslation } from 'react-i18next';
import { FaEarthAsia } from 'react-icons/fa6';
import { AgreementPanel } from '../leaderboard/AgreementPanel';
import { Heading } from '../ui/heading';
import { GlobalRankingToggle } from './GlobalRankingToggle';
import type { useGlobalRankingSubmission } from '~/hooks/useGlobalRankingSubmission';
import { HStack, Stack } from 'styled-system/jsx';

export function GlobalRankingSection({
  globalRanking,
  ranking
}: {
  globalRanking: ReturnType<typeof useGlobalRankingSubmission>;
  ranking: string[][];
}) {
  const { t } = useTranslation();
  if (!globalRanking.isEnabled) return null;
  return (
    <Stack
      data-testid="global-ranking-section"
      gap="4"
      alignItems="center"
      borderColor="border.default"
      borderRadius="l3"
      borderWidth="1px"
      w="full"
      maxW="3xl"
      p={{ base: '4', md: '6' }}
    >
      <HStack gap="2">
        <FaEarthAsia />
        <Heading as="h2" fontSize="lg">
          {t('global_ranking.title')}
        </Heading>
      </HStack>
      {globalRanking.isAvailable && (
        <GlobalRankingToggle
          contribute={globalRanking.contribute}
          setContribute={globalRanking.setContribute}
          status={globalRanking.status}
          onRetry={globalRanking.retry}
          canRetry={globalRanking.canRetry}
        />
      )}
      <AgreementPanel
        kind={globalRanking.sortContext.kind}
        mode={globalRanking.sortContext.mode}
        ranking={ranking}
        submissionId={globalRanking.submissionId}
      />
    </Stack>
  );
}
