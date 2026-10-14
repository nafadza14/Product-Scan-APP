#!/usr/bin/env node
// Packages the Vite build (dist/) as a live update bundle for the native apps.
//
// Runs after `vite build` (see package.json "build"). Produces:
//   dist/ota/bundle-<version>.zip   the web build, index.html at the zip root
//   dist/ota/latest.json            manifest read by services/liveUpdate.ts
//
// Env:
//   OTA_BASE_URL     base for the bundle url (default https://app.scanything.online/ota)
//   OTA_MIN_NATIVE   override minNative (default: NATIVE_LEVEL parsed from services/liveUpdate.ts)
//   OTA_FORCE_NODE_ZIP=1  skip the system `zip` binary and use the built-in writer
//
// No dependencies: uses the system `zip` when present, otherwise a small deflate zip writer
// built on node:zlib.

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { resolveBuildId, VERSION_FILE } from './build-id.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const OTA_DIR = path.join(DIST, 'ota');
const DEFAULT_BASE_URL = 'https://app.scanything.online/ota';

const log = (...a) => console.log('[build-ota]', ...a);
const fail = (msg) => {
  console.error('[build-ota] ' + msg);
  process.exit(1);
};

// ---- version ---------------------------------------------------------------------------
// Prefer the id Vite baked into this build (dist/version.json) so manifest and bundle agree.
function readVersion() {
  try {
    const v = JSON.parse(fs.readFileSync(path.join(DIST, VERSION_FILE), 'utf8')).version;
    if (typeof v === 'string' && v) return v;
  } catch {}
  log(`warning: dist/${VERSION_FILE} missing, computing build id here`);
  return resolveBuildId();
}

// ---- native compatibility level ---------------------------------------------------------
// Single source of truth is NATIVE_LEVEL in services/liveUpdate.ts: a web build compiled
// against level N needs a native app of level N or newer.
function readMinNative() {
  if (process.env.OTA_MIN_NATIVE) {
    const n = Number.parseInt(process.env.OTA_MIN_NATIVE, 10);
    if (!Number.isInteger(n) || n < 1) fail('OTA_MIN_NATIVE must be a positive integer');
    return n;
  }
  const src = fs.readFileSync(path.join(ROOT, 'services', 'liveUpdate.ts'), 'utf8');
  const m = src.match(/export\s+const\s+NATIVE_LEVEL\s*=\s*(\d+)/);
  if (!m) fail('could not find `export const NATIVE_LEVEL = <n>` in services/liveUpdate.ts');
  return Number.parseInt(m[1], 10);
}

// ---- file list ---------------------------------------------------------------------------
function listFiles(dir, rel = '') {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const relPath = rel ? `${rel}/${entry.name}` : entry.name;
    if (!rel && entry.name === 'ota') continue; // never bundle the bundles
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(abs, relPath));
    else if (entry.isFile()) out.push(relPath);
  }
  return out.sort();
}

// ---- zip: system binary --------------------------------------------------------------------
function hasSystemZip() {
  if (process.env.OTA_FORCE_NODE_ZIP === '1') return false;
  try {
    execFileSync('which', ['zip'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function zipWithBinary(files, outFile) {
  // -X: no extra file attributes, -q: quiet, -9: max compression. Paths are relative to dist.
  // File list goes on stdin (-@) so nothing is subject to shell globbing.
  execFileSync('zip', ['-X', '-q', '-9', '-@', outFile], {
    cwd: DIST,
    input: files.join('\n') + '\n',
    stdio: ['pipe', 'inherit', 'inherit']
  });
}

// ---- zip: built-in writer (deflate via node:zlib, no zip64; fine for bundles < 4 GB) -------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  if (typeof zlib.crc32 === 'function') return zlib.crc32(buf) >>> 0;
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function dosDateTime(d) {
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2);
  const date = ((Math.max(d.getFullYear(), 1980) - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return { time, date };
}

function zipWithNode(files, outFile) {
  const chunks = [];
  const central = [];
  let offset = 0;

  for (const rel of files) {
    const data = fs.readFileSync(path.join(DIST, rel));
    const name = Buffer.from(rel, 'utf8');
    const crc = crc32(data);
    const deflated = zlib.deflateRawSync(data, { level: 9 });
    const useDeflate = deflated.length < data.length;
    const body = useDeflate ? deflated : data;
    const method = useDeflate ? 8 : 0;
    const { time, date } = dosDateTime(fs.statSync(path.join(DIST, rel)).mtime);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0x0800, 6); // flags: UTF-8 names
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28); // extra length
    chunks.push(local, name, body);

    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4); // version made by
    cd.writeUInt16LE(20, 6); // version needed
    cd.writeUInt16LE(0x0800, 8);
    cd.writeUInt16LE(method, 10);
    cd.writeUInt16LE(time, 12);
    cd.writeUInt16LE(date, 14);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(body.length, 20);
    cd.writeUInt32LE(data.length, 24);
    cd.writeUInt16LE(name.length, 28);
    // extra len, comment len, disk start, internal attrs, external attrs: all 0
    cd.writeUInt32LE(offset, 42);
    central.push(cd, name);

    offset += local.length + name.length + body.length;
  }

  const cdBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(cdBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  fs.writeFileSync(outFile, Buffer.concat([...chunks, cdBuf, end]));
}

// ---- main ----------------------------------------------------------------------------------
if (!fs.existsSync(path.join(DIST, 'index.html'))) fail('dist/index.html not found, run `vite build` first');

const version = readVersion();
if (!/^[A-Za-z0-9._-]+$/.test(version)) fail(`unsafe version string: ${version}`);
const minNative = readMinNative();
const baseUrl = (process.env.OTA_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');

fs.rmSync(OTA_DIR, { recursive: true, force: true });
fs.mkdirSync(OTA_DIR, { recursive: true });

const files = listFiles(DIST);
const zipName = `bundle-${version}.zip`;
const zipPath = path.join(OTA_DIR, zipName);

if (hasSystemZip()) {
  zipWithBinary(files, zipPath);
  log(`zipped ${files.length} files with system zip`);
} else {
  zipWithNode(files, zipPath);
  log(`zipped ${files.length} files with built-in writer`);
}

const zipBuf = fs.readFileSync(zipPath);
// @capgo/capacitor-updater requires a checksum for download() and compares it with the
// lowercase sha256 hex digest of the downloaded zip.
const checksum = createHash('sha256').update(zipBuf).digest('hex');

const manifest = {
  version,
  url: `${baseUrl}/${zipName}`,
  checksum,
  minNative,
  createdAt: new Date().toISOString()
};
fs.writeFileSync(path.join(OTA_DIR, 'latest.json'), JSON.stringify(manifest, null, 2) + '\n');

log(`version ${version}, ${(zipBuf.length / 1024).toFixed(0)} KB, minNative ${minNative}`);
log(`manifest dist/ota/latest.json -> ${manifest.url}`);
