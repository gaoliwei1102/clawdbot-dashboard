/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GATEWAY_URL?: string;
  readonly VITE_GATEWAY_TOKEN?: string;
  readonly VITE_GATEWAY_SESSION_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

