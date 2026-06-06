/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MODEL_ASSET_BASE_URL?: string;
  readonly VITE_MODEL_ASSET_CACHE_SUFFIX?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
