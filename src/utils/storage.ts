const DATABASE = 'the-sorter';
const STORE = 'sessions';
const LEGACY = '__legacy__:';
const BACKUP = '__backup__:';
const cache = new Map<string, string | null>();
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

const fingerprint = async (value: unknown) => {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(JSON.stringify(value))
  );
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

const isSaveList = (value: unknown): value is { id: string }[] =>
  Array.isArray(value) &&
  value.every(
    (save: unknown) =>
      !!save && typeof save === 'object' && 'id' in save && typeof save.id === 'string'
  );

const mergeLegacySaves = (
  existing: unknown,
  legacy: string,
  baseline?: string | null,
  fingerprints?: Map<string, string>
): string | null | undefined => {
  try {
    const current: unknown = existing === null ? [] : JSON.parse(String(existing));
    const incoming: unknown = JSON.parse(legacy);
    if (!isSaveList(current) || !isSaveList(incoming)) return;
    const previous: unknown = baseline ? JSON.parse(baseline) : [];
    if (!isSaveList(previous)) return;
    const merged = [...current];
    for (const save of incoming) {
      if (
        previous.some(
          (entry) =>
            entry.id === save.id &&
            (JSON.stringify(entry) === JSON.stringify(save) ||
              ('fingerprint' in entry &&
                entry.fingerprint === fingerprints?.get(JSON.stringify(save))))
        )
      )
        continue;
      const matching = merged.find((entry) => entry.id === save.id);
      if (!matching) merged.push(save);
      else if (JSON.stringify(matching) !== JSON.stringify(save)) {
        merged.push({ ...save, id: crypto.randomUUID() });
      }
    }
    return existing === null && merged.length === 0 ? null : JSON.stringify(merged);
  } catch {
    return;
  }
};

const mergeLegacyBaselines = (previous: unknown, incoming: string | null) => {
  if (incoming === null) return typeof previous === 'string' ? previous : null;
  try {
    const first: unknown = typeof previous === 'string' ? JSON.parse(previous) : [];
    const second: unknown = JSON.parse(incoming);
    if (Array.isArray(first) && Array.isArray(second)) {
      return JSON.stringify([
        ...new Map(
          [...first, ...second].map((save: unknown) => [JSON.stringify(save), save])
        ).values()
      ]);
    }
  } catch {}
  return incoming;
};

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
        store.put(value, key);
        const baseline = store.get(LEGACY + key);
        baseline.onsuccess = () => {
          if (legacyBackups.has(key) || baseline.result === undefined) {
            const legacy = legacyBackups.get(key) ?? null;
            store.put(
              key === 'saved-sort-states' ? mergeLegacyBaselines(baseline.result, legacy) : legacy,
              LEGACY + key
            );
          }
        };
        store.put(legacyBackups.get(key) ?? null, BACKUP + key);
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
          await transaction((store) => store.put(null, BACKUP + key));
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
  const keys = new Set([...cache].filter(([, value]) => value !== null).map(([key]) => key));
  try {
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);
      if (key !== null && cache.get(key) !== null) keys.add(key);
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
      cache.set(key, null);
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
      const values = await new Promise<Map<string, string | null>>((resolve, reject) => {
        const entries = new Map<string, string | null>();
        const tx = db.transaction(STORE, 'readonly');
        const request = tx.objectStore(STORE).openCursor();
        request.onsuccess = () => {
          const cursor = request.result;
          if (!cursor) return;
          if (
            typeof cursor.key === 'string' &&
            (typeof cursor.value === 'string' || cursor.value === null)
          ) {
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
      }
      const legacy = new Map<string, string>();
      try {
        for (let index = 0; index < localStorage.length; index++) {
          const key = localStorage.key(index);
          if (!key || !isDurableKey(key)) continue;
          const value = localStorage.getItem(key);
          if (value !== null) {
            legacy.set(key, value);
          }
        }
      } catch {}
      const fingerprints = new Map<string, string>();
      try {
        const saves: unknown = JSON.parse(legacy.get('saved-sort-states') ?? 'null');
        if (Array.isArray(saves)) {
          await Promise.all(
            saves.map(async (save: unknown) =>
              fingerprints.set(JSON.stringify(save), await fingerprint(save))
            )
          );
        }
      } catch {}
      const resetLogs = [...legacy].flatMap(([key, value]) => {
        if (
          !key.endsWith('sort-state-history') ||
          !values.has(LEGACY + key) ||
          values.get(BACKUP + key) === value
        )
          return [];
        const logKey = key.replace(/state-history$/, 'log');
        return legacy.has(logKey) ? [] : [logKey];
      });
      if (legacy.size || resetLogs.length) {
        const committed = new Map<string, string | null>();
        const removableBackups = new Map<string, string>();
        try {
          await transaction((store) => {
            for (const [key, value] of legacy) {
              const request = store.get(key);
              const baselineRequest = store.get(LEGACY + key);
              const backupRequest = store.get(BACKUP + key);
              let reconciledOnce = false;
              const reconcile = () => {
                if (
                  reconciledOnce ||
                  [request, baselineRequest, backupRequest].some(
                    (read) => read.readyState !== 'done'
                  )
                )
                  return;
                reconciledOnce = true;
                const existing: unknown = request.result;
                const baseline: unknown = baselineRequest.result;
                const backup: unknown = backupRequest.result;
                if (localStorage.getItem(key) !== value) {
                  if (typeof existing === 'string' || existing === null)
                    committed.set(key, existing);
                  return;
                }
                let reconciled = existing;
                let removable = existing === undefined || existing === value || backup === value;
                if (existing === undefined) reconciled = value;
                else if (backup !== value && key === 'saved-sort-states') {
                  const merged = mergeLegacySaves(
                    existing,
                    value,
                    typeof baseline === 'string' ? baseline : null,
                    fingerprints
                  );
                  if (merged !== undefined) {
                    reconciled = merged;
                    removable = true;
                  }
                } else if (backup !== value && baseline !== undefined) {
                  reconciled = value;
                  removable = true;
                }
                if (typeof reconciled === 'string' || reconciled === null) {
                  committed.set(key, reconciled);
                  if (removable) {
                    if (
                      key.endsWith('sort-state-history') &&
                      backup !== value &&
                      baseline !== undefined
                    ) {
                      const logKey = key.replace(/state-history$/, 'log');
                      if (localStorage.getItem(logKey) === null) {
                        store.put(null, logKey);
                        store.put(null, LEGACY + logKey);
                        committed.set(logKey, null);
                      }
                    }
                    store.put(reconciled, key);
                    store.put(
                      key === 'saved-sort-states' ? mergeLegacyBaselines(baseline, value) : value,
                      LEGACY + key
                    );
                    store.put(value, BACKUP + key);
                    removableBackups.set(key, value);
                  }
                }
              };
              request.onsuccess = baselineRequest.onsuccess = backupRequest.onsuccess = reconcile;
            }
          });
          for (const [key, value] of removableBackups) {
            legacyBackups.set(key, value);
          }
          for (const [key, value] of committed) {
            cache.set(key, value);
            try {
              const backup = legacyBackups.get(key);
              if (backup !== undefined && localStorage.getItem(key) === backup) {
                localStorage.removeItem(key);
                await transaction((store) => store.put(null, BACKUP + key));
                legacyBackups.delete(key);
              }
            } catch {}
          }
        } catch {
          for (const key of resetLogs) {
            const historyKey = key.replace(/log$/, 'state-history');
            if (localStorage.getItem(historyKey) !== legacy.get(historyKey)) continue;
            cache.set(key, null);
            pending.set(key, null);
            failed.add(key);
          }
          for (const [key, value] of legacy) {
            if (localStorage.getItem(key) !== value) continue;
            let recovered = committed.get(key);
            if (cache.has(key) && !removableBackups.has(key)) {
              if (key === 'saved-sort-states') {
                recovered = mergeLegacySaves(
                  cache.get(key),
                  value,
                  values.get(LEGACY + key),
                  fingerprints
                );
                if (recovered === undefined) {
                  failed.add(key);
                  continue;
                }
              } else if (values.has(LEGACY + key) && values.get(BACKUP + key) !== value) {
                recovered = value;
              } else continue;
            }
            if (recovered === undefined) recovered = value;
            cache.set(key, recovered);
            legacyBackups.set(key, value);
            pending.set(key, recovered);
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
                if (request.result === undefined) cache.delete(key);
                else cache.set(key, value);
                announce(key, value);
              };
            }
          );
        }
      } catch {}
      await new Promise<void>((resolve, reject) => {
        const latest = new Map<string, string | null>();
        const tx = db.transaction(STORE, 'readonly');
        const request = tx.objectStore(STORE).openCursor();
        request.onsuccess = () => {
          const cursor = request.result;
          if (!cursor) return;
          if (
            typeof cursor.key === 'string' &&
            isDurableKey(cursor.key) &&
            (typeof cursor.value === 'string' || cursor.value === null)
          )
            latest.set(cursor.key, cursor.value);
          cursor.continue();
        };
        tx.oncomplete = () => {
          for (const key of cache.keys())
            if (!pending.has(key) && !latest.has(key)) cache.delete(key);
          for (const [key, value] of latest) if (!pending.has(key)) cache.set(key, value);
          resolve();
        };
        tx.addEventListener('error', () => reject(tx.error));
        tx.addEventListener('abort', () => reject(tx.error));
      });
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

const deletionBaseline = (key: string, current: string | null, baseline: string | null) => {
  const raw = localStorage.getItem(key);
  if (key === 'saved-sort-states') {
    try {
      const versions: unknown[] = [raw, current, baseline]
        .filter((value) => value != null)
        .map((value) => JSON.parse(value!));
      if (versions.every(Array.isArray)) return JSON.stringify(versions.flat());
    } catch {}
  }
  return raw ?? current ?? baseline ?? null;
};

export const clearAppStorage = async () => {
  await initializeStorage();
  await writes;
  if ((durableReady || initializationFailed) && !database)
    throw new Error('Session storage is unavailable. Reload before clearing data.');
  let deletedSaves: unknown[] = [];
  if (database) {
    const keys = storageKeys().filter(isDurableKey);
    await transaction((store) => {
      for (const key of keys) {
        if (!cache.has(key)) store.put(null, key);
      }
      const request = store.openCursor();
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) return;
        const key = cursor.key;
        if (typeof key === 'string' && isDurableKey(key)) {
          const baseline = store.get(LEGACY + key);
          baseline.onsuccess = () => {
            const value = deletionBaseline(key, cursor.value, baseline.result ?? null);
            if (key === 'saved-sort-states' && value) {
              try {
                const parsed: unknown = JSON.parse(value);
                if (Array.isArray(parsed)) deletedSaves = parsed;
              } catch {}
            }
            cursor.update(null);
            store.put(value, LEGACY + key);
            store.put(localStorage.getItem(key), BACKUP + key);
            cursor.continue();
          };
        } else {
          if (typeof key !== 'string' || (!key.startsWith(LEGACY) && !key.startsWith(BACKUP)))
            cursor.delete();
          cursor.continue();
        }
      };
    });
  }
  try {
    localStorage.clear();
  } catch (error) {
    failed.add('__clear__');
    notify();
    throw error;
  }
  if (database) {
    const signatures = await Promise.all(
      deletedSaves.map(async (save) => ({
        id: save && typeof save === 'object' && 'id' in save ? save.id : null,
        fingerprint:
          save &&
          typeof save === 'object' &&
          'fingerprint' in save &&
          typeof save.fingerprint === 'string' &&
          /^[a-f0-9]{64}$/.test(save.fingerprint)
            ? save.fingerprint
            : await fingerprint(save)
      }))
    );
    await transaction((store) => {
      const request = store.openCursor();
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) return;
        if (cursor.key === LEGACY + 'saved-sort-states') cursor.update(JSON.stringify(signatures));
        else if (
          typeof cursor.key === 'string' &&
          (cursor.key.startsWith(LEGACY) || cursor.key.startsWith(BACKUP))
        )
          cursor.update(null);
        cursor.continue();
      };
    });
  }
  cache.clear();
  legacyBackups.clear();
  try {
    channel?.postMessage({ clear: true });
  } catch {}
  pending.clear();
  failed.clear();
  notify();
};
