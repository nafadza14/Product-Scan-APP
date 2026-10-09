import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = process.env[k] || env[k];
      if (v) return v;
    }
    return '';
  };

  return {
    plugins: [react()],
    define: {
      // Accept the name the README documents (GEMINI_API_KEY) as well as the older ones.
      'process.env.API_KEY': JSON.stringify(pick('GEMINI_API_KEY', 'API_KEY', 'VITE_API_KEY')),
      'process.env.GEMINI_MODEL': JSON.stringify(pick('GEMINI_MODEL') || 'gemini-flash-latest'),
    },
    build: {
      outDir: 'dist',
      chunkSizeWarningLimit: 900,
    },
  };
});
