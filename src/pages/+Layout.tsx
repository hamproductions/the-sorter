import React from 'react';
import { ToasterProvider } from '~/context/ToasterContext';
import '../index.css';

export function Layout({ children }: { children: React.ReactNode }) {
  return <ToasterProvider>{children}</ToasterProvider>;
}
