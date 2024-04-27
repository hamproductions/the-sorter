import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';

type NullOrUndefinedAble<T> = T | null | undefined;
export class LocalStorage<T = unknown> {
  constructor(public key: string) {}

  get value(): NullOrUndefinedAble<T> {
    try {
      const val = localStorage.getItem(this.key);
      return val !== null ? JSON.parse(val) : null;
    } catch (error) {
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
  const [data, setData] = useState<NullOrUndefinedAble<T>>(undefined);

  const setNewData: Dispatch<SetStateAction<NullOrUndefinedAble<T>>> = (
    s: SetStateAction<NullOrUndefinedAble<T>>
  ) => {
    //@ts-expect-error force convert to function
    const newData = typeof s === 'function' ? s.call(s, data) : s;
    storage.current.value = newData;
    setData(newData);
  };

  const updateValue = (updateKey: string) => (storageEvent: StorageEvent) => {
    if (storageEvent.key === updateKey) {
      setData(JSON.parse(storageEvent.newValue ?? ''));
    }
  };

  useEffect(() => {
    setNewData(storage.current.value ?? initial ?? null);
  }, []);

  useEffect(() => {
    window.addEventListener('storage', updateValue(key));
    return () => {
      window.removeEventListener('storage', updateValue(key));
    };
  }, [key]);

  return [data, setNewData];
};
