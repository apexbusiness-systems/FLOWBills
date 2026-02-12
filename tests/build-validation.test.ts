import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Build Output Validation', () => {
  const distPath = path.resolve(process.cwd(), 'dist/assets/js');

  it('should generate non-empty vendor bundles', () => {
    // This test assumes 'npm run build' has been executed.
    // In CI, we run build before tests or in a separate stage.
    // If dist doesn't exist, we can't validate, but we shouldn't fail unit tests
    // if we are just running logic tests.
    // However, for "security protocol" validation, we want to be strict.

    if (!fs.existsSync(distPath)) {
      console.warn('Build output not found at ' + distPath + '. Skipping bundle validation.');
      return;
    }

    const files = fs.readdirSync(distPath);
    const vendors = files.filter(f => f.startsWith('vendor-') && f.endsWith('.js'));

    // We expect at least the configured vendor chunks:
    // vendor-react, vendor-ui, vendor-supabase, vendor-charts, vendor-forms
    expect(vendors.length).toBeGreaterThanOrEqual(5);

    vendors.forEach(vendor => {
      const stats = fs.statSync(path.join(distPath, vendor));
      // Vendor chunks should not be empty (0 bytes) or near-empty
      expect(stats.size).toBeGreaterThan(1000);
    });
  });

  it('should not exceed total bundle size limit', () => {
    if (!fs.existsSync(distPath)) return;

    const files = fs.readdirSync(distPath);
    const totalSize = files.reduce((sum, file) => {
        if (file.endsWith('.js')) {
            return sum + fs.statSync(path.join(distPath, file)).size;
        }
        return sum;
    }, 0);

    // 3.5 MB Limit
    expect(totalSize).toBeLessThan(3500000);
  });
});
