import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
  useCallback,
  useSyncExternalStore
} from 'react';
import {
  appStorage,
  hasStorageFailure,
  isDurableKey,
  isStoragePersisted,
  subscribeStorage,
  usesIndexedDB
} from '~/utils/storage';

type NullOrUndefinedAble<T> = T | null | undefined;
export { isStoragePersisted } from '~/utils/storage';

export const useStorageFailure = () =>
  useSyncExternalStore(subscribeStorage, hasStorageFailure, () => false);

export class LocalStorage<T = unknown> {
  constructor(public key: string) {}

  get value(): NullOrUndefinedAble<T> {
    try {
      const val = appStorage.getItem(this.key);
      return val != null ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  }

  set value(value: NullOrUndefinedAble<T>) {
    const serialized = value != null ? JSON.stringify(value) : null;
    if (serialized !== null) appStorage.setItem(this.key, serialized);
    else appStorage.removeItem(this.key);
  }

  clear() {
    this.value = null;
  }
}

const sameKeyListeners = new Map<string, Set<(value: unknown) => void>>();

export const useLocalStorage = function <T>(
  key: string,
  initial: NullOrUndefinedAble<T> = undefined
): [NullOrUndefinedAble<T>, Dispatch<SetStateAction<NullOrUndefinedAble<T>>>] {
  const storage = useRef(new LocalStorage<T>(key));
  const [data, setData] = useState<NullOrUndefinedAble<T>>(initial);

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
      if (storageEvent.key !== key || !isStoragePersisted(key)) return;
      if (usesIndexedDB() && isDurableKey(key)) return;
      let newData: NullOrUndefinedAble<T> = null;
      try {
        newData = storageEvent.newValue ? JSON.parse(storageEvent.newValue) : null;
      } catch {}
      listener(newData);
    };
    const handleDurableStorage = (event: Event) => {
      const { key: updatedKey, value } = (
        event as CustomEvent<{ key: string; value: string | null }>
      ).detail;
      if (updatedKey !== key) return;
      try {
        listener(value === null ? null : JSON.parse(value));
      } catch {}
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('sorter-storage', handleDurableStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('sorter-storage', handleDurableStorage);
    };
  }, [key]);

  return [data, setNewData];
};
