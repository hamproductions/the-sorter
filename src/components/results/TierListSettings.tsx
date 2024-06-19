import { useTranslation } from 'react-i18next';
import { sortBy } from 'lodash-es';
import { FaTimes } from 'react-icons/fa';
import { FaPlus } from 'react-icons/fa6';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Text } from '../ui/text';
import { IconButton } from '../ui/icon-button';
import { Button } from '../ui/button';
import type { TierListSettings as TierListSettingsData } from './TierList';
import { HStack, Stack, Wrap } from 'styled-system/jsx';

export function TierListSettings({
  settings,
  setSettings
}: {
  settings: TierListSettingsData;
  setSettings: (data: TierListSettingsData) => void;
}) {
  const { t } = useTranslation();

  const { tiers, showName, showRank, showInfo } = settings;
  return (
    <Stack textAlign="start">
      <Text>{t('results.settings.tier.settings')}</Text>
      <Stack>
        {sortBy(tiers, 'percentile').map((tier, index) => {
          const key = `${index}`;
          return (
            <HStack key={key}>
              <HStack>
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
                  <FaTimes />
                </IconButton>
              </HStack>
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
      </Stack>
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
        <Checkbox
          checked={showInfo}
          disabled={!showName}
          onCheckedChange={({ checked }) =>
            setSettings({ ...settings, showInfo: checked === true })
          }
        >
          Show Info
        </Checkbox>
      </Wrap>
    </Stack>
  );
}
