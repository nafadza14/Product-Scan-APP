/// <reference types="vite/client" />

// Build id of the running web bundle (commit sha or timestamp), injected by vite.config.ts.
declare const __BUILD_ID__: string;

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string;
  readonly VITE_PAYWALL_MODE?: string;
  readonly VITE_REVENUECAT_IOS_KEY?: string;
  readonly VITE_REVENUECAT_ANDROID_KEY?: string;
  readonly VITE_AMAZON_TAG?: string;
  readonly VITE_SHOPEE_AFF_ID?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
