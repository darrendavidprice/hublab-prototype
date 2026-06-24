/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Which data backend to use. Defaults to the local prototype. */
  readonly VITE_DATA_SOURCE?: 'local' | 'supabase';
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** Injected at build time from package.json (see vite.config.ts). */
declare const __APP_VERSION__: string;
declare const __BUILD_DATE__: string;
