import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ToasterProvider } from './context/ToasterContext.tsx';
import { Head } from './components/Head.tsx';
import { Partytown } from '@builder.io/partytown/react';
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Head>
      <Partytown />
    </Head>
    <ToasterProvider>
      <App />
    </ToasterProvider>
  </React.StrictMode>
);
