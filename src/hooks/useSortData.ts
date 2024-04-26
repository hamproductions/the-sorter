import { filter, groupBy } from 'lodash';
import { useEffect, useMemo } from 'react';
import { FilterType } from '~/components/sorter/CharacterFilters';
import { Character } from '~/types';
import { useData } from './useData';
import { useSorter } from './useSorter';
import { useLocalStorage } from './useLocalStorage';
import { hasFilter, matchFilter } from '~/utils/filter';

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

    console.log(hasFilter(filters), filters);
    return filters && hasFilter(filters)
      ? charaSeiyuu.filter((c) => {
          return matchFilter(c, filters);
        })
      : charaSeiyuu;
  }, [seiyuu, characters, filters]);

  const { init, left, right, state, count, tie, undo, progress, reset } = useSorter(listToSort);

  useEffect(() => {
    reset();
  }, [listToSort]);

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
    listCount: listToSort.length
  };
};
