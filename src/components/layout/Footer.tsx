import { useTranslation } from 'react-i18next';
import { Link } from '../ui/link';
import { Text } from '../ui/text';
import { Version } from '../utils/Version';
import { Stack, Wrap } from 'styled-system/jsx';

export function Footer() {
  const { t } = useTranslation();

  return (
    <Stack gap="1" justifyContent="center" w="full" p="4" textAlign="center" bgColor="bg.muted">
      <Wrap justifyContent="center" w="full">
        <Text>
          {t('footer.created_by')}{' '}
          <Link href="https://ham-san.net/namecard" target="_blank">
            ハムP
          </Link>
        </Text>{' '}
        | <Text>{t('footer.footer_text')}</Text>
      </Wrap>
      <Wrap gap="1" justifyContent="center" alignItems="center" w="full">
        <Text>{t('footer.source_code')}</Text>
        <Link href="https://github.com/hamproductions/the-sorter" target="_blank">
          GitHub
        </Link>
        <Text color="text.muted" fontSize="xs">
          <Version format="version" />
        </Text>
      </Wrap>
    </Stack>
  );
}
