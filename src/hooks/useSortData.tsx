import groupBy from 'lodash-es/groupBy';
import { useCallback, useEffect, useMemo } from 'react';
import { useData } from './useData';
import { useLocalStorage } from './useLocalStorage';
import { useSorter } from './useSorter';
import { FilterType } from '~/components/sorter/CharacterFilters';
import { useToaster } from '~/context/ToasterContext';
import { Character } from '~/types';
import { hasFilter, matchFilter } from '~/utils/filter';

export const useSortData = () => {
  const characters = useData();
  const [seiyuu, setSeiyuu] = useLocalStorage('seiyuu-mode', false);
  const [filters, setFilters] = useLocalStorage<FilterType>('filters', undefined);
  const listToSort = useMemo(() => {
    const charaSeiyuu = seiyuu
      ? Object.values(
          groupBy(
            characters.flatMap((c) =>
              c.casts.map(
                (a, idx) =>
                  ({ ...c, id: idx > 0 ? `${c.id}-${idx}` : c.id, casts: [a] }) as Character
              )
            ),
            (d) => d.casts[0].seiyuu
          )
        ).map((d) => d[0])
      : characters;

    return filters && hasFilter(filters)
      ? charaSeiyuu.filter((c) => {
          return matchFilter(c, filters);
        })
      : charaSeiyuu;
  }, [seiyuu, characters, filters]);

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
    toast?.('ヒトリダケナンテエラベナイヨー');
    tie();
  }, [toast, tie]);

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
    seiyuu: seiyuu ?? false,
    setSeiyuu,
    init,
    left,
    right,
    state,
    count,
    tie: handleTie,
    undo,
    progress,
    filters,
    setFilters,
    listToSort,
    listCount: listToSort.length,
    clear
  };
};
