import type { CapacitorConfig } from '@capacitor/cli';

// Native shell for App Store and Google Play. The web build (dist) is bundled into the app.
// Build with VITE_API_BASE pointing at the deployed site so /api calls reach the server.
const config: CapacitorConfig = {
  appId: 'online.scanything.app',
  appName: 'Scanything',
  webDir: 'dist',
  backgroundColor: '#FFFFFF',
  ios: { contentInset: 'never' },
  android: { allowMixedContent: false }
};

export default config;
