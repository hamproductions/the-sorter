import { cloneDeep } from 'lodash-es';
import type { SortState } from './sort';
import { getCurrentItem, step } from './sort';

export const getNextItems = <T>(state: SortState<T>) => {
  const leftState = getCurrentItem(step('left', cloneDeep(state)));
  const rightState = getCurrentItem(step('right', cloneDeep(state)));
  const tieState = getCurrentItem(step('tie', cloneDeep(state)));

  return Array.from(
    new Set(
      [
        leftState?.left,
        leftState?.right,
        rightState?.left,
        rightState?.right,
        tieState?.left,
        tieState?.right
      ].flatMap((i) => i ?? [])
    )
  );
};
