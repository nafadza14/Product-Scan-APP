/**
 * Base URL for the server functions (/api/chat, /api/feed).
 * Empty on the web (same origin). The native app loads from capacitor://localhost, so it must call the
 * deployed site instead: set VITE_API_BASE=https://scanything.online when building for Capacitor.
 */
const BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');
export const apiUrl = (path: string) => `${BASE}${path}`;
