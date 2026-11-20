import { flushAppStorage } from './storage';
import { bootstrapAssetRecovery } from './asset-recovery-bootstrap';

let recovering = false;

export const recoverAssetError = async (error: unknown): Promise<boolean> => {
  if (
    recovering ||
    !(error instanceof Error) ||
    !/Failed to fetch dynamically imported module|Importing a module script failed|Failed to load module script|error loading dynamically imported module|Unable to preload CSS/i.test(
      error.message
    )
  ) {
    return false;
  }

  recovering = true;
  bootstrapAssetRecovery(import.meta.env.PUBLIC_ENV__BUILD_TIMESTAMP ?? 'development');
  try {
    await flushAppStorage();
    return window.__sorterAssetRecovery!.reload();
  } catch {
    window.__sorterAssetRecovery?.showUnavailable?.(true);
    return false;
  } finally {
    recovering = false;
  }
};

export const installRuntimeAssetRecovery = () => {
  bootstrapAssetRecovery(import.meta.env.PUBLIC_ENV__BUILD_TIMESTAMP ?? 'development');
  window.__sorterAssetRecovery!.recover = recoverAssetError;
  const url = new URL(window.location.href);
  if (url.searchParams.has('__sorter_reload')) {
    url.searchParams.delete('__sorter_reload');
    window.history.replaceState(window.history.state, '', url.href);
  }
};
