import shuffle from 'lodash-es/shuffle';
import { useEffect, useCallback, useRef } from 'react';
import cloneDeep from 'lodash-es/cloneDeep';
import type { SortState } from '../utils/sort';
import { step, initSort } from '../utils/sort';
import { useLocalStorage } from './useLocalStorage';

export const useSorter = <T>(items: T[], statePrefix?: string) => {
  const [state, setState] = useLocalStorage<SortState<T>>(
    `${statePrefix ? statePrefix + '-' : ''}sort-state`
  );
  const [history, setHistory] = useLocalStorage<SortState<T>[]>(
    `${statePrefix ? statePrefix + '-' : ''}sort-state-history`,
    undefined
  );

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

  const stateRef = useRef(state);
  const historyRef = useRef(history);

  // Update refs synchronously during render to avoid useEffect timing issues
  stateRef.current = state;
  historyRef.current = history;

  const handleStep = useCallback(
    (value: 'left' | 'right' | 'tie') => () => {
      const currentState = stateRef.current;
      if (currentState) {
        let newHistory = [...(historyRef.current ?? []), cloneDeep(currentState)];
        if (newHistory.length > 50) {
          newHistory = newHistory.slice(-50);
        }
        setHistory(newHistory);
        const nextStep = step(value, currentState);
        setState(nextStep);
      }
    },
    [setHistory, setState]
  );

  const reset = useCallback(() => {
    setState(initSort(shuffle(items)));
    // setState(initSort(items));
    setHistory([]);
    localStorage.removeItem('results-display-order');
  }, [items, setState, setHistory]);

  const handleUndo = useCallback(() => {
    const currentHistory = historyRef.current;
    if (!currentHistory || currentHistory?.length === 0) return;
    const previousState = currentHistory.at(-1);
    if (previousState) {
      setState(previousState);
      setHistory(currentHistory.slice(0, -1));
    }
  }, [setState, setHistory]);

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
    localStorage.removeItem('results-display-order');
  };

  const progress = getProgress();
  const isEnded = progress === 1 || isNaN(progress);

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
    isEnded,
    reset,
    loadState,
    clear
  };
};
