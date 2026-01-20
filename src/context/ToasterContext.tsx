import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';
import { toaster, Toaster, type ToastOptions } from '~/components/ui';

const ToasterContext = createContext<{ toast: (options: ToastOptions) => void }>({
  toast: () => {}
});

export function ToasterProvider({ children }: { children: ReactNode }) {
  return (
    <ToasterContext.Provider
      value={{
        toast: (options) => {
          toaster.create(options as any);
        }
      }}
    >
      {children}
      <Toaster />
    </ToasterContext.Provider>
  );
}

export const useToaster = () => useContext(ToasterContext);
