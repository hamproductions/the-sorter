import { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocalStorage } from './useLocalStorage';
import { useSorter } from './useSorter';
import { useHasuSongData } from './useHasuSongData';
import { useToaster } from '~/context/ToasterContext';
import { matchSongFilter } from '~/utils/hasu-song-filter';
import { hasFilter } from '~/utils/filter';
import type { HasuSongFilterType } from '~/components/sorter/HasuSongFilters';
import { getAssetUrl } from '~/utils/assets';
import { TieToastContent } from '~/components/sorter/TieToastContent';
import { token } from 'styled-system/tokens';

export const useHasuSongsSortData = () => {
  const { t } = useTranslation();
  const songs = useHasuSongData();
  const [noTieMode, setNoTieMode] = useLocalStorage('dd-mode', false);
  const [songFilters, setSongFilters] = useLocalStorage<HasuSongFilterType>(
    'hasu-song-filters',
    undefined
  );
  const listToSort = useMemo(() => {
    return songs && songFilters && hasFilter(songFilters)
      ? songs.filter((s) => {
          return matchSongFilter(s, songFilters ?? {});
        })
      : songs;
  }, [songs, songFilters]);

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
    'hasu-songs'
  );

  const { toast } = useToaster();

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
      if (state && state.status !== 'end') {
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
      }
    };
    document.addEventListener('keydown', handleKeystroke);

    return () => {
      document.removeEventListener('keydown', handleKeystroke);
    };
  }, [left, right, handleTie, undo, state]);

  return {
    noTieMode: noTieMode ?? false,
    setNoTieMode,
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
    songFilters,
    setSongFilters,
    listToSort,
    listCount: listToSort.length,
    clear,
    isEnded
  };
};
