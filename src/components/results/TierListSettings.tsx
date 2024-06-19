import { max, sortBy } from 'lodash-es';
import { useEffect } from 'react';
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
    if (tiers.length !== tierRanks.length || max(tierRanks) !== count) {
      setSettings({
        ...settings,
        tierRanks: tiers.map((_, idx) => Math.round(((idx + 1) / tiers.length) * count))
      });
    }
  }, [tiers, count]);
  return (
    <Stack textAlign="start">
      <Text>{t('results.settings.tier.settings')}</Text>
      <Grid gridTemplateColumns="1fr ">
        {sortBy(tiers, 'percentile').map((tier, index) => {
          const key = `${index}`;

          return (
            <HStack key={key}>
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
              <NumberInput
                disabled={index === 0}
                value={(tierRanks[index - 1] ?? 0)?.toString()}
                min={(tierRanks[index - 2] ?? 0) + 1}
                max={tierRanks[index] - 1}
                onValueChange={(e) =>
                  setSettings({
                    ...settings,
                    tierRanks: tierRanks.map((r, idx) => (idx === index - 1 ? Number(e.value) : r))
                  })
                }
              ></NumberInput>
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
            </HStack>
          );
        })}
        <Button
          variant="solid"
          onClick={() =>
            setSettings({
              ...settings,
              tiers: [...settings.tiers, 'New Tier']
            })
          }
          w="fit-content"
        >
          <FaPlus /> {t('results.settings.tier.new_tier')}
        </Button>
      </Grid>
      <Wrap>
        <Checkbox
          checked={showRank}
          onCheckedChange={({ checked }) =>
            setSettings({ ...settings, showRank: checked === true })
          }
        >
          Show Rank
        </Checkbox>
        <Checkbox
          checked={showName}
          onCheckedChange={({ checked }) =>
            setSettings({ ...settings, showName: checked === true })
          }
        >
          Show Name
        </Checkbox>
        {showName && (
          <Checkbox
            checked={showInfo}
            disabled={!showName}
            onCheckedChange={({ checked }) =>
              setSettings({ ...settings, showInfo: checked === true })
            }
          >
            Show Info
          </Checkbox>
        )}
      </Wrap>
    </Stack>
  );
}
