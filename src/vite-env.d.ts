/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly PUBLIC_ENV__BASE_URL: string;
  readonly PUBLIC_ENV__APP_VERSION: string;
  readonly PUBLIC_ENV__BUILD_TIMESTAMP: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '@builder.io/partytown/react';
