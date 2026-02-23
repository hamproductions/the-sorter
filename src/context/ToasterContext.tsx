import { createToaster } from '@ark-ui/react/toast';
import type { ReactNode } from 'react';
import { Suspense, createContext, useContext, useMemo } from 'react';
import { FaXmark } from 'react-icons/fa6';
import { IconButton } from '~/components/ui/icon-button';
import { Toast } from '~/components/ui/toast';

type RenderFn = () => ReactNode;
type ToastContent = ReactNode | RenderFn;

interface ToastOptions {
  title?: ToastContent;
  description?: ToastContent;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  placement?: 'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end';
  meta?: {
    backgroundImage?: string;
  };
}

const isRenderFn = (value: unknown): value is RenderFn => typeof value === 'function';

const ToasterContext = createContext<{ toast: (options: ToastOptions) => void }>({
  toast: () => {}
});

const toaster = createToaster({
  placement: 'bottom-end',
  max: 5,
  overlap: true
});

export function ToasterProvider({ children }: { children: ReactNode }) {
  const value = useMemo(
    () => ({
      toast: (options: ToastOptions) => {
        toaster.create({
          type: 'info',
          ...options,
          placement: options.placement ?? 'bottom-end'
        } as Parameters<typeof toaster.create>[0]);
      }
    }),
    []
  );

  return (
    <ToasterContext.Provider value={value}>
      {children}
      <Suspense>
        <Toast.Toaster toaster={toaster}>
          {(toast) => {
            const title = isRenderFn(toast.title) ? toast.title() : toast.title;
            const description = isRenderFn(toast.description)
              ? toast.description()
              : toast.description;
            return (
              <Toast.Root
                style={{
                  backgroundImage: toast.meta?.backgroundImage
                    ? `url(${toast.meta.backgroundImage})`
                    : undefined
                }}
                bgPosition="center"
                bgSize="cover"
              >
                {title && <Toast.Title>{title}</Toast.Title>}
                {description && <Toast.Description>{description}</Toast.Description>}
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
