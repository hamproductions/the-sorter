import React from 'react';
import { ToasterProvider } from '~/context/ToasterContext';
import '../index.css';
import ErrorBoundary from '~/components/utils/ErrorBoundary';

import '../i18n';
import { HelmetProvider } from 'react-helmet-async';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <ToasterProvider>{children}</ToasterProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}
