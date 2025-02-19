import { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocalStorage } from './useLocalStorage';
import { useSorter } from './useSorter';
import { useSongData } from './useSongData';
import { useToaster } from '~/context/ToasterContext';

import { hasFilter } from '~/utils/filter';

import { matchSongFilter } from '~/utils/song-filter';
import type { SongFilterType } from '~/components/sorter/SongFilters';

export const useSongsSortData = () => {
  const { t } = useTranslation();
  const songs = useSongData();
  const [noTieMode, setNoTieMode] = useLocalStorage('dd-mode', false);
  const [songFilters, setSongFilters] = useLocalStorage<SongFilterType>('song-filters', undefined);
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
    if (!noTieMode) {
      toast?.('ヒトリダケナンテエラベナイヨー');
      tie();
    } else {
      //TODO: somehow add a pic
      toast?.(t('toast.tie_not_allowed'), { type: 'error' });
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
  }, [left, right, handleTie, undo]);

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
    isEnded,
    songFilters,
    setSongFilters,
    listToSort,
    listCount: listToSort.length,
    clear
  };
};
