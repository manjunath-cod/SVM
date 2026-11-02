import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { handleApiRequest } from './server/api.js';
import { loadEnv } from './server/env.js';

loadEnv();

function apiPlugin() {
  return {
    name: 'svm-api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
          if (url.pathname.startsWith('/api/')) {
            const queryParams = url.searchParams;
            const handled = await handleApiRequest(req, res, url.pathname, queryParams);
            if (handled) return;
          }
        } catch (err) {
          console.error('[api error]', err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
          return;
        }
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
          if (url.pathname.startsWith('/api/')) {
            const queryParams = url.searchParams;
            const handled = await handleApiRequest(req, res, url.pathname, queryParams);
            if (handled) return;
          }
        } catch (err) {
          console.error('[api error]', err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), apiPlugin()],
  server: {
    port: 5173,
    host: true,
  },
  preview: {
    port: 5173,
    host: true,
  }
});
