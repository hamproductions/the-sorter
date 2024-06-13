import { createToaster } from '@ark-ui/react/toast';
import { ReactNode, createContext, useContext } from 'react';
import * as Toast from '~/components/ui/toast';

const ToasterContext = createContext<{ toast?: (msg: ReactNode) => void }>({});

const toaster = createToaster({
  placement: 'bottom-end',
  max: 3,
  overlap: true
});

export function ToasterProvider({ children }: { children: ReactNode }) {
  return (
    <ToasterContext.Provider
      value={{
        toast: (message: ReactNode) => {
          toaster.create({
            description: message,
            type: 'info'
          });
        }
      }}
    >
      {children}
      <Toast.Toaster toaster={toaster}>
        {(toast) => {
          return (
            <Toast.Root>
              {/* <Toast.Title>{toast.title}</Toast.Title> */}
              <Toast.Description>{toast.description}</Toast.Description>
              <Toast.CloseTrigger>Close</Toast.CloseTrigger>
            </Toast.Root>
          );
        }}
      </Toast.Toaster>
    </ToasterContext.Provider>
  );
}

export const useToaster = () => useContext(ToasterContext);
