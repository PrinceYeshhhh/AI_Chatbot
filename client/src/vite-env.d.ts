/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  // add other VITE_ env vars as needed
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
} 