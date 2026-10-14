// Live updates (OTA) for the native apps, self-hosted with @capgo/capacitor-updater in manual mode.
//
// Every web deploy publishes https://app.scanything.online/ota/latest.json plus a zip of the build
// (see scripts/build-ota.mjs). The native app downloads a newer bundle in the background and queues
// it with `next()`, so it is applied when the app goes to the background or on the next cold start.
// The user is never reloaded mid-task. On the web this module does nothing.
//
// See docs/LIVE-UPDATES.md.

/**
 * Native compatibility level of this web code.
 *
 * Bump it (1 -> 2 -> ...) in the same commit that starts depending on something only a new store
 * build provides: a new Capacitor plugin, a new permission, native config. scripts/build-ota.mjs reads
 * this constant and writes it into the manifest as `minNative`, so apps still running an older
 * native binary skip those bundles until the user installs the store update.
 */
export const NATIVE_LEVEL = 1;

const MANIFEST_URL = 'https://app.scanything.online/ota/latest.json';
const RECHECK_INTERVAL_MS = 30 * 60 * 1000;
// Must stay below capacitor.config.ts CapacitorUpdater.appReadyTimeout (15000).
const RENDER_WAIT_MS = 10_000;

interface Manifest {
  version: string;
  url: string;
  checksum: string;
  minNative?: number;
  createdAt?: string;
}

type Updater = typeof import('@capgo/capacitor-updater').CapacitorUpdater;

const log = (...args: unknown[]) => console.info('[ota]', ...args);

let started = false;
let lastCheck = 0;
let inFlight: Promise<void> | null = null;

function isNative(): boolean {
  try {
    return Boolean((window as any).Capacitor?.isNativePlatform?.());
  } catch {
    return false;
  }
}

/** Starts the live update loop. Safe to call more than once; no-op on the web. */
export function initLiveUpdate(): void {
  if (started || !isNative()) return;
  started = true;
  void start().catch((err) => log('init failed', err));
}

async function start(): Promise<void> {
  const { CapacitorUpdater } = await import('@capgo/capacitor-updater');

  // Confirm this bundle works so the plugin does not roll it back. We wait until React has put
  // something on screen: a bundle that throws on first render never confirms and is rolled back
  // to the previous good bundle after appReadyTimeout.
  if (await waitForFirstRender()) {
    try {
      const { bundle } = await CapacitorUpdater.notifyAppReady();
      log('ready, bundle', bundle.id, bundle.version, 'build', __BUILD_ID__);
    } catch (err) {
      log('notifyAppReady failed', err);
    }
  } else {
    // Leave it unconfirmed so a downloaded bundle rolls back. Still check below: on the builtin
    // bundle there is nothing to roll back to, and a newer bundle may carry the fix.
    log('app did not render, not confirming bundle');
  }

  // If the previous launch rolled back a bundle, never retry that version on this device.
  try {
    const failed = await CapacitorUpdater.getFailedUpdate();
    if (failed?.bundle?.version) {
      log('bundle failed to start and was rolled back', failed.bundle.version);
      rememberFailed(failed.bundle.version);
    }
  } catch {}

  void check(CapacitorUpdater);

  try {
    const { App } = await import('@capacitor/app');
    await App.addListener('appStateChange', ({ isActive }) => {
      if (isActive && Date.now() - lastCheck >= RECHECK_INTERVAL_MS) void check(CapacitorUpdater);
    });
  } catch (err) {
    log('appStateChange listener failed', err);
  }
}

const FAILED_KEY = 'ota.failedVersions';

function failedVersions(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(FAILED_KEY) || '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function rememberFailed(version: string): void {
  try {
    const list = [...failedVersions().filter((v) => v !== version), version].slice(-10);
    localStorage.setItem(FAILED_KEY, JSON.stringify(list));
  } catch {}
}

function waitForFirstRender(): Promise<boolean> {
  const rendered = () => (document.getElementById('root')?.childElementCount ?? 0) > 0;
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const tick = () => {
      if (rendered()) return resolve(true);
      if (Date.now() - startedAt >= RENDER_WAIT_MS) return resolve(false);
      setTimeout(tick, 200);
    };
    tick();
  });
}

function check(updater: Updater): Promise<void> {
  if (inFlight) return inFlight;
  lastCheck = Date.now();
  inFlight = runCheck(updater)
    .catch((err) => log('check failed', err))
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

async function fetchManifest(): Promise<Manifest | null> {
  const res = await fetch(`${MANIFEST_URL}?t=${Date.now()}`, {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache' }
  });
  if (!res.ok) {
    log('manifest http', res.status);
    return null;
  }
  const m = (await res.json()) as Partial<Manifest>;
  if (
    typeof m?.version !== 'string' ||
    !m.version ||
    typeof m.url !== 'string' ||
    !/^https:\/\//.test(m.url) ||
    typeof m.checksum !== 'string' ||
    !/^[0-9a-f]{64}$/i.test(m.checksum)
  ) {
    log('manifest invalid', m);
    return null;
  }
  return m as Manifest;
}

async function runCheck(updater: Updater): Promise<void> {
  const manifest = await fetchManifest();
  if (!manifest) return;
  const { version } = manifest;

  // __BUILD_ID__ covers the builtin bundle, whose plugin version is the native app version.
  if (version === __BUILD_ID__) return log('up to date', version);

  const minNative = Number(manifest.minNative ?? 1);
  if (minNative > NATIVE_LEVEL) {
    return log(`bundle ${version} needs native level ${minNative}, have ${NATIVE_LEVEL}; store update required`);
  }

  const { bundle: current } = await updater.current();
  if (current.version === version) return log('up to date', version);

  const next = await updater.getNextBundle().catch(() => null);
  if (next && next.version === version && next.status !== 'error') {
    return log('already queued', version);
  }

  if (failedVersions().includes(version)) {
    // This version already failed to start on this device and was rolled back. Wait for a new deploy.
    return log('skipping version that failed to start before', version);
  }

  const { bundles } = await updater.list();
  const known = bundles.filter((b) => b.version === version);
  // An `error` bundle here is a broken or interrupted download: drop it and download again.
  for (const b of known) {
    if (b.status === 'error') await updater.delete({ id: b.id }).catch(() => undefined);
  }

  let target = known.find((b) => b.status === 'success' || b.status === 'pending');
  if (!target) {
    log('downloading', version);
    target = await updater.download({ url: manifest.url, version, checksum: manifest.checksum.toLowerCase() });
  }

  await updater.next({ id: target.id });
  log('queued', version, 'applies on next background or launch');

  // Free disk space: keep builtin, the running bundle and the queued one.
  const keep = new Set(['builtin', current.id, target.id]);
  for (const b of bundles) {
    if (keep.has(b.id) || b.status === 'downloading' || b.status === 'deleting') continue;
    await updater.delete({ id: b.id }).catch(() => undefined);
  }
}
