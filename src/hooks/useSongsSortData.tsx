import { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocalStorage } from './useLocalStorage';
import { useGlobalRankingSubmission } from './useGlobalRankingSubmission';
import { useSorter } from './useSorter';
import { useSongSortTimer } from './useSongSortTimer';
import { useSongData } from './useSongData';
import { useToaster } from '~/context/ToasterContext';
import { getSongSortList } from '~/utils/song-sort-list';
import type { SongFilterType } from '~/components/sorter/SongFilters';
import { getAssetUrl } from '~/utils/assets';
import { TieToastContent } from '~/components/sorter/TieToastContent';
import { token } from 'styled-system/tokens';

export const useSongsSortData = (
  excludedSongIds?: Set<string>,
  options?: {
    disableShortcutsRef?: { current: boolean };
    performanceSongIds?: string[];
    performanceIds?: string[];
    storagePrefix?: string;
  }
) => {
  const { t } = useTranslation();
  const songs = useSongData();
  const [noTieMode, setNoTieMode] = useLocalStorage('dd-mode', false);
  const [heardleMode, setHeardleMode] = useLocalStorage('heardle-mode', false);
  const [songFilters, setSongFilters] = useLocalStorage<SongFilterType>('song-filters', undefined);

  const listToSort = useMemo(
    () =>
      getSongSortList(songs, songFilters, {
        performanceSongIds: options?.performanceSongIds,
        heardleMode: !!heardleMode,
        excludedSongIds
      }),
    [songs, songFilters, excludedSongIds, options?.performanceSongIds, heardleMode]
  );

  const {
    init,
    left,
    right,
    state,
    history,
    comparisonsCount,
    isEstimatedCount,
    maxComparisons,
    tie,
    undo,
    progress,
    clear,
    isEnded,
    getSnapshot,
    loadState,
    log,
    setLog
  } = useSorter(
    listToSort.map((l) => l.id),
    options?.storagePrefix ?? 'songs'
  );

  const isPerformanceMode = !!options?.performanceSongIds?.length;
  const globalRanking = useGlobalRankingSubmission({
    log,
    setLog,
    isEnded: !!isEnded,
    context: {
      kind: 'song',
      mode: heardleMode ? 'heardle' : isPerformanceMode ? 'performance' : 'normal',
      filter: songFilters ?? null,
      performanceIds: isPerformanceMode ? options?.performanceIds : undefined
    }
  });

  // Background timer: track how long each comparison and the whole session takes.
  const {
    timing,
    stats,
    getElapsedMs,
    startTimer,
    clearTimer,
    recordTick,
    removeLastTick,
    markEnded
  } = useSongSortTimer(options?.storagePrefix ?? 'songs');

  const timedInit = useCallback(() => {
    startTimer();
    init();
  }, [startTimer, init]);

  const timedClear = useCallback(() => {
    clearTimer();
    clear();
  }, [clearTimer, clear]);

  const timedLeft = useCallback(() => {
    recordTick();
    left();
  }, [recordTick, left]);

  const timedRight = useCallback(() => {
    recordTick();
    right();
  }, [recordTick, right]);

  const timedUndo = useCallback(() => {
    // Only drop a timing entry when undo will actually rewind a comparison. Once
    // useSorter's history cap (50) is exhausted, undo() no-ops; popping a duration
    // anyway would desync the timer from the sorter and corrupt the results stats.
    if (history && history.length > 0) removeLastTick();
    undo();
  }, [history, removeLastTick, undo]);

  // Freeze the timer once the sort completes.
  useEffect(() => {
    if (state?.status === 'end') markEnded();
  }, [state?.status, markEnded]);

  const timedLoadState = useCallback(
    (data: Parameters<typeof loadState>[0]) => {
      if (data.state.status === 'end') clearTimer();
      else startTimer();
      loadState(data);
    },
    [clearTimer, startTimer, loadState]
  );

  const { toast } = useToaster();

  // useEffect(() => {
  //   if (history === null) return;
  //   if (history === undefined || history.length === 0) {
  //     reset();
  //   }
  // }, [listToSort]);

  const handleTie = useCallback(() => {
    const isMobile = window.matchMedia(`(max-width: ${token('breakpoints.sm')})`).matches;
    if (!noTieMode) {
      toast?.({
        meta: { backgroundImage: getAssetUrl('/assets/bg.webp') },
        description: TieToastContent,
        duration: 1000,
        placement: isMobile ? 'top' : undefined
      });
      recordTick();
      tie();
    } else {
      toast?.({ description: t('toast.tie_not_allowed'), type: 'error' });
    }
  }, [toast, tie, noTieMode, t, recordTick]);

  useEffect(() => {
    const handleKeystroke = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (!state || state.status === 'end') return;
      if (e.key === 'ArrowUp') {
        timedUndo();
        e.preventDefault();
        return;
      }
      if (options?.disableShortcutsRef?.current) return;
      switch (e.key) {
        case 'ArrowLeft':
          timedLeft();
          e.preventDefault();
          break;
        case 'ArrowRight':
          timedRight();
          e.preventDefault();
          break;
        case 'ArrowDown':
          handleTie();
          e.preventDefault();
          break;
      }
    };
    document.addEventListener('keydown', handleKeystroke);

    return () => {
      document.removeEventListener('keydown', handleKeystroke);
    };
  }, [timedLeft, timedRight, handleTie, timedUndo, state, options?.disableShortcutsRef]);

  return {
    noTieMode: noTieMode ?? false,
    setNoTieMode,
    heardleMode: heardleMode ?? false,
    setHeardleMode,
    init: timedInit,
    left: timedLeft,
    right: timedRight,
    state,
    comparisonsCount,
    isEstimatedCount,
    maxComparisons,
    tie: handleTie,
    undo: timedUndo,
    progress,
    isEnded,
    songFilters,
    setSongFilters,
    listToSort,
    listCount: listToSort.length,
    clear: timedClear,
    timing,
    timingStats: stats,
    getElapsedMs,
    getSnapshot,
    loadState: timedLoadState,
    globalRanking
  };
};
