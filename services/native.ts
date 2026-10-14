import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { supabase } from './supabaseClient';

// Native glue for the Capacitor builds. The web app runs the exact same code; everything here is a
// no-op in a browser so web, Android and iOS look and animate identically.

export type Platform = 'ios' | 'android' | 'web';

export const isNative = (): boolean => Capacitor.isNativePlatform();

export const platform = (): Platform => {
  const p = Capacitor.getPlatform();
  return p === 'ios' || p === 'android' ? p : 'web';
};

/**
 * Where Google sign-in returns to inside the native app (custom URL scheme = appId).
 * IMPORTANT: `online.scanything.app://auth-callback` must be added to
 * Supabase Dashboard > Authentication > URL Configuration > Redirect URLs,
 * and the `online.scanything.app` scheme must be registered natively
 * (Android intent-filter in AndroidManifest.xml, iOS CFBundleURLTypes in Info.plist).
 */
export const NATIVE_AUTH_REDIRECT = 'online.scanything.app://auth-callback';

/** Light tap feedback through the Taptic Engine / vibrator. Returns false when not native. */
export const nativeHaptic = (ms = 8): boolean => {
  if (!isNative()) return false;
  Haptics.impact({ style: ms >= 12 ? ImpactStyle.Medium : ImpactStyle.Light }).catch(() => {});
  return true;
};

/** Open a URL in the in-app browser (SFSafariViewController / Chrome Custom Tab). */
export const openInAppBrowser = (url: string) => Browser.open({ url }).catch(() => {
  window.location.href = url;
});

/**
 * Open an OAuth URL in the in-app browser. `onFinished` runs when the browser sheet closes
 * (signed in, or dismissed by the user) so the caller can clear its loading state.
 */
export const openAuthBrowser = async (url: string, onFinished?: () => void) => {
  let handle: PluginListenerHandle | undefined;
  if (onFinished) {
    handle = await Browser.addListener('browserFinished', () => {
      handle?.remove();
      onFinished();
    });
  }
  try {
    await Browser.open({ url });
  } catch {
    handle?.remove();
    onFinished?.();
  }
};

const extractCode = (url: string): string | null => {
  try {
    return new URL(url).searchParams.get('code');
  } catch {
    const m = url.match(/[?&#]code=([^&#]+)/);
    return m ? decodeURIComponent(m[1]) : null;
  }
};

let started = false;

export const initNative = () => {
  if (typeof document !== 'undefined') document.documentElement.dataset.platform = platform();
  if (!isNative() || started) return;
  started = true;

  // 1. Splash: hide once React has painted the first screen (double rAF = after a real paint),
  //    with a safety timeout in case something stalls.
  let hidden = false;
  const hide = () => {
    if (hidden) return;
    hidden = true;
    SplashScreen.hide({ fadeOutDuration: 200 }).catch(() => {});
  };
  requestAnimationFrame(() => requestAnimationFrame(hide));
  window.setTimeout(hide, 3000);

  // 2. Status bar: Style.Light = dark icons for a light background. Overlay the WebView so
  //    env(safe-area-inset-*) keeps working exactly like the web build.
  (async () => {
    try {
      await StatusBar.setStyle({ style: Style.Light });
      if (platform() === 'android') {
        // Not available on Android 15+ (edge-to-edge is enforced there), so failures are fine.
        await StatusBar.setBackgroundColor({ color: '#00000000' }).catch(() => {});
        await StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
      }
    } catch { /* plugin unavailable */ }
  })();

  // 3. Android hardware back: close the top overlay through history (App.tsx popstate handles the
  //    animated dismissal); at the root, send the app to the background instead of exiting.
  App.addListener('backButton', () => {
    const depth = typeof window.history.state?.ov === 'number' ? window.history.state.ov : 0;
    if (depth > 0) window.history.back();
    else App.minimizeApp().catch(() => {});
  });

  // 5. External links: target=_blank anchors open in the in-app browser instead of leaving the app.
  document.addEventListener(
    'click',
    (e) => {
      if (e.defaultPrevented || e.button !== 0) return;
      const a = (e.target as Element | null)?.closest?.('a');
      if (!a || a.target !== '_blank') return;
      const href = a.href;
      if (!/^https?:\/\//i.test(href)) return;
      e.preventDefault();
      openInAppBrowser(href);
    },
    true
  );

  // 6. OAuth deep link: online.scanything.app://auth-callback?code=... -> finish PKCE sign-in.
  App.addListener('appUrlOpen', async ({ url }) => {
    if (!url || !url.startsWith('online.scanything.app://')) return;
    if (url.includes('code=')) {
      const code = extractCode(url);
      if (code) {
        try {
          await supabase.auth.exchangeCodeForSession(code);
        } catch { /* surfaced by the auth state staying signed out */ }
      }
    }
    Browser.close().catch(() => {});
  });

  // 7. Keyboard: resize 'native' in capacitor.config.ts; nothing to do at runtime.
};
