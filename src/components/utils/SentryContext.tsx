import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import type * as Sentry from '@sentry/browser';

export const SentryContext = createContext<typeof Sentry | undefined>(undefined);

export function SentryProvider({ children }: { children: ReactNode }) {
  const [sentryInstance, setSentryInstance] = useState<typeof Sentry>();

  useEffect(() => {
    const initSentry = async () => {
      const sentry = await import('@sentry/browser');

      sentry.init({
        dsn: 'https://231e0da90e9d4405b611d2998839b752@error-tracking.ham-san.net/1'
      });

      setSentryInstance(sentry);
    };

    void initSentry();
  }, []);
  return <SentryContext.Provider value={sentryInstance}>{children}</SentryContext.Provider>;
}

export const useSentry = () => useContext(SentryContext);
