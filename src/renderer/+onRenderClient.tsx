// https://vike.dev/onRenderClient

import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { PageLayout } from './PageLayout';

export function onRenderClient(pageContext: { Page: React.FC }) {
  const { Page } = pageContext;
  const root = document.getElementById('root');
  if (!root) return;
  hydrateRoot(
    root,
    <PageLayout>
      <Page />
    </PageLayout>
  );
}
