import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

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
    plugins: [react(), sumopodApi()],
    build: { outDir: 'dist', chunkSizeWarningLimit: 900 }
  };
});
