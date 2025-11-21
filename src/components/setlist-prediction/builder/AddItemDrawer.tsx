import { useTranslation } from 'react-i18next';
import { Stack, Box, HStack } from 'styled-system/jsx';
import { Button } from '~/components/ui/styled/button';
import { Text } from '~/components/ui/styled/text';
import { Dialog } from '~/components/ui/dialog';
import { SongSearchPanel } from './SongSearchPanel';
import { BiPlus } from 'react-icons/bi';

interface AddItemDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSong: (songId: string, songTitle: string) => void;
  onAddCustomSong: (customName: string) => void;
  onAddQuickItem: (title: string, type: 'mc' | 'other') => void;
}

export function AddItemDrawer({
  isOpen,
  onClose,
  onAddSong,
  onAddCustomSong,
  onAddQuickItem
}: AddItemDrawerProps) {
  const { t } = useTranslation();

  return (
    <Dialog.Root open={isOpen} onOpenChange={(details) => !details.open && onClose()}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Stack gap={4} p={6}>
            <HStack justifyContent="space-between" alignItems="center">
              <Dialog.Title>{t('setlistPrediction.addItem', { defaultValue: 'Add Item' })}</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <Button variant="ghost" size="sm">
                  {t('common.close', { defaultValue: 'Close' })}
                </Button>
              </Dialog.CloseTrigger>
            </HStack>

            <Stack gap={6}>
              {/* Quick Add Section */}
              <Stack gap={2}>
                <Text fontSize="sm" fontWeight="medium">
                  {t('setlistPrediction.quickAdd', { defaultValue: 'Quick Add' })}
                </Text>
                <HStack gap={2} flexWrap="wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onAddQuickItem('MC①', 'mc');
                      onClose();
                    }}
                  >
                    <BiPlus /> MC
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onAddQuickItem('━━ ENCORE ━━', 'other');
                      onClose();
                    }}
                  >
                    <BiPlus /> Encore
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onAddQuickItem('━━ INTERMISSION ━━', 'other');
                      onClose();
                    }}
                  >
                    <BiPlus /> Intermission
                  </Button>
                </HStack>
              </Stack>

              {/* Song Search Section */}
              <Stack gap={2} flex={1}>
                <Text fontSize="sm" fontWeight="medium">
                  {t('setlistPrediction.searchSongs', { defaultValue: 'Search Songs' })}
                </Text>
                <Box flex={1} overflow="auto" minH="300px" maxH="400px">
                  <SongSearchPanel
                    onAddSong={(id, title) => {
                      onAddSong(id, title);
                      onClose();
                    }}
                    onAddCustomSong={(name) => {
                      onAddCustomSong(name);
                      onClose();
                    }}
                  />
                </Box>
              </Stack>
            </Stack>
          </Stack>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
