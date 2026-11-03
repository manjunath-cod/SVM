import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { handleApiRequest } from './server/api.js';
import { loadEnv } from './server/env.js';

loadEnv();

function svmBackendPlugin() {
  return {
    name: 'svm-backend-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const url = new URL(req.url, `http://${req.headers.host || 'localhost:5173'}`);
          if (url.pathname.startsWith('/api/')) {
            const handled = await handleApiRequest(req, res, url.pathname, url.searchParams);
            if (handled) return;
          }
          next();
        } catch (err) {
          next(err);
        }
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const url = new URL(req.url, `http://${req.headers.host || 'localhost:5173'}`);
          if (url.pathname.startsWith('/api/')) {
            const handled = await handleApiRequest(req, res, url.pathname, url.searchParams);
            if (handled) return;
          }
          next();
        } catch (err) {
          next(err);
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), svmBackendPlugin()],
  server: {
    port: 5173,
    host: true,
  },
  preview: {
    port: 5173,
    host: true,
  }
});
