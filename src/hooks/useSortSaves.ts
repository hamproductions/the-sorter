import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSaveStates } from './useSaveStates';
import { useSaveLoadContext } from '~/context/SaveLoadContext';
import { useToaster } from '~/context/ToasterContext';
import type { SortLog } from '~/types/global-ranking';
import type { SavedSortState, SorterType } from '~/types/save-state';
import type { SortState } from '~/utils/sort';

interface SortSnapshot<T> {
  state: SortState<T> | null | undefined;
  history: SortState<T>[];
  comparisonsCount: number;
  log?: SortLog;
}

export const useSortSaves = <T extends string | number>({
  sorterType,
  getSnapshot,
  loadState,
  itemCount,
  progress,
  filterSummary
}: {
  sorterType: SorterType;
  getSnapshot: () => SortSnapshot<T>;
  loadState: (data: {
    state: SortState<T>;
    history: SortState<T>[];
    comparisonsCount?: number;
    log?: SortLog;
  }) => void;
  itemCount: number;
  progress: number;
  filterSummary?: string;
}) => {
  const { t } = useTranslation();
  const { toast } = useToaster();
  const { saves, save, remove, update, load } = useSaveStates(sorterType);
  const { pendingLoadId, clearPendingLoad } = useSaveLoadContext();

  const applySave = useCallback(
    (saved: SavedSortState) => {
      loadState({
        state: saved.state as SortState<T>,
        history: saved.history as SortState<T>[],
        comparisonsCount: saved.comparisonsCount,
        log: saved.log
      });
      toast?.({ description: t('dialog.saved_states.loaded') });
    },
    [loadState, toast, t]
  );

  useEffect(() => {
    if (!pendingLoadId) return;
    const saved = load(pendingLoadId);
    if (!saved) {
      clearPendingLoad();
      return;
    }
    if (saved.sorterType !== sorterType) return;
    clearPendingLoad();
    applySave(saved);
  }, [pendingLoadId, load, clearPendingLoad, sorterType, applySave]);

  const captureCurrent = () => {
    const snapshot = getSnapshot();
    if (!snapshot.state) return;
    return {
      state: snapshot.state,
      history: snapshot.history,
      comparisonsCount: snapshot.comparisonsCount,
      log: snapshot.log,
      itemCount,
      progress,
      filterSummary
    };
  };

  const saveCurrent = (name: string) => {
    const current = captureCurrent();
    if (!current) return false;
    save({ ...current, name, sorterType });
    toast?.({ description: t('dialog.save_state.saved') });
    return true;
  };

  const overwrite = (id: string) => {
    const current = captureCurrent();
    if (!current) return false;
    update(id, current);
    toast?.({ description: t('dialog.save_state.overwritten') });
    return true;
  };

  const loadById = (id: string) => {
    const saved = load(id);
    if (!saved) return false;
    applySave(saved);
    return true;
  };

  return { saves, saveCurrent, overwrite, loadById, remove };
};
