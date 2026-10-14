# Live updates (OTA)

The Android and iOS apps run the same web build as https://app.scanything.online. Every web deploy also
publishes a live update bundle, and installed apps pick it up on their own. No store release needed for
web changes.

## How it works

1. `npm run build` runs `vite build`, then `scripts/build-ota.mjs`, which writes:
   - `dist/ota/bundle-<version>.zip`: the whole `dist/` folder, `index.html` at the zip root
   - `dist/ota/latest.json`: the manifest

   ```json
   {
     "version": "3f9c2a1b7d4e",
     "url": "https://app.scanything.online/ota/bundle-3f9c2a1b7d4e.zip",
     "checksum": "<sha256 hex of the zip>",
     "minNative": 1,
     "createdAt": "2026-10-14T09:30:15.000Z"
   }
   ```

   `version` is the first 12 chars of `VERCEL_GIT_COMMIT_SHA`, or a UTC timestamp for local builds. The
   same value is compiled into the app as `__BUILD_ID__` and written to `dist/version.json`.
2. Vercel serves `latest.json` with `Cache-Control: no-store` and the zips as immutable (`vercel.json`).
3. In the native app, `services/liveUpdate.ts` (started from `index.tsx`):
   - confirms the running bundle with `notifyAppReady()` once React has rendered. A bundle that never
     renders is not confirmed and the plugin rolls it back after 15 s (`appReadyTimeout`).
   - fetches `latest.json` on launch and again when the app returns to the foreground (at most every
     30 minutes).
   - skips it if `version` equals the running build, or if `minNative` is higher than `NATIVE_LEVEL`.
   - downloads the zip (checksum verified by the plugin) and queues it with `next()`.
   - the plugin switches to the new bundle the next time the app goes to the background or is
     relaunched. The user is never reloaded mid-task.

On the web the module does nothing. Vercel deploys are already live.

Plugin: `@capgo/capacitor-updater` in manual, self-hosted mode (`autoUpdate: false` in
`capacitor.config.ts`). No Capgo cloud account is used.

## What updates automatically

Everything in the web build: React code, UI, copy and translations, styles, animations, images and
fonts under `dist/`, API calls and business logic.

## What needs a store release

Anything native:

- adding or upgrading a Capacitor plugin (any `@capacitor/*`, `@capgo/*`, RevenueCat, etc.)
- new permissions, `Info.plist` / `AndroidManifest.xml` changes, entitlements
- app icon, splash screen, app name, `capacitor.config.ts`
- Capacitor or `@capgo/capacitor-updater` major upgrades

When web code starts depending on such a change, bump `NATIVE_LEVEL` in `services/liveUpdate.ts`
(for example 1 to 2) in the same commit. `build-ota.mjs` reads that constant into `minNative`, so:

- apps on the old store build keep their current bundle and ignore new ones until the user updates
  from the store
- the new store build ships with the new web code built in and keeps receiving updates

`resetWhenUpdate: true` makes a fresh store install drop old downloaded bundles and start from the
bundle shipped inside it. Release order: ship the store build first, then deploy the web change.

## Rolling back

- **Automatic:** a bundle that fails to render within 15 s is rolled back on that device and its version
  is never retried there.
- **Bad deploy that renders fine:** in Vercel, use Instant Rollback or redeploy the previous good
  commit. Its `latest.json` names the old version, and since apps compare versions for equality (not
  order) they download it and switch on the next foreground or launch check.
- **Emergency stop:** a deploy whose `latest.json` has a `minNative` higher than any shipped app (set
  `OTA_MIN_NATIVE=99` in the Vercel env and redeploy) stops all apps from taking new bundles.
- **On one device:** reinstall the app, or call `CapacitorUpdater.reset()` from a debug build to go back
  to the bundle shipped in the store build.

## Testing locally

1. `npm run build` and check `dist/ota/latest.json` and `unzip -l dist/ota/bundle-*.zip`
   (`index.html` must be at the root).
2. Serve `dist` over https so a device can reach it, for example `npx serve dist -l 8080` plus a
   tunnel (cloudflared, ngrok). Rebuild with `OTA_BASE_URL=https://<tunnel-host>/ota npm run build`
   and temporarily point `MANIFEST_URL` in `services/liveUpdate.ts` at
   `https://<tunnel-host>/ota/latest.json`. The app only accepts `https://` bundle urls.
3. Install a native build (`npx cap sync && npx cap run android` / `ios`), then change some visible copy,
   rebuild, and keep serving. Reopen the app: logs show `[ota] downloading`, then `[ota] queued`.
   Send the app to the background and reopen it to see the new copy.
4. Filter logs with `[ota]` (Android Studio Logcat, Safari Web Inspector for iOS).

Env options for `build-ota.mjs`: `OTA_BASE_URL`, `OTA_MIN_NATIVE`, `OTA_FORCE_NODE_ZIP=1` (use the
built-in zip writer instead of the system `zip`).
