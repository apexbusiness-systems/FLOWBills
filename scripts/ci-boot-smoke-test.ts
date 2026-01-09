#!/usr/bin/env node
/**
 * CI Boot Smoke Test - Post-Deployment Verification
 *
 * This test verifies that FlowBills boots reliably in production-like conditions.
 * It tests the resilient boot pipeline and ensures no single points of failure.
 *
 * Usage: node scripts/ci-boot-smoke-test.ts [url]
 */

import { chromium } from 'playwright';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL';
  duration: number;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];
const targetUrl = process.argv[2] || 'http://localhost:4173';

async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  const start = Date.now();
  try {
    await testFn();
    results.push({
      name,
      status: 'PASS',
      duration: Date.now() - start
    });
    console.log(`✅ ${name}`);
  } catch (error) {
    results.push({
      name,
      status: 'FAIL',
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : String(error)
    });
    console.error(`❌ ${name}: ${error}`);
  }
}

async function testBasicBoot() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Set a reasonable timeout
    page.setDefaultTimeout(30000);

    // Navigate to the app
    await page.goto(targetUrl);

    // Wait for root element
    await page.waitForSelector('#root', { state: 'attached', timeout: 20000 });

    // Check that root has content
    const rootContent = await page.locator('#root').innerHTML();
    if (rootContent.trim().length === 0) {
      throw new Error('Root element is empty');
    }

    // Check boot status
    const bootStatus = await page.evaluate(() => (window as any).__FLOWBILLS_BOOT__?.stage);
    if (bootStatus !== 'mounted') {
      throw new Error(`Boot not completed, stage: ${bootStatus}`);
    }

    // Check for boot errors
    const bootErrors = await page.evaluate(() => (window as any).__FLOWBILLS_BOOT__?.errors || []);
    const fatalErrors = bootErrors.filter((e: any) => e.fatal);
    if (fatalErrors.length > 0) {
      throw new Error(`Fatal boot errors: ${fatalErrors.map((e: any) => e.message).join(', ')}`);
    }

  } finally {
    await browser.close();
  }
}

async function testBootWithServiceWorkerDisabled() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Disable service worker
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: undefined,
        configurable: true
      });
    });

    await page.goto(targetUrl);
    await page.waitForSelector('#root', { state: 'attached', timeout: 20000 });

    const rootContent = await page.locator('#root').innerHTML();
    if (rootContent.trim().length === 0) {
      throw new Error('Root element is empty without service worker');
    }

    const bootStatus = await page.evaluate(() => (window as any).__FLOWBILLS_BOOT__?.stage);
    if (bootStatus !== 'mounted') {
      throw new Error(`Boot failed without service worker, stage: ${bootStatus}`);
    }

  } finally {
    await browser.close();
  }
}

async function testBootWithCachesDisabled() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Disable caches
    await page.addInitScript(() => {
      Object.defineProperty(window, 'caches', {
        value: undefined,
        configurable: true
      });
    });

    await page.goto(targetUrl);
    await page.waitForSelector('#root', { state: 'attached', timeout: 20000 });

    const rootContent = await page.locator('#root').innerHTML();
    if (rootContent.trim().length === 0) {
      throw new Error('Root element is empty without caches');
    }

    const bootStatus = await page.evaluate(() => (window as any).__FLOWBILLS_BOOT__?.stage);
    if (bootStatus !== 'mounted') {
      throw new Error(`Boot failed without caches, stage: ${bootStatus}`);
    }

  } finally {
    await browser.close();
  }
}

async function testChunkLoadRecovery() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Simulate chunk load failures
    let failureCount = 0;
    await page.route('**/assets/**', (route) => {
      if (Math.random() < 0.3 && failureCount < 2) { // Fail 30% of requests, max 2 failures
        failureCount++;
        route.abort();
      } else {
        route.continue();
      }
    });

    await page.goto(targetUrl);

    // Wait longer for potential recovery
    await page.waitForSelector('#root', { state: 'attached', timeout: 30000 });

    const rootContent = await page.locator('#root').innerHTML();
    const hasRecoveryUI = await page.locator('text=Application Loading Error').count() > 0;

    // Should either have content or recovery UI
    if (rootContent.trim().length === 0 && !hasRecoveryUI) {
      throw new Error('No content and no recovery UI after chunk failures');
    }

  } finally {
    await browser.close();
  }
}

async function testBootTimeout() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Simulate slow loading
    await page.route('**/*', (route) => {
      // Delay all requests by 2 seconds
      setTimeout(() => route.continue(), 2000);
    });

    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

    // Wait for boot timeout monitor to potentially trigger
    await page.waitForTimeout(25000); // Wait past 20s timeout

    const hasTimeoutError = await page.locator('text=Application Loading Timeout').count() > 0;
    const bootStatus = await page.evaluate(() => (window as any).__FLOWBILLS_BOOT__?.stage);

    // Should either have mounted by now or shown timeout error
    if (bootStatus !== 'mounted' && !hasTimeoutError) {
      throw new Error('Boot stuck without timeout error after 25s');
    }

  } finally {
    await browser.close();
  }
}

// Note: Upscope is disabled by default in CI via VITE_UPSCOPE_ENABLED=false
// This test ensures the app boots correctly without Upscope
async function testBootWithoutUpscope() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Ensure Upscope is disabled (default behavior)
    await page.goto(targetUrl);
    await page.waitForSelector('#root', { state: 'attached', timeout: 20000 });

    const rootContent = await page.locator('#root').innerHTML();
    if (rootContent.trim().length === 0) {
      throw new Error('App failed to load without Upscope');
    }

    const bootStatus = await page.evaluate(() => (window as any).__FLOWBILLS_BOOT__?.stage);
    if (bootStatus !== 'mounted') {
      throw new Error(`Boot failed without Upscope, stage: ${bootStatus}`);
    }

    // Verify no Upscope scripts are loaded
    const upscopeScripts = await page.locator('script[src*="upscope"]').count();
    if (upscopeScripts > 0) {
      throw new Error('Upscope scripts were loaded when they should be disabled');
    }

  } finally {
    await browser.close();
  }
}

async function main() {
  console.log(`🚀 Running CI Boot Smoke Tests against: ${targetUrl}\n`);

  await runTest('Basic Boot Test', testBasicBoot);
  await runTest('Boot without Service Worker', testBootWithServiceWorkerDisabled);
  await runTest('Boot without Caches API', testBootWithCachesDisabled);
  await runTest('Chunk Load Failure Recovery', testChunkLoadRecovery);
  await runTest('Boot Timeout Handling', testBootTimeout);
  await runTest('Boot without Upscope', testBootWithoutUpscope);

  console.log('\n' + '='.repeat(60));
  console.log('📊 CI BOOT SMOKE TEST RESULTS');
  console.log('='.repeat(60) + '\n');

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const total = results.length;

  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);

  results.forEach((result, index) => {
    const icon = result.status === 'PASS' ? '✅' : '❌';
    console.log(`${index + 1}. ${icon} ${result.name} (${result.duration}ms)`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log('\n' + '='.repeat(60));
  if (failed === 0) {
    console.log('🎉 ALL BOOT SMOKE TESTS PASSED - PRODUCTION READY');
    process.exit(0);
  } else {
    console.log('❌ BOOT SMOKE TESTS FAILED - DO NOT PROCEED TO PRODUCTION');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error running CI boot smoke tests:', error);
  process.exit(1);
});