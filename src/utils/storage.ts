const DATABASE = 'the-sorter';
const STORE = 'sessions';
const cache = new Map<string, string>();
const legacyBackups = new Map<string, string>();
const pending = new Map<string, string | null>();
const listeners = new Set<() => void>();
const failed = new Set<string>();
const revisions = new Map<string, number>();
let database: IDBDatabase | undefined;
let durableReady = false;
let initializationFailed = false;
let initialization: Promise<void> | undefined;
let writes = Promise.resolve();
let channel: BroadcastChannel | undefined;

export const isDurableKey = (key: string) =>
  /^(?:(?:songs-|perf-songs-|hasu-songs-)?sort-(?:state-history|log|timing)|saved-sort-states|perf-songs-(?:meta|ids)|results-display-order(?:-read-only)?|heardle-(?:revealed-songs|failed-songs|current-guesses|guess-results)|setlist-(?:predictions|save-slots|prediction-drafts)-v1|performance-cache-v1)$/.test(
    key
  );

const isCurrentSortKey = (key: string) =>
  /^(?:songs-|perf-songs-|hasu-songs-)?(?:sort-state|comparisons-count)$/.test(key);

export const usesIndexedDB = () => durableReady;
export const isStoragePersisted = (key: string) =>
  !pending.has(key) && !(initializationFailed && isDurableKey(key));
export const hasStorageFailure = () => failed.size > 0;
export const subscribeStorage = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const notify = () => listeners.forEach((listener) => listener());

const transaction = (action: (store: IDBObjectStore) => void) =>
  new Promise<void>((resolve, reject) => {
    const tx = database!.transaction(STORE, 'readwrite');
    tx.oncomplete = () => resolve();
    tx.addEventListener('error', () => reject(tx.error));
    tx.addEventListener('abort', () => reject(tx.error));
    action(tx.objectStore(STORE));
  });

const announce = (key: string, value: string | null) => {
  window.dispatchEvent(new CustomEvent('sorter-storage', { detail: { key, value } }));
};

const persist = (key: string, value: string | null) => {
  pending.set(key, value);
  const revision = (revisions.get(key) ?? 0) + 1;
  revisions.set(key, revision);
  writes = writes.then(async () => {
    try {
      await transaction((store) => {
        if (value === null) store.delete(key);
        else store.put(value, key);
      });
      if (revisions.get(key) === revision) {
        pending.delete(key);
        failed.delete(key);
        notify();
      }
      const legacy = legacyBackups.get(key);
      if (legacy !== undefined) {
        try {
          if (localStorage.getItem(key) === legacy) localStorage.removeItem(key);
          legacyBackups.delete(key);
        } catch {}
      }
      try {
        channel?.postMessage({ key, value });
      } catch {}
    } catch {
      if (revisions.get(key) === revision) failed.add(key);
      notify();
    }
    return undefined;
  });
};

const storageKeys = () => {
  const keys = new Set(cache.keys());
  try {
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);
      if (key !== null) keys.add(key);
    }
  } catch {}
  for (const [key, value] of pending) {
    if (value === null) keys.delete(key);
    else keys.add(key);
  }
  return [...keys];
};

export const appStorage: Storage = {
  get length() {
    return storageKeys().length;
  },
  key(index) {
    return storageKeys()[index] ?? null;
  },
  getItem(key) {
    if (pending.has(key)) return pending.get(key) ?? null;
    if ((durableReady || initializationFailed) && isDurableKey(key)) return cache.get(key) ?? null;
    return localStorage.getItem(key);
  },
  setItem(key, value) {
    if (initializationFailed && isDurableKey(key)) {
      pending.set(key, value);
      failed.add(key);
      notify();
      return;
    }
    if (durableReady && isDurableKey(key)) {
      cache.set(key, value);
      persist(key, value);
      return;
    }
    try {
      localStorage.setItem(key, value);
      pending.delete(key);
      if (failed.delete(key)) notify();
    } catch {
      pending.set(key, value);
      failed.add(key);
      notify();
    }
  },
  removeItem(key) {
    if (initializationFailed && isDurableKey(key)) {
      pending.set(key, null);
      failed.add(key);
      notify();
      return;
    }
    if (durableReady && isDurableKey(key)) {
      cache.delete(key);
      persist(key, null);
      return;
    }
    try {
      localStorage.removeItem(key);
      pending.delete(key);
      if (failed.delete(key)) notify();
    } catch {
      pending.set(key, null);
      failed.add(key);
      notify();
    }
  },
  clear() {
    void clearAppStorage().catch(() => {
      failed.add('__clear__');
      notify();
    });
  }
};

export const initializeStorage = () => {
  initialization ??= (async () => {
    let opened: IDBDatabase | undefined;
    try {
      if (typeof indexedDB === 'undefined') throw new Error('Session storage is unavailable');
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(DATABASE, 1);
        let blocked = false;
        request.onupgradeneeded = () => request.result.createObjectStore(STORE);
        request.onsuccess = () => {
          if (blocked) request.result.close();
          else resolve(request.result);
        };
        request.addEventListener('error', () => reject(request.error));
        request.onblocked = () => {
          blocked = true;
          reject(new Error('Storage upgrade blocked'));
        };
      });
      opened = db;
      const values = await new Promise<Map<string, string>>((resolve, reject) => {
        const entries = new Map<string, string>();
        const tx = db.transaction(STORE, 'readonly');
        const request = tx.objectStore(STORE).openCursor();
        request.onsuccess = () => {
          const cursor = request.result;
          if (!cursor) return;
          if (typeof cursor.key === 'string' && typeof cursor.value === 'string') {
            entries.set(cursor.key, cursor.value);
          }
          cursor.continue();
        };
        tx.oncomplete = () => resolve(entries);
        tx.addEventListener('error', () => reject(tx.error));
        tx.addEventListener('abort', () => reject(tx.error));
      });
      database = db;
      durableReady = true;
      for (const [key, value] of values) {
        if (isDurableKey(key)) cache.set(key, value);
        else if (isCurrentSortKey(key)) {
          try {
            if (localStorage.getItem(key) === null) localStorage.setItem(key, value);
            if (localStorage.getItem(key) !== null) {
              try {
                await transaction((store) => store.delete(key));
              } catch {}
            }
          } catch {
            pending.set(key, value);
            failed.add(key);
            notify();
          }
        }
      }
      const legacy = new Map<string, string>();
      try {
        for (let index = 0; index < localStorage.length; index++) {
          const key = localStorage.key(index);
          if (!key || !isDurableKey(key)) continue;
          const value = localStorage.getItem(key);
          if (value !== null) {
            legacy.set(key, value);
            if (!cache.has(key)) legacyBackups.set(key, value);
          }
        }
      } catch {}
      if (legacy.size) {
        try {
          const committed = new Map<string, string>();
          await transaction((store) => {
            for (const [key, value] of legacy) {
              const request = store.get(key);
              request.onsuccess = () => {
                if (request.result === undefined) {
                  store.put(value, key);
                  committed.set(key, value);
                } else if (typeof request.result === 'string') {
                  committed.set(key, request.result);
                }
              };
            }
          });
          for (const [key, value] of committed) {
            cache.set(key, value);
            try {
              if (legacy.get(key) === value && localStorage.getItem(key) === value) {
                localStorage.removeItem(key);
                legacyBackups.delete(key);
              }
            } catch {}
          }
        } catch {
          for (const [key, value] of legacy) {
            if (cache.has(key)) continue;
            cache.set(key, value);
            pending.set(key, value);
            failed.add(key);
          }
          notify();
        }
      }
      try {
        if (typeof BroadcastChannel !== 'undefined') {
          channel = new BroadcastChannel('the-sorter-storage');
          channel.addEventListener(
            'message',
            ({ data }: MessageEvent<{ key?: string; clear?: boolean }>) => {
              if (!database || !data) return;
              if (data.clear) {
                const keys = [...cache.keys()];
                for (const key of keys) {
                  if (pending.has(key)) continue;
                  cache.delete(key);
                  announce(key, null);
                }
                return;
              }
              const key = data.key;
              if (typeof key !== 'string' || !isDurableKey(key) || pending.has(key)) return;
              const tx = database.transaction(STORE, 'readonly');
              const request = tx.objectStore(STORE).get(key);
              tx.oncomplete = () => {
                if (pending.has(key)) return;
                const value = typeof request.result === 'string' ? request.result : null;
                if (value === null) cache.delete(key);
                else cache.set(key, value);
                announce(key, value);
              };
            }
          );
        }
      } catch {}
      db.onversionchange = () => {
        db.close();
        database = undefined;
        failed.add('__database__');
        notify();
      };
    } catch {
      opened?.close();
      database = undefined;
      durableReady = false;
      initializationFailed = true;
      try {
        for (let index = 0; index < localStorage.length; index++) {
          const key = localStorage.key(index);
          if (!key || !isDurableKey(key)) continue;
          const value = localStorage.getItem(key);
          if (value !== null) cache.set(key, value);
        }
      } catch {}
      failed.add('__database__');
      notify();
    }
  })();
  return initialization;
};

export const flushAppStorage = async () => {
  let current: Promise<void>;
  do {
    current = writes;
    await current;
  } while (current !== writes);
  if (pending.size > 0 || failed.size > 0)
    throw new Error('Changes have not been saved. Export sessions before reloading.');
};

export const clearAppStorage = async () => {
  await initializeStorage();
  await writes;
  if ((durableReady || initializationFailed) && !database)
    throw new Error('Session storage is unavailable. Reload before clearing data.');
  if (database) await transaction((store) => store.clear());
  localStorage.clear();
  cache.clear();
  legacyBackups.clear();
  try {
    channel?.postMessage({ clear: true });
  } catch {}
  pending.clear();
  failed.clear();
  notify();
};
