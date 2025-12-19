import { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocalStorage } from './useLocalStorage';
import { useSorter } from './useSorter';
import { useHasuSongData } from './useHasuSongData';
import { useToaster } from '~/context/ToasterContext';
import { matchSongFilter } from '~/utils/hasu-song-filter';
import { hasFilter } from '~/utils/filter';
import type { HasuSongFilterType } from '~/components/sorter/HasuSongFilters';

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
    // history,
    left,
    right,
    state,
    count,
    tie,
    undo,
    progress,
    clear,
    isEnded
    // reset
  } = useSorter(
    listToSort.map((l) => l.id),
    'hasu-songs'
  );

  const { toast } = useToaster();

  const handleTie = useCallback(() => {
    if (!noTieMode) {
      toast?.({ description: 'ヒトリダケナンテエラベナイヨー' });
      tie();
    } else {
      //TODO: somehow add a pic
      toast?.({ description: t('toast.tie_not_allowed'), type: 'error' });
    }
  }, [toast, tie, noTieMode, t]);

  useEffect(() => {
    const handleKeystroke = (e: KeyboardEvent) => {
      if (state?.status !== 'end') {
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
  }, [left, right, handleTie, undo, state?.status]);

  return {
    noTieMode: noTieMode ?? false,
    setNoTieMode,
    init,
    left,
    right,
    state,
    count,
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
