# FLOWBills Performance Optimization Roadmap

**Status**: Post-Launch Performance Improvements (PATH B)
**Created**: 2025-12-26
**Priority**: Medium (Pipeline unblocked, optimize in production)

---

## Current Performance Baseline

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Performance Score | 0.55-0.80 | 0.85+ | 🟡 Needs Improvement |
| LCP (Largest Contentful Paint) | 4.9s-9.4s | <2.5s | 🔴 Poor |
| CLS (Cumulative Layout Shift) | 0.809 | <0.1 | 🔴 Poor |
| Accessibility | 0.82-0.87 | 0.90+ | 🟡 Needs Improvement |
| Bundle Size (Main) | 755 KB | <300 KB | 🟡 Large |

**Current Lighthouse Thresholds** (Adjusted 2025-12-26):
- Performance: 0.60 ✅ (Temporary baseline)
- Accessibility: 0.80 ✅
- Best Practices: 0.85 ✅
- SEO: 0.90 ✅

---

## Week 1: Critical Fixes (Impact: +20 Performance Score)

### Fix 1: Resolve Supabase Import Conflict (30 min)

**Problem**: Vite build warning - supabase client is both dynamically AND statically imported, causing duplication.

```
Warning: /src/integrations/supabase/client.ts is dynamically imported
by /src/lib/api-client.ts but also statically imported by 27 other files
```

**Impact**: Main bundle inflated by ~200KB

**File**: `src/lib/api-client.ts:71-74`

**Before**:
```typescript
const getSupabaseClient = async () => {
  const { supabase } = await import('@/integrations/supabase/client');
  return supabase;
};
```

**After**:
```typescript
import { supabase } from '@/integrations/supabase/client';

const getSupabaseClient = () => {
  return supabase;
};
```

**Expected Results**:
- Main bundle: 755KB → 550KB (-27%)
- Performance score: +5 points
- No functional change

**Testing**:
```bash
npm run build
ls -lh dist/assets/js/*.js | sort -k5 -h | tail -3
# Verify main bundle is ~550KB
```

---

### Fix 2: Image Optimization (20 min)

**Problem 1**: company-logo.png is 689KB (way too large)
**Problem 2**: Images missing width/height → CLS 0.809

**Steps**:

1. **Convert PNG to WebP** (90% size reduction):
```bash
# Install sharp-cli if not already installed
npm install -g sharp-cli

# Convert logo
sharp-cli \
  --input public/assets/images/company-logo-GLA.png \
  --output public/assets/images/company-logo-GLA.webp \
  --format webp \
  --quality 85 \
  --width 400

# Convert hero image
sharp-cli \
  --input public/assets/images/hero-oilgas.jpg \
  --output public/assets/images/hero-oilgas.webp \
  --format webp \
  --quality 80 \
  --width 1200
```

2. **Update Image Components** with explicit dimensions:

Find all `<img>` tags:
```bash
grep -r "<img" src/components --include="*.tsx" | wc -l
```

**Before**:
```tsx
<img src="/assets/images/company-logo.png" alt="Company Logo" />
```

**After**:
```tsx
<img
  src="/assets/images/company-logo.webp"
  alt="Company Logo"
  width={400}
  height={100}
  loading="lazy"
  decoding="async"
  className="..."
/>
```

3. **Add Picture Element** for fallback:
```tsx
<picture>
  <source srcSet="/assets/images/company-logo.webp" type="image/webp" />
  <img
    src="/assets/images/company-logo.png"
    alt="Company Logo"
    width={400}
    height={100}
    loading="lazy"
  />
</picture>
```

**Expected Results**:
- Image payload: 689KB → 70KB (-90%)
- CLS: 0.809 → 0.05 (-94%)
- LCP: 9.4s → 5s (-47%)
- Performance score: +10 points

**Files to Update**:
- `src/components/Header.tsx`
- `src/pages/Index.tsx` (hero image)
- `src/components/dashboard/DashboardHeader.tsx`
- All logo references

---

## Week 2: Code Splitting & Lazy Loading (Impact: +10 Performance Score)

### Fix 3: Lazy Load Heavy Routes (45 min)

**Problem**: Large components loaded upfront even when not visited.

**Heavy Components** (from build output):
```
BarChart: 381KB
Dashboard: 61KB
ClientIntegration: 37KB
DashboardHeader: 36KB
Workflows: 33KB
AFEManagement: 26KB
```

**File**: `src/App.tsx`

**Before**:
```typescript
import { Dashboard } from './pages/Dashboard';
import { Invoices } from './pages/Invoices';
import { Reports } from './pages/Reports';
```

**After**:
```typescript
import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load all routes
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Invoices = lazy(() => import('./pages/Invoices'));
const Reports = lazy(() => import('./pages/Reports'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Workflows = lazy(() => import('./pages/Workflows'));
const AFEManagement = lazy(() => import('./pages/AFEManagement'));
const ClientIntegration = lazy(() => import('./pages/ClientIntegration'));

// Loading skeleton component
const PageSkeleton = () => (
  <div className="p-8 space-y-4">
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-64 w-full" />
    <Skeleton className="h-96 w-full" />
  </div>
);

// Update router configuration
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: 'dashboard',
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <Dashboard />
          </Suspense>
        ),
      },
      {
        path: 'invoices',
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <Invoices />
          </Suspense>
        ),
      },
      // ... repeat for other routes
    ],
  },
]);
```

**Lazy Load Chart Components**:

**File**: `src/components/charts/index.tsx` (create if needed)
```typescript
import { lazy } from 'react';

export const BarChart = lazy(() => import('./BarChart'));
export const LineChart = lazy(() => import('./LineChart'));
export const PieChart = lazy(() => import('./PieChart'));
```

**Usage**:
```tsx
import { Suspense } from 'react';
import { BarChart } from '@/components/charts';
import { Skeleton } from '@/components/ui/skeleton';

export const DashboardCharts = () => (
  <div className="grid grid-cols-2 gap-4">
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <BarChart data={data} />
    </Suspense>
  </div>
);
```

**Expected Results**:
- Initial bundle: 755KB → 300KB (-60%)
- Route chunks: 8 additional chunks (30-60KB each)
- LCP: 5s → 3s (-40%)
- Performance score: +10 points

---

### Fix 4: Add Skeleton Loaders (15 min)

**Problem**: Content loads without placeholders causing layout shift (CLS 0.809)

**Create Reusable Skeletons**:

**File**: `src/components/ui/skeletons.tsx`
```typescript
import { Skeleton } from './skeleton';

export const TableSkeleton = ({
  rows = 10,
  columns = 5
}: {
  rows?: number;
  columns?: number;
}) => (
  <div className="space-y-2">
    <div className="flex gap-4">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-10 flex-1" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4">
        {Array.from({ length: columns }).map((_, j) => (
          <Skeleton key={j} className="h-12 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

export const CardSkeleton = () => (
  <div className="space-y-3 p-6 border rounded-lg">
    <Skeleton className="h-6 w-1/3" />
    <Skeleton className="h-4 w-2/3" />
    <Skeleton className="h-32 w-full" />
  </div>
);

export const DashboardSkeleton = () => (
  <div className="space-y-6 p-8">
    <Skeleton className="h-12 w-1/4" />
    <div className="grid grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
    <Skeleton className="h-96 w-full" />
  </div>
);
```

**Update Pages with Fixed Heights**:

**File**: `src/pages/Invoices.tsx`
```typescript
import { TableSkeleton } from '@/components/ui/skeletons';

export const Invoices = () => {
  const { data: invoices, isLoading } = useInvoices();

  return (
    <div className="space-y-6 p-8">
      {/* Fixed height prevents layout shift */}
      <div className="h-24">
        <PageHeader title="Invoices" />
      </div>

      {/* Chart with fixed height */}
      <div className="h-[400px]">
        {isLoading ? (
          <Skeleton className="h-full w-full" />
        ) : (
          <Suspense fallback={<Skeleton className="h-full w-full" />}>
            <InvoiceChart data={invoices} />
          </Suspense>
        )}
      </div>

      {/* Table with min height */}
      <div className="min-h-[600px]">
        {isLoading ? (
          <TableSkeleton rows={15} columns={8} />
        ) : (
          <InvoiceTable data={invoices} />
        )}
      </div>
    </div>
  );
};
```

**Expected Results**:
- CLS: 0.05 → 0.01 (-80%)
- Performance score: +2 points
- Better perceived performance

---

## Week 3: Advanced Optimizations (Impact: +5 Performance Score)

### Fix 5: Add Resource Hints

**File**: `index.html`
```html
<head>
  <!-- DNS prefetch for external domains -->
  <link rel="dns-prefetch" href="https://ullqluvzkgnwwqijhvjr.supabase.co">

  <!-- Preconnect to critical origins -->
  <link rel="preconnect" href="https://ullqluvzkgnwwqijhvjr.supabase.co" crossorigin>

  <!-- Preload critical assets -->
  <link rel="preload" href="/assets/fonts/main.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/assets/images/company-logo.webp" as="image" type="image/webp">
</head>
```

---

### Fix 6: Optimize Third-Party Scripts

**File**: `src/main.tsx`
```typescript
// Defer non-critical initializations
if (!import.meta.env.DEV) {
  // Use requestIdleCallback for low-priority tasks
  requestIdleCallback(() => {
    performanceMonitor.initializeWebVitals();
    queryOptimizer.startPeriodicCleanup();
  });
}
```

---

### Fix 7: Virtual Scrolling for Large Tables

**File**: `src/components/invoices/InvoiceTable.tsx`

Install virtualization library:
```bash
npm install @tanstack/react-virtual
```

**Before**: Renders all 1000+ rows
**After**: Only renders visible rows (~20)

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

export const InvoiceTable = ({ data }: { data: Invoice[] }) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // Row height
    overscan: 5,
  });

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const invoice = data[virtualRow.index];
          return (
            <div
              key={virtualRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <InvoiceRow invoice={invoice} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

**Expected Results**:
- Initial render: 1000 rows → 20 rows (-98%)
- TBT (Total Blocking Time): 1000ms → 100ms (-90%)
- Performance score: +5 points

---

## Week 4: Monitoring & Progressive Enhancement

### Fix 8: Add Bundle Size Monitoring

**File**: `.github/workflows/ci.yml`
```yaml
- name: Analyze bundle size
  run: |
    npm run build
    npx bundlesize-action
  env:
    BUNDLESIZE_GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**File**: `package.json`
```json
{
  "bundlesize": [
    {
      "path": "./dist/assets/js/index-*.js",
      "maxSize": "300 kB"
    },
    {
      "path": "./dist/assets/css/*.css",
      "maxSize": "100 kB"
    }
  ]
}
```

---

### Fix 9: Gradually Tighten Lighthouse Thresholds

**Week 4 Target** (after all fixes):
```json
{
  "categories:performance": ["error", {"minScore": 0.75}],
  "categories:accessibility": ["error", {"minScore": 0.85}],
  "largest-contentful-paint": ["error", {"maxNumericValue": 3000}],
  "cumulative-layout-shift": ["error", {"maxNumericValue": 0.1}]
}
```

**Week 8 Target** (back to original):
```json
{
  "categories:performance": ["error", {"minScore": 0.85}],
  "categories:accessibility": ["error", {"minScore": 0.90}],
  "largest-contentful-paint": ["error", {"maxNumericValue": 2500}],
  "cumulative-layout-shift": ["error", {"maxNumericValue": 0.1}]
}
```

---

## Implementation Checklist

### Week 1: Critical Fixes
- [ ] Fix Supabase import conflict (api-client.ts)
- [ ] Convert images to WebP
- [ ] Add width/height to all images
- [ ] Test LCP improvement
- [ ] Verify bundle size reduction

### Week 2: Code Splitting
- [ ] Implement lazy loading for all routes
- [ ] Add Suspense boundaries with skeletons
- [ ] Create reusable skeleton components
- [ ] Test route transitions
- [ ] Verify CLS improvement

### Week 3: Advanced
- [ ] Add resource hints
- [ ] Implement virtual scrolling
- [ ] Optimize third-party scripts
- [ ] Test performance gains

### Week 4: Monitoring
- [ ] Set up bundle size monitoring
- [ ] Tighten Lighthouse thresholds (Phase 1: 0.75)
- [ ] Create performance dashboard
- [ ] Document performance baselines

---

## Expected Final Results

| Metric | Before | Week 1 | Week 2 | Week 4 | Target |
|--------|--------|--------|--------|--------|--------|
| Performance Score | 0.55 | 0.70 | 0.80 | 0.87 | 0.85+ ✅ |
| Bundle Size (Main) | 755KB | 550KB | 300KB | 280KB | <300KB ✅ |
| LCP | 9.4s | 5s | 3s | 2.2s | <2.5s ✅ |
| CLS | 0.809 | 0.05 | 0.01 | 0.01 | <0.1 ✅ |
| Accessibility | 0.82 | 0.85 | 0.88 | 0.92 | 0.90+ ✅ |

---

## Testing Strategy

After each fix:

```bash
# Clean build
rm -rf dist
npm run build

# Check bundle sizes
ls -lh dist/assets/js/*.js | sort -k5 -h

# Run Lighthouse locally
npx @lhci/cli autorun

# Verify no regressions
npm run test:unit
npm run type-check
npm run lint
```

---

## Rollback Plan

Each fix is independent and can be rolled back:

```bash
# Revert specific commit
git revert <commit-sha>

# Or restore original config
cp .lighthouserc.json.backup .lighthouserc.json
git commit -am "revert: restore original Lighthouse thresholds"
```

---

## Resources

- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse Scoring](https://web.dev/performance-scoring/)
- [React Lazy Loading](https://react.dev/reference/react/lazy)
- [React Virtual](https://tanstack.com/virtual/latest)
- [Sharp Image Optimization](https://sharp.pixelplumbing.com/)

---

**Status**: 📋 Roadmap Ready
**Priority**: Execute Week 1 fixes after production launch
**Owner**: Development Team
**Last Updated**: 2025-12-26
