import { Suspense, lazy, useEffect, useState } from 'react';
import { preload } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { FaShare } from 'react-icons/fa6';
import { isEqual } from 'lodash-es';
import { Button } from '../../components/ui/styled/button';
import { Kbd } from '../../components/ui/styled/kbd';
import { Progress } from '../../components/ui/progress';
import { Switch } from '../../components/ui/switch';
import { Text } from '../../components/ui/styled/text';
import { useToaster } from '../../context/ToasterContext';
import { getCurrentItem } from '../../utils/sort';
import { getNextItems } from '~/utils/preloading';
import { LoadingCharacterFilters } from '~/components/sorter/LoadingCharacterFilters';
import { Metadata } from '~/components/layout/Metadata';
import { Box, HStack, Stack, Wrap } from 'styled-system/jsx';
import { SongCard } from '~/components/sorter/SongCard';
import { useSongsSortData } from '~/hooks/useSongsSortData';
import { SongResultsView } from '~/components/results/songs/SongResultsView';
import { useSongData } from '~/hooks/useSongData';
import { useArtistsData } from '~/hooks/useArtistsData';
import { isValidSongFilter } from '~/utils/song-filter';
import { addSongPresetParams } from '~/utils/share';
import { getSongName } from '~/utils/names';
import type { Song } from '~/types/songs';

const ConfirmMidSortDialog = lazy(() =>
  import('../../components/dialog/ConfirmDialog').then((m) => ({
    default: m.ConfirmMidSortDialog
  }))
);

const ConfirmEndedDialog = lazy(() =>
  import('../../components/dialog/ConfirmDialog').then((m) => ({
    default: m.ConfirmEndedDialog
  }))
);

const ConfirmNewSessionDialog = lazy(() =>
  import('../../components/dialog/ConfirmDialog').then((m) => ({
    default: m.ConfirmNewSessionDialog
  }))
);

const SongFilters = lazy(() =>
  import('../../components/sorter/SongFilters').then((m) => ({
    default: m.SongFilters
  }))
);

const SortingPreviewDialog = lazy(() =>
  import('../../components/sorter/SortingPreviewDialog').then((m) => ({
    default: m.SortingPreviewDialog
  }))
);

export function Page() {
  const songs = useSongData();
  const artists = useArtistsData();
  const { toast } = useToaster();
  const { t, i18n: _i18n } = useTranslation();
  const {
    noTieMode,
    setNoTieMode,
    init,
    left,
    right,
    state,
    count,
    tie,
    undo,
    progress,
    songFilters,
    setSongFilters,
    listToSort,
    listCount,
    clear,
    isEnded
  } = useSongsSortData();
  const [showConfirmDialog, setShowConfirmDialog] = useState<{
    type: 'mid-sort' | 'ended' | 'preview' | 'new-session';
    action: 'reset' | 'clear';
  }>();

  useEffect(() => {
    if (state && state.status !== 'end') {
      const params = new URLSearchParams(location.search);
      const hasFilterParams =
        params.has('series') ||
        params.has('artists') ||
        params.has('types') ||
        params.has('characters') ||
        params.has('discographies');

      if (hasFilterParams) {
        const newFilters = {
          series: params.getAll('series'),
          artists: params.getAll('artists'),
          types: params.getAll('types') as ('group' | 'solo' | 'unit')[],
          characters: params.getAll('characters').map(Number),
          discographies: params.getAll('discographies').map(Number),
          years: params.getAll('years').map(Number)
        };

        // Only show dialog if the filters are actually different
        // And if we haven't already shown the dialog (to prevent infinite loop)
        const isDialogAlreadyShown =
          showConfirmDialog?.type === 'new-session' && showConfirmDialog?.action === 'reset';

        if (!isEqual(newFilters, songFilters) && !isDialogAlreadyShown) {
          setShowConfirmDialog({
            type: 'new-session',
            action: 'reset'
          });
        }
      }
    }
  }, [songFilters, state, showConfirmDialog]);

  const { left: leftItem, right: rightItem } =
    (state && getCurrentItem(state)) || ({} as { left: string[]; right: string[] });

  const currentLeft = leftItem && listToSort.find((l) => l.id === leftItem[0]);
  const artistLeft =
    currentLeft?.artists
      .map((i) => artists.find((a) => a.id === i.id))
      .filter((i) => i !== undefined) ?? [];
  const currentRight = rightItem && listToSort.find((l) => l.id === rightItem[0]);
  const artistRight =
    currentRight?.artists
      .map((i) => artists.find((a) => a.id === i.id))
      .filter((i) => i !== undefined) ?? [];

  // const titlePrefix = getFilterTitle(filters, data, i18n.language) ?? t('defaultTitlePrefix');
  const title = t('title', {
    titlePrefix: t('songs')
  });

  const shareUrl = async () => {
    if (!songFilters || !isValidSongFilter(songFilters)) return;
    const params = addSongPresetParams(new URLSearchParams(), songFilters);
    const url = `${location.origin}${location.pathname}?${params.toString()}`;
    try {
      await navigator.clipboard.writeText(url);
      toast?.({ description: t('toast.url_copied') });
    } catch {}
  };

  // Preload Assets
  useEffect(() => {
    if (!state) return;
    const nextItems = getNextItems(state);
    for (const item of nextItems) {
      const song = listToSort.find((l) => l.id === item);
      const url =
        song &&
        `https://www.youtube-nocookie.com/embed/${song.musicVideo?.videoId}/?start=${song.musicVideo?.videoOffset}&html5=1`;
      if (url) preload(url, { as: 'document' });
    }
  }, [state, listToSort]);

  const isSorting = !!state;

  const handleStart = () => {
    if (isSorting) {
      setShowConfirmDialog({
        type: state.status === 'end' ? 'ended' : 'mid-sort',
        action: 'reset'
      });
    } else {
      init();
    }
  };

  const handleClear = () => {
    if (isSorting) {
      setShowConfirmDialog({
        type: state.status === 'end' ? 'ended' : 'mid-sort',
        action: 'clear'
      });
    } else {
      clear();
    }
  };

  return (
    <>
      <Metadata title={title} helmet />
      <Stack alignItems="center" w="full">
        <Text fontSize="3xl" fontWeight="bold" textAlign="center">
          {title}
        </Text>
        <Text textAlign="center">{t('description')}</Text>
        {!isSorting && (
          <>
            <Suspense fallback={<LoadingCharacterFilters />}>
              {import.meta.env.SSR ? (
                <LoadingCharacterFilters />
              ) : (
                <SongFilters filters={songFilters} setFilters={setSongFilters} />
              )}
            </Suspense>
            <Wrap>
              <Switch
                checked={noTieMode}
                disabled={isSorting}
                onCheckedChange={(e) => setNoTieMode(e.checked)}
              >
                {t('settings.no_tie_mode')}
              </Switch>
            </Wrap>
          </>
        )}
        <Wrap justifyContent="center" alignItems="center">
          <Text fontSize="sm" fontWeight="bold">
            {t('settings.song_sort_count', { count: listCount })}
          </Text>
          <Button
            size="sm"
            variant="outline"
            disabled={listCount === 0}
            onClick={() => setShowConfirmDialog({ type: 'preview', action: 'reset' })}
          >
            {t('sort.preview')}
          </Button>
        </Wrap>
        <Wrap justifyContent="center">
          <Button onClick={() => void shareUrl()} variant="subtle">
            <FaShare /> {t('settings.share')}
          </Button>
          <Button variant="solid" onClick={() => handleStart()}>
            {!isSorting ? t('sort.start') : t('sort.start_over')}
          </Button>
          {isSorting && (
            <Button variant="subtle" onClick={() => handleClear()}>
              {state?.status !== 'end' ? t('sort.stop') : t('sort.new_settings')}
            </Button>
          )}
        </Wrap>
        {state && (
          <Stack alignItems="center" w="full">
            {state.status !== 'end' && (
              <Stack w="full" h={{ base: '100vh', md: 'auto' }} p="4">
                <Stack flex="1" alignItems="center" w="full">
                  {currentLeft && currentRight && (
                    <HStack
                      flex={1}
                      flexDirection={{ base: 'column', sm: 'row' }}
                      justifyContent="stretch"
                      alignItems="stretch"
                      width="full"
                    >
                      <Stack flex="1" alignItems="center" w="full">
                        <SongCard
                          onClick={() => left()}
                          song={currentLeft}
                          artists={artistLeft}
                          flex={1}
                        />
                        <Box hideBelow="sm">
                          <Kbd>←</Kbd>
                        </Box>
                      </Stack>
                      <Stack flex="1" alignItems="center" w="full">
                        <SongCard
                          onClick={() => right()}
                          song={currentRight}
                          artists={artistRight}
                          flex={1}
                        />
                        <Box hideBelow="sm">
                          <Kbd>→</Kbd>
                        </Box>
                      </Stack>
                    </HStack>
                  )}
                  <HStack justifyContent="center" w="full">
                    <Button
                      size={{ base: '2xl', md: 'lg' }}
                      onClick={() => tie()}
                      disabled={noTieMode}
                      flex={{ base: 1, md: 'unset' }}
                    >
                      {t('sort.tie')}
                    </Button>
                    <Button
                      size={{ base: '2xl', md: 'lg' }}
                      variant="subtle"
                      onClick={() => undo()}
                      flex={{ base: 1, md: 'unset' }}
                    >
                      {t('sort.undo')}
                    </Button>
                  </HStack>
                  <Stack hideBelow="sm" gap="1">
                    <Text fontWeight="bold">{t('sort.keyboard_shortcuts')}</Text>
                    <Wrap>
                      <Text>
                        <Kbd>←</Kbd>: {t('sort.pick_left')}
                      </Text>
                      <Text>
                        <Kbd>→</Kbd>: {t('sort.pick_right')}
                      </Text>
                      <Text
                        data-disabled={noTieMode === true || undefined}
                        textDecoration={{ _disabled: 'line-through' }}
                      >
                        <Kbd>↓</Kbd>: {t('sort.tie')}
                      </Text>
                      <Text>
                        <Kbd>↑</Kbd>: {t('sort.undo')}
                      </Text>
                    </Wrap>
                  </Stack>
                </Stack>
                <Text>{t('sort.comparison_no', { count })}</Text>
                <Progress
                  translations={{ value: (details) => `${details.percent}%` }}
                  value={progress}
                  min={0}
                  max={1}
                  defaultValue={0}
                />
              </Stack>
            )}
            {state.arr && isEnded && (
              <Suspense>
                <SongResultsView songsData={songs} w="full" order={state.arr} />
              </Suspense>
            )}
          </Stack>
        )}
      </Stack>
      <Suspense>
        <ConfirmEndedDialog
          open={showConfirmDialog?.type === 'ended'}
          lazyMount
          unmountOnExit
          onConfirm={() => {
            if (showConfirmDialog?.action === 'clear') {
              clear();
            } else {
              init();
            }
            setShowConfirmDialog(undefined);
          }}
          onOpenChange={({ open }) => {
            if (!open) {
              setShowConfirmDialog(undefined);
            }
          }}
        />
        <ConfirmNewSessionDialog
          open={showConfirmDialog?.type === 'new-session'}
          lazyMount
          unmountOnExit
          onConfirm={() => {
            // User chose to accept the new link (reset current session and use new params)
            clear();
            // We need to parse URL params and set them as filters
            const params = new URLSearchParams(location.search);
            const newFilters = {
              series: params.getAll('series'),
              artists: params.getAll('artists'),
              types: params.getAll('types') as ('group' | 'solo' | 'unit')[],
              characters: params.getAll('characters').map(Number),
              discographies: params.getAll('discographies').map(Number),
              years: params.getAll('years').map(Number)
            };
            setSongFilters(newFilters);
            setShowConfirmDialog(undefined);
          }}
          onOpenChange={({ open }) => {
            if (!open) {
              // User dismissed/cancelled (keep current session, remove URL params)
              const url = new URL(window.location.href);
              url.search = '';
              window.history.replaceState({}, '', url.toString());
              setShowConfirmDialog(undefined);
            }
          }}
        />
        <SortingPreviewDialog
          open={showConfirmDialog?.type === 'preview'}
          lazyMount
          unmountOnExit
          items={listToSort}
          getItemName={(item) => getSongName((item as Song).name, (item as Song).englishName)}
          onOpenChange={({ open }) => {
            if (!open) {
              setShowConfirmDialog(undefined);
            }
          }}
        />
        <ConfirmMidSortDialog
          open={showConfirmDialog?.type === 'mid-sort'}
          lazyMount
          unmountOnExit
          onConfirm={() => {
            if (showConfirmDialog?.action === 'clear') {
              clear();
            } else {
              init();
            }
            setShowConfirmDialog(undefined);
          }}
          onOpenChange={({ open }) => {
            if (!open) {
              setShowConfirmDialog(undefined);
            }
          }}
        />
      </Suspense>
    </>
  );
}
