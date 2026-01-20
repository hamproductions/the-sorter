import { useTranslation } from 'react-i18next';
import { Stack, Wrap } from 'styled-system/jsx';
import { Kbd, Text } from '~/components/ui';

interface KeyboardShortcutsProps {
  noTieMode: boolean;
}

export const KeyboardShortcuts = ({ noTieMode }: KeyboardShortcutsProps) => {
  const { t } = useTranslation();

  return (
    <Stack hideBelow="sm" gap="1">
      <Text fontWeight="bold">{t('sort.keyboard_shortcuts')}</Text>
      <Wrap>
        <Text>
          <Kbd>←</Kbd>: {t('sort.pick_left')}
        </Text>
        <Text>
          <Kbd>→</Kbd>: {t('sort.pick_right')}
        </Text>
        <Text
          data-disabled={noTieMode === true || undefined}
          textDecoration={{ _disabled: 'line-through' }}
        >
          <Kbd>↓</Kbd>: {t('sort.tie')}
        </Text>
        <Text>
          <Kbd>↑</Kbd>: {t('sort.undo')}
        </Text>
      </Wrap>
    </Stack>
  );
};
