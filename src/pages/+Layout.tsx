import React from 'react';
import { HelmetProvider } from 'react-helmet-async';
import ErrorBoundary from '~/components/utils/ErrorBoundary';
import { ToasterProvider } from '~/context/ToasterContext';
import '../i18n';
import '../index.css';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <ToasterProvider>{children}</ToasterProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}
