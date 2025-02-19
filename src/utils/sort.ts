export interface SortState<I> {
  arr: I[][];
  currentSize: number;
  leftStart: number;
  status?: 'done' | 'waiting' | 'end';
  mergeState?: MergeState<I>;
  ties?: I[][];
}
interface MergeState<I> {
  start: number;
  mid: number;
  end: number;
  leftArr?: I[][];
  rightArr?: I[][];
  leftArrIdx?: number;
  rightArrIdx?: number;
  arrIdx?: number;
}

export const initSort = <I>(arr: I[]): SortState<I> => {
  return mergeSort({
    arr: [...arr.map((a) => [a])],
    currentSize: 1,
    leftStart: 0,
    status: arr.length === 1 ? 'end' : 'waiting'
  });
};

export const mergeSort = <I>(state: SortState<I>): SortState<I> => {
  const { arr, status } = state;
  let { currentSize, leftStart } = state;
  let currentStepDone = status === 'done';
  const n = arr.length;

  // console.log('MERGESORT', n, currentSize, leftStart);
  for (; currentSize <= n - 1; currentSize = 2 * currentSize, leftStart = 0) {
    // console.log('CURRENT SIZE', currentSize, leftStart, n - 1);
    for (; leftStart < n - 1; leftStart += 2 * currentSize) {
      // Find ending point of left
      // subarray. mid+1 is starting
      // point of right

      // Merge Subarrays arr[left_start...mid]
      // & arr[mid+1...right_end]
      if (currentStepDone) {
        currentStepDone = false;
        continue;
      }

      const mid = Math.min(leftStart + currentSize - 1, n - 1);

      const end = Math.min(leftStart + 2 * currentSize - 1, n - 1);

      const res = merge({
        arr,
        currentSize,
        leftStart,
        mergeState: {
          start: leftStart,
          mid,
          end
        }
      });
      if (res.status !== 'done') {
        return res;
      }
    }
  }

  return {
    arr,
    currentSize: arr.length,
    leftStart: 0,
    status: 'end'
  };
};

export const merge = <I>(state: SortState<I>): SortState<I> => {
  const { arr, currentSize, leftStart, mergeState } = state;
  if (!mergeState) return state;
  const { start, mid, end } = mergeState;
  let { leftArrIdx = 0, rightArrIdx = 0, arrIdx = start, leftArr, rightArr } = mergeState;

  const n1 = mid - start + 1;
  const n2 = end - mid;

  if (!leftArr || !rightArr) {
    // console.log('Init Merge', 'start', start, 'mid', mid, 'end', end);
    /* create temp arrays */
    leftArr = Array(n1).fill(0);
    rightArr = Array(n2).fill(0);

    /*
     * Copy data to temp arrays L and R
     */
    for (leftArrIdx = 0; leftArrIdx < n1; leftArrIdx++)
      leftArr[leftArrIdx] = arr[start + leftArrIdx];
    for (rightArrIdx = 0; rightArrIdx < n2; rightArrIdx++)
      rightArr[rightArrIdx] = arr[mid + 1 + rightArrIdx];

    /*
     * Merge the temp arrays back into arr[l..r]
     */
    leftArrIdx = 0;
    rightArrIdx = 0;
    arrIdx = start;
  }

  while (leftArrIdx < n1 && rightArrIdx < n2) {
    if (rightArr[rightArrIdx].length === 0) {
      arr[arrIdx] = rightArr[rightArrIdx];
      rightArrIdx++;
      arrIdx++;
    } else if (leftArr[leftArrIdx].length === 0) {
      arr[arrIdx] = leftArr[leftArrIdx];
      leftArrIdx++;
      arrIdx++;
    } else {
      return {
        arr,
        currentSize,
        leftStart,
        mergeState: {
          start,
          mid,
          end,
          leftArr,
          leftArrIdx,
          rightArr,
          rightArrIdx,
          arrIdx
        }
      };
    }
  }

  /*
   * Copy the remaining elements of L, if there are any
   */
  while (leftArrIdx < n1) {
    arr[arrIdx] = leftArr[leftArrIdx];
    leftArrIdx++;
    arrIdx++;
  }

  /*
   * Copy the remaining elements of R, if there are any
   */
  while (rightArrIdx < n2) {
    arr[arrIdx] = rightArr[rightArrIdx];
    rightArrIdx++;
    arrIdx++;
  }

  return {
    arr,
    currentSize,
    leftStart,
    status: 'done'
  };
};

export const step = <I>(option: 'left' | 'right' | 'tie', state: SortState<I>): SortState<I> => {
  const { arr: a, currentSize, leftStart, mergeState } = state;
  const arr = [...a];
  if (!mergeState) return state;
  let { leftArrIdx, rightArrIdx, arrIdx } = mergeState;
  const { start, mid, end, leftArr, rightArr } = mergeState;

  if (
    leftArr !== undefined &&
    rightArr !== undefined &&
    leftArrIdx !== undefined &&
    rightArrIdx !== undefined &&
    arrIdx !== undefined
  ) {
    if (option === 'tie') {
      arr[arrIdx] = [...leftArr[leftArrIdx], ...rightArr[rightArrIdx]];
      rightArr[rightArrIdx] = [];
      leftArrIdx++;
    } else if (option === 'left') {
      arr[arrIdx] = leftArr[leftArrIdx];
      leftArrIdx++;
    } else {
      arr[arrIdx] = rightArr[rightArrIdx];
      rightArrIdx++;
    }

    arrIdx++;

    const nextState = merge({
      arr,
      currentSize,
      leftStart,
      mergeState: { start, mid, end, leftArrIdx, rightArrIdx, arrIdx, leftArr, rightArr }
    });

    if (!nextState.mergeState) {
      return mergeSort(nextState);
    } else {
      return nextState;
    }
  }
  return state;
};

export const getCurrentItem = <T>(state: SortState<T>) => {
  if (
    !state.mergeState ||
    state.mergeState.leftArrIdx === undefined ||
    state.mergeState.rightArrIdx === undefined
  )
    return undefined;
  const left = state.mergeState?.leftArr?.[state.mergeState.leftArrIdx];
  const right = state.mergeState?.rightArr?.[state.mergeState.rightArrIdx];

  return {
    left,
    right
  };
};
