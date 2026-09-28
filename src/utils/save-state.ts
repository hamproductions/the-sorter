import {
  calculateMaxComparisons,
  estimateComparisonsMade,
  getSortItems,
  isSortState
} from './sort';
import type { TFunction } from 'i18next';
import type { RankingFilter, SortLog } from '~/types/global-ranking';
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

const CURRENT_SESSION_PREFIXES: { prefix: string; sorterType: SorterType; filterKey?: string }[] = [
  { prefix: '', sorterType: 'characters', filterKey: 'filters' },
  { prefix: 'songs-', sorterType: 'songs', filterKey: 'song-filters' },
  { prefix: 'perf-songs-', sorterType: 'songs' },
  { prefix: 'hasu-songs-', sorterType: 'hasu-songs' }
];

const AUTO_NAME_COUNT_KEYS: Record<SorterType, string> = {
  characters: 'dialog.saved_states.auto_name_count_characters',
  songs: 'dialog.saved_states.auto_name_count_songs',
  'hasu-songs': 'dialog.saved_states.auto_name_count_songs'
};

export const autoSaveName = (
  t: TFunction,
  sorterType: SorterType,
  itemCount: number,
  filterSummary?: string
) =>
  `${filterSummary ?? t(SORTER_TYPE_LABEL_KEYS[sorterType])} · ${t(AUTO_NAME_COUNT_KEYS[sorterType], { count: itemCount })}`;

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
  nameFor: (
    sorterType: SorterType,
    isCompleted: boolean,
    details: { itemCount: number; filterSummary?: string }
  ) => string,
  summarize?: (sorterType: SorterType, filter: RankingFilter) => string | undefined
) => {
  if (storage.getItem(CURRENT_SESSIONS_MIGRATED_KEY)) return;
  const saves = toSavedSortStates(readJson(storage, SAVED_STATES_KEY));
  const migrated = CURRENT_SESSION_PREFIXES.flatMap(({ prefix, sorterType, filterKey }) => {
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
    const itemCount = getSortItems(state).length;
    const storedFilter = filterKey ? readJson(storage, filterKey) : null;
    const filter = isSortLog(log)
      ? log.context?.filter
      : storedFilter && typeof storedFilter === 'object'
        ? (storedFilter as RankingFilter)
        : undefined;
    const filterSummary = filter ? summarize?.(sorterType, filter) : undefined;
    return [
      createSavedSortState({
        name: nameFor(sorterType, isCompleted, { itemCount, filterSummary }),
        sorterType,
        state,
        history: Array.isArray(history) && history.every(isSortState) ? history : [],
        comparisonsCount: typeof count === 'number' ? count : estimateComparisonsMade(state),
        itemCount,
        filterSummary,
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

export const getLocallySortedIds = (storage: Storage, sorterType: SorterType) => {
  const states = [
    ...CURRENT_SESSION_PREFIXES.filter((p) => p.sorterType === sorterType).map(({ prefix }) =>
      readJson(storage, `${prefix}sort-state`)
    ),
    ...getSaveStatesByType(toSavedSortStates(readJson(storage, SAVED_STATES_KEY)), sorterType).map(
      (s) => s.state
    )
  ];
  return new Set(states.filter(isSortState).flatMap((state) => getSortItems(state).map(String)));
};

const AUTO_SAVED_RESULTS_KEY = 'auto-saved-results';
const AUTO_SAVED_RESULTS_LIMIT = 200;

const hashString = (value: string) => {
  let hash = 5381;
  for (let i = 0; i < value.length; i++) hash = ((hash << 5) + hash + value.charCodeAt(i)) | 0;
  return (hash >>> 0).toString(36);
};

const readAutoSaved = (): string[] => {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(AUTO_SAVED_RESULTS_KEY) ?? '[]');
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
};

export const wasResultAutoSaved = (serializedState: string) =>
  readAutoSaved().includes(hashString(serializedState));

export const markResultAutoSaved = (serializedState: string) => {
  try {
    const hashes = [hashString(serializedState), ...readAutoSaved()].slice(
      0,
      AUTO_SAVED_RESULTS_LIMIT
    );
    localStorage.setItem(AUTO_SAVED_RESULTS_KEY, JSON.stringify(hashes));
  } catch {}
};
