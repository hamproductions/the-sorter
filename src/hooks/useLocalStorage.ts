import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
  useCallback
} from 'react';

type NullOrUndefinedAble<T> = T | null | undefined;
export class LocalStorage<T = unknown> {
  constructor(public key: string) {}

  get value(): NullOrUndefinedAble<T> {
    try {
      const val = localStorage.getItem(this.key);
      return val !== null ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  }

  set value(value: NullOrUndefinedAble<T>) {
    if (value != null) {
      const val: string = JSON.stringify(value);
      localStorage.setItem(this.key, val);
    } else {
      localStorage.removeItem(this.key);
    }
  }

  clear() {
    localStorage.removeItem(this.key);
  }
}

const sameKeyListeners = new Map<string, Set<(value: unknown) => void>>();

export const useLocalStorage = function <T>(
  key: string,
  initial: NullOrUndefinedAble<T> = undefined
): [NullOrUndefinedAble<T>, Dispatch<SetStateAction<NullOrUndefinedAble<T>>>] {
  const storage = useRef(new LocalStorage<T>(key));
  const [data, setData] = useState<NullOrUndefinedAble<T>>(
    () => (typeof window !== 'undefined' ? storage.current.value : initial) ?? initial
  );

  const dataRef = useRef(data);
  const receive = useRef((value: unknown) => {
    dataRef.current = value as NullOrUndefinedAble<T>;
    setData(value as NullOrUndefinedAble<T>);
  });

  const setNewData: Dispatch<SetStateAction<NullOrUndefinedAble<T>>> = useCallback(
    (s: SetStateAction<NullOrUndefinedAble<T>>) => {
      const newData =
        typeof s === 'function'
          ? (s as (prev: NullOrUndefinedAble<T>) => NullOrUndefinedAble<T>)(dataRef.current)
          : s;
      dataRef.current = newData;
      storage.current.value = newData;
      setData(newData);
      sameKeyListeners.get(storage.current.key)?.forEach((listener) => {
        if (listener !== receive.current) listener(newData);
      });
    },
    []
  );

  useEffect(() => {
    const value = storage.current.value ?? initial;
    dataRef.current = value;
    storage.current.value = value;
    setData(value);
    // oxlint-disable-next-line exhaustive-deps
  }, []);

  useEffect(() => {
    if (storage.current.key === key) return;
    storage.current = new LocalStorage<T>(key);
    const value = storage.current.value ?? initial;
    dataRef.current = value;
    setData(value);
    // oxlint-disable-next-line exhaustive-deps
  }, [key]);

  useEffect(() => {
    const listener = receive.current;
    let listeners = sameKeyListeners.get(key);
    if (!listeners) {
      listeners = new Set();
      sameKeyListeners.set(key, listeners);
    }
    listeners.add(listener);
    const handleStorage = (storageEvent: StorageEvent) => {
      if (storageEvent.key !== key) return;
      let newData: NullOrUndefinedAble<T> = null;
      try {
        newData = storageEvent.newValue ? JSON.parse(storageEvent.newValue) : null;
      } catch {}
      listener(newData);
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener('storage', handleStorage);
    };
  }, [key]);

  return [data, setNewData];
};
