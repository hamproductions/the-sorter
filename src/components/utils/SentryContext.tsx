import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import type * as Sentry from '@sentry/browser';
import { recoverAssetError } from '~/utils/asset-recovery';

export const SentryContext = createContext<typeof Sentry | undefined>(undefined);

export function SentryProvider({ children }: { children: ReactNode }) {
  const [sentryInstance, setSentryInstance] = useState<typeof Sentry>();

  useEffect(() => {
    const onPreloadError = (event: Event) => {
      void recoverAssetError((event as Event & { payload: unknown }).payload);
    };
    window.addEventListener('vite:preloadError', onPreloadError);
    return () => window.removeEventListener('vite:preloadError', onPreloadError);
  }, []);

  useEffect(() => {
    if (
      !import.meta.env.PROD ||
      ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname) ||
      window.location.pathname.includes('/pr/')
    ) {
      return;
    }

    const initSentry = async () => {
      const sentry = await import('@sentry/browser');

      sentry.init({
        dsn: 'https://231e0da90e9d4405b611d2998839b752@error-tracking.ham-san.net/1',
        environment: 'production',
        release: `the-sorter@${import.meta.env.PUBLIC_ENV__APP_VERSION}+${import.meta.env.PUBLIC_ENV__BUILD_TIMESTAMP}`
      });

      setSentryInstance(sentry);
    };

    void initSentry().catch(() => {});
  }, []);
  return <SentryContext.Provider value={sentryInstance}>{children}</SentryContext.Provider>;
}

export const useSentry = () => useContext(SentryContext);
