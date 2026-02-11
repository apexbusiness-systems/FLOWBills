import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';

function normalizeModuleId(id: string): string {
  // Convert Windows paths to Unix (C:\Users\... -> /Users/...)
  const normalized = id.replace(/\\/g, '/');

  // Extract package name from absolute path
  // /path/to/node_modules/react-dom/index.js -> react-dom
  const match = normalized.match(/node_modules\/(@[^/]+\/[^/]+|[^/]+)/);
  return match ? match[1] : '';
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false, // Disable auto-registration - we use manual sw.js
      includeAssets: ['favicon.png', 'icons/*.png', 'icons/*.svg'],
      manifest: {
        name: 'FLOWBills - Invoice Automation',
        short_name: 'FLOWBills',
        description: 'Automate invoices. Approve faster. Close with confidence.',
        theme_color: '#0EA5E9',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: 'icons/icon-72x72.png', sizes: '72x72', type: 'image/png' },
          { src: 'icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
          { src: 'icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
          { src: 'icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
          { src: 'icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
          { src: 'icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: 'icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
          { src: 'icons/icon-512x512.png', sizes: '512x512', type: 'image/png' }
        ],
        shortcuts: [
          { name: 'Dashboard', url: '/dashboard', description: 'View your dashboard' },
          { name: 'Upload Invoice', url: '/invoices', description: 'Upload new invoice' },
          { name: 'Approvals', url: '/approvals', description: 'Review pending approvals' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/ullqluvzkgnwwqijhvjr\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      }
    }),
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap',
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  build: {
    minify: mode === 'production' ? 'esbuild' : false,
    sourcemap: mode !== 'production',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          const pkg = normalizeModuleId(id);

          // Group 1: Core Framework (~200 KB)
          if (['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'].includes(pkg)) {
            return 'vendor-react';
          }

          // Group 2: UI Components (~300 KB)
          if (pkg.startsWith('@radix-ui/') || ['lucide-react', 'class-variance-authority', 'clsx', 'tailwind-merge', 'cmdk', 'sonner', 'vaul'].includes(pkg)) {
            return 'vendor-ui';
          }

          // Group 3: Backend & Auth (~150 KB)
          if (pkg === '@supabase/supabase-js') {
            return 'vendor-supabase';
          }

          // Group 4: Data Visualization (~250 KB)
          if (['recharts', 'date-fns'].includes(pkg)) {
            return 'vendor-charts';
          }

          // Group 5: Forms & Validation (~100 KB)
          if (['react-hook-form', '@hookform/resolvers', 'zod', 'input-otp'].includes(pkg)) {
            return 'vendor-forms';
          }

          // CRITICAL: Return undefined for unmatched (let Vite handle)
          return undefined;
        },
        // Optimize asset file names for caching
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.');
          const ext = info?.[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext || '')) {
            return `assets/images/[name]-[hash][extname]`;
          } else if (/woff|woff2|eot|ttf|otf/i.test(ext || '')) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
    target: 'es2020',
    cssCodeSplit: true,
    reportCompressedSize: false,
  },
  esbuild: {
    drop: mode === 'production' ? ['debugger'] : [], // Keep console logs for production debugging
    legalComments: 'none',
    treeShaking: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js'],
    exclude: ['@tanstack/react-query-devtools'],
  },
  preview: {
    host: "::",
    port: 4173,
  },
}));
