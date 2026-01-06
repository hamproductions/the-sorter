import { useTranslation } from 'react-i18next';
import { FaCircleInfo } from 'react-icons/fa6';
import { HStack } from 'styled-system/jsx';
import { Text } from '~/components/ui/styled/text';
import { Tooltip } from '~/components/ui/tooltip';

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
      <Tooltip.Root>
        <Tooltip.Trigger>
          <FaCircleInfo />
        </Tooltip.Trigger>
        <Tooltip.Positioner>
          <Tooltip.Content>
            ~{comparisonsCount} / {maxComparisons} {t('sort.comparisons')}
            <br />
            {t('sort.estimate_disclaimer')}
          </Tooltip.Content>
        </Tooltip.Positioner>
      </Tooltip.Root>
    </HStack>
  );
};
