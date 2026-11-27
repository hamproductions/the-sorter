import { useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCheck, FaChevronDown, FaImage, FaSliders } from 'react-icons/fa6';
import { Box } from 'styled-system/jsx';
import { ExportMenu, ExportMenuGroup, ExportMenuItem, ExportMenuItemBody } from './ExportMenu';
import type { ActionItem } from './ExportMenu';
import { ExportSettingsDialog } from './ExportSettings';
import { Button } from '~/components/ui/button';
import { Menu } from '~/components/ui/menu';
import { Spinner } from '~/components/ui/spinner';
import { useAbbreviations } from '~/hooks/useAbbreviations';

export interface ImageMenuProps {
  actions: ActionItem[];
  busy: boolean;
  busyLabel?: string;
  nicknameLabel: string;
  nicknameHint?: string;
  settings?: ReactNode;
}

export function ImageMenu({
  actions,
  busy,
  busyLabel,
  nicknameLabel,
  nicknameHint,
  settings
}: ImageMenuProps) {
  const { t } = useTranslation();
  const { enabled, setEnabled } = useAbbreviations();
  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const label = (busy && busyLabel) || t(enabled ? 'results.image_abbreviated' : 'results.image');

  return (
    <>
      <ExportMenu
        open={open && !busy}
        onOpenChange={(details) => setOpen(details.open && !busy)}
        trigger={
          <Button
            ref={triggerRef}
            variant="subtle"
            aria-busy={busy}
            aria-disabled={busy}
            cursor={busy ? 'not-allowed' : 'pointer'}
            w="full"
            h={{ base: '11', sm: '10' }}
            opacity={busy ? 0.6 : 1}
          >
            {busy ? <Spinner size="sm" /> : <FaImage />}
            {label}
            <FaChevronDown />
          </Button>
        }
      >
        <ExportMenuGroup label={t('results.image')}>
          {actions.map((action) => (
            <ExportMenuItem
              key={action.id}
              value={action.id}
              onClick={action.onSelect}
              icon={action.icon}
              label={action.label}
            />
          ))}
        </ExportMenuGroup>
        <Menu.Separator />
        <Menu.CheckboxItem
          value="nickname"
          checked={enabled}
          onCheckedChange={setEnabled}
          closeOnSelect={false}
          cursor="pointer"
          gap="2.5"
          alignItems="flex-start"
          h="auto"
          minH={{ base: '12', sm: '10' }}
          py="2.5"
          _highlighted={{ bg: 'bg.emphasized' }}
        >
          <ExportMenuItemBody
            icon={
              <Box
                display="grid"
                borderColor="fg.muted"
                borderRadius="xs"
                borderWidth="1px"
                w="4"
                h="4"
                placeItems="center"
                css={{ '& svg': { w: '2.5', h: '2.5' } }}
              >
                {enabled && <FaCheck />}
              </Box>
            }
            label={nicknameLabel}
            description={nicknameHint}
          />
        </Menu.CheckboxItem>
        {settings && (
          <ExportMenuItem
            value="settings"
            onClick={() => setShowSettings(true)}
            icon={<FaSliders />}
            label={t('results.export_settings')}
          />
        )}
      </ExportMenu>
      {settings && (
        <ExportSettingsDialog
          open={showSettings}
          onOpenChange={setShowSettings}
          finalFocusEl={() => triggerRef.current}
        >
          {settings}
        </ExportSettingsDialog>
      )}
    </>
  );
}
