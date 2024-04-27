import { createToaster } from '@ark-ui/react/toast';
import { ReactNode, createContext, useContext } from 'react';
import * as Toast from '~/components/ui/toast';

const ToasterContext = createContext<{ toast?: (msg: string) => void }>({});

export const ToasterProvider = ({ children }: { children: ReactNode }) => {
  const [Toaster, toast] = createToaster({
    placement: 'bottom-end',
    render(toast) {
      return (
        <Toast.Root>
          {/* <Toast.Title>{toast.title}</Toast.Title> */}
          <Toast.Description>{toast.description}</Toast.Description>
          <Toast.CloseTrigger>Close</Toast.CloseTrigger>
        </Toast.Root>
      );
    }
  });

  return (
    <ToasterContext.Provider
      value={{
        toast: (message: string) => {
          toast.create({
            description: message
          });
        }
      }}
    >
      {children}
      <Toaster />
    </ToasterContext.Provider>
  );
};

export const useToaster = () => useContext(ToasterContext);
