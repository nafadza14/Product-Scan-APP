
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on mode (development/production)
  // Casting process to any to fix the TypeScript error where 'cwd' is not found on the Process type.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Priority: Vercel/System Env -> Local .env -> Empty String
      // This ensures AI analysis works on live deployments
      'process.env.API_KEY': JSON.stringify(process.env.API_KEY || env.API_KEY || env.VITE_API_KEY || "")
    },
    build: {
      outDir: 'dist',
    }
  };
});
