import { describe, expect, it } from 'vitest';
import {
  createSavedSortState,
  addSaveState,
  removeSaveState,
  renameSaveState,
  getSaveStatesByType,
  getSaveStateById
} from '../save-state';
import type { SavedSortState } from '~/types/save-state';
import type { SortState } from '../sort';
import { initSort, step, getCurrentItem } from '../sort';

const mockSortState: SortState<string> = {
  arr: [['a'], ['b'], ['c']],
  currentSize: 1,
  leftStart: 0,
  status: 'waiting',
  mergeState: {
    start: 0,
    mid: 0,
    end: 1,
    leftArr: [['a']],
    rightArr: [['b']],
    leftArrIdx: 0,
    rightArrIdx: 0,
    arrIdx: 0
  }
};

const mockCompletedState: SortState<string> = {
  arr: [['a'], ['b'], ['c']],
  currentSize: 3,
  leftStart: 0,
  status: 'end'
};

const makeInput = (overrides?: Partial<Parameters<typeof createSavedSortState>[0]>) => ({
  name: 'Test',
  sorterType: 'characters' as const,
  state: mockSortState,
  history: [],
  comparisonsCount: 1,
  itemCount: 3,
  progress: 0,
  ...overrides
});

describe('save-state', () => {
  describe('createSavedSortState', () => {
    it('creates a save with id, date, and provided fields', () => {
      const save = createSavedSortState(
        makeInput({ name: 'My Save', comparisonsCount: 5, progress: 0.3 })
      );
      expect(save.id).toBeDefined();
      expect(save.date).toBeDefined();
      expect(save.name).toBe('My Save');
      expect(save.sorterType).toBe('characters');
      expect(save.isCompleted).toBe(false);
      expect(save.state).toEqual(mockSortState);
      expect(save.history).toEqual([]);
      expect(save.comparisonsCount).toBe(5);
      expect(save.progress).toBe(0.3);
    });

    it('sets isCompleted true for ended state', () => {
      const save = createSavedSortState(
        makeInput({ sorterType: 'songs', state: mockCompletedState, progress: 1 })
      );
      expect(save.isCompleted).toBe(true);
    });

    it('generates unique ids', () => {
      const a = createSavedSortState(makeInput({ name: 'A' }));
      const b = createSavedSortState(makeInput({ name: 'B' }));
      expect(a.id).not.toBe(b.id);
    });

    it('generates valid ISO date', () => {
      const save = createSavedSortState(makeInput());
      expect(() => new Date(save.date)).not.toThrow();
      expect(new Date(save.date).toISOString()).toBe(save.date);
    });
  });

  describe('addSaveState', () => {
    it('adds to empty array', () => {
      const save = createSavedSortState(makeInput({ name: 'First' }));
      const result = addSaveState([], save);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(save);
    });

    it('prepends new saves (newest first)', () => {
      const a = createSavedSortState(makeInput({ name: 'A' }));
      const b = createSavedSortState(makeInput({ name: 'B' }));
      const result = addSaveState([a], b);
      expect(result[0].name).toBe('B');
      expect(result[1].name).toBe('A');
    });

    it('does not mutate original array', () => {
      const a = createSavedSortState(makeInput({ name: 'A' }));
      const original = [a];
      const b = createSavedSortState(makeInput({ name: 'B' }));
      addSaveState(original, b);
      expect(original).toHaveLength(1);
    });
  });

  describe('removeSaveState', () => {
    it('removes by id', () => {
      const a = createSavedSortState(makeInput({ name: 'A' }));
      const b = createSavedSortState(makeInput({ name: 'B', sorterType: 'songs' }));
      const result = removeSaveState([a, b], a.id);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('B');
    });

    it('returns same-length array if id not found', () => {
      const a = createSavedSortState(makeInput({ name: 'A' }));
      const result = removeSaveState([a], 'nonexistent');
      expect(result).toHaveLength(1);
    });

    it('handles empty array', () => {
      expect(removeSaveState([], 'any')).toEqual([]);
    });
  });

  describe('renameSaveState', () => {
    it('renames by id', () => {
      const a = createSavedSortState(makeInput({ name: 'Old' }));
      const result = renameSaveState([a], a.id, 'New');
      expect(result[0].name).toBe('New');
    });

    it('does not mutate original', () => {
      const a = createSavedSortState(makeInput({ name: 'Old' }));
      const original = [a];
      renameSaveState(original, a.id, 'New');
      expect(original[0].name).toBe('Old');
    });

    it('preserves other fields', () => {
      const a = createSavedSortState(makeInput({ name: 'Old', comparisonsCount: 42 }));
      const result = renameSaveState([a], a.id, 'New');
      expect(result[0].comparisonsCount).toBe(42);
      expect(result[0].id).toBe(a.id);
    });
  });

  describe('getSaveStatesByType', () => {
    it('filters by sorterType', () => {
      const a = createSavedSortState(makeInput({ name: 'A', sorterType: 'characters' }));
      const b = createSavedSortState(makeInput({ name: 'B', sorterType: 'songs' }));
      const c = createSavedSortState(makeInput({ name: 'C', sorterType: 'characters' }));
      expect(getSaveStatesByType([a, b, c], 'characters')).toHaveLength(2);
      expect(getSaveStatesByType([a, b, c], 'songs')).toHaveLength(1);
      expect(getSaveStatesByType([a, b, c], 'hasu-songs')).toHaveLength(0);
    });

    it('handles null/undefined gracefully', () => {
      expect(getSaveStatesByType(undefined as unknown as SavedSortState[], 'characters')).toEqual(
        []
      );
      expect(getSaveStatesByType(null as unknown as SavedSortState[], 'characters')).toEqual([]);
    });

    it('handles empty array', () => {
      expect(getSaveStatesByType([], 'songs')).toEqual([]);
    });
  });

  describe('getSaveStateById', () => {
    it('finds by id', () => {
      const a = createSavedSortState(makeInput({ name: 'A' }));
      expect(getSaveStateById([a], a.id)).toEqual(a);
    });

    it('returns undefined for missing id', () => {
      expect(getSaveStateById([], 'nope')).toBeUndefined();
    });
  });

  describe('state integrity', () => {
    it('preserves mergeState through save', () => {
      const save = createSavedSortState(makeInput());
      expect(save.state.mergeState).toEqual(mockSortState.mergeState);
      expect(save.state.mergeState?.leftArr).toEqual([['a']]);
      expect(save.state.mergeState?.rightArr).toEqual([['b']]);
    });

    it('preserves undo history through save', () => {
      const history = [mockSortState, { ...mockSortState, leftStart: 2 }];
      const save = createSavedSortState(makeInput({ history }));
      expect(save.history).toHaveLength(2);
      expect(save.history).toEqual(history);
    });

    it('survives JSON round-trip (simulating localStorage)', () => {
      const save = createSavedSortState(makeInput({ history: [mockSortState] }));
      const roundTripped = JSON.parse(JSON.stringify(save)) as SavedSortState;
      expect(roundTripped).toEqual(save);
      expect(roundTripped.state.mergeState).toEqual(save.state.mergeState);
    });

    it('saved mid-sort state can continue sorting to completion', () => {
      let state = initSort(['d', 'a', 'c', 'b', 'e']);

      const doAlphabeticalStep = (s: typeof state) => {
        const { left, right } = getCurrentItem(s) ?? {};
        if (!left || !right) throw new Error('Invalid State');
        return step(left[0] < right[0] ? 'left' : 'right', s);
      };

      state = doAlphabeticalStep(state);
      state = doAlphabeticalStep(state);

      const save = createSavedSortState(
        makeInput({ state, itemCount: 5, progress: 0.2, comparisonsCount: 2 })
      );

      let loaded = save.state as SortState<string>;
      while (loaded.status !== 'end') {
        loaded = doAlphabeticalStep(loaded);
      }

      expect(loaded.arr.filter((s) => s.length > 0)).toEqual([['a'], ['b'], ['c'], ['d'], ['e']]);
    });

    it('saved completed state remains completed after round-trip', () => {
      const save = createSavedSortState(makeInput({ state: mockCompletedState }));
      const roundTripped = JSON.parse(JSON.stringify(save)) as SavedSortState;
      expect(roundTripped.state.status).toBe('end');
      expect(roundTripped.isCompleted).toBe(true);
    });

    it('handles large result sets', () => {
      const bigState: SortState<string> = {
        arr: Array.from({ length: 200 }, (_, i) => [String(i)]),
        currentSize: 1,
        leftStart: 0,
        status: 'waiting',
        mergeState: {
          start: 0,
          mid: 0,
          end: 1,
          leftArr: [['0']],
          rightArr: [['1']],
          leftArrIdx: 0,
          rightArrIdx: 0,
          arrIdx: 0
        }
      };
      const save = createSavedSortState(makeInput({ state: bigState, itemCount: 200 }));
      const roundTripped = JSON.parse(JSON.stringify(save)) as SavedSortState;
      expect(roundTripped.state.arr).toHaveLength(200);
      expect(roundTripped.itemCount).toBe(200);
    });
  });
});
