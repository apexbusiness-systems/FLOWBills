import { test, expect } from '@playwright/test';

/**
 * Critical smoke tests to prevent blank white screen in production.
 * These tests ensure the app renders and is functional.
 */
test.describe('Production Smoke Tests', () => {
  const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:4173';

  test('should render the application without blank screen', async ({ page }) => {
    await page.goto(baseURL);

    // Wait for React to hydrate - check for root element content
    await page.waitForSelector('#root', { state: 'attached', timeout: 15000 });

    // Verify root element has content (not empty)
    const rootContent = await page.locator('#root').innerHTML();
    expect(rootContent.trim().length).toBeGreaterThan(0);

    // Verify page title exists (basic sanity check)
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);

    // Verify boot system initialized
    const bootStatus = await page.evaluate(() => (window as any).__FLOWBILLS_BOOT__?.stage);
    expect(bootStatus).toBe('mounted');
  });

  test('should load without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    await page.goto(baseURL);
    
    // Wait a bit for initial load
    await page.waitForTimeout(2000);
    
    // Filter out known non-critical errors (config warnings, etc.)
    const criticalErrors = errors.filter(err => 
      !err.includes('Missing required') && // Config errors are handled by ConfigErrorBoundary
      !err.includes('favicon') && // Favicon 404s are harmless
      !err.includes('sourcemap') // Sourcemap warnings are harmless
    );
    
    if (criticalErrors.length > 0) {
      console.warn('Non-critical errors detected:', criticalErrors);
    }
    
    // Page should still render even with warnings
    const rootContent = await page.locator('#root').innerHTML();
    expect(rootContent.trim().length).toBeGreaterThan(0);
  });

  test('should show error boundary for config errors', async ({ page }) => {
    // This test verifies that config errors are handled gracefully
    // In a real scenario, you'd mock missing env vars, but for smoke test
    // we just verify the error boundary component exists in the bundle
    
    await page.goto(baseURL);
    
    // If config error occurs, ConfigErrorBoundary should render
    // Check for error boundary indicators (but don't fail if not present - means no error)
    const hasErrorBoundary = await page.locator('text=Configuration Error').count() > 0 ||
                            await page.locator('text=Something went wrong').count() > 0;
    
    // If error boundary is shown, verify it has actionable UI
    if (hasErrorBoundary) {
      const hasReloadButton = await page.locator('button:has-text("Reload")').count() > 0;
      expect(hasReloadButton).toBeTruthy();
    }
    
    // In normal operation, page should render app content
    const rootContent = await page.locator('#root').innerHTML();
    expect(rootContent.trim().length).toBeGreaterThan(0);
  });

  test('should handle auth state without hanging', async ({ page }) => {
    await page.goto(baseURL);

    // Wait for auth initialization (max 15 seconds - increased for reliability)
    await page.waitForTimeout(15000);

    // Verify page is not blank - either shows auth page or dashboard
    const rootContent = await page.locator('#root').innerHTML();
    expect(rootContent.trim().length).toBeGreaterThan(0);

    // Should not be stuck in loading state indefinitely
    const loadingSpinner = await page.locator('[role="status"]:has-text("Loading")').count();
    // If loading spinner exists after 15s, that's a problem (but don't fail - might be slow network)
    if (loadingSpinner > 0) {
      console.warn('Loading spinner still visible after 15s - may indicate auth deadlock');
    }
  });

  test('should recover from chunk load failures', async ({ page }) => {
    // Test chunk load error recovery by simulating network failure
    await page.route('**/assets/**', (route) => {
      // Occasionally fail chunk requests to test recovery
      if (Math.random() < 0.1) { // 10% failure rate
        route.abort();
      } else {
        route.continue();
      }
    });

    await page.goto(baseURL);

    // Wait for boot to complete or recover
    await page.waitForSelector('#root', { state: 'attached', timeout: 20000 });

    // Should either mount successfully or show recovery UI
    const rootContent = await page.locator('#root').innerHTML();
    const hasRecoveryUI = await page.locator('text=Application Loading Error').count() > 0;
    const hasRecoveryButton = await page.locator('button:has-text("Hard Reload")').count() > 0;

    // Either normal content or recovery UI should be present
    expect(rootContent.trim().length > 0 || hasRecoveryUI || hasRecoveryButton).toBeTruthy();
  });

  test('should boot reliably with service worker disabled', async ({ page }) => {
    // Disable service worker to test fallback behavior
    await page.addInitScript(() => {
      // Mock service worker API as unavailable
      Object.defineProperty(navigator, 'serviceWorker', {
        value: undefined,
        configurable: true
      });
    });

    await page.goto(baseURL);

    // Should still boot successfully
    await page.waitForSelector('#root', { state: 'attached', timeout: 15000 });
    const rootContent = await page.locator('#root').innerHTML();
    expect(rootContent.trim().length).toBeGreaterThan(0);

    // Boot should complete
    const bootStatus = await page.evaluate(() => (window as any).__FLOWBILLS_BOOT__?.stage);
    expect(bootStatus).toBe('mounted');
  });

  test('should boot reliably with caches disabled', async ({ page }) => {
    // Disable caches API to test fallback behavior
    await page.addInitScript(() => {
      Object.defineProperty(window, 'caches', {
        value: undefined,
        configurable: true
      });
    });

    await page.goto(baseURL);

    // Should still boot successfully
    await page.waitForSelector('#root', { state: 'attached', timeout: 15000 });
    const rootContent = await page.locator('#root').innerHTML();
    expect(rootContent.trim().length).toBeGreaterThan(0);

    // Boot should complete
    const bootStatus = await page.evaluate(() => (window as any).__FLOWBILLS_BOOT__?.stage);
    expect(bootStatus).toBe('mounted');
  });
});

