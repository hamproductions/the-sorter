import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { preload } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { FaShare } from 'react-icons/fa6';
import { isEqual } from 'lodash-es';
import { ComparisonInfo } from '../../components/sorter/ComparisonInfo';
import { KeyboardShortcuts } from '../../components/sorter/KeyboardShortcuts';
import series from '../../../data/series-info.json';
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
import { useHeardleState } from '~/hooks/useHeardleState';
import { SongResultsView } from '~/components/results/songs/SongResultsView';
import { useSongData } from '~/hooks/useSongData';
import { useArtistsData } from '~/hooks/useArtistsData';
import { isValidSongFilter } from '~/utils/song-filter';
import { addSongPresetParams, getAllCommaSeparated } from '~/utils/share';
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
  const { t, i18n } = useTranslation();

  // Heardle state management
  const {
    isSongRevealed,
    getAttemptCount,
    getGuessHistory,
    getAudioDuration,
    makeGuess,
    passGuess,
    autoReveal,
    resetSession,
    failedSongIds,
    maxAttempts
  } = useHeardleState();

  const {
    noTieMode,
    setNoTieMode,
    heardleMode,
    setHeardleMode,
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
  } = useSongsSortData(failedSongIds.size > 0 ? failedSongIds : undefined);
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
        params.has('characters') ||
        params.has('discographies') ||
        params.has('songs');

      if (hasFilterParams) {
        const newFilters = {
          series: getAllCommaSeparated(params, 'series'),
          artists: getAllCommaSeparated(params, 'artists'),
          types: getAllCommaSeparated(params, 'types') as ('group' | 'solo' | 'unit')[],
          characters: getAllCommaSeparated(params, 'characters').map(Number),
          discographies: getAllCommaSeparated(params, 'discographies').map(Number),
          songs: getAllCommaSeparated(params, 'songs').map(Number),
          years: getAllCommaSeparated(params, 'years').map(Number)
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

  // Heardle mode state for current comparison
  const isLeftRevealed = currentLeft ? isSongRevealed(currentLeft.id) : false;
  const isRightRevealed = currentRight ? isSongRevealed(currentRight.id) : false;
  const bothRevealed = !heardleMode || (isLeftRevealed && isRightRevealed);

  // Get failed songs for results display
  const failedSongsForResults = useMemo(() => {
    return songs.filter((s) => failedSongIds.has(s.id));
  }, [songs, failedSongIds]);

  // Heardle handlers for left song
  const handleLeftGuess = useCallback(
    (guessedId: string) => {
      if (currentLeft) {
        makeGuess(currentLeft.id, guessedId);
      }
    },
    [currentLeft, makeGuess]
  );

  const handleLeftPass = useCallback(() => {
    if (currentLeft) {
      passGuess(currentLeft.id);
    }
  }, [currentLeft, passGuess]);

  const handleLeftNoAudio = useCallback(() => {
    if (currentLeft) {
      autoReveal(currentLeft.id);
    }
  }, [currentLeft, autoReveal]);

  // Heardle handlers for right song
  const handleRightGuess = useCallback(
    (guessedId: string) => {
      if (currentRight) {
        makeGuess(currentRight.id, guessedId);
      }
    },
    [currentRight, makeGuess]
  );

  const handleRightPass = useCallback(() => {
    if (currentRight) {
      passGuess(currentRight.id);
    }
  }, [currentRight, passGuess]);

  const handleRightNoAudio = useCallback(() => {
    if (currentRight) {
      autoReveal(currentRight.id);
    }
  }, [currentRight, autoReveal]);

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
      // Reset Heardle session state when starting new sort
      resetSession();
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
      // Reset Heardle session state when clearing
      resetSession();
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
              <Switch
                checked={heardleMode}
                disabled={isSorting}
                onCheckedChange={(e) => setHeardleMode(e.checked)}
              >
                {t('settings.heardle_mode')}
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
                          onClick={bothRevealed ? () => left() : undefined}
                          song={currentLeft}
                          artists={artistLeft}
                          heardleMode={heardleMode}
                          isRevealed={isLeftRevealed}
                          songInventory={listToSort}
                          attempts={getAttemptCount(currentLeft.id)}
                          maxAttempts={maxAttempts}
                          guessHistory={getGuessHistory(currentLeft.id)}
                          audioDuration={getAudioDuration(getAttemptCount(currentLeft.id))}
                          onGuess={handleLeftGuess}
                          onPass={handleLeftPass}
                          onNoAudio={handleLeftNoAudio}
                          flex={1}
                        />
                        <Box hideBelow="sm">
                          <Kbd>←</Kbd>
                        </Box>
                      </Stack>
                      <Stack flex="1" alignItems="center" w="full">
                        <SongCard
                          onClick={bothRevealed ? () => right() : undefined}
                          song={currentRight}
                          artists={artistRight}
                          heardleMode={heardleMode}
                          isRevealed={isRightRevealed}
                          songInventory={listToSort}
                          attempts={getAttemptCount(currentRight.id)}
                          maxAttempts={maxAttempts}
                          guessHistory={getGuessHistory(currentRight.id)}
                          audioDuration={getAudioDuration(getAttemptCount(currentRight.id))}
                          onGuess={handleRightGuess}
                          onPass={handleRightPass}
                          onNoAudio={handleRightNoAudio}
                          flex={1}
                        />
                        <Box hideBelow="sm">
                          <Kbd>→</Kbd>
                        </Box>
                      </Stack>
                    </HStack>
                  )}
                  {/* Show message when ranking is disabled in Heardle mode */}
                  {heardleMode && !bothRevealed && (
                    <Text color="fg.muted" fontSize="sm" textAlign="center">
                      {t('heardle.guess_both_songs', {
                        defaultValue: 'Guess both songs to enable ranking'
                      })}
                    </Text>
                  )}
                  <HStack justifyContent="center" w="full">
                    <Button
                      size={{ base: '2xl', md: 'lg' }}
                      onClick={() => tie()}
                      disabled={noTieMode || !bothRevealed}
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
                <SongResultsView
                  songsData={songs}
                  failedSongs={heardleMode ? failedSongsForResults : undefined}
                  w="full"
                  order={state.arr}
                />
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
            // Reset Heardle session when confirming dialog action
            resetSession();
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
            resetSession();
            clear();
            // We need to parse URL params and set them as filters
            const params = new URLSearchParams(location.search);
            const newFilters = {
              series: getAllCommaSeparated(params, 'series'),
              artists: getAllCommaSeparated(params, 'artists'),
              types: getAllCommaSeparated(params, 'types') as ('group' | 'solo' | 'unit')[],
              characters: getAllCommaSeparated(params, 'characters').map(Number),
              discographies: getAllCommaSeparated(params, 'discographies').map(Number),
              songs: getAllCommaSeparated(params, 'songs').map(Number),
              years: getAllCommaSeparated(params, 'years').map(Number)
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
          getItemName={(item) =>
            getSongName((item as Song).name, (item as Song).englishName, i18n.language)
          }
          getItemColor={(item) => {
            const song = item as Song;
            const seriesId = song.seriesIds?.[0];
            const seriesInfo = series.find(
              (s: { id: string | number; color: string }) => s.id == seriesId
            );
            return seriesInfo?.color;
          }}
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
            // Reset Heardle session when confirming dialog action
            resetSession();
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
