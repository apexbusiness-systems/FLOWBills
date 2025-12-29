import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from 'vite-plugin-pwa';

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
        // PRODUCTION HOTFIX 2025-12-26: Removed broken manualChunks configuration
        // that was generating empty vendor bundles (0.00 kB for vendor-react,
        // vendor-supabase, vendor-ui). Main bundle was only 0.71 kB causing
        // complete application failure in production.
        //
        // ROOT CAUSE: Module ID matching was failing, excluding all vendor code
        // from output bundles.
        //
        // SOLUTION: Vite's automatic chunking is sufficient and reliable for
        // production. It will properly split code based on size thresholds and
        // shared dependencies.
        //
        // TODO POST-LAUNCH: Re-implement optimized chunking strategy with:
        //   - Proper module ID normalization (path separators, absolute paths)
        //   - Route-based code splitting with dynamic imports
        //   - Bundle size validation in CI/CD
        //   - Testing with vite-bundle-visualizer
        //
        // DO NOT RESTORE without testing and validation script in place.
        //
        // manualChunks: (id) => {
        //   // BROKEN - DO NOT RESTORE WITHOUT TESTING
        //   // This configuration generated 0.00 kB chunks, excluding all vendor code
        //   if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
        //     return 'vendor-react';
        //   }
        //   if (id.includes('node_modules/react-router')) {
        //     return 'vendor-router';
        //   }
        //   if (id.includes('node_modules/@supabase')) {
        //     return 'vendor-supabase';
        //   }
        //   if (id.includes('node_modules/@tanstack')) {
        //     return 'vendor-query';
        //   }
        //   if (id.includes('node_modules/@radix-ui')) {
        //     return 'vendor-ui';
        //   }
        //   if (id.includes('node_modules/recharts')) {
        //     return 'vendor-charts';
        //   }
        //   if (id.includes('node_modules')) {
        //     return 'vendor-misc';
        //   }
        // },
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
      // PRODUCTION HOTFIX 2025-12-26: Removed aggressive treeshaking that was
      // treating application code as dead code. With moduleSideEffects: false,
      // Rollup was removing main.tsx entirely (including createRoot().render())
      // because it assumed no modules have side effects.
      //
      // Vite's default treeshaking is safe and sufficient.
      //
      // treeshake: {
      //   moduleSideEffects: false,  // BROKEN - Removes all app code!
      //   propertyReadSideEffects: false,
      // },
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
