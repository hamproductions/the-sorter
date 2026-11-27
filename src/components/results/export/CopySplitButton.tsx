import { Fragment, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCheck, FaChevronDown, FaCopy } from 'react-icons/fa6';
import { Box, Grid, HStack } from 'styled-system/jsx';
import { ExportMenu, ExportMenuGroup, ExportMenuItem } from './ExportMenu';
import { Button } from '~/components/ui/button';
import { IconButton } from '~/components/ui/icon-button';
import { Menu } from '~/components/ui/menu';
import type { CopyGroup, CopyOption } from './copy-options';

function Preview({ getText }: { getText: () => string }) {
  return getText()
    .split('\n')
    .filter(Boolean)
    .slice(0, 2)
    .map((line, index) => (
      <Box as="span" key={index} lineClamp="2">
        {line}
      </Box>
    ));
}

export function CopySplitButton({ groups }: { groups: CopyGroup[] }) {
  const { t } = useTranslation();
  const [copiedAt, setCopiedAt] = useState<number>();
  const [primary] = groups[0].options;

  useEffect(() => {
    if (!copiedAt) return;
    const timeout = setTimeout(() => setCopiedAt(undefined), 2000);
    return () => clearTimeout(timeout);
  }, [copiedAt]);

  const copy = async (option: CopyOption) => {
    if (await option.onCopy()) setCopiedAt(Date.now());
  };

  return (
    <HStack gap="0" w="full">
      <Button
        onClick={() => void copy(primary)}
        flex="1"
        borderEndRadius="0"
        minW="40"
        h="auto"
        minH={{ base: '11', sm: '10' }}
        py="1"
        whiteSpace="normal"
      >
        <Grid justifyItems="center">
          <HStack visibility={copiedAt ? 'hidden' : undefined} gridArea="1 / 1">
            <FaCopy /> {primary.label}
          </HStack>
          <HStack visibility={copiedAt ? undefined : 'hidden'} gridArea="1 / 1">
            <FaCheck /> {t('results.copied')}
          </HStack>
        </Grid>
      </Button>
      <ExportMenu
        placement="bottom-end"
        trigger={
          <IconButton
            aria-label={t('results.copy_choices')}
            alignSelf="stretch"
            borderStartWidth="1px"
            borderStartColor="white.a8"
            borderStartRadius="0"
            w={{ base: '14', sm: '11' }}
            h="auto"
          >
            <FaChevronDown />
          </IconButton>
        }
      >
        {groups.map((group, index) => (
          <Fragment key={group.id}>
            {index > 0 && <Menu.Separator />}
            <ExportMenuGroup label={group.label}>
              {group.options.map((option) => (
                <ExportMenuItem
                  key={option.id}
                  value={option.id}
                  onClick={() => void copy(option)}
                  icon={<FaCopy />}
                  label={option.label}
                  description={<Preview getText={option.getPreview} />}
                />
              ))}
            </ExportMenuGroup>
          </Fragment>
        ))}
      </ExportMenu>
    </HStack>
  );
}
