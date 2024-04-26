import { useState } from 'react';
import { SortState, step, initSort } from '../utils/sort';
import shuffle from 'lodash/shuffle';

export const useSorter = <T>(items: T[]) => {
  const [count, setCount] = useState(0);
  const [state, setState] = useState<SortState<T>>();
  const [history, setHistory] = useState<SortState<T>[]>([]);

  const handleStep = (value: 'left' | 'right' | 'tie') => () => {
    if (state) {
      setHistory([...history, state]);
      const nextStep = step(value, state);
      state && setState(nextStep);
      setCount((c) => (c += 1));
    }
  };

  const reset = () => {
    // setState(initSort(shuffle(items)));
    setState(initSort(items));
    setCount(1);
    setHistory([]);
  };

  const handleUndo = () => {
    if (history.length === 0 || count < 2) return;
    console.log(history.at(-1));
    setState(history.at(-1));
    setHistory(history.slice(0, -1));
    setCount((c) => c - 1);
  };

  const getProgress = () => {
    const prevStep = ((state?.currentSize ?? 0) - 1) ** 1 / 2 / Math.ceil(items.length ** 1 / 2);
    const current = (state?.currentSize ?? 0) ** 1 / 2 / Math.ceil(items.length ** 1 / 2);

    return prevStep + (current - prevStep) * ((state?.leftStart ?? 0) / items.length);
  };
  const progress = getProgress();
  return {
    state,
    count,
    init: () => reset(),
    left: handleStep('left'),
    right: handleStep('right'),
    tie: handleStep('tie'),
    undo: () => handleUndo(),
    progress,
    reset
  };
};
