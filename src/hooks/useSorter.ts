import shuffle from 'lodash-es/shuffle';
import { useEffect, useCallback, useRef } from 'react';
import cloneDeep from 'lodash-es/cloneDeep';
import type { SortState } from '../utils/sort';
import { step, initSort, calculateMaxComparisons, estimateComparisonsMade } from '../utils/sort';
import { useLocalStorage } from './useLocalStorage';

export const useSorter = <T>(items: T[], statePrefix?: string) => {
  const [state, setState] = useLocalStorage<SortState<T>>(
    `${statePrefix ? statePrefix + '-' : ''}sort-state`
  );
  const [history, setHistory] = useLocalStorage<SortState<T>[]>(
    `${statePrefix ? statePrefix + '-' : ''}sort-state-history`,
    undefined
  );
  const [comparisonsCount, setComparisonsCount] = useLocalStorage<number | undefined>(
    `${statePrefix ? statePrefix + '-' : ''}comparisons-count`,
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

  const loadResumeState = (state: SortState<T>) => {
    setState(state);
    setHistory([]);
    setComparisonsCount(1);
  };

  const stateRef = useRef(state);
  const historyRef = useRef(history);
  const comparisonsCountRef = useRef(comparisonsCount);

  stateRef.current = state;
  historyRef.current = history;
  comparisonsCountRef.current = comparisonsCount;

  const handleStep = useCallback(
    (value: 'left' | 'right' | 'tie') => () => {
      const currentState = stateRef.current;
      if (currentState) {
        let newHistory = [...(historyRef.current ?? []), cloneDeep(currentState)];
        if (newHistory.length > 50) {
          newHistory = newHistory.slice(-50);
        }
        setHistory(newHistory);
        const currentCount =
          comparisonsCountRef.current ?? estimateComparisonsMade(currentState, items.length);
        setComparisonsCount(currentCount + 1);
        const nextStep = step(value, currentState);
        setState(nextStep);
      }
    },
    [setHistory, setState, setComparisonsCount, items.length]
  );

  const reset = useCallback(() => {
    setState(initSort(shuffle(items)));
    setHistory([]);
    setComparisonsCount(1);
    localStorage.removeItem('results-display-order');
  }, [items, setState, setHistory, setComparisonsCount]);

  const handleUndo = useCallback(() => {
    const currentHistory = historyRef.current;
    if (!currentHistory || currentHistory?.length === 0) return;
    const previousState = currentHistory.at(-1);
    if (previousState) {
      setState(previousState);
      setHistory(currentHistory.slice(0, -1));
      setComparisonsCount(Math.max(0, (comparisonsCountRef.current ?? 1) - 1));
    }
  }, [setState, setHistory, setComparisonsCount]);

  const maxComparisons = calculateMaxComparisons(items.length);
  const estimatedProgress = state
    ? estimateComparisonsMade(state, items.length) / maxComparisons
    : 0;

  const clear = () => {
    setHistory(undefined);
    setState(undefined);
    setComparisonsCount(undefined);
    localStorage.removeItem('results-display-order');
  };

  const progress = Math.min(1, estimatedProgress);
  const isEnded = state?.status === 'end';

  const isEstimatedCount = comparisonsCount === undefined && state !== undefined;
  const actualComparisonsCount =
    comparisonsCount ?? (state ? estimateComparisonsMade(state, items.length) : 0);

  return {
    state,
    history,
    comparisonsCount: actualComparisonsCount,
    isEstimatedCount,
    maxComparisons,
    init: () => reset(),
    left: handleStep('left'),
    right: handleStep('right'),
    tie: handleStep('tie'),
    undo: () => handleUndo(),
    progress,
    isEnded,
    reset,
    loadState,
    loadResumeState,
    clear
  };
};
