import type { CapacitorConfig } from '@capacitor/cli';

// One codebase for web, Android and iOS. The native apps bundle the web build (dist) and then keep
// themselves current with live updates: every web deploy publishes a bundle at
// https://app.scanything.online/ota/latest.json, which the apps download and switch to on next launch.
const config: CapacitorConfig = {
  appId: 'online.scanything.app',
  appName: 'Scanything',
  webDir: 'dist',
  backgroundColor: '#FFFFFF',
  ios: { contentInset: 'never', scheme: 'Scanything' },
  android: { allowMixedContent: false },
  plugins: {
    CapacitorUpdater: {
      // We drive updates ourselves from services/liveUpdate.ts against our own manifest.
      autoUpdate: false,
      appReadyTimeout: 15000,
      resetWhenUpdate: true,
      // Self-hosted: send no usage statistics to Capgo's servers.
      statsUrl: ''
    },
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#FFFFFF',
      showSpinner: false
    },
    StatusBar: { style: 'LIGHT', backgroundColor: '#FFFFFF', overlaysWebView: true },
    Keyboard: { resize: 'native' }
  }
};

export default config;
