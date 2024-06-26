import { max, sortBy } from 'lodash-es';
import { Fragment, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaPlus, FaTrash } from 'react-icons/fa6';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { IconButton } from '../ui/icon-button';
import { Input } from '../ui/input';
import { NumberInput } from '../ui/number-input';
import { Text } from '../ui/text';
import type { TierListSettings as TierListSettingsData } from './TierList';
import { Grid, HStack, Stack, Wrap } from 'styled-system/jsx';

export function TierListSettings({
  settings,
  setSettings,
  count
}: {
  settings: TierListSettingsData;
  setSettings: (data: TierListSettingsData) => void;
  count: number;
}) {
  const { t } = useTranslation();

  const { tiers, showName, showRank, showInfo, tierRanks = [] } = settings;

  useEffect(() => {
    if (max(tierRanks) !== count || tiers.length > tierRanks.length) {
      setSettings({
        ...settings,
        tierRanks: tiers.map((_, idx) => Math.round(((idx + 1) / tiers.length) * count))
      });
    } else if (tierRanks.length > tiers.length) {
      setSettings({
        ...settings,
        tierRanks: [...tierRanks.slice(0, tiers.length - 1), count]
      });
    }
  }, [tiers, count]);
  return (
    <Stack textAlign="start">
      <Text fontSize="lg" fontWeight="bold">
        {t('results.settings.tier.settings')}
      </Text>
      <Text>Experimental Feature, Ideas are welcome.</Text>
      <Grid gridTemplateColumns="1fr minmax(auto, 150px) auto">
        <Text width="full" fontSize="sm" fontWeight="bold">
          {t('results.settings.tier.tier_name')}
        </Text>
        <Text textAlign="center" fontSize="sm" fontWeight="bold">
          {t('results.settings.tier.ranks')}
        </Text>
        <Text></Text>
        {sortBy(tiers, 'percentile').map((tier, index) => {
          const key = `${index}`;
          return (
            <Fragment key={key}>
              <Input
                size="sm"
                value={tier}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    tiers: settings.tiers.map((t, idx) => (index === idx ? e.target.value : t))
                  })
                }
              />
              <HStack gap="1" flexDirection={{ base: 'column', md: 'row' }} w="full">
                <NumberInput
                  disabled={index === 0}
                  value={(tierRanks[index - 1] ?? 0)?.toString()}
                  min={(tierRanks[index - 2] ?? 0) + 1}
                  max={tierRanks[index] - 1}
                  onValueChange={(e) =>
                    setSettings({
                      ...settings,
                      tierRanks: tierRanks.map((r, idx) =>
                        idx === index - 1 ? Number(e.value) : r
                      )
                    })
                  }
                ></NumberInput>
                <Text>-</Text>
                <NumberInput
                  disabled={index === tierRanks.length - 1}
                  min={(tierRanks[index - 1] ?? 0) + 1}
                  value={tierRanks[index]?.toString()}
                  max={(tierRanks[index + 1] ?? count + 1) - 1}
                  onValueChange={(e) =>
                    setSettings({
                      ...settings,
                      tierRanks: tierRanks.map((r, idx) => (idx === index ? Number(e.value) : r))
                    })
                  }
                ></NumberInput>
              </HStack>
              <IconButton
                aria-label={t('results.settings.tier.delete_tier')}
                variant="subtle"
                disabled={tiers.length === 1}
                onClick={() =>
                  setSettings({
                    ...settings,
                    tiers: settings.tiers.filter((_, idx) => index !== idx)
                  })
                }
              >
                <FaTrash />
              </IconButton>
            </Fragment>
          );
        })}
        <Button
          variant="solid"
          disabled={count === tiers.length}
          onClick={() =>
            setSettings({
              ...settings,
              tiers: [...settings.tiers, 'New Tier']
            })
          }
          size="sm"
          w="fit-content"
        >
          <FaPlus /> {t('results.settings.tier.new_tier')}
        </Button>
      </Grid>
      <Wrap>
        <Checkbox
          size="sm"
          checked={showRank}
          onCheckedChange={({ checked }) =>
            setSettings({ ...settings, showRank: checked === true })
          }
        >
          {t('results.settings.tier.show_rank')}
        </Checkbox>
        <Checkbox
          size="sm"
          checked={showName}
          onCheckedChange={({ checked }) =>
            setSettings({ ...settings, showName: checked === true })
          }
        >
          {t('results.settings.tier.show_name')}
        </Checkbox>
        {showName && (
          <Checkbox
            size="sm"
            checked={showInfo}
            disabled={!showName}
            onCheckedChange={({ checked }) =>
              setSettings({ ...settings, showInfo: checked === true })
            }
          >
            {t('results.settings.tier.show_info')}
          </Checkbox>
        )}
      </Wrap>
    </Stack>
  );
}
