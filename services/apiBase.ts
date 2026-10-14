/**
 * Base URL for the server functions (/api/chat, /api/feed).
 * Web: same origin. Native app (Capacitor): the page runs from capacitor://localhost or https://localhost,
 * so calls go to the deployed site. This is decided at runtime, so a live-update bundle built for the web
 * works unchanged inside the apps.
 */
const DEPLOYED = 'https://app.scanything.online';
const isNative = () => typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.();
const base = () => (import.meta.env.VITE_API_BASE || (isNative() ? DEPLOYED : '')).replace(/\/$/, '');
export const apiUrl = (path: string) => `${base()}${path}`;
