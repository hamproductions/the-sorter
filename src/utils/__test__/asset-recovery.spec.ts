import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { recoverAssetError } from '../asset-recovery';
import { flushAppStorage } from '../storage';

vi.mock('../storage', () => ({ flushAppStorage: vi.fn() }));

beforeEach(() => {
  vi.mocked(flushAppStorage).mockResolvedValue(undefined);
  window.__sorterAssetRecovery = { reload: vi.fn(() => true) };
});

afterEach(() => {
  delete window.__sorterAssetRecovery;
});

describe('asset recovery', () => {
  it.each([
    'Failed to fetch dynamically imported module: /assets/chunks/old.js',
    'Importing a module script failed.',
    'error loading dynamically imported module: /assets/chunks/old.js',
    'Unable to preload CSS for /assets/static/old.css'
  ])('flushes saved changes before recovering %s', async (message) => {
    const reload = vi.fn(() => true);
    window.__sorterAssetRecovery = { reload };
    expect(await recoverAssetError(new Error(message))).toBe(true);
    expect(flushAppStorage).toHaveBeenCalled();
    expect(reload).toHaveBeenCalledOnce();
    expect(vi.mocked(flushAppStorage).mock.invocationCallOrder.at(-1)).toBeLessThan(
      reload.mock.invocationCallOrder[0]
    );
  });

  it('keeps unsaved changes in the tab when persistence fails', async () => {
    const showUnavailable = vi.fn();
    window.__sorterAssetRecovery!.showUnavailable = showUnavailable;
    vi.mocked(flushAppStorage).mockRejectedValue(new Error('Storage is full'));
    expect(await recoverAssetError(new Error('Unable to preload CSS for /old.css'))).toBe(false);
    expect(window.__sorterAssetRecovery?.reload).not.toHaveBeenCalled();
    expect(showUnavailable).toHaveBeenCalledWith(true);
  });

  it('does not reload unrelated application errors', async () => {
    expect(await recoverAssetError(new Error('Invalid ranking'))).toBe(false);
    expect(window.__sorterAssetRecovery?.reload).not.toHaveBeenCalled();
  });
});
