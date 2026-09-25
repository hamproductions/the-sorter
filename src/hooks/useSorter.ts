import shuffle from 'lodash-es/shuffle';
import { useEffect, useCallback, useRef } from 'react';
import cloneDeep from 'lodash-es/cloneDeep';
import type { SortState } from '../utils/sort';
import { step, initSort, calculateMaxComparisons, estimateComparisonsMade } from '../utils/sort';
import { useLocalStorage } from './useLocalStorage';
import type { SortChoice, SortLog } from '~/types/global-ranking';

const CHOICES: Record<'left' | 'right' | 'tie', SortChoice> = { left: 'L', right: 'R', tie: 'T' };

const createSessionId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export const useSorter = <T extends string | number>(items: T[], statePrefix?: string) => {
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
  const [log, setLog] = useLocalStorage<SortLog>(
    `${statePrefix ? statePrefix + '-' : ''}sort-log`,
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

  const loadState = useCallback(
    (stateData: {
      state: SortState<T>;
      history: SortState<T>[];
      comparisonsCount?: number;
      log?: SortLog;
    }) => {
      const { state, history, comparisonsCount: count, log: savedLog } = stateData;
      setState(state);
      setHistory(history);
      if (count !== undefined) {
        setComparisonsCount(count);
      }
      setLog(savedLog ?? null);
    },
    [setState, setHistory, setComparisonsCount, setLog]
  );

  const loadResumeState = (state: SortState<T>) => {
    setState(state);
    setHistory([]);
    setComparisonsCount(1);
    setLog(null);
  };

  const stateRef = useRef(state);
  const historyRef = useRef(history);
  const comparisonsCountRef = useRef(comparisonsCount);
  const logRef = useRef(log);

  stateRef.current = state;
  historyRef.current = history;
  comparisonsCountRef.current = comparisonsCount;
  logRef.current = log;

  const getSnapshot = useCallback(() => {
    return {
      state: stateRef.current,
      history: historyRef.current ?? [],
      comparisonsCount: comparisonsCountRef.current ?? 0,
      log: logRef.current ?? undefined
    };
  }, []);

  const handleStep = useCallback(
    (value: 'left' | 'right' | 'tie') => () => {
      const currentState = stateRef.current;
      if (currentState) {
        let newHistory = [...(historyRef.current ?? []), cloneDeep(currentState)];
        if (newHistory.length > 50) {
          newHistory = newHistory.slice(-50);
        }
        setHistory(newHistory);
        const currentCount = comparisonsCountRef.current ?? estimateComparisonsMade(currentState);
        setComparisonsCount(currentCount + 1);
        const nextStep = step(value, currentState);
        setState(nextStep);
        if (currentState.mergeState) {
          setLog((l) => (l ? { ...l, choices: l.choices + CHOICES[value] } : l));
        }
      }
    },
    [setHistory, setState, setComparisonsCount, setLog]
  );

  const reset = useCallback(() => {
    const initialOrder = shuffle(items);
    setState(initSort(initialOrder));
    setHistory([]);
    setComparisonsCount(1);
    setLog({ sessionId: createSessionId(), initialOrder, choices: '' });
    localStorage.removeItem('results-display-order');
  }, [items, setState, setHistory, setComparisonsCount, setLog]);

  const handleUndo = useCallback(() => {
    const currentHistory = historyRef.current;
    if (!currentHistory || currentHistory?.length === 0) return;
    const previousState = currentHistory.at(-1);
    if (previousState) {
      setState(previousState);
      setHistory(currentHistory.slice(0, -1));
      setComparisonsCount(Math.max(0, (comparisonsCountRef.current ?? 1) - 1));
      if (previousState.mergeState) {
        setLog((l) => (l ? { ...l, choices: l.choices.slice(0, -1) } : l));
      }
    }
  }, [setState, setHistory, setComparisonsCount, setLog]);

  const sortedN = state?.arr.length ?? items.length;
  const maxComparisons = calculateMaxComparisons(sortedN);
  const estimatedProgress =
    state && maxComparisons > 0 ? estimateComparisonsMade(state) / maxComparisons : 0;

  const clear = () => {
    setHistory(undefined);
    setState(undefined);
    setComparisonsCount(undefined);
    setLog(null);
    localStorage.removeItem('results-display-order');
  };

  const progress = Math.max(0, Math.min(1, estimatedProgress));
  const isEnded = state?.status === 'end';

  const isEstimatedCount = comparisonsCount === undefined && state !== undefined;
  const actualComparisonsCount = comparisonsCount ?? (state ? estimateComparisonsMade(state) : 0);

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
    getSnapshot,
    clear,
    log,
    setLog
  };
};
