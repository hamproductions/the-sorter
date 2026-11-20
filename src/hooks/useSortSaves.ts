import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSaveStates } from './useSaveStates';
import { flushAppStorage, isStoragePersisted } from '~/utils/storage';
import { useSaveLoadContext } from '~/context/SaveLoadContext';
import { useToaster } from '~/context/ToasterContext';
import type { SortLog } from '~/types/global-ranking';
import type { SavedSortState, SorterType } from '~/types/save-state';
import {
  autoSaveName,
  createSavedSortState,
  getSortSaveIdentity,
  markResultAutoSaved,
  wasResultAutoSaved
} from '~/utils/save-state';
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
  filterSummary,
  isSeiyuu,
  isEnded,
  metadata,
  onApply
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
  isSeiyuu?: boolean;
  isEnded: boolean;
  metadata?: Pick<SavedSortState, 'performanceMeta' | 'songFilters'>;
  onApply?: (saved: SavedSortState) => void;
}) => {
  const { t } = useTranslation();
  const { toast } = useToaster();
  const { saves, save, remove, update, load } = useSaveStates(sorterType);
  const { pendingLoadId, clearPendingLoad } = useSaveLoadContext();

  const captureCurrent = () => {
    const snapshot = getSnapshot();
    if (!snapshot.state) return;
    return {
      ...metadata,
      state: snapshot.state,
      history: snapshot.history,
      comparisonsCount: snapshot.comparisonsCount,
      log: snapshot.log,
      itemCount,
      progress,
      filterSummary,
      isSeiyuu
    };
  };

  const preserveCurrent = (target: SavedSortState) => {
    const current = captureCurrent();
    if (!current || current.state.status === 'end') return;
    const serialized = getSortSaveIdentity({ ...current, sorterType });
    if (getSortSaveIdentity(target) === serialized) return;
    if (saves.some((s) => getSortSaveIdentity(s) === serialized)) return;
    save({
      ...current,
      sorterType,
      name: autoSaveName(t, sorterType, current.itemCount, current.filterSummary)
    });
  };

  const applySave = (saved: SavedSortState) => {
    preserveCurrent(saved);
    onApply?.(saved);
    loadState({
      state: saved.state as SortState<T>,
      history: saved.history as SortState<T>[],
      comparisonsCount: saved.comparisonsCount,
      log: saved.log
    });
    toast?.({ description: t('dialog.saved_states.loaded') });
  };
  const applySaveRef = useRef(applySave);
  applySaveRef.current = applySave;

  const autoSave = () => {
    const current = captureCurrent();
    if (!current || current.state.status !== 'end') return;
    const serialized = getSortSaveIdentity({ ...current, sorterType });
    if (wasResultAutoSaved(serialized)) return;
    if (saves.some((s) => getSortSaveIdentity(s) === serialized)) {
      if (isStoragePersisted('saved-sort-states')) markResultAutoSaved(serialized);
      return;
    }
    save({
      ...current,
      sorterType,
      name: autoSaveName(t, sorterType, current.itemCount, current.filterSummary)
    });
    void flushAppStorage().then(
      () => {
        markResultAutoSaved(serialized);
        if (isStoragePersisted('saved-sort-states'))
          toast?.({ description: t('dialog.saved_states.auto_saved') });
        return undefined;
      },
      () => {}
    );
  };
  const autoSaveRef = useRef(autoSave);
  autoSaveRef.current = autoSave;

  useEffect(() => {
    if (isEnded && !pendingLoadId) autoSaveRef.current();
  }, [isEnded, pendingLoadId]);

  useEffect(() => {
    if (!pendingLoadId) return;
    const saved = load(pendingLoadId);
    if (!saved) {
      clearPendingLoad();
      return;
    }
    if (saved.sorterType !== sorterType) return;
    clearPendingLoad();
    applySaveRef.current(saved);
  }, [pendingLoadId, load, clearPendingLoad, sorterType]);

  const saveCurrent = (name: string) => {
    const current = captureCurrent();
    if (!current) return false;
    save({ ...current, name, sorterType });
    void flushAppStorage().then(
      () => {
        if (isStoragePersisted('saved-sort-states'))
          toast?.({ description: t('dialog.save_state.saved') });
        return undefined;
      },
      () => {}
    );
    return true;
  };

  const overwrite = (id: string) => {
    const current = captureCurrent();
    if (!current) return false;
    update(id, current);
    void flushAppStorage().then(
      () => {
        if (isStoragePersisted('saved-sort-states'))
          toast?.({ description: t('dialog.save_state.overwritten') });
        return undefined;
      },
      () => {}
    );
    return true;
  };

  const getCurrentSave = () => {
    const current = captureCurrent();
    if (!current) return undefined;
    return createSavedSortState({
      ...current,
      sorterType,
      name: autoSaveName(t, sorterType, current.itemCount, current.filterSummary)
    });
  };

  const loadById = (id: string) => {
    const saved = load(id);
    if (!saved) return false;
    applySave(saved);
    return true;
  };

  return { saves, saveCurrent, overwrite, loadById, remove, getCurrentSave };
};
