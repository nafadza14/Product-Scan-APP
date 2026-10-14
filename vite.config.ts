import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
// @ts-ignore -- plain JS helper shared with scripts/build-ota.mjs (no type declarations)
import { resolveBuildId, VERSION_FILE } from './scripts/build-id.mjs';

// One build id per build: injected as __BUILD_ID__ and written to dist/version.json, which
// scripts/build-ota.mjs reads so the OTA manifest version always matches the running bundle.
const BUILD_ID: string = resolveBuildId();
const buildIdFile = (): Plugin => ({
  name: 'build-id-file',
  apply: 'build',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: VERSION_FILE, source: JSON.stringify({ version: BUILD_ID }) + '\n' });
  }
});

// Serves /api/chat and /api/feed during `npm run dev` / `npm run preview` with the same handler Vercel uses.
const sumopodApi = (): Plugin => {
  const middleware = async (req: any, res: any, next: any) => {
    if (req.url?.startsWith('/api/feed')) {
      const { handleFeed } = await import('./server/feed.js');
      const query = Object.fromEntries(new URL(req.url, 'http://local').searchParams);
      try {
        const { status, body } = await handleFeed(req.method, query);
        res.statusCode = status;
        res.setHeader('Content-Type', 'application/json');
        res.end(body);
      } catch (err: any) {
        res.statusCode = 502;
        res.end(JSON.stringify({ error: 'feed_error', message: String(err?.message || err) }));
      }
      return;
    }
    if (!req.url?.startsWith('/api/chat')) return next();
    const { handleChat } = await import('./server/sumopod.js');
    let raw = '';
    req.on('data', (c: Buffer) => (raw += c));
    req.on('end', async () => {
      try {
        const { status, body } = await handleChat(req.method, raw ? JSON.parse(raw) : {});
        res.statusCode = status;
        res.setHeader('Content-Type', 'application/json');
        res.end(body);
      } catch (err: any) {
        res.statusCode = 502;
        res.end(JSON.stringify({ error: 'upstream_error', message: String(err?.message || err) }));
      }
    });
  };
  return {
    name: 'sumopod-api',
    configureServer: (server) => void server.middlewares.use(middleware),
    configurePreviewServer: (server) => void server.middlewares.use(middleware)
  };
};

export default defineConfig(({ mode }) => {
  // Make .env / .env.local values (SUMOPOD_API_KEY, SUMOPOD_MODEL) visible to the dev API handler.
  const env = loadEnv(mode, (process as any).cwd(), '');
  for (const k of ['SUMOPOD_API_KEY', 'SUMOPOD_MODEL', 'SUMOPOD_BASE_URL']) {
    if (env[k] && !process.env[k]) process.env[k] = env[k];
  }

  return {
    plugins: [react(), sumopodApi(), buildIdFile()],
    define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
    build: { outDir: 'dist', chunkSizeWarningLimit: 900 }
  };
});
