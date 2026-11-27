import { useTranslation } from 'react-i18next';
import { BiX } from 'react-icons/bi';
import { ExportShareTools } from './ExportShareTools';
import { Drawer } from '~/components/ui/drawer';

import { Box, Stack } from 'styled-system/jsx';
import { IconButton } from '~/components/ui/styled/icon-button';
import { Text } from '~/components/ui/styled/text';
import type { SetlistPrediction, Performance } from '~/types/setlist-prediction';
import { isSongItem } from '~/types/setlist-prediction';

export function BuilderActionsPanel({
  prediction,
  performance,
  open,
  onOpenChange
}: {
  prediction: SetlistPrediction;
  performance?: Performance;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();

  return (
    <>
      {/* Right Panel: Actions - Desktop */}
      <Box
        hideBelow="lg"
        borderLeftWidth="1px"
        w="300px"
        p={4}
        bgColor="bg.default"
        overflow="auto"
      >
        <Stack gap={4}>
          <Text fontSize="lg" fontWeight="bold">
            {t('setlistPrediction.actions', { defaultValue: 'Actions' })}
          </Text>

          {/* Stats */}
          <Box borderRadius="md" borderWidth="1px" p={3} bgColor="bg.muted">
            <Stack gap={1}>
              <Text fontSize="sm" fontWeight="medium">
                {t('setlistPrediction.stats', { defaultValue: 'Stats' })}
              </Text>
              <Text fontSize="xs">
                {t('setlistPrediction.totalSongs', {
                  count: prediction.setlist.items.filter(isSongItem).length,
                  defaultValue: `${prediction.setlist.items.filter(isSongItem).length} songs`
                })}
              </Text>
              <Text fontSize="xs">
                {t('setlistPrediction.totalItems', {
                  count: prediction.setlist.items.length,
                  defaultValue: `${prediction.setlist.items.length} total items`
                })}
              </Text>
            </Stack>
          </Box>

          {/* Export/Share */}
          <ExportShareTools prediction={prediction} performance={performance} />

          {/* Help */}
          <Box borderRadius="md" borderWidth="1px" p={3} bgColor="bg.emphasized">
            <Text color="fg.muted" fontSize="xs">
              {t('setlistPrediction.builderHelp', {
                defaultValue:
                  'Drag songs from the left panel to build your prediction. Reorder by dragging items in the center panel.'
              })}
            </Text>
          </Box>
        </Stack>
      </Box>

      {/* Right Panel: Actions - Mobile Drawer */}
      <Drawer.Root open={open} onOpenChange={(details) => onOpenChange(details.open)}>
        <Drawer.Backdrop hideFrom="lg" />
        <Drawer.Positioner hideFrom="lg">
          <Drawer.Content>
            <Drawer.Header>
              <Drawer.Title>
                {t('setlistPrediction.actions', { defaultValue: 'Actions' })}
              </Drawer.Title>
              <Drawer.CloseTrigger asChild position="absolute" top="3" right="3">
                <IconButton variant="ghost" aria-label={t('dialog.close')}>
                  <BiX size={24} />
                </IconButton>
              </Drawer.CloseTrigger>
            </Drawer.Header>
            <Drawer.Body>
              <Stack gap={4}>
                {/* Stats */}
                <Box borderRadius="md" borderWidth="1px" p={3} bgColor="bg.muted">
                  <Stack gap={1}>
                    <Text fontSize="sm" fontWeight="medium">
                      {t('setlistPrediction.stats', { defaultValue: 'Stats' })}
                    </Text>
                    <Text fontSize="xs">
                      {t('setlistPrediction.totalSongs', {
                        count: prediction.setlist.items.filter(isSongItem).length,
                        defaultValue: `${prediction.setlist.items.filter(isSongItem).length} songs`
                      })}
                    </Text>
                    <Text fontSize="xs">
                      {t('setlistPrediction.totalItems', {
                        count: prediction.setlist.items.length,
                        defaultValue: `${prediction.setlist.items.length} total items`
                      })}
                    </Text>
                  </Stack>
                </Box>

                {/* Export/Share */}
                <ExportShareTools prediction={prediction} performance={performance} />

                {/* Help */}
                <Box borderRadius="md" borderWidth="1px" p={3} bgColor="bg.emphasized">
                  <Text color="fg.muted" fontSize="xs">
                    {t('setlistPrediction.builderHelp', {
                      defaultValue:
                        'Drag songs from the left panel to build your prediction. Reorder by dragging items in the center panel.'
                    })}
                  </Text>
                </Box>
              </Stack>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Drawer.Root>
    </>
  );
}
