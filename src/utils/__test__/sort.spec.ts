import { describe, expect, it } from 'vitest';
import shuffle from 'lodash-es/shuffle';
import { getCurrentItem, initSort, step } from '../sort';

const createNumberArray = (n = 10) =>
  Array(n)
    .fill(undefined)
    .map((_, i) => i);

describe('Sorting', () => {
  describe('initSort function', () => {
    it('create sorting state', () => {
      const state = initSort(createNumberArray());
      expect(state).toEqual({
        arr: [[0], [1], [2], [3], [4], [5], [6], [7], [8], [9]],
        currentSize: 1,
        leftStart: 0,
        mergeState: {
          arrIdx: 0,
          end: 1,
          leftArr: [[0]],
          leftArrIdx: 0,
          mid: 0,
          rightArr: [[1]],
          rightArrIdx: 0,
          start: 0
        }
      });
    });
  });

  describe('Sort Function', () => {
    describe('Sorts the array', () => {
      it('In original order', () => {
        let state = initSort(createNumberArray());
        while (state.status !== 'end') {
          state = step('left', state);
        }
        expect(state.arr).toEqual([[0], [1], [2], [3], [4], [5], [6], [7], [8], [9]]);
      });

      it('Reversed array', () => {
        let state = initSort(createNumberArray().toReversed());
        while (state.status !== 'end') {
          state = step('right', state);
        }
        expect(state.arr).toEqual([[0], [1], [2], [3], [4], [5], [6], [7], [8], [9]]);
      });

      it('Random Array', () => {
        // Init Random Array
        let state = initSort(shuffle(createNumberArray()));

        // Loop until sort ends
        while (state.status !== 'end') {
          const { left, right } = getCurrentItem(state) ?? {};
          if (!left || !right) throw new Error('Invalid State');
          const direction = left[0] === right[0] ? 'tie' : left[0] < right[0] ? 'left' : 'right';
          // Update new sort state
          state = step(direction, state);
        }

        expect(state.arr).toEqual([[0], [1], [2], [3], [4], [5], [6], [7], [8], [9]]);
      });

      it('All tied', () => {
        // Init Random Array
        let state = initSort(createNumberArray());

        // Loop until sort ends
        while (state.status !== 'end') {
          state = step('tie', state);
        }
        expect(state.arr.filter((s) => s.length > 0)).toEqual([[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]]);
      });

      it('With ties', () => {
        // Init Random Array
        let state = initSort(shuffle(createNumberArray(20).map((a) => Math.floor(a / 2))));

        // Loop until sort ends
        while (state.status !== 'end') {
          const { left, right } = getCurrentItem(state) ?? {};
          if (!left || !right) throw new Error('Invalid State');
          const direction = left[0] === right[0] ? 'tie' : left[0] < right[0] ? 'left' : 'right';

          // Update new sort state
          state = step(direction, state);
        }

        expect(state.arr.filter((s) => s.length > 0)).toEqual([
          [0, 0],
          [1, 1],
          [2, 2],
          [3, 3],
          [4, 4],
          [5, 5],
          [6, 6],
          [7, 7],
          [8, 8],
          [9, 9]
        ]);
      });

      it("Doesn't show empty array in intermediate state", () => {
        const sort = () => {
          // Init Random Array
          let state = initSort(shuffle(createNumberArray(100).map((a) => Math.floor(a / 2))));

          // Loop until sort ends
          while (state.status !== 'end') {
            const { left, right } = getCurrentItem(state) ?? {};
            if (!left || !right) throw new Error('Invalid State');
            if (left.length === 0 || right.length === 0) throw new Error('Empty Array');
            const direction = left[0] === right[0] ? 'tie' : left[0] < right[0] ? 'left' : 'right';
            // Update new sort state
            state = step(direction, state);
          }
        };

        expect(sort).not.toThrow();
      });
    });
  });
});
