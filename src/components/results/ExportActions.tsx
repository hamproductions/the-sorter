import { FaShare } from 'react-icons/fa6';
import { Box, Flex } from 'styled-system/jsx';
import { CopySplitButton } from './export/CopySplitButton';
import type { CopyGroup } from './export/copy-options';
import type { ActionItem } from './export/ExportMenu';
import { ImageMenu, type ImageMenuProps } from './export/ImageMenu';
import { MoreMenu } from './export/MoreMenu';
import { Button } from '~/components/ui/button';
import { useMediaQuery } from '~/hooks/useMediaQuery';

export function ExportActions({
  copy,
  image,
  share,
  more,
  stacked
}: {
  copy: CopyGroup[];
  image: ImageMenuProps;
  share?: { label: string; onClick: () => void; disabled?: boolean; testId?: string };
  more: ActionItem[];
  stacked?: boolean;
}) {
  const isPhone = useMediaQuery('(max-width: 639.98px)');

  const copyControl = (
    <Box key="copy" flex={stacked ? '1 1 100%' : { base: '1 1 calc(100% - 3.25rem)', sm: 'none' }}>
      <CopySplitButton groups={copy} />
    </Box>
  );
  const imageControl = (
    <Box key="image" flex={stacked ? '1 1 100%' : { base: '1 1 0', sm: 'none' }}>
      <ImageMenu {...image} />
    </Box>
  );
  const shareControl = share && (
    <Box key="share" flex={stacked ? '1' : { base: '1 1 0', sm: 'none' }}>
      <Button
        variant="subtle"
        data-testid={share.testId}
        onClick={share.onClick}
        disabled={share.disabled}
        w="full"
        h="auto"
        minH={{ base: '11', sm: '10' }}
        py="1"
        px={{ base: '2', sm: '4' }}
        whiteSpace="normal"
      >
        <FaShare /> {share.label}
      </Button>
    </Box>
  );
  const moreControl = <MoreMenu key="more" items={more} />;

  return (
    <Flex gap="2" justifyContent="center" alignItems="center" w="full" flexWrap="wrap">
      {isPhone && !stacked
        ? [copyControl, moreControl, imageControl, shareControl]
        : [copyControl, imageControl, shareControl, moreControl]}
    </Flex>
  );
}
