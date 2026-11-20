import { IDBFactory } from 'fake-indexeddb';
import { beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal('indexedDB', new IDBFactory());
  vi.stubGlobal('BroadcastChannel', undefined);
  localStorage.clear();
});

const openDatabase = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('the-sorter', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('sessions');
    request.onsuccess = () => resolve(request.result);
    request.addEventListener('error', () => reject(request.error));
  });

const read = async (key: string) => {
  const database = await openDatabase();
  return new Promise<unknown>((resolve, reject) => {
    const tx = database.transaction('sessions', 'readonly');
    const request = tx.objectStore('sessions').get(key);
    tx.oncomplete = () => {
      database.close();
      resolve(request.result);
    };
    tx.addEventListener('error', () => reject(tx.error));
  });
};

describe('session storage', () => {
  it('preserves pending local writes when another tab clears storage', async () => {
    let receive: ((event: MessageEvent) => void) | undefined;
    vi.stubGlobal(
      'BroadcastChannel',
      class {
        addEventListener(_type: string, listener: (event: MessageEvent) => void) {
          receive = listener;
        }
        postMessage() {}
      }
    );
    const storage = await import('../storage');
    await storage.initializeStorage();
    storage.appStorage.setItem('saved-sort-states', '"pending"');
    receive?.(new MessageEvent('message', { data: { clear: true } }));
    await storage.flushAppStorage();
    expect(storage.appStorage.getItem('saved-sort-states')).toBe('"pending"');
    expect(await read('saved-sort-states')).toBe('"pending"');
  });

  it('moves bulky legacy data after committing it and leaves preferences in localStorage', async () => {
    const values = {
      'sort-log': '{"sessionId":"session","choices":"L"}',
      'songs-sort-state-history': '[{"arr":[["2"]]}]',
      'saved-sort-states': '[{"id":"saved"}]',
      'perf-songs-meta': '{"performanceIds":[1]}',
      'heardle-guess-results': '{"1":{"result":"correct"}}',
      'setlist-predictions-v1': '{"prediction":{"id":"prediction"}}'
    };
    for (const [key, value] of Object.entries(values)) localStorage.setItem(key, value);
    localStorage.setItem('color-mode', '"dark"');
    localStorage.setItem('sort-state', '"current"');
    localStorage.setItem('songs-comparisons-count', '5');
    const { initializeStorage, appStorage } = await import('../storage');
    await initializeStorage();

    for (const [key, value] of Object.entries(values)) {
      expect(appStorage.getItem(key)).toBe(value);
      expect(await read(key)).toBe(value);
      expect(localStorage.getItem(key)).toBeNull();
    }
    expect(localStorage.getItem('color-mode')).toBe('"dark"');
    expect(localStorage.getItem('sort-state')).toBe('"current"');
    expect(localStorage.getItem('songs-comparisons-count')).toBe('5');
    expect(await read('sort-state')).toBeUndefined();
    expect(await read('songs-comparisons-count')).toBeUndefined();
  });

  it('persists a session larger than the localStorage budget without a legacy copy', async () => {
    const storage = await import('../storage');
    await storage.initializeStorage();
    const value = JSON.stringify('x'.repeat(6 * 1024 * 1024));
    storage.appStorage.setItem('songs-sort-state-history', value);
    await storage.flushAppStorage();
    expect(await read('songs-sort-state-history')).toBe(value);
    expect(localStorage.getItem('songs-sort-state-history')).toBeNull();
  });

  it('preserves existing database values and conflicting legacy copies', async () => {
    const database = await openDatabase();
    await new Promise<void>((resolve) => {
      const tx = database.transaction('sessions', 'readwrite');
      tx.objectStore('sessions').put('"newer"', 'saved-sort-states');
      tx.oncomplete = () => resolve();
    });
    database.close();
    localStorage.setItem('saved-sort-states', '"legacy"');
    const { initializeStorage, appStorage } = await import('../storage');
    await initializeStorage();
    expect(appStorage.getItem('saved-sort-states')).toBe('"newer"');
    expect(await read('saved-sort-states')).toBe('"newer"');
    expect(localStorage.getItem('saved-sort-states')).toBe('"legacy"');
  });

  it('serializes rapid updates and removals before flushing', async () => {
    const { initializeStorage, appStorage, flushAppStorage } = await import('../storage');
    await initializeStorage();
    appStorage.setItem('songs-sort-state-history', '"first"');
    appStorage.setItem('songs-sort-state-history', '"second"');
    appStorage.setItem('songs-sort-state-history', '"first"');
    await flushAppStorage();
    expect(await read('songs-sort-state-history')).toBe('"first"');
    expect(localStorage.getItem('songs-sort-state-history')).toBeNull();
    appStorage.removeItem('songs-sort-state-history');
    await flushAppStorage();
    expect(await read('songs-sort-state-history')).toBeNull();
  });

  it('does not resurrect a conflicting legacy copy after an intentional deletion', async () => {
    const database = await openDatabase();
    await new Promise<void>((resolve) => {
      const tx = database.transaction('sessions', 'readwrite');
      tx.objectStore('sessions').put('"newer"', 'saved-sort-states');
      tx.oncomplete = () => resolve();
    });
    database.close();
    localStorage.setItem('saved-sort-states', '"legacy"');
    const storage = await import('../storage');
    await storage.initializeStorage();
    storage.appStorage.removeItem('saved-sort-states');
    await storage.flushAppStorage();
    vi.resetModules();
    const reloaded = await import('../storage');
    await reloaded.initializeStorage();
    expect(reloaded.appStorage.getItem('saved-sort-states')).toBeNull();
  });

  it('keeps a deletion authoritative when legacy cleanup cannot remove its backup', async () => {
    localStorage.setItem('saved-sort-states', '"legacy"');
    const remove = vi.spyOn(localStorage, 'removeItem').mockImplementation(() => {
      throw new DOMException('Denied', 'SecurityError');
    });
    const storage = await import('../storage');
    await storage.initializeStorage();
    storage.appStorage.removeItem('saved-sort-states');
    await storage.flushAppStorage();
    expect(localStorage.getItem('saved-sort-states')).toBe('"legacy"');
    expect(await read('saved-sort-states')).toBeNull();
    vi.resetModules();
    const reloaded = await import('../storage');
    await reloaded.initializeStorage();
    expect(reloaded.appStorage.getItem('saved-sort-states')).toBeNull();
    expect(
      Array.from({ length: reloaded.appStorage.length }, (_, i) => reloaded.appStorage.key(i))
    ).not.toContain('saved-sort-states');
    remove.mockRestore();
  });

  it('keeps legacy data when migration cannot commit and allows retry', async () => {
    localStorage.setItem('saved-sort-states', '"legacy"');
    const database = await openDatabase();
    const prototype = Object.getPrototypeOf(database) as IDBDatabase;
    const original = prototype.transaction;
    const transaction = vi.spyOn(prototype, 'transaction').mockImplementation(function (
      this: IDBDatabase,
      stores: string | Iterable<string>,
      mode?: IDBTransactionMode,
      options?: IDBTransactionOptions
    ) {
      if (mode === 'readwrite') throw new DOMException('Full', 'QuotaExceededError');
      return original.call(this, stores, mode, options);
    });
    database.close();
    const storage = await import('../storage');
    await storage.initializeStorage();
    expect(localStorage.getItem('saved-sort-states')).toBe('"legacy"');
    expect(storage.appStorage.getItem('saved-sort-states')).toBe('"legacy"');
    expect(storage.hasStorageFailure()).toBe(true);
    await expect(storage.flushAppStorage()).rejects.toThrow('not been saved');
    transaction.mockRestore();
    storage.appStorage.setItem('saved-sort-states', '"recovered"');
    await storage.flushAppStorage();
    expect(await read('saved-sort-states')).toBe('"recovered"');
    expect(storage.hasStorageFailure()).toBe(false);
  });

  it('falls back without crashing when both database and local storage are unavailable', async () => {
    vi.stubGlobal('indexedDB', {
      open: () => {
        throw new DOMException('Denied', 'SecurityError');
      }
    });
    const storage = await import('../storage');
    await storage.initializeStorage();
    vi.spyOn(localStorage, 'setItem').mockImplementationOnce(() => {
      throw new DOMException('Full', 'QuotaExceededError');
    });
    storage.appStorage.setItem('saved-sort-states', '"current"');
    storage.appStorage.setItem('sort-state', '"active"');
    expect(storage.appStorage.getItem('sort-state')).toBe('"active"');
    expect(storage.appStorage.getItem('saved-sort-states')).toBe('"current"');
    expect(storage.isStoragePersisted('saved-sort-states')).toBe(false);
    expect(storage.hasStorageFailure()).toBe(true);
    await expect(storage.flushAppStorage()).rejects.toThrow('not been saved');
  });

  it('keeps newer database data visible if a legacy migration transaction fails', async () => {
    const database = await openDatabase();
    await new Promise<void>((resolve) => {
      const tx = database.transaction('sessions', 'readwrite');
      tx.objectStore('sessions').put('"newer"', 'saved-sort-states');
      tx.oncomplete = () => resolve();
    });
    localStorage.setItem('saved-sort-states', '"legacy"');
    localStorage.setItem('songs-sort-state-history', '"unmigrated"');
    const prototype = Object.getPrototypeOf(database) as IDBDatabase;
    const original = prototype.transaction;
    const transaction = vi.spyOn(prototype, 'transaction').mockImplementation(function (
      this: IDBDatabase,
      stores: string | Iterable<string>,
      mode?: IDBTransactionMode,
      options?: IDBTransactionOptions
    ) {
      if (mode === 'readwrite') throw new DOMException('Full', 'QuotaExceededError');
      return original.call(this, stores, mode, options);
    });
    database.close();
    const storage = await import('../storage');
    await storage.initializeStorage();
    expect(storage.appStorage.getItem('saved-sort-states')).toBe('"newer"');
    expect(storage.isStoragePersisted('saved-sort-states')).toBe(true);
    expect(storage.appStorage.getItem('songs-sort-state-history')).toBe('"unmigrated"');
    expect(storage.isStoragePersisted('songs-sort-state-history')).toBe(false);
    expect(localStorage.getItem('saved-sort-states')).toBe('"legacy"');
    transaction.mockRestore();
    expect(await read('saved-sort-states')).toBe('"newer"');
  });

  it('warns and keeps durable changes in memory when a populated database cannot be read', async () => {
    const database = await openDatabase();
    await new Promise<void>((resolve) => {
      const tx = database.transaction('sessions', 'readwrite');
      tx.objectStore('sessions').put('"database"', 'saved-sort-states');
      tx.oncomplete = () => resolve();
    });
    localStorage.setItem('saved-sort-states', '"legacy"');
    const prototype = Object.getPrototypeOf(database) as IDBDatabase;
    const original = prototype.transaction;
    const transaction = vi.spyOn(prototype, 'transaction').mockImplementation(function (
      this: IDBDatabase,
      stores: string | Iterable<string>,
      mode?: IDBTransactionMode,
      options?: IDBTransactionOptions
    ) {
      if (mode === 'readonly') throw new DOMException('Denied', 'SecurityError');
      return original.call(this, stores, mode, options);
    });
    database.close();
    const storage = await import('../storage');
    await storage.initializeStorage();
    expect(storage.appStorage.getItem('saved-sort-states')).toBe('"legacy"');
    expect(storage.hasStorageFailure()).toBe(true);
    expect(storage.isStoragePersisted('saved-sort-states')).toBe(false);
    storage.appStorage.setItem('saved-sort-states', '"memory only"');
    storage.appStorage.setItem('sort-state', '"current sort"');
    expect(storage.appStorage.getItem('saved-sort-states')).toBe('"memory only"');
    expect(localStorage.getItem('saved-sort-states')).toBe('"legacy"');
    expect(localStorage.getItem('sort-state')).toBe('"current sort"');
    await expect(storage.flushAppStorage()).rejects.toThrow('not been saved');
    transaction.mockRestore();
    expect(await read('saved-sort-states')).toBe('"database"');
  });

  it('uses localStorage alone for current sorts and never restores stale database copies', async () => {
    const database = await openDatabase();
    await new Promise<void>((resolve) => {
      const tx = database.transaction('sessions', 'readwrite');
      tx.objectStore('sessions').put('"older database state"', 'sort-state');
      tx.objectStore('sessions').put('"restored state"', 'songs-sort-state');
      tx.objectStore('sessions').put('12', 'songs-comparisons-count');
      tx.oncomplete = () => resolve();
    });
    database.close();
    localStorage.setItem('sort-state', '"current local state"');
    const storage = await import('../storage');
    await storage.initializeStorage();
    expect(storage.appStorage.getItem('sort-state')).toBe('"current local state"');
    expect(storage.appStorage.getItem('songs-sort-state')).toBeNull();
    expect(localStorage.getItem('songs-sort-state')).toBeNull();
    expect(localStorage.getItem('songs-comparisons-count')).toBeNull();
    storage.appStorage.removeItem('sort-state');
    await storage.flushAppStorage();
    vi.resetModules();
    const reloaded = await import('../storage');
    await reloaded.initializeStorage();
    expect(reloaded.appStorage.getItem('sort-state')).toBeNull();
    expect(await read('sort-state')).toBe('"older database state"');
  });

  it('clears the database and legacy preferences together', async () => {
    const storage = await import('../storage');
    await storage.initializeStorage();
    storage.appStorage.setItem('saved-sort-states', '["saved"]');
    storage.appStorage.setItem('color-mode', '"dark"');
    await storage.flushAppStorage();
    await storage.clearAppStorage();
    expect(await read('saved-sort-states')).toBeNull();
    expect(storage.appStorage.getItem('saved-sort-states')).toBeNull();
    expect(localStorage.getItem('color-mode')).toBeNull();
  });

  it('preserves deletion tombstones if clearing localStorage fails', async () => {
    localStorage.setItem('saved-sort-states', '"legacy"');
    const remove = vi.spyOn(localStorage, 'removeItem').mockImplementation(() => {
      throw new DOMException('Denied', 'SecurityError');
    });
    const storage = await import('../storage');
    await storage.initializeStorage();
    storage.appStorage.removeItem('saved-sort-states');
    await storage.flushAppStorage();
    const clear = vi.spyOn(localStorage, 'clear').mockImplementationOnce(() => {
      throw new DOMException('Denied', 'SecurityError');
    });
    await expect(storage.clearAppStorage()).rejects.toThrow('Denied');
    expect(storage.hasStorageFailure()).toBe(true);
    vi.resetModules();
    const reloaded = await import('../storage');
    await reloaded.initializeStorage();
    expect(reloaded.appStorage.getItem('saved-sort-states')).toBeNull();
    expect(await read('saved-sort-states')).toBeNull();
    remove.mockRestore();
    clear.mockRestore();
    vi.resetModules();
    const recovered = await import('../storage');
    await recovered.initializeStorage();
    expect(localStorage.getItem('saved-sort-states')).toBeNull();
    expect(recovered.appStorage.getItem('saved-sort-states')).toBeNull();
  });
});
