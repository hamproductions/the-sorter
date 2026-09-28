import { useTranslation } from 'react-i18next';
import { FaXmark } from 'react-icons/fa6';
import { ResultsView, type ShareDisplayData } from '../results/ResultsView';
import { HasuSongResultsView } from '../results/songs/HasuSongResultsView';
import { SongResultsView } from '../results/songs/SongResultsView';
import { Dialog } from '~/components/ui/dialog';
import { IconButton } from '~/components/ui/icon-button';
import { useData } from '~/hooks/useData';
import { useHasuSongData } from '~/hooks/useHasuSongData';
import { useSongData } from '~/hooks/useSongData';
import { SavedGlobalRanking } from './SavedGlobalRanking';
import type { FilterType } from '~/components/sorter/CharacterFilters';
import type { SongFilterType } from '~/components/sorter/SongFilters';
import { useToaster } from '~/context/ToasterContext';
import type { SavedSortState } from '~/types/save-state';
import { addPresetParams, addSongPresetParams, serializeData } from '~/utils/share';
import { Stack } from 'styled-system/jsx';

export interface SavedResultsDialogProps extends Dialog.RootProps {
  save?: SavedSortState;
}

export function SavedResultsDialog({ save, ...rest }: SavedResultsDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToaster();
  const characters = useData();
  const songs = useSongData();
  const hasuSongs = useHasuSongData();
  const order = save?.state.arr.filter((group) => group.length > 0) ?? [];
  const isSeiyuu = save?.isSeiyuu ?? save?.log?.context?.mode === 'seiyuu';
  const filter = save?.log?.context?.filter ?? {};

  const copyShareUrl = async (path: string, params: URLSearchParams) => {
    const url = `${location.origin}${import.meta.env.PUBLIC_ENV__BASE_URL ?? ''}${path}?${params.toString()}`;
    try {
      await navigator.clipboard.writeText(url);
      toast?.({ description: t('toast.url_copied') });
    } catch {}
  };

  const shareCharacters = async (shareData: ShareDisplayData) => {
    const params = addPresetParams(new URLSearchParams(), filter as FilterType, isSeiyuu);
    params.append('data', await serializeData({ ...shareData, results: order }));
    await copyShareUrl('/share', params);
  };

  const shareSongs = async () => {
    const params = addSongPresetParams(new URLSearchParams(), filter as SongFilterType);
    params.append('data', await serializeData({ results: order }));
    await copyShareUrl('/songs/share', params);
  };

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
                allowExport
                onShareResults={(data) => void shareCharacters(data)}
                charactersData={characters}
                isSeiyuu={isSeiyuu}
                w="full"
                order={order as string[][]}
              />
            )}
            {save?.sorterType === 'songs' && (
              <SongResultsView
                readOnly
                allowExport
                onShareResults={() => void shareSongs()}
                songsData={songs}
                w="full"
                order={order as string[][]}
              />
            )}
            {save?.sorterType === 'hasu-songs' && (
              <HasuSongResultsView songsData={hasuSongs} w="full" order={order as number[][]} />
            )}
            {save && save.sorterType !== 'hasu-songs' && (
              <SavedGlobalRanking saveId={save.id} ranking={order as string[][]} />
            )}
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
