import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { SavedSortState, SorterType } from '~/types/save-state';
import {
  addSaveState,
  removeSaveState,
  renameSaveState,
  getSaveStatesByType,
  toSavedSortStates,
  getSaveStateById,
  createSavedSortState,
  updateSaveState
} from '~/utils/save-state';
import type { SortState } from '~/utils/sort';
import type { SortLog } from '~/types/global-ranking';

interface SaveInput {
  name: string;
  sorterType: SorterType;
  state: SortState<string | number>;
  history: SortState<string | number>[];
  comparisonsCount: number;
  itemCount: number;
  progress: number;
  filterSummary?: string;
  log?: SortLog;
  isSeiyuu?: boolean;
}

export const useSaveStates = (sorterType?: SorterType) => {
  const [storedSaves, setAllSaves] = useLocalStorage<SavedSortState[]>('saved-sort-states', []);
  const allSaves = useMemo(() => toSavedSortStates(storedSaves), [storedSaves]);
  const saves = sorterType ? getSaveStatesByType(allSaves, sorterType) : allSaves;

  const save = useCallback(
    (input: SaveInput) => {
      const entry = createSavedSortState(input);
      setAllSaves((prev) => addSaveState(toSavedSortStates(prev), entry));
      return entry;
    },
    [setAllSaves]
  );

  const remove = useCallback(
    (id: string) => {
      setAllSaves((prev) => removeSaveState(toSavedSortStates(prev), id));
    },
    [setAllSaves]
  );

  const rename = useCallback(
    (id: string, name: string) => {
      setAllSaves((prev) => renameSaveState(toSavedSortStates(prev), id, name));
    },
    [setAllSaves]
  );

  const update = useCallback(
    (id: string, input: Omit<SaveInput, 'name' | 'sorterType'>) => {
      setAllSaves((prev) =>
        updateSaveState(toSavedSortStates(prev), id, {
          ...input,
          isCompleted: input.state.status === 'end'
        })
      );
    },
    [setAllSaves]
  );

  const load = useCallback((id: string) => getSaveStateById(allSaves, id), [allSaves]);

  return { saves, allSaves, save, remove, rename, update, load };
};
