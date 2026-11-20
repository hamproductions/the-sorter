import { flushAppStorage } from './storage';

const RELOAD_KEY = 'sorter-asset-recovery';
let recovering = false;

export const recoverAssetError = async (error: unknown): Promise<boolean> => {
  if (
    recovering ||
    !(error instanceof Error) ||
    !/Failed to fetch dynamically imported module|Importing a module script failed|Failed to load module script/.test(
      error.message
    )
  ) {
    return false;
  }

  recovering = true;
  try {
    if (sessionStorage.getItem(RELOAD_KEY) === error.message) return false;
    await flushAppStorage();
    sessionStorage.setItem(RELOAD_KEY, error.message);
    window.location.reload();
    return true;
  } catch {
    return false;
  } finally {
    recovering = false;
  }
};
