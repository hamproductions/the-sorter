import { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocalStorage } from './useLocalStorage';
import { useSorter } from './useSorter';
import { useSongData } from './useSongData';
import { useToaster } from '~/context/ToasterContext';

import { hasFilter } from '~/utils/filter';

import { matchSongFilter } from '~/utils/song-filter';
import type { SongFilterType } from '~/components/sorter/SongFilters';
import { getAssetUrl } from '~/utils/assets';
import { TieToastContent } from '~/components/sorter/TieToastContent';
import { token } from 'styled-system/tokens';

export const useSongsSortData = (
  excludedSongIds?: Set<string>,
  options?: { disableShortcutsRef?: { current: boolean } }
) => {
  const { t } = useTranslation();
  const songs = useSongData();
  const [noTieMode, setNoTieMode] = useLocalStorage('dd-mode', false);
  const [heardleMode, setHeardleMode] = useLocalStorage('heardle-mode', false);
  const [songFilters, setSongFilters] = useLocalStorage<SongFilterType>('song-filters', undefined);

  // First apply song filters, then exclude failed songs (for Heardle mode)
  const listToSort = useMemo(() => {
    let filtered =
      songs && songFilters && hasFilter(songFilters)
        ? songs.filter((s) => {
            return matchSongFilter(s, songFilters ?? {});
          })
        : songs;

    // Exclude failed songs if provided
    if (excludedSongIds && excludedSongIds.size > 0) {
      filtered = filtered.filter((s) => !excludedSongIds.has(s.id));
    }

    return filtered;
  }, [songs, songFilters, excludedSongIds]);

  const {
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
    clear,
    isEnded
  } = useSorter(
    listToSort.map((l) => l.id),
    'songs'
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
      tie();
    } else {
      toast?.({ description: t('toast.tie_not_allowed'), type: 'error' });
    }
  }, [toast, tie, noTieMode, t]);

  useEffect(() => {
    const handleKeystroke = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (options?.disableShortcutsRef?.current) return;
      if (!state || state.status === 'end') return;
      switch (e.key) {
        case 'ArrowLeft':
          left();
          e.preventDefault();
          break;
        case 'ArrowRight':
          right();
          e.preventDefault();
          break;
        case 'ArrowDown':
          handleTie();
          e.preventDefault();
          break;
        case 'ArrowUp':
          undo();
          e.preventDefault();
          break;
      }
    };
    document.addEventListener('keydown', handleKeystroke);

    return () => {
      document.removeEventListener('keydown', handleKeystroke);
    };
  }, [left, right, handleTie, undo, state, options?.disableShortcutsRef]);

  return {
    noTieMode: noTieMode ?? false,
    setNoTieMode,
    heardleMode: heardleMode ?? false,
    setHeardleMode,
    init,
    left,
    right,
    state,
    comparisonsCount,
    isEstimatedCount,
    maxComparisons,
    tie: handleTie,
    undo,
    progress,
    isEnded,
    songFilters,
    setSongFilters,
    listToSort,
    listCount: listToSort.length,
    clear
  };
};
