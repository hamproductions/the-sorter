import { Suspense, lazy, useEffect, useState } from 'react';
import { preload } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { FaShare } from 'react-icons/fa6';
import { ComparisonInfo } from '../../components/sorter/ComparisonInfo';
import { KeyboardShortcuts } from '../../components/sorter/KeyboardShortcuts';
import { Progress, Button, Kbd, Text, Switch } from '../../components/ui';
import { useToaster } from '../../context/ToasterContext';
import { getCurrentItem } from '../../utils/sort';
import { Box, HStack, Stack, Wrap } from 'styled-system/jsx';
import { Metadata } from '~/components/layout/Metadata';
import { HasuSongResultsView } from '~/components/results/songs/HasuSongResultsView';
import { LoadingCharacterFilters } from '~/components/sorter/LoadingCharacterFilters';
import { useHasuSongData } from '~/hooks/useHasuSongData';
import { useHasuSongsSortData } from '~/hooks/useHasuSongsSortData';
import { getPicUrl } from '~/utils/assets';
import { getNextItems } from '~/utils/preloading';
import { HasuSongCard } from '~/components/sorter/HasuSongCard';
import { isValidSongFilter } from '~/utils/hasu-song-filter';
import type { HasuSongFilterType } from '~/components/sorter/HasuSongFilters';
import { addHasuSongPresetParams } from '~/utils/share';

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

const HasuSongFilters = lazy(() =>
  import('../../components/sorter/HasuSongFilters').then((m) => ({
    default: m.HasuSongFilters
  }))
);

export function Page() {
  const songs = useHasuSongData();
  const { toast } = useToaster();
  const { t, i18n: _i18n } = useTranslation();
  const {
    noTieMode,
    setNoTieMode,
    init,
    left,
    right,
    state,
    comparisonsCount,
    isEstimatedCount,
    maxComparisons,
    tie,
    undo,
    progress,
    songFilters,
    setSongFilters,
    listToSort,
    listCount,
    clear,
    isEnded
  } = useHasuSongsSortData();
  const [showConfirmDialog, setShowConfirmDialog] = useState<{
    type: 'mid-sort' | 'ended' | 'new-session';
    action: 'reset' | 'clear';
  }>();

  useEffect(() => {
    if (state && state.status !== 'end') {
      const params = new URLSearchParams(location.search);
      const hasFilterParams =
        params.has('generations') || params.has('units') || params.has('types');
      if (hasFilterParams) {
        setShowConfirmDialog({
          type: 'new-session',
          action: 'reset'
        });
      }
    }
  }, [state]);

  const { left: leftItem, right: rightItem } =
    (state && getCurrentItem(state)) || ({} as { left: string[]; right: string[] });

  const currentLeft = leftItem && listToSort.find((l) => l.id === leftItem[0]);
  const currentRight = rightItem && listToSort.find((l) => l.id === rightItem[0]);

  // const titlePrefix = getFilterTitle(filters, data, i18n.language) ?? t('defaultTitlePrefix');
  const title = t('title', {
    titlePrefix: t('hasu-songs')
  });

  const shareUrl = async () => {
    if (!songFilters || !isValidSongFilter(songFilters)) return;
    const params = addHasuSongPresetParams(new URLSearchParams(), songFilters);
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
      const url = getPicUrl(`${item}`, 'thumbnail');
      if (url) preload(url, { as: 'image' });
    }
  }, [state]);

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
                <HasuSongFilters filters={songFilters} setFilters={setSongFilters} />
              )}
            </Suspense>
            <Wrap>
              <Switch.Root
                checked={noTieMode}
                disabled={isSorting}
                onCheckedChange={(details) => setNoTieMode(details.checked)}
              >
                <Switch.HiddenInput />
                <Switch.Control />
                <Switch.Label>{t('settings.no_tie_mode')}</Switch.Label>
              </Switch.Root>
            </Wrap>
          </>
        )}
        <Text fontSize="sm" fontWeight="bold">
          {t('settings.song_sort_count', { count: listCount })}
        </Text>
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
                        <HasuSongCard onClick={() => left()} song={currentLeft} flex={1} />
                        <Box hideBelow="sm">
                          <Kbd>←</Kbd>
                        </Box>
                      </Stack>
                      <Stack flex="1" alignItems="center" w="full">
                        <HasuSongCard onClick={() => right()} song={currentRight} flex={1} />
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
                  <KeyboardShortcuts noTieMode={noTieMode} />
                </Stack>
                <ComparisonInfo
                  comparisonsCount={comparisonsCount}
                  isEstimatedCount={isEstimatedCount}
                  maxComparisons={maxComparisons}
                />
                <Progress.Root value={progress} min={0} max={1} defaultValue={0}>
                  <Progress.Track>
                    <Progress.Range />
                  </Progress.Track>
                </Progress.Root>
              </Stack>
            )}
            {state.arr && isEnded && (
              <Suspense>
                <HasuSongResultsView songsData={songs} w="full" order={state.arr} />
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
              generations: params.getAll('generations'),
              units: params.getAll('units'),
              types: params.getAll('types') as HasuSongFilterType['types']
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
