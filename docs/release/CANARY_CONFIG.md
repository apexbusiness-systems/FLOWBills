# P16 — Canary Deployment Configuration

## Overview
Canary deployments allow gradual rollout of new releases to minimize risk. Traffic is initially routed to a small percentage of users (10%) and automatically rolled back if error thresholds are exceeded.

## Canary Rules

### Traffic Split
- **Initial**: 10% canary, 90% stable
- **Monitoring Period**: 15 minutes
- **Promotion**: Auto-promote to 100% if healthy

### Auto-Rollback Conditions
Rollback is triggered if **any** of the following occur for 10 consecutive minutes:

1. **p95 Latency** > 800ms
2. **Error Rate** > 0.5% (5 errors per 1000 requests)
3. **Availability** < 99.5%

### Monitoring Windows
- **5-minute window**: 14x burn rate (immediate issues)
- **30-minute window**: 6x burn rate (degradation)
- **1-hour window**: 3x burn rate (sustained issues)

## Implementation

### Deployment Flow
```bash
# 1. Deploy canary
git checkout <new-sha>
npm run build
./scripts/deploy-canary.sh --traffic 10

# 2. Monitor for 15 minutes
./scripts/monitor-canary.sh --duration 15m

# 3. Auto-promote or rollback
# If healthy: promote to 100%
# If unhealthy: rollback to stable
```

### Canary Monitoring Script
```bash
#!/bin/bash
# scripts/monitor-canary.sh
DURATION=${2:-15m}
START_TIME=$(date +%s)

while true; do
  # Check p95 latency
  P95=$(curl -s http://localhost:8910/metrics | grep 'http_request_duration_seconds{quantile="0.95"}' | awk '{print $2}')
  
  # Check error rate
  ERROR_RATE=$(curl -s http://localhost:8910/metrics | grep 'http_requests_total{status=~"5.."}' | awk '{sum+=$2} END {print sum/NR}')
  
  # Check availability
  AVAILABILITY=$(curl -s http://localhost:8910/healthz && echo "up" || echo "down")
  
  if (( $(echo "$P95 > 0.8" | bc -l) )) || (( $(echo "$ERROR_RATE > 0.005" | bc -l) )) || [ "$AVAILABILITY" = "down" ]; then
    echo "❌ Canary FAILED - Triggering rollback"
    ./scripts/rollback.sh $PREVIOUS_SHA
    exit 1
  fi
  
  ELAPSED=$(($(date +%s) - START_TIME))
  if [ $ELAPSED -gt 900 ]; then # 15 minutes
    echo "✅ Canary PASSED - Promoting to 100%"
    ./scripts/promote-canary.sh
    exit 0
  fi
  
  sleep 30
done
```

### Simulated Failure Test
To test auto-rollback, inject a simulated failure:

```bash
# Inject high latency
curl -X POST http://localhost:8910/admin/inject-latency -d '{"ms": 1000}'

# Inject errors
curl -X POST http://localhost:8910/admin/inject-errors -d '{"rate": 0.01}'

# Verify rollback triggers within 10 minutes
./scripts/monitor-canary.sh
```

## Alert Configuration

### PagerDuty Integration
```yaml
alert:
  - name: "Canary Rollback Triggered"
    condition: "canary_status == 'rolled_back'"
    severity: "high"
    notify:
      - pagerduty
      - slack: "#engineering"
    
  - name: "Canary Promoted"
    condition: "canary_status == 'promoted'"
    severity: "info"
    notify:
      - slack: "#engineering"
```

### Slack Notifications
```bash
# On rollback
slack-cli send --channel #engineering --text "🚨 Canary rollback triggered for release $RELEASE_SHA. Reason: $REASON"

# On promotion
slack-cli send --channel #engineering --text "✅ Canary promoted to 100% for release $RELEASE_SHA"
```

## Rollback Evidence
All rollback events are logged to `security_events` table for audit:

```sql
INSERT INTO security_events (event_type, severity, details)
VALUES (
  'canary_rollback_triggered',
  'high',
  jsonb_build_object(
    'release_sha', '<sha>',
    'reason', 'p95_latency_exceeded',
    'p95_latency_ms', 850,
    'error_rate', 0.003,
    'timestamp', now()
  )
);
```

## Best Practices

1. **Always test in staging first** before production canary
2. **Monitor actively** during the 15-minute window
3. **Have on-call engineer ready** for manual intervention
4. **Document rollback reasons** in postmortem
5. **Review metrics** after every canary (pass or fail)

## Links
- [Release Notes Template](./RELEASE_NOTES_TEMPLATE.md)
- [Rollback Script](../../scripts/rollback.sh)
- [Monitoring Dashboard](https://grafana.flowbills.ca/d/canary)
