import React from 'react';
import { ToasterProvider } from '~/context/ToasterContext';
import '../index.css';
import ErrorBoundary from '~/components/utils/ErrorBoundary';

import '../i18n';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <ToasterProvider>{children}</ToasterProvider>
    </ErrorBoundary>
  );
}
