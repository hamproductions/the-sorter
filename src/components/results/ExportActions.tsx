import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Stack } from 'styled-system/jsx';
import { Switch } from '~/components/ui/switch';
import { useAbbreviations } from '~/hooks/useAbbreviations';

export function ExportActions({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { enabled, setEnabled } = useAbbreviations();

  return (
    <Stack gap="2" alignItems="flex-end" w="full">
      <Switch checked={enabled} onCheckedChange={(e) => setEnabled(e.checked)}>
        {t('settings.use_abbreviations')}
      </Switch>
      <Box
        display={{ base: 'grid', lg: 'flex' }}
        gap="2"
        justifyContent="flex-end"
        gridTemplateColumns={{ base: '1fr', sm: '1fr 1fr' }}
        w="full"
      >
        {children}
      </Box>
    </Stack>
  );
}
