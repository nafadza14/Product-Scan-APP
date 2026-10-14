// Single source of truth for the build id (the OTA bundle version).
// Used by vite.config.ts (injected as __BUILD_ID__) and by scripts/build-ota.mjs (manifest version).
//
// On Vercel both run in the same build with the same VERCEL_GIT_COMMIT_SHA, so they agree.
// Locally there is no commit sha, so Vite falls back to a timestamp and records it in
// dist/version.json; build-ota.mjs reads that file instead of computing a new timestamp.

export const VERSION_FILE = 'version.json';

let cached;

export function resolveBuildId() {
  if (cached) return cached;
  const sha = (process.env.VERCEL_GIT_COMMIT_SHA || '').trim();
  if (sha) {
    cached = sha.slice(0, 12);
  } else {
    // UTC timestamp, e.g. 20261014T093015Z. Sorts and reads well, safe in file names.
    cached = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  }
  return cached;
}
