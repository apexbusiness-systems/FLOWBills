# FlowBills Boot Recovery Runbook

## White Screen Recovery

### Symptoms
- White screen with "Application Loading Error" or complete blank page
- Console shows boot errors or timeout messages
- Users unable to access the application

### Automatic Recovery Mechanisms

#### 1. Boot Stage Tracking
The application tracks boot progress through global state:
```javascript
window.__FLOWBILLS_BOOT__ = {
  stage: 'start' | 'sw-check' | 'import-app' | 'mounted' | 'error',
  ts: number,
  details: object,
  errors: Array<{ message: string, ts: number, fatal: boolean }>
}
```

**Check boot stage:**
```javascript
console.log(window.__FLOWBILLS_BOOT__);
// Expected final state: { stage: 'mounted', ... }
```

#### 2. Chunk Load Failure Recovery
- **Detection**: Monitors for `ChunkLoadError`, `Loading chunk`, `Failed to fetch dynamically imported module`
- **Automatic Action**: One-time recovery that unregisters service workers, clears caches, and reloads
- **Prevention**: `index.html` has `Cache-Control: no-cache` to prevent stale chunks

#### 3. Service Worker Resilience
- **Non-blocking cleanup**: SW cleanup runs in background with 500ms timeout
- **Safe registration**: SW only registered after app successfully mounts
- **Fallback**: App works perfectly without service worker

#### 4. Third-party Script Safety
- **Upscope**: Feature-flagged (`VITE_UPSCOPE_ENABLED=true`), loads after mount, failures don't block boot
- **Timeout protection**: All third-party scripts load with 5s timeout
- **Silent failures**: Third-party failures never throw uncaught exceptions

#### 5. Realistic Timeout Monitor
- **Timeout**: 20 seconds (not 5 seconds like the old failing watchdog)
- **Conditions**: Only shows error if app not mounted AND fatal errors detected
- **Recovery UI**: Provides diagnostic info and manual reload option

### Manual Recovery Steps

#### Immediate Actions (User-facing)
1. **Hard Reload**: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. **Clear Browser Data**:
   - Chrome: Settings → Privacy → Clear browsing data → Cached images and files
   - Firefox: Settings → Privacy → Clear Data → Cached Web Content

#### Developer Diagnostics
1. **Check Boot Status**:
   ```javascript
   console.log('Boot Status:', window.__FLOWBILLS_BOOT__);
   console.log('Boot Errors:', window.__FLOWBILLS_BOOT__?.errors);
   ```

2. **Check Network Tab**:
   - Look for 404s on chunk files
   - Verify main bundle loads (200 status)

3. **Check Console**:
   - `[FlowBills] Boot stage: *` messages
   - Any uncaught errors or promise rejections

#### Emergency Recovery
If automatic recovery fails:

1. **Force Chunk Recovery Reset**:
   ```javascript
   window.flowbillsBoot?.forceChunkRecovery();
   ```

2. **Clear Boot State**:
   ```javascript
   window.flowbillsBoot?.clearBootState();
   ```

3. **Manual SW/Cache Cleanup**:
   ```javascript
   // Unregister service workers
   navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));

   // Clear caches
   caches.keys().then(names => names.forEach(name => caches.delete(name)));
   ```

### Prevention Measures

#### CI/CD Gates
- **Post-deployment smoke tests**: `scripts/ci-boot-smoke-test.ts`
- **Boot reliability tests**: Verify app loads without SW, caches, third-party scripts
- **Chunk load failure simulation**: Tests automatic recovery

#### Hosting Configuration
- `index.html`: `Cache-Control: no-cache, no-store, must-revalidate`
- Assets: `Cache-Control: public, max-age=31536000, immutable`
- Multiple hosting configs: `vercel.json`, `netlify.toml`, `public/_headers`

#### Feature Flags
- `VITE_UPSCOPE_ENABLED=false` (default in production)
- Third-party scripts only load when explicitly enabled

### Monitoring & Alerts

#### Key Metrics to Monitor
1. **Boot Success Rate**: Percentage of page loads that reach `mounted` stage
2. **Boot Time**: Time from `start` to `mounted`
3. **Chunk Load Errors**: Count of chunk load failures
4. **Recovery Usage**: How often automatic recovery triggers

#### Alert Conditions
- Boot success rate < 99%
- Boot time > 10 seconds (P95)
- Chunk load errors > 1% of page loads
- Recovery triggers > 5% of page loads

### Deployment Checklist

#### Pre-deployment
- [ ] Run `npm run test:e2e` (includes boot smoke tests)
- [ ] Run `node scripts/ci-boot-smoke-test.ts`
- [ ] Verify `index.html` has correct cache headers
- [ ] Check that third-party scripts are feature-flagged

#### Post-deployment
- [ ] Monitor boot success rate for 1 hour
- [ ] Check for increased chunk load errors
- [ ] Verify automatic recovery is working
- [ ] Confirm no white screens in production

### Troubleshooting Common Issues

#### "ChunkLoadError" in Console
- **Cause**: Stale `index.html` cached, trying to load old chunk URLs
- **Solution**: Automatic recovery handles this, but verify `index.html` cache headers

#### "Application Loading Timeout"
- **Cause**: Boot taking >20s, possibly network issues or large bundles
- **Solution**: Check network tab, consider bundle splitting or CDN optimization

#### Boot Stuck at "sw-check"
- **Cause**: Service worker cleanup hanging
- **Solution**: Non-blocking by design, but check if SW APIs are failing

#### Third-party Script Errors
- **Cause**: Upscope or other scripts failing
- **Solution**: These should not block boot - check feature flags

### Contact Information
- **On-call Engineer**: Check #devops channel
- **Runbook Owner**: Platform team
- **Last Updated**: December 2025