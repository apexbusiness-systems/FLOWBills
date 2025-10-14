# P7: SLO Burn Rate Alerts

## Overview
FlowBills.ca implements multi-window burn-rate alerting based on Google SRE workbook recommendations to detect SLO violations early.

## SLO Targets

| Service | Availability SLO | Latency SLO (p95) | Error Budget |
|---------|------------------|-------------------|--------------|
| API (invoice processing) | 99.5% | < 500ms | 0.5% (216 min/month) |
| E-invoicing validation | 99.5% | < 800ms | 0.5% |
| OCR extraction | 99.0% | < 3s | 1.0% |
| Webhook delivery | 99.9% | < 1s | 0.1% |

## Burn Rate Windows

Per Google SRE formula: `burn_rate = error_rate / error_budget`

| Window | Duration | Burn Rate Threshold | Budget Consumption | Alert Severity |
|--------|----------|---------------------|-------------------|----------------|
| 1h | 60 min | 14.4x | 1% in 1 hour | **CRITICAL** |
| 6h | 360 min | 6x | 5% in 6 hours | **HIGH** |
| 24h | 1440 min | 3x | 10% in 24 hours | **MEDIUM** |
| 72h | 4320 min | 1x | 30% in 72 hours | **LOW** |

## Alert Rules

### Critical Alert (1h window)
```
IF burn_rate_1h > 14.4 AND burn_rate_5m > 14.4
THEN page on-call
```
**Meaning:** At current error rate, we'll exhaust the entire monthly budget in 1 hour.

**Response:**
1. Check recent deployments (rollback if needed)
2. Inspect error logs for patterns
3. Scale resources if load-related
4. Update incident channel

### High Alert (6h window)
```
IF burn_rate_6h > 6 AND burn_rate_30m > 6
THEN notify #incidents
```
**Meaning:** Burning 5% of monthly budget in 6 hours.

**Response:**
1. Investigate error spike cause
2. Prepare rollback plan
3. Monitor burn rate trend

### Medium Alert (24h window)
```
IF burn_rate_24h > 3 AND burn_rate_2h > 3
THEN notify #engineering
```
**Meaning:** Burning 10% of budget in 24 hours.

**Response:**
1. Triage errors
2. Create tickets for fixes
3. Review logs for patterns

### Low Alert (72h window)
```
IF burn_rate_72h > 1 AND burn_rate_6h > 1
THEN ticket for investigation
```
**Meaning:** Burning 30% of budget in 3 days.

**Response:**
1. Analyze trends
2. Plan preventive fixes
3. Review capacity

## Metrics Collection

### Frontend (Browser)
```typescript
import { StructuredLogger } from '@/lib/observability';

const logger = new StructuredLogger({
  tenant: 'org-123',
  route: '/api/invoices',
});

// Capture API errors
try {
  const response = await fetch('/api/endpoint');
  if (!response.ok) {
    logger.error('API request failed', {
      status: response.status,
      endpoint: '/api/endpoint',
      duration_ms: performance.now() - start,
    });
  }
} catch (err) {
  logger.error('Network error', { error: err.message });
}
```

### Edge Functions
```typescript
import { StructuredLogger } from "../_shared/observability.ts";

const logger = new StructuredLogger({
  tenant: customer_id,
  route: 'einvoice_validate',
});

const start = performance.now();
try {
  // Processing logic
  logger.info('Validation successful', {
    duration_ms: performance.now() - start,
  });
} catch (err) {
  logger.error('Validation failed', {
    error: err.message,
    duration_ms: performance.now() - start,
  });
  throw err;
}
```

## Calculating Burn Rate

```typescript
import { calculateBurnRate, shouldAlert, SLO_BURN_WINDOWS } from '@/lib/observability';

// Example: API errors in last hour
const errorCount = 50;
const totalRequests = 10000;
const sloTarget = 0.995; // 99.5%

const burnRate = calculateBurnRate(errorCount, totalRequests, sloTarget);
// burnRate = (50/10000) / 0.005 = 1.0

const window1h = SLO_BURN_WINDOWS.find(w => w.name === '1h');
if (shouldAlert(burnRate, window1h)) {
  // Trigger alert: burnRate (1.0) < threshold (14.4), so no alert
}
```

## Query Examples (Supabase Analytics)

### API Error Rate (1h window)
```sql
SELECT 
  COUNT(*) FILTER (WHERE parsed.error_severity IN ('ERROR', 'FATAL')) as errors,
  COUNT(*) as total,
  (COUNT(*) FILTER (WHERE parsed.error_severity IN ('ERROR', 'FATAL'))::float / COUNT(*)) as error_rate,
  ((COUNT(*) FILTER (WHERE parsed.error_severity IN ('ERROR', 'FATAL'))::float / COUNT(*)) / 0.005) as burn_rate
FROM postgres_logs
CROSS JOIN unnest(metadata) as m
CROSS JOIN unnest(m.parsed) as parsed
WHERE timestamp > now() - interval '1 hour'
  AND identifier = 'einvoice_validate';
```

### Latency SLO (p95 < 500ms)
```sql
SELECT 
  percentile_cont(0.95) WITHIN GROUP (ORDER BY m.execution_time_ms) as p95_latency,
  COUNT(*) FILTER (WHERE m.execution_time_ms > 500) as slow_requests,
  COUNT(*) as total,
  (COUNT(*) FILTER (WHERE m.execution_time_ms > 500)::float / COUNT(*)) as latency_error_rate
FROM function_edge_logs
CROSS JOIN unnest(metadata) as m
WHERE timestamp > now() - interval '1 hour'
  AND m.function_id = 'einvoice_validate';
```

## Dashboard Setup

1. **Supabase Dashboard** → Functions → Logs
2. Create saved queries for each SLO window
3. Set up email alerts for critical thresholds
4. Export metrics to external monitoring (optional: Grafana, Datadog)

## Runbook: SLO Breach Response

### Step 1: Acknowledge
- Update incident channel with burn rate data
- Assign incident commander

### Step 2: Triage
- Check recent deployments (last 2 hours)
- Review error logs for common patterns
- Inspect resource utilization (CPU, memory, DB)

### Step 3: Mitigate
- **If deployment issue:** Rollback via Git revert + redeploy
- **If load issue:** Scale Edge Functions or upgrade DB plan
- **If external API:** Circuit-break failing dependency

### Step 4: Resolve
- Confirm burn rate drops below threshold
- Document root cause
- Create tickets for permanent fixes

### Step 5: Postmortem
- Write incident report within 48h
- Identify preventive measures
- Update runbooks

## References
- [Google SRE: Alerting on SLOs](https://sre.google/workbook/alerting-on-slos/)
- [Multi-Window Burn-Rate Alerts](https://sre.google/workbook/alerting-on-slos/#6-multiwindow-multi-burn-rate-alerts)
- [Supabase Analytics Queries](https://supabase.com/docs/guides/platform/logs)