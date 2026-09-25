import shuffle from 'lodash-es/shuffle';
import { useEffect, useCallback, useRef } from 'react';
import cloneDeep from 'lodash-es/cloneDeep';
import type { SortState } from '../utils/sort';
import {
  step,
  initSort,
  calculateMaxComparisons,
  estimateComparisonsMade,
  isSortState
} from '../utils/sort';
import { isSortLog } from '../utils/save-state';
import { useLocalStorage } from './useLocalStorage';
import type { SortChoice, SortLog } from '~/types/global-ranking';

const CHOICES: Record<'left' | 'right' | 'tie', SortChoice> = { left: 'L', right: 'R', tie: 'T' };

const createSessionId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export const useSorter = <T extends string | number>(items: T[], statePrefix?: string) => {
  const [storedState, setState] = useLocalStorage<SortState<T>>(
    `${statePrefix ? statePrefix + '-' : ''}sort-state`
  );
  const [storedHistory, setHistory] = useLocalStorage<SortState<T>[]>(
    `${statePrefix ? statePrefix + '-' : ''}sort-state-history`,
    undefined
  );
  const [comparisonsCount, setComparisonsCount] = useLocalStorage<number | undefined>(
    `${statePrefix ? statePrefix + '-' : ''}comparisons-count`,
    undefined
  );
  const [, setDisplayOrder] = useLocalStorage<string[][]>('results-display-order');
  const [storedLog, setLog] = useLocalStorage<SortLog>(
    `${statePrefix ? statePrefix + '-' : ''}sort-log`,
    undefined
  );

  const state = isSortState(storedState) ? (storedState as SortState<T>) : undefined;
  const history =
    Array.isArray(storedHistory) && storedHistory.every(isSortState) ? storedHistory : undefined;
  const log = isSortLog(storedLog) ? storedLog : undefined;

  useEffect(() => {
    if (storedState != null && !state) setState(undefined);
    if (storedHistory != null && !history) setHistory(undefined);
    if (storedLog != null && !log) setLog(undefined);
  }, [storedState, state, storedHistory, history, storedLog, log, setState, setHistory, setLog]);

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
      setDisplayOrder(null);
    },
    [setState, setHistory, setComparisonsCount, setLog, setDisplayOrder]
  );

  const loadResumeState = (state: SortState<T>) => {
    setState(state);
    setHistory([]);
    setComparisonsCount(1);
    setLog(null);
    setDisplayOrder(null);
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
    setDisplayOrder(null);
  }, [items, setState, setHistory, setComparisonsCount, setLog, setDisplayOrder]);

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
    setDisplayOrder(null);
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
