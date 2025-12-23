#!/usr/bin/env node

/**
 * Bundle Size Analysis Script
 * Analyzes Vite build output and provides optimization recommendations
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const DIST_DIR = join(process.cwd(), 'dist');
const MAX_CHUNK_SIZE = 500 * 1024; // 500KB
const MAX_ASSET_SIZE = 200 * 1024; // 200KB

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function analyzeDirectory(dir, basePath = '') {
  const items = readdirSync(dir);
  const results = {
    chunks: [],
    assets: [],
    totalSize: 0,
    warnings: [],
  };

  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);
    const relativePath = join(basePath, item);

    if (stat.isDirectory()) {
      const subResults = analyzeDirectory(fullPath, relativePath);
      results.chunks.push(...subResults.chunks);
      results.assets.push(...subResults.assets);
      results.totalSize += subResults.totalSize;
      results.warnings.push(...subResults.warnings);
    } else {
      const size = stat.size;
      results.totalSize += size;

      if (item.endsWith('.js')) {
        const chunkInfo = {
          path: relativePath,
          size,
          formatted: formatBytes(size),
          isLarge: size > MAX_CHUNK_SIZE,
        };
        results.chunks.push(chunkInfo);

        if (chunkInfo.isLarge) {
          results.warnings.push(
            `⚠️  Large chunk: ${relativePath} (${chunkInfo.formatted})`
          );
        }
      } else if (item.match(/\.(png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/i)) {
        const assetInfo = {
          path: relativePath,
          size,
          formatted: formatBytes(size),
          isLarge: size > MAX_ASSET_SIZE,
        };
        results.assets.push(assetInfo);

        if (assetInfo.isLarge) {
          results.warnings.push(
            `⚠️  Large asset: ${relativePath} (${assetInfo.formatted})`
          );
        }
      }
    }
  }

  return results;
}

function main() {
  console.log('📦 Analyzing bundle sizes...\n');

  try {
    const results = analyzeDirectory(DIST_DIR);

    console.log('📊 Bundle Analysis Results\n');
    console.log(`Total bundle size: ${formatBytes(results.totalSize)}\n`);

    console.log('📦 JavaScript Chunks:');
    results.chunks
      .sort((a, b) => b.size - a.size)
      .slice(0, 10)
      .forEach((chunk) => {
        const marker = chunk.isLarge ? '⚠️ ' : '✅';
        console.log(`  ${marker} ${chunk.path}: ${chunk.formatted}`);
      });

    console.log('\n🖼️  Assets:');
    results.assets
      .sort((a, b) => b.size - a.size)
      .slice(0, 10)
      .forEach((asset) => {
        const marker = asset.isLarge ? '⚠️ ' : '✅';
        console.log(`  ${marker} ${asset.path}: ${asset.formatted}`);
      });

    if (results.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      results.warnings.forEach((warning) => console.log(`  ${warning}`));
      console.log('\n💡 Recommendations:');
      console.log('  - Consider code splitting for large chunks');
      console.log('  - Optimize images (use WebP, compress)');
      console.log('  - Use lazy loading for non-critical assets');
      console.log('  - Review dependencies for tree-shaking opportunities');
    } else {
      console.log('\n✅ All chunks and assets are within recommended sizes!');
    }

    console.log('\n📈 Optimization Tips:');
    console.log('  - Enable gzip/brotli compression on server');
    console.log('  - Use CDN for static assets');
    console.log('  - Implement service worker caching');
    console.log('  - Monitor Core Web Vitals (LCP, FID, CLS)');
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error('❌ dist/ directory not found. Run "npm run build" first.');
      process.exit(1);
    } else {
      console.error('❌ Error analyzing bundle:', error);
      process.exit(1);
    }
  }
}

main();

