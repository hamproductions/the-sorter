import { useTranslation } from 'react-i18next';
import { Link } from '../ui/link';
import { Text } from '../ui/text';
import { HStack, Stack } from 'styled-system/jsx';

export function Footer() {
  const { t } = useTranslation();

  return (
    <Stack
      zIndex="1"
      gap="1"
      justifyContent="center"
      w="full"
      p="4"
      textAlign="center"
      bgColor="bg.muted"
    >
      <HStack justifyContent="center" w="full">
        <Text>
          {t('footer.created_by')}{' '}
          <Link href="https://ham-san.net/namecard" target="_blank">
            ハムP
          </Link>
        </Text>{' '}
        | <Text>{t('footer.footer_text')}</Text>
      </HStack>
      <HStack justifyContent="center" w="full">
        <Text>{t('footer.source_code')}</Text>
        <Link href="https://github.com/hamproductions/the-sorter" target="_blank">
          GitHub
        </Link>
      </HStack>
    </Stack>
  );
}
