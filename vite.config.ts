import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import pixabayHandler from './api/pixabay.js'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    tailwindcss(),
    react(),
    {
      // Serve the real Vercel function in dev, so `npm run dev` and the deployed
      // site use identical routing and the same PIXABAY_API_KEY env var.
      name: 'pixabay-dev-function',
      configureServer(server) {
        server.middlewares.use('/api/pixabay', (req, res, _next) => {
          pixabayHandler(req, res).catch((error: unknown) => {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: String(error) }));
          });
        });
      },
    },
  ],
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Keep the React runtime in its own long-lived cache chunk.
        manualChunks(id: string) {
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/scheduler/')
          ) {
            return 'react-vendor';
          }
          return undefined;
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/api/pollinations': {
        target: 'https://image.pollinations.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/pollinations/, ''),
      },
      '/api/clipart-free': {
        target: 'https://clipart.free',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/clipart-free/, ''),
      },
      '/api/wikimedia-upload': {
        target: 'https://upload.wikimedia.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/wikimedia-upload/, ''),
        headers: {
          'User-Agent': 'StudioPress/1.0 (Desktop Publishing Studio)',
        },
      },
      '/api/wikimedia-thumb': {
        target: 'https://thumb.wikimedia.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/wikimedia-thumb/, ''),
        headers: {
          'User-Agent': 'StudioPress/1.0 (Desktop Publishing Studio)',
        },
      },
    },
  },
})
