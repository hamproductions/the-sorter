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
    if (value !== null) {
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

export const useLocalStorage = function <T>(
  key: string,
  initial: NullOrUndefinedAble<T> = undefined
): [NullOrUndefinedAble<T>, Dispatch<SetStateAction<NullOrUndefinedAble<T>>>] {
  const storage = useRef(new LocalStorage<T>(key));
  const [data, setData] = useState<NullOrUndefinedAble<T>>(
    () => (typeof window !== 'undefined' ? storage.current.value : initial) ?? initial
  );

  const dataRef = useRef(data);
  const isSelfUpdate = useRef(false);

  const setNewData: Dispatch<SetStateAction<NullOrUndefinedAble<T>>> = useCallback(
    (s: SetStateAction<NullOrUndefinedAble<T>>) => {
      const newData =
        typeof s === 'function'
          ? (s as (prev: NullOrUndefinedAble<T>) => NullOrUndefinedAble<T>)(dataRef.current)
          : s;
      dataRef.current = newData;
      storage.current.value = newData;
      setData(newData);
      isSelfUpdate.current = true;
      try {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: storage.current.key,
            newValue: newData === null || newData === undefined ? null : JSON.stringify(newData)
          })
        );
      } finally {
        isSelfUpdate.current = false;
      }
    },
    []
  );

  useEffect(() => {
    setNewData(storage.current.value ?? initial);
    // oxlint-disable-next-line exhaustive-deps
  }, []);

  useEffect(() => {
    const handleStorage = (storageEvent: StorageEvent) => {
      if (storageEvent.key !== key || isSelfUpdate.current) return;
      let newData: NullOrUndefinedAble<T> = null;
      try {
        newData = storageEvent.newValue ? JSON.parse(storageEvent.newValue) : null;
      } catch {}
      dataRef.current = newData;
      setData(newData);
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, [key]);

  return [data, setNewData];
};
