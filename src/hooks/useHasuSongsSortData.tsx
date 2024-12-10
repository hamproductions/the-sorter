import { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocalStorage } from './useLocalStorage';
import { useSorter } from './useSorter';
import { useSongData } from './useSongData';
import { useToaster } from '~/context/ToasterContext';
import { matchSongFilter } from '~/utils/song-filter';
import { hasFilter } from '~/utils/filter';
import type { SongFilterType } from '~/components/sorter/SongFilters';

export const useHasuSongsSortData = () => {
  const { t } = useTranslation();
  const songs = useSongData();
  const [noTieMode, setNoTieMode] = useLocalStorage('dd-mode', false);
  const [filters, setFilters] = useLocalStorage<SongFilterType>('hasu-song-filters', undefined);
  const listToSort = useMemo(() => {
    return songs && filters && hasFilter(filters)
      ? songs.filter((s) => {
          return matchSongFilter(s, filters ?? {});
        })
      : songs;
  }, [songs, filters]);

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
    clear
    // reset
  } = useSorter(listToSort.map((l) => l.id));

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
    filters: null,
    setFilters,
    listToSort,
    listCount: listToSort.length,
    clear
  };
};
