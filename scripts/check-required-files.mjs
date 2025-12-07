import fs from 'fs';
import path from 'path';
import url from 'url';

const projectRoot = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');

const requiredFiles = [
  'package.json',
  'tsconfig.json',
  'vite.config.ts',
  'src/main.tsx',
  'src/App.tsx',
  'public/favicon.ico',
];

const missing = requiredFiles.filter((relativePath) => {
  const absolutePath = path.resolve(projectRoot, relativePath);
  return !fs.existsSync(absolutePath);
});

if (missing.length > 0) {
  console.error('❌ Missing required files:', missing.join(', '));
  process.exitCode = 1;
} else {
  console.log('✅ All required files found');
}
