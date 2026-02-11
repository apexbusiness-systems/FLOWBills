import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Build Output Validation', () => {
  const distPath = path.join(__dirname, '../dist/assets/js');

  it('should generate non-empty vendor bundles', () => {
    if (!fs.existsSync(distPath)) {
        throw new Error(`Distribution directory not found at ${distPath}. Run 'npm run build' first.`);
    }

    const vendors = fs.readdirSync(distPath)
      .filter(f => f.startsWith('vendor-'));

    expect(vendors.length).toBeGreaterThan(0);

    vendors.forEach(vendor => {
      const size = fs.statSync(path.join(distPath, vendor)).size;
      expect(size).toBeGreaterThan(50_000); // Min 50 KB (adjusted for vendor-forms ~80KB)
    });
  });

  it('should not exceed total bundle size limit', () => {
    if (!fs.existsSync(distPath)) {
        throw new Error(`Distribution directory not found at ${distPath}. Run 'npm run build' first.`);
    }

    const totalSize = fs.readdirSync(distPath)
      .reduce((sum, file) => {
        return sum + fs.statSync(path.join(distPath, file)).size;
      }, 0);

    expect(totalSize).toBeLessThan(3_500_000); // Max 3.5 MB
  });
});
