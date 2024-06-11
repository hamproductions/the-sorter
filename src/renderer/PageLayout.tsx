export { PageLayout };

import React from 'react';
import { ToasterProvider } from '~/context/ToasterContext';
function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <React.StrictMode>
      <ToasterProvider>{children}</ToasterProvider>
    </React.StrictMode>
  );
}
