/// <reference types="vite/client" />

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
