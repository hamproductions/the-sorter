import {
  calculateMaxComparisons,
  estimateComparisonsMade,
  getSortItems,
  isSortState
} from './sort';
import type { SortLog } from '~/types/global-ranking';
import type { SavedSortState, SorterType } from '~/types/save-state';

type CreateSaveInput = Omit<SavedSortState, 'id' | 'date' | 'isCompleted'>;

export const createSavedSortState = (input: CreateSaveInput): SavedSortState => ({
  ...input,
  id: crypto.randomUUID(),
  date: new Date().toISOString(),
  isCompleted: input.state.status === 'end'
});

export const addSaveState = (saves: SavedSortState[], save: SavedSortState): SavedSortState[] => [
  save,
  ...saves
];

export const removeSaveState = (saves: SavedSortState[], id: string): SavedSortState[] =>
  saves.filter((s) => s.id !== id);

export const renameSaveState = (
  saves: SavedSortState[],
  id: string,
  name: string
): SavedSortState[] => saves.map((s) => (s.id === id ? { ...s, name } : s));

export const getSaveStatesByType = (
  saves: SavedSortState[] | null | undefined,
  type: SorterType
): SavedSortState[] => (saves ?? []).filter((s) => s.sorterType === type);

export const getSaveStateById = (saves: SavedSortState[], id: string): SavedSortState | undefined =>
  saves.find((s) => s.id === id);

export const updateSaveState = (
  saves: SavedSortState[],
  id: string,
  update: Partial<Omit<SavedSortState, 'id'>>
): SavedSortState[] =>
  saves.map((s) => (s.id === id ? { ...s, ...update, date: new Date().toISOString() } : s));

export const SORTER_TYPE_ROUTES: Record<SorterType, string> = {
  characters: '/',
  songs: '/songs',
  'hasu-songs': '/hasu-music'
};

export const SORTER_TYPE_LABEL_KEYS: Record<SorterType, string> = {
  characters: 'dialog.saved_states.type_characters',
  songs: 'dialog.saved_states.type_songs',
  'hasu-songs': 'dialog.saved_states.type_hasu_songs'
};

export const SAVED_STATES_KEY = 'saved-sort-states';
export const CURRENT_SESSIONS_MIGRATED_KEY = 'saved-sort-states-migrated';

const CURRENT_SESSION_PREFIXES: { prefix: string; sorterType: SorterType }[] = [
  { prefix: '', sorterType: 'characters' },
  { prefix: 'songs-', sorterType: 'songs' },
  { prefix: 'perf-songs-', sorterType: 'songs' },
  { prefix: 'hasu-songs-', sorterType: 'hasu-songs' }
];

const readJson = (storage: Storage, key: string): unknown => {
  try {
    const value = storage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

export const isSortLog = (value: unknown): value is SortLog =>
  !!value &&
  typeof value === 'object' &&
  typeof (value as SortLog).sessionId === 'string' &&
  Array.isArray((value as SortLog).initialOrder) &&
  typeof (value as SortLog).choices === 'string';

const isSavedSortState = (value: unknown): value is SavedSortState =>
  !!value &&
  typeof value === 'object' &&
  typeof (value as SavedSortState).id === 'string' &&
  typeof (value as SavedSortState).name === 'string' &&
  (value as SavedSortState).sorterType in SORTER_TYPE_ROUTES &&
  isSortState((value as SavedSortState).state) &&
  Array.isArray((value as SavedSortState).history);

export const toSavedSortStates = (value: unknown): SavedSortState[] =>
  Array.isArray(value) ? value.filter(isSavedSortState) : [];

export const migrateCurrentSessions = (
  storage: Storage,
  nameFor: (sorterType: SorterType, isCompleted: boolean) => string
) => {
  if (storage.getItem(CURRENT_SESSIONS_MIGRATED_KEY)) return;
  const saves = toSavedSortStates(readJson(storage, SAVED_STATES_KEY));
  const migrated = CURRENT_SESSION_PREFIXES.flatMap(({ prefix, sorterType }) => {
    const state = readJson(storage, `${prefix}sort-state`);
    if (!isSortState(state) || state.arr.length === 0) return [];
    const serialized = JSON.stringify(state);
    if (saves.some((s) => s.sorterType === sorterType && JSON.stringify(s.state) === serialized)) {
      return [];
    }
    const history = readJson(storage, `${prefix}sort-state-history`);
    const count = readJson(storage, `${prefix}comparisons-count`);
    const log = readJson(storage, `${prefix}sort-log`);
    const maxComparisons = calculateMaxComparisons(state.arr.length);
    const isCompleted = state.status === 'end';
    return [
      createSavedSortState({
        name: nameFor(sorterType, isCompleted),
        sorterType,
        state,
        history: Array.isArray(history) && history.every(isSortState) ? history : [],
        comparisonsCount: typeof count === 'number' ? count : estimateComparisonsMade(state),
        itemCount: getSortItems(state).length,
        progress: isCompleted
          ? 1
          : maxComparisons > 0
            ? Math.max(0, Math.min(1, estimateComparisonsMade(state) / maxComparisons))
            : 0,
        log: isSortLog(log) ? log : undefined,
        isSeiyuu:
          sorterType === 'characters' ? readJson(storage, 'seiyuu-mode') === true : undefined
      })
    ];
  });
  if (migrated.length > 0) {
    storage.setItem(SAVED_STATES_KEY, JSON.stringify([...migrated, ...saves]));
  }
  storage.setItem(CURRENT_SESSIONS_MIGRATED_KEY, 'true');
};
