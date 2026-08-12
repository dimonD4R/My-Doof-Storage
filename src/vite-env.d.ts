/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Primary JSON metadata URL. Falls back to the bundled data file. */
  readonly VITE_DATA_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}