import { type ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';

const PENDING_LOAD_KEY = 'pending-save-load';

interface SaveLoadContextType {
  pendingLoadId: string | null;
  requestLoad: (id: string) => void;
  clearPendingLoad: () => void;
}

const SaveLoadContext = createContext<SaveLoadContextType>({
  pendingLoadId: null,
  requestLoad: () => {},
  clearPendingLoad: () => {}
});

const writePendingLoad = (id: string | null) => {
  try {
    if (id) sessionStorage.setItem(PENDING_LOAD_KEY, id);
    else sessionStorage.removeItem(PENDING_LOAD_KEY);
  } catch {}
};

export function SaveLoadProvider({ children }: { children: ReactNode }) {
  const [pendingLoadId, setPendingLoadId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(PENDING_LOAD_KEY);
      if (stored) setPendingLoadId(stored);
    } catch {}
  }, []);

  const requestLoad = useCallback((id: string) => {
    writePendingLoad(id);
    setPendingLoadId(id);
  }, []);

  const clearPendingLoad = useCallback(() => {
    writePendingLoad(null);
    setPendingLoadId(null);
  }, []);

  return (
    <SaveLoadContext.Provider value={{ pendingLoadId, requestLoad, clearPendingLoad }}>
      {children}
    </SaveLoadContext.Provider>
  );
}

export const useSaveLoadContext = () => useContext(SaveLoadContext);
