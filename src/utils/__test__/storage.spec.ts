import { IDBFactory } from 'fake-indexeddb';
import { webcrypto } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal('crypto', webcrypto);
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
  it('recovers saved sessions created while downgraded without replacing current saves', async () => {
    localStorage.setItem('saved-sort-states', '[{"id":"original","name":"Original"}]');
    const first = await import('../storage');
    await first.initializeStorage();
    localStorage.setItem('saved-sort-states', '[{"id":"rollback","name":"Rollback"}]');
    vi.resetModules();
    const next = await import('../storage');
    await next.initializeStorage();
    expect(JSON.parse(next.appStorage.getItem('saved-sort-states')!)).toEqual([
      { id: 'original', name: 'Original' },
      { id: 'rollback', name: 'Rollback' }
    ]);
    expect(localStorage.getItem('saved-sort-states')).toBeNull();
  });

  it('recovers new legacy saves after deletion without reviving an unchanged backup', async () => {
    localStorage.setItem('saved-sort-states', '[{"id":"deleted"}]');
    const first = await import('../storage');
    await first.initializeStorage();
    first.appStorage.removeItem('saved-sort-states');
    await first.flushAppStorage();
    localStorage.setItem('saved-sort-states', '[{"id":"new-on-old-version"}]');
    vi.resetModules();
    const next = await import('../storage');
    await next.initializeStorage();
    expect(JSON.parse(next.appStorage.getItem('saved-sort-states')!)).toEqual([
      { id: 'new-on-old-version' }
    ]);
  });

  it('keeps both revisions when older code edits a saved session', async () => {
    localStorage.setItem('saved-sort-states', '[{"id":"same","name":"Current"}]');
    const first = await import('../storage');
    await first.initializeStorage();
    localStorage.setItem('saved-sort-states', '[{"id":"same","name":"Changed on old version"}]');
    vi.resetModules();
    const next = await import('../storage');
    await next.initializeStorage();
    const recovered = JSON.parse(next.appStorage.getItem('saved-sort-states')!);
    expect(recovered.map((entry: { name: string }) => entry.name)).toEqual([
      'Current',
      'Changed on old version'
    ]);
    expect(new Set(recovered.map((entry: { id: string }) => entry.id)).size).toBe(2);
  });

  it('uses history and log written by a downgraded version with its newer current state', async () => {
    localStorage.setItem('sort-state-history', '["old-history"]');
    localStorage.setItem('sort-log', '"old-log"');
    const first = await import('../storage');
    await first.initializeStorage();
    localStorage.setItem('sort-state', '"new-current"');
    localStorage.setItem('comparisons-count', '5');
    localStorage.setItem('sort-state-history', '["before-downgrade-step"]');
    localStorage.setItem('sort-log', '"new-log"');
    vi.resetModules();
    const next = await import('../storage');
    await next.initializeStorage();
    expect(next.appStorage.getItem('sort-state')).toBe('"new-current"');
    expect(next.appStorage.getItem('sort-state-history')).toBe('["before-downgrade-step"]');
    expect(next.appStorage.getItem('sort-log')).toBe('"new-log"');
  });
  it('does not revive unchanged deleted saves from an older tab adding a save', async () => {
    const original = '[{"id":"deleted","name":"Original"}]';
    localStorage.setItem('saved-sort-states', original);
    const first = await import('../storage');
    await first.initializeStorage();
    first.appStorage.setItem('saved-sort-states', '[]');
    await first.flushAppStorage();
    localStorage.setItem(
      'saved-sort-states',
      '[{"id":"new","name":"New"},{"id":"deleted","name":"Original"}]'
    );
    vi.resetModules();
    const next = await import('../storage');
    await next.initializeStorage();
    expect(JSON.parse(next.appStorage.getItem('saved-sort-states')!)).toEqual([
      { id: 'new', name: 'New' }
    ]);
  });

  it('clears a stale log when older code advanced without a log', async () => {
    localStorage.setItem('sort-state-history', '["old"]');
    localStorage.setItem('sort-log', '"old-log"');
    const first = await import('../storage');
    await first.initializeStorage();
    localStorage.setItem('sort-state-history', '["downgrade"]');
    vi.resetModules();
    const next = await import('../storage');
    await next.initializeStorage();
    expect(next.appStorage.getItem('sort-state-history')).toBe('["downgrade"]');
    expect(next.appStorage.getItem('sort-log')).toBeNull();
  });

  it('keeps reconciled saves recoverable if migration aborts after reading conflicts', async () => {
    localStorage.setItem('saved-sort-states', '[{"id":"first"}]');
    localStorage.setItem('sort-state-history', '["old-history"]');
    localStorage.setItem('sort-log', '"old-log"');
    const first = await import('../storage');
    await first.initializeStorage();
    localStorage.setItem('saved-sort-states', '[{"id":"downgraded"}]');
    localStorage.setItem('sort-state-history', '["new-history"]');
    const database = await openDatabase();
    const prototype = Object.getPrototypeOf(
      database.transaction('sessions').objectStore('sessions')
    ) as IDBObjectStore;
    const original = prototype.get;
    let aborted = false;
    const get = vi.spyOn(prototype, 'get').mockImplementation(function (
      this: IDBObjectStore,
      key: IDBValidKey | IDBKeyRange
    ) {
      const request = original.call(this, key);
      if (!aborted && key === 'saved-sort-states' && this.transaction.mode === 'readwrite') {
        aborted = true;
        request.addEventListener('success', () => queueMicrotask(() => this.transaction.abort()));
      }
      return request;
    });
    database.close();
    vi.resetModules();
    const next = await import('../storage');
    await next.initializeStorage();
    get.mockRestore();
    expect(aborted).toBe(true);
    expect(next.hasStorageFailure()).toBe(true);
    expect(next.appStorage.getItem('sort-log')).toBeNull();
    expect(next.appStorage.getItem('sort-state-history')).toBe('["new-history"]');
    expect(
      JSON.parse(next.appStorage.getItem('saved-sort-states')!).map((s: { id: string }) => s.id)
    ).toEqual(['first', 'downgraded']);
    expect(localStorage.getItem('saved-sort-states')).toBe('[{"id":"downgraded"}]');
    expect(await read('saved-sort-states')).toBe('[{"id":"first"}]');
    await expect(next.flushAppStorage()).rejects.toThrow('not been saved');
  });
  it('preserves deleted-save provenance when clearing all data', async () => {
    localStorage.setItem('saved-sort-states', '[{"id":"deleted"}]');
    const first = await import('../storage');
    await first.initializeStorage();
    await first.clearAppStorage();
    localStorage.setItem('saved-sort-states', '[{"id":"deleted"},{"id":"new"}]');
    vi.resetModules();
    const next = await import('../storage');
    await next.initializeStorage();
    expect(JSON.parse(next.appStorage.getItem('saved-sort-states')!)).toEqual([{ id: 'new' }]);
  });

  it('does not rewind reconciliation provenance from an older current-version tab', async () => {
    localStorage.setItem('saved-sort-states', '[{"id":"a"}]');
    const stale = await import('../storage');
    await stale.initializeStorage();
    localStorage.setItem('saved-sort-states', '[{"id":"a"},{"id":"b"}]');
    vi.resetModules();
    const upgraded = await import('../storage');
    await upgraded.initializeStorage();
    stale.appStorage.setItem('saved-sort-states', '[]');
    await stale.flushAppStorage();
    localStorage.setItem('saved-sort-states', '[{"id":"a"},{"id":"b"},{"id":"c"}]');
    vi.resetModules();
    const next = await import('../storage');
    await next.initializeStorage();
    expect(JSON.parse(next.appStorage.getItem('saved-sort-states')!)).toEqual([{ id: 'c' }]);
  });
  it('clears erased payloads while retaining compact deletion fingerprints across repeated clears', async () => {
    localStorage.setItem(
      'saved-sort-states',
      '[{"id":"private","name":"PRIVATE-PAYLOAD","log":"PRIVATE-LOG"}]'
    );
    const first = await import('../storage');
    await first.initializeStorage();
    await first.clearAppStorage();
    const baseline = await read('__legacy__:saved-sort-states');
    expect(String(baseline)).not.toContain('PRIVATE');
    expect(String(baseline)).toContain('fingerprint');
    await first.clearAppStorage();
    expect(await read('__legacy__:saved-sort-states')).toBe(baseline);
    localStorage.setItem(
      'saved-sort-states',
      '[{"id":"private","name":"PRIVATE-PAYLOAD","log":"PRIVATE-LOG"},{"id":"new"}]'
    );
    vi.resetModules();
    const next = await import('../storage');
    await next.initializeStorage();
    expect(JSON.parse(next.appStorage.getItem('saved-sort-states')!)).toEqual([{ id: 'new' }]);
  });
  it('preserves null tombstones if reconciliation aborts after reading an obsolete backup', async () => {
    localStorage.setItem('saved-sort-states', '[{"id":"deleted"}]');
    const remove = vi.spyOn(localStorage, 'removeItem').mockImplementation(() => {
      throw new DOMException('Denied', 'SecurityError');
    });
    const first = await import('../storage');
    await first.initializeStorage();
    first.appStorage.removeItem('saved-sort-states');
    await first.flushAppStorage();
    const database = await openDatabase();
    const prototype = Object.getPrototypeOf(
      database.transaction('sessions').objectStore('sessions')
    ) as IDBObjectStore;
    const original = prototype.get;
    let aborted = false;
    const get = vi.spyOn(prototype, 'get').mockImplementation(function (
      this: IDBObjectStore,
      key: IDBValidKey | IDBKeyRange
    ) {
      const request = original.call(this, key);
      if (!aborted && key === 'saved-sort-states' && this.transaction.mode === 'readwrite') {
        aborted = true;
        request.addEventListener('success', () => queueMicrotask(() => this.transaction.abort()));
      }
      return request;
    });
    database.close();
    vi.resetModules();
    const next = await import('../storage');
    await next.initializeStorage();
    get.mockRestore();
    remove.mockRestore();
    expect(next.appStorage.getItem('saved-sort-states')).toBeNull();
    expect(await read('saved-sort-states')).toBeNull();
  });
  it('retains deleted-save provenance across repeated downgrade and reupgrade cycles', async () => {
    localStorage.setItem('saved-sort-states', '[{"id":"a"}]');
    const first = await import('../storage');
    await first.initializeStorage();
    first.appStorage.setItem('saved-sort-states', '[]');
    await first.flushAppStorage();
    localStorage.setItem('saved-sort-states', '[{"id":"b"}]');
    vi.resetModules();
    const second = await import('../storage');
    await second.initializeStorage();
    localStorage.setItem('saved-sort-states', '[{"id":"a"},{"id":"b"},{"id":"c"}]');
    vi.resetModules();
    const third = await import('../storage');
    await third.initializeStorage();
    expect(JSON.parse(third.appStorage.getItem('saved-sort-states')!)).toEqual([
      { id: 'b' },
      { id: 'c' }
    ]);
  });
  it('reads current provenance after another upgrade finishes while hashing legacy saves', async () => {
    localStorage.setItem('saved-sort-states', '[{"id":"a"}]');
    const first = await import('../storage');
    await first.initializeStorage();
    localStorage.setItem('saved-sort-states', '[{"id":"b"}]');
    const original = crypto.subtle.digest.bind(crypto.subtle);
    let resume!: () => void;
    let started!: () => void;
    const entered = new Promise<void>((resolve) => {
      started = resolve;
    });
    const gate = new Promise<void>((resolve) => {
      resume = resolve;
    });
    const digest = vi
      .spyOn(crypto.subtle, 'digest')
      .mockImplementationOnce(async (algorithm, data) => {
        started();
        await gate;
        return original(algorithm, data);
      });
    vi.resetModules();
    const slow = await import('../storage');
    const initialization = slow.initializeStorage();
    await entered;
    vi.resetModules();
    const fast = await import('../storage');
    await fast.initializeStorage();
    fast.appStorage.setItem('saved-sort-states', '[]');
    await fast.flushAppStorage();
    resume();
    await initialization;
    digest.mockRestore();
    expect(JSON.parse(slow.appStorage.getItem('saved-sort-states')!)).toEqual([]);
    expect(JSON.parse(String(await read('saved-sort-states')))).toEqual([]);
  });
  it('does not reimport history already consumed by a faster upgrade', async () => {
    localStorage.setItem('saved-sort-states', '[{"id":"a"}]');
    localStorage.setItem('sort-state-history', '["original"]');
    const first = await import('../storage');
    await first.initializeStorage();
    localStorage.setItem('saved-sort-states', '[{"id":"b"}]');
    localStorage.setItem('sort-state-history', '["downgrade"]');
    const original = crypto.subtle.digest.bind(crypto.subtle);
    let resume!: () => void;
    let started!: () => void;
    const entered = new Promise<void>((resolve) => {
      started = resolve;
    });
    const gate = new Promise<void>((resolve) => {
      resume = resolve;
    });
    const digest = vi
      .spyOn(crypto.subtle, 'digest')
      .mockImplementationOnce(async (algorithm, data) => {
        started();
        await gate;
        return original(algorithm, data);
      });
    vi.resetModules();
    const slow = await import('../storage');
    const initialization = slow.initializeStorage();
    await entered;
    vi.resetModules();
    const fast = await import('../storage');
    await fast.initializeStorage();
    fast.appStorage.setItem('sort-state-history', '["current-after-new-step"]');
    fast.appStorage.setItem('sort-log', '"current-log"');
    await fast.flushAppStorage();
    resume();
    await initialization;
    digest.mockRestore();
    expect(await read('sort-state-history')).toBe('["current-after-new-step"]');
    expect(await read('sort-log')).toBe('"current-log"');
    expect(slow.appStorage.getItem('sort-log')).toBe('"current-log"');
    expect(slow.appStorage.getItem('sort-state-history')).toBe('["current-after-new-step"]');
  });
});
