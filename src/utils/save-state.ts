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
