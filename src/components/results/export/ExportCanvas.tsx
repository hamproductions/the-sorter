import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Stack } from 'styled-system/jsx';
import { Heading } from '~/components/ui/heading';
import { Text } from '~/components/ui/text';

export function ExportCanvas({
  title,
  description,
  timestamp,
  compact,
  children
}: {
  title: string;
  description?: string;
  timestamp: Date;
  compact?: boolean;
  children: ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <Box position="absolute" w="0" h="0" overflow="hidden">
      <Stack
        id="results"
        width={compact ? '480px' : '1280px'}
        p="4"
        textAlign={compact ? 'start' : undefined}
        bgColor="bg.canvas"
      >
        {title && (
          <Heading fontSize="2xl" fontWeight="bold" overflowWrap="anywhere">
            {title}
          </Heading>
        )}
        {description && <Text overflowWrap="anywhere">{description}</Text>}
        <Box w="full" textAlign={compact ? 'start' : 'center'}>
          {children}
        </Box>
        <Text
          color={compact ? 'fg.muted' : undefined}
          fontSize={compact ? 'xs' : undefined}
          textAlign="end"
        >
          {t('results.generated_at')}: {timestamp.toLocaleString()}
        </Text>
      </Stack>
    </Box>
  );
}
