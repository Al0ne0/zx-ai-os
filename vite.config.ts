import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Read build-time secrets from environment variables (VITE_ prefix)
// Do NOT hardcode API keys in source. Provide values via .env or CI.
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || '';

export default defineConfig(({ mode }) => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // Keep existing runtime reference `process.env.API_KEY` used across the app,
        // but inject its value from VITE_GEMINI_API_KEY at build time.
        'process.env.API_KEY': JSON.stringify(GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(GEMINI_API_KEY),
      },
      resolve: {
        alias: {
          // Fix: Replace __dirname with './' to avoid undefined errors in ES module contexts.
          '@': path.resolve('./'),
        }
      }
    };
});