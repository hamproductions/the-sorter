import groupBy from 'lodash/groupBy';
import { useEffect, useMemo } from 'react';
import { FilterType } from '~/components/sorter/CharacterFilters';
import { Character } from '~/types';
import { hasFilter, matchFilter } from '~/utils/filter';
import { useData } from './useData';
import { useLocalStorage } from './useLocalStorage';
import { useSorter } from './useSorter';

export const useSortData = () => {
  const characters = useData();
  const [seiyuu, setSeiyuu] = useLocalStorage('seiyuu-mode', false);
  const [filters, setFilters] = useLocalStorage<FilterType>('filters', {
    series: {},
    units: {},
    school: {}
  });
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

  const { init, history, left, right, state, count, tie, undo, progress, reset } = useSorter(
    listToSort.map((l) => l.id)
  );

  useEffect(() => {
    if (history !== undefined && (history === null || history?.length === 0)) {
      reset();
    }
  }, [listToSort]);

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
            tie();
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
  }, [left, right, tie, undo]);

  return {
    seiyuu: seiyuu ?? false,
    setSeiyuu,
    init,
    left,
    right,
    state,
    count,
    tie,
    undo,
    progress,
    filters,
    setFilters,
    listToSort,
    listCount: listToSort.length
  };
};
