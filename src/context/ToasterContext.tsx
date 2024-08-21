import { createToaster } from '@ark-ui/react/toast';
import type { ReactNode } from 'react';
import { Suspense, createContext, useContext } from 'react';
import { FaXmark } from 'react-icons/fa6';
import { IconButton } from '~/components/ui/styled/icon-button';
import * as Toast from '~/components/ui/styled/toast';

type ToastOptions = Parameters<typeof toaster.create>[0];
const ToasterContext = createContext<{ toast?: (msg: ReactNode, options?: ToastOptions) => void }>(
  {}
);

const toaster = createToaster({
  placement: 'bottom-end',
  max: 10,
  overlap: true
});

export function ToasterProvider({ children }: { children: ReactNode }) {
  return (
    <ToasterContext.Provider
      value={{
        toast: (message, options) => {
          toaster.create({
            description: message,
            type: 'info',
            ...options
          });
        }
      }}
    >
      {children}
      <Suspense>
        <Toast.Toaster toaster={toaster}>
          {(toast) => {
            return (
              <Toast.Root>
                <Toast.Title>{toast.title}</Toast.Title>
                <Toast.Description>{toast.description}</Toast.Description>
                <Toast.CloseTrigger asChild>
                  <IconButton size="sm" variant="link">
                    <FaXmark />
                  </IconButton>
                </Toast.CloseTrigger>
              </Toast.Root>
            );
          }}
        </Toast.Toaster>
      </Suspense>
    </ToasterContext.Provider>
  );
}

export const useToaster = () => useContext(ToasterContext);
