/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/lib/test-utils.tsx'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'tests/**/*.test.ts', 'tests/**/*.test.tsx', 'tests/**/*.spec.ts', 'tests/**/*.spec.tsx'],
    exclude: [
      'supabase/functions/**', // Exclude Deno tests
      'tests/e2e/**', // Exclude Playwright E2E tests from Unit/Integration runner
      'node_modules/',
      'src/lib/test-utils.tsx',
      '**/*.d.ts',
      '**/*.config.*',
      'dist/',
      '.next/',
      'coverage/',
    ],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/lib/test-utils.tsx',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
        '.next/',
        'coverage/',
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
    },
    // Mock environment variables for Vitest
    env: {
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'test-anon-key',
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
