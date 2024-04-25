import { useState } from 'react';
import { SortState, step, initSort } from '../utils/sort';

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

  const handleInit = () => {
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

  return {
    state,
    count,
    init: () => handleInit(),
    left: handleStep('left'),
    right: handleStep('right'),
    tie: handleStep('tie'),
    undo: () => handleUndo()
  };
};
