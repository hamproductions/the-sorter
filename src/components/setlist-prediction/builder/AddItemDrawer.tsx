import { useTranslation } from 'react-i18next';
import { BiPlus, BiX } from 'react-icons/bi';
import { SongSearchPanel } from './SongSearchPanel';
import { Stack, Box, HStack } from 'styled-system/jsx';
import { Button } from '~/components/ui/styled/button';
import { Text } from '~/components/ui/styled/text';
import { Drawer } from '~/components/ui/drawer';

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
    <Drawer.Root open={isOpen} onOpenChange={(details) => !details.open && onClose()}>
      <Drawer.Backdrop />
      <Drawer.Positioner>
        <Drawer.Content>
          <Stack gap={4} h="full">
            <HStack
              justifyContent="space-between"
              alignItems="center"
              borderBottomWidth="1px"
              p={4}
            >
              <Drawer.Title>
                {t('setlistPrediction.addItem', { defaultValue: 'Add Item' })}
              </Drawer.Title>
              <Drawer.CloseTrigger asChild>
                <Button variant="ghost" size="sm">
                  <BiX size={20} />
                </Button>
              </Drawer.CloseTrigger>
            </HStack>

            <Stack flex={1} gap={6} p={4} overflow="auto">
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
              <Stack flex={1} gap={2}>
                <Text fontSize="sm" fontWeight="medium">
                  {t('setlistPrediction.searchSongs', { defaultValue: 'Search Songs' })}
                </Text>
                <Box flex={1} overflow="auto">
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
        </Drawer.Content>
      </Drawer.Positioner>
    </Drawer.Root>
  );
}
