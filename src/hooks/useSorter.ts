import { useState } from 'react';
import { SortState, step, initSort } from '../utils/sort';
import shuffle from 'lodash/shuffle';

export const useSorter = <T>(items: T[]) => {
  const [state, setState] = useState<SortState<T>>();
  const [history, setHistory] = useState<SortState<T>[]>([]);

  const loadState = (stateData: { state: SortState<T>; history: SortState<T>[] }) => {
    const { state, history } = stateData;
    setState(state);
    setHistory(history);
  };

  const handleStep = (value: 'left' | 'right' | 'tie') => () => {
    if (state) {
      setHistory([...history, state]);
      const nextStep = step(value, state);
      state && setState(nextStep);
    }
  };

  const reset = () => {
    setState(initSort(shuffle(items)));
    // setState(initSort(items));
    setHistory([]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    setState(history.at(-1));
    setHistory(history.slice(0, -1));
  };

  const getProgress = () => {
    const sizeCount = Math.ceil(Math.log2(items.length));
    const currentStep = Math.ceil(Math.log2(state?.currentSize ?? 1));
    const next = (currentStep + 1) / sizeCount;
    const current = currentStep / sizeCount;
    const stepProgress = (state?.mergeState?.arrIdx ?? 0) / items.length;

    return current + (next - current) * stepProgress;
  };

  const progress = getProgress();

  return {
    state,
    history,
    count: history.length + 1,
    init: () => reset(),
    left: handleStep('left'),
    right: handleStep('right'),
    tie: handleStep('tie'),
    undo: () => handleUndo(),
    progress,
    reset,
    loadState
  };
};
