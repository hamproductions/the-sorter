import shuffle from 'lodash-es/shuffle';
import { useEffect } from 'react';
import cloneDeep from 'lodash-es/cloneDeep';
import type { SortState } from '../utils/sort';
import { step, initSort } from '../utils/sort';
import { useLocalStorage } from './useLocalStorage';

export const useSorter = <T>(items: T[]) => {
  const [state, setState] = useLocalStorage<SortState<T>>('sort-state');
  const [history, setHistory] = useLocalStorage<SortState<T>[]>('sort-state-history', undefined);

  useEffect(() => {
    if (
      (state && !state?.arr) ||
      (state?.arr[0] && !Array.isArray(state?.arr[0])) ||
      (history?.[0]?.arr[0] && !Array.isArray(history?.[0]?.arr[0]))
    ) {
      localStorage.clear();
    }
  }, [state, history]);

  const loadState = (stateData: { state: SortState<T>; history: SortState<T>[] }) => {
    const { state, history } = stateData;
    setState(state);
    setHistory(history);
  };

  const handleStep = (value: 'left' | 'right' | 'tie') => () => {
    if (state) {
      setHistory([...(history ?? []), cloneDeep(state)]);
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
    if (!history || history?.length === 0) return;
    const state = history.at(-1);
    if (state) {
      setState(state);
      setHistory(history.slice(0, -1));
    }
  };

  const getProgress = () => {
    const sizeCount = Math.ceil(Math.log2(items.length));
    const currentStep = Math.ceil(Math.log2(state?.currentSize ?? 1));
    const next = (currentStep + 1) / sizeCount;
    const current = currentStep / sizeCount;
    const stepProgress = (state?.mergeState?.arrIdx ?? 0) / items.length;

    return current + (next - current) * stepProgress;
  };

  const clear = () => {
    setHistory(undefined);
    setState(undefined);
  };

  const progress = getProgress();

  return {
    state,
    history,
    count: (history?.length ?? 0) + 1,
    init: () => reset(),
    left: handleStep('left'),
    right: handleStep('right'),
    tie: handleStep('tie'),
    undo: () => handleUndo(),
    progress,
    reset,
    loadState,
    clear
  };
};
