import shuffle from 'lodash-es/shuffle';
import { useEffect, useCallback, useRef } from 'react';
import cloneDeep from 'lodash-es/cloneDeep';
import type { SortState } from '../utils/sort';
import { step, initSort, calculateMaxComparisons, estimateComparisonsMade } from '../utils/sort';
import { useLocalStorage } from './useLocalStorage';

export const useSorter = <T>(items: T[], statePrefix?: string) => {
  const [sortState, setSortState] = useLocalStorage<SortState<T>>(
    `${statePrefix ? statePrefix + '-' : ''}sort-state`
  );
  const [sortHistory, setSortHistory] = useLocalStorage<SortState<T>[]>(
    `${statePrefix ? statePrefix + '-' : ''}sort-state-history`,
    undefined
  );
  const [comparisonsCount, setComparisonsCount] = useLocalStorage<number | undefined>(
    `${statePrefix ? statePrefix + '-' : ''}comparisons-count`,
    undefined
  );

  useEffect(() => {
    if (
      (sortState && !sortState?.arr) ||
      (sortState?.arr[0] && !Array.isArray(sortState?.arr[0])) ||
      (sortHistory?.[0]?.arr[0] && !Array.isArray(sortHistory?.[0]?.arr[0]))
    ) {
      localStorage.clear();
    }
  }, [sortState, sortHistory]);

  const loadState = (stateData: { state: SortState<T>; history: SortState<T>[] }) => {
    const { state, history } = stateData;
    setSortState(state);
    setSortHistory(history);
  };

  const stateRef = useRef(sortState);
  const historyRef = useRef(sortHistory);
  const comparisonsCountRef = useRef(comparisonsCount);

  stateRef.current = sortState;
  historyRef.current = sortHistory;
  comparisonsCountRef.current = comparisonsCount;

  const handleStep = useCallback(
    (value: 'left' | 'right' | 'tie') => () => {
      const currentState = stateRef.current;
      if (currentState) {
        let newHistory = [...(historyRef.current ?? []), cloneDeep(currentState)];
        if (newHistory.length > 50) {
          newHistory = newHistory.slice(-50);
        }
        setSortHistory(newHistory);
        const currentCount = comparisonsCountRef.current ?? estimateComparisonsMade(currentState);
        setComparisonsCount(currentCount + 1);
        const nextStep = step(value, currentState);
        setSortState(nextStep);
      }
    },
    [setSortHistory, setSortState, setComparisonsCount]
  );

  const reset = useCallback(() => {
    setSortState(initSort(shuffle(items)));
    setSortHistory([]);
    setComparisonsCount(1);
    localStorage.removeItem('results-display-order');
  }, [items, setSortState, setSortHistory, setComparisonsCount]);

  const handleUndo = useCallback(() => {
    const currentHistory = historyRef.current;
    if (!currentHistory || currentHistory?.length === 0) return;
    const previousState = currentHistory.at(-1);
    if (previousState) {
      setSortState(previousState);
      setSortHistory(currentHistory.slice(0, -1));
      setComparisonsCount(Math.max(0, (comparisonsCountRef.current ?? 1) - 1));
    }
  }, [setSortState, setSortHistory, setComparisonsCount]);

  const sortedN = sortState?.arr.length ?? items.length;
  const maxComparisons = calculateMaxComparisons(sortedN);
  const estimatedProgress =
    sortState && maxComparisons > 0 ? estimateComparisonsMade(sortState) / maxComparisons : 0;

  const clear = () => {
    setSortHistory(undefined);
    setSortState(undefined);
    setComparisonsCount(undefined);
    localStorage.removeItem('results-display-order');
  };

  const progress = Math.max(0, Math.min(1, estimatedProgress));
  const isEnded = sortState?.status === 'end';

  const isEstimatedCount = comparisonsCount === undefined && sortState !== undefined;
  const actualComparisonsCount =
    comparisonsCount ?? (sortState ? estimateComparisonsMade(sortState) : 0);

  return {
    state: sortState,
    history: sortHistory,
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
    clear
  };
};
