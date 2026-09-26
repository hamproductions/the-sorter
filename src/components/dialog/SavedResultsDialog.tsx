import { useTranslation } from 'react-i18next';
import { FaXmark } from 'react-icons/fa6';
import { ResultsView } from '../results/ResultsView';
import { HasuSongResultsView } from '../results/songs/HasuSongResultsView';
import { SongResultsView } from '../results/songs/SongResultsView';
import { Button } from '~/components/ui/button';
import { Dialog } from '~/components/ui/dialog';
import { IconButton } from '~/components/ui/icon-button';
import { useData } from '~/hooks/useData';
import { useHasuSongData } from '~/hooks/useHasuSongData';
import { useSongData } from '~/hooks/useSongData';
import type { SavedSortState } from '~/types/save-state';
import { Stack } from 'styled-system/jsx';

export interface SavedResultsDialogProps extends Dialog.RootProps {
  save?: SavedSortState;
}

export function SavedResultsDialog({ save, ...rest }: SavedResultsDialogProps) {
  const { t } = useTranslation();
  const characters = useData();
  const songs = useSongData();
  const hasuSongs = useHasuSongData();
  const order = save?.state.arr.filter((group) => group.length > 0) ?? [];
  const isSeiyuu = save?.isSeiyuu ?? save?.log?.context?.mode === 'seiyuu';

  return (
    <Dialog.Root {...rest}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content w="full" maxW="5xl" maxH="90vh" overflow="auto">
          <Stack data-testid="saved-results-dialog" gap="4" p="6">
            <Stack gap="1">
              <Dialog.Title>{save?.name}</Dialog.Title>
              <Dialog.Description>
                {t('dialog.saved_states.view_results_description')}
              </Dialog.Description>
            </Stack>
            {save?.sorterType === 'characters' && (
              <ResultsView
                readOnly
                charactersData={characters}
                isSeiyuu={isSeiyuu}
                w="full"
                order={order as string[][]}
              />
            )}
            {save?.sorterType === 'songs' && (
              <SongResultsView readOnly songsData={songs} w="full" order={order as string[][]} />
            )}
            {save?.sorterType === 'hasu-songs' && (
              <HasuSongResultsView songsData={hasuSongs} w="full" order={order as number[][]} />
            )}
            <Dialog.CloseTrigger asChild>
              <Button variant="outline" width="full">
                {t('dialog.close')}
              </Button>
            </Dialog.CloseTrigger>
          </Stack>
          <Dialog.CloseTrigger asChild position="absolute" top="2" right="2">
            <IconButton aria-label="Close Dialog" variant="ghost" size="sm">
              <FaXmark />
            </IconButton>
          </Dialog.CloseTrigger>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
