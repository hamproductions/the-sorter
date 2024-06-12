/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly PUBLIC_ENV__BASE_URL: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
