import { useTranslation } from 'react-i18next';
import { FaCircleInfo } from 'react-icons/fa6';
import { HStack } from 'styled-system/jsx';
import { Text, Tooltip } from '~/components/ui';

interface ComparisonInfoProps {
  comparisonsCount: number;
  isEstimatedCount: boolean;
  maxComparisons: number;
}

export const ComparisonInfo = ({
  comparisonsCount,
  isEstimatedCount,
  maxComparisons
}: ComparisonInfoProps) => {
  const { t } = useTranslation();

  return (
    <HStack gap="1" justifyContent="center">
      <Text>
        {t('sort.comparison_no', { count: `${isEstimatedCount ? '~' : ''}${comparisonsCount}` })}
      </Text>
      <Tooltip
        content={
          <>
            ~{comparisonsCount} / {maxComparisons} {t('sort.comparisons')}
            <br />
            {t('sort.estimate_disclaimer')}
          </>
        }
      >
        <FaCircleInfo />
      </Tooltip>
    </HStack>
  );
};
