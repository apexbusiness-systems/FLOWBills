# Service Level Objectives (SLOs) and Alerting

## Overview

FlowAi maintains high availability and performance through well-defined Service Level Objectives (SLOs) with multi-window burn-rate alerting based on Google SRE best practices.

## Core SLOs

### 1. API Availability SLO
- **Objective**: 99.9% availability over 30 days
- **Error Budget**: 43.2 minutes/month
- **SLI**: Ratio of successful HTTP responses (2xx, 3xx) to total requests
- **Measurement**: `http_requests_total{status!~"5.."}` / `http_requests_total`

### 2. Invoice Processing Latency SLO  
- **Objective**: 95% of invoice processing requests complete within 10 seconds
- **Error Budget**: 5% of requests can exceed 10s
- **SLI**: P95 latency of `/api/invoices` POST requests
- **Measurement**: `histogram_quantile(0.95, http_request_duration_seconds_bucket{endpoint="/api/invoices"})`

### 3. OCR Extraction Success Rate SLO
- **Objective**: 98% OCR extraction success rate over 7 days  
- **Error Budget**: 2% of extractions can fail
- **SLI**: Ratio of successful OCR extractions to total attempts
- **Measurement**: `ocr_extractions_total{status="success"}` / `ocr_extractions_total`

### 4. Fraud Detection Response Time SLO
- **Objective**: 99% of fraud checks complete within 2 seconds
- **Error Budget**: 1% of checks can exceed 2s
- **SLI**: P99 latency of fraud detection pipeline
- **Measurement**: `histogram_quantile(0.99, fraud_check_duration_seconds_bucket)`

### 5. Database Query Performance SLO
- **Objective**: 95% of database queries complete within 500ms
- **Error Budget**: 5% of queries can exceed 500ms  
- **SLI**: P95 query execution time
- **Measurement**: `histogram_quantile(0.95, db_query_duration_seconds_bucket)`

## Multi-Window Burn-Rate Alerting

### Burn Rate Calculation
For a 99.9% SLO (0.1% error budget):
- **1x burn rate**: 0.1% error rate (normal consumption)
- **14.4x burn rate**: 1.44% error rate (fast burn - 5m window)
- **6x burn rate**: 0.6% error rate (slow burn - 1h window)

### Alert Configuration

#### Fast Burn Alert (Critical)
```yaml
groups:
- name: slo-fast-burn
  rules:
  - alert: APIAvailabilityFastBurn
    expr: |
      (
        (1 - (http_requests_total{status!~"5.."}[5m] / http_requests_total[5m])) > (14.4 * 0.001)
        and
        (1 - (http_requests_total{status!~"5.."}[1h] / http_requests_total[1h])) > (14.4 * 0.001)
      )
    for: 2m
    labels:
      severity: critical
      slo: api_availability
    annotations:
      summary: "API availability burning error budget too fast"
      description: "Error budget will be exhausted in 2 hours at current rate"
```

#### Slow Burn Alert (Warning)
```yaml
  - alert: APIAvailabilitySlowBurn  
    expr: |
      (
        (1 - (http_requests_total{status!~"5.."}[30m] / http_requests_total[30m])) > (6 * 0.001)
        and
        (1 - (http_requests_total{status!~"5.."}[6h] / http_requests_total[6h])) > (6 * 0.001)
      )
    for: 15m
    labels:
      severity: warning
      slo: api_availability
    annotations:
      summary: "API availability burning error budget consistently"
      description: "Error budget will be exhausted in 5 days at current rate"
```

### Invoice Processing Latency Alerts
```yaml
  - alert: InvoiceProcessingLatencyFastBurn
    expr: |
      (
        histogram_quantile(0.95, http_request_duration_seconds_bucket{endpoint="/api/invoices"}[5m]) > 10
        and
        histogram_quantile(0.95, http_request_duration_seconds_bucket{endpoint="/api/invoices"}[1h]) > 10
      )
    for: 2m
    labels:
      severity: critical
      slo: invoice_processing_latency

  - alert: InvoiceProcessingLatencySlowBurn
    expr: |
      (
        histogram_quantile(0.95, http_request_duration_seconds_bucket{endpoint="/api/invoices"}[30m]) > 10
        and
        histogram_quantile(0.95, http_request_duration_seconds_bucket{endpoint="/api/invoices"}[6h]) > 10
      )
    for: 15m
    labels:
      severity: warning
      slo: invoice_processing_latency
```

## Available Metrics

### HTTP Metrics
- `http_requests_total`: Total HTTP requests with status labels
- `http_request_duration_seconds`: Request duration histogram

### Business Logic Metrics  
- `invoices_processed_total`: Total invoices processed
- `invoices_auto_approved_total`: Auto-approved invoices
- `invoices_rejected_total`: Rejected invoices
- `duplicate_invoices_detected_total`: Duplicate detection hits

### OCR & AI Metrics
- `ocr_extractions_total`: OCR extraction attempts with status
- `ocr_extraction_duration_seconds`: OCR processing time
- `ai_confidence_score`: AI confidence distribution
- `hil_queue_size`: Human-in-the-loop queue depth

### Security Metrics
- `fraud_flags_total`: Fraud detection flags by type
- `security_events_total`: Security events by severity
- `auth_attempts_total`: Authentication attempts by result

### Infrastructure Metrics
- `db_query_duration_seconds`: Database query performance
- `db_connections_active`: Active database connections
- `memory_usage_bytes`: Memory consumption
- `cpu_usage_percent`: CPU utilization

## SLO Dashboard Queries

### Availability Dashboard
```promql
# Success rate (last 24h)
sum(rate(http_requests_total{status!~"5.."}[24h])) / sum(rate(http_requests_total[24h]))

# Error budget remaining (30d window)
1 - ((1 - 0.999) - (1 - (sum(rate(http_requests_total{status!~"5.."}[30d])) / sum(rate(http_requests_total[30d])))))/(1 - 0.999)

# Burn rate (current 5m window) 
(1 - (sum(rate(http_requests_total{status!~"5.."}[5m])) / sum(rate(http_requests_total[5m])))) / 0.001
```

### Latency Dashboard
```promql
# P95 latency trend
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# SLO compliance (% under 10s)
sum(rate(http_request_duration_seconds_bucket{le="10"}[5m])) / sum(rate(http_request_duration_seconds_count[5m]))
```

## Error Budget Policies

### Budget Exhaustion Response

#### >50% Budget Consumed
- **Action**: Increase monitoring
- **Frequency**: Daily SLO review
- **Escalation**: Engineering team notification

#### >75% Budget Consumed  
- **Action**: Slow feature development
- **Frequency**: Hourly SLO review
- **Escalation**: Engineering manager notification

#### >90% Budget Consumed
- **Action**: Halt feature deployments
- **Frequency**: Continuous monitoring
- **Escalation**: CTO/VP Engineering notification

#### Budget Exhausted
- **Action**: Full deployment freeze
- **Frequency**: Real-time monitoring
- **Escalation**: Executive escalation

### Budget Reset
- Monthly budget reset for 30-day SLOs
- Weekly budget reset for 7-day SLOs
- Post-incident budget adjustments as needed

## Incident Response Integration

### SLO Breach Procedures
1. **Immediate**: Page on-call engineer
2. **5 minutes**: Incident commander assigned  
3. **15 minutes**: Stakeholder notification
4. **30 minutes**: Status page update
5. **Post-incident**: SLO review and adjustment

### Root Cause Analysis
- Correlate SLO breaches with deployment events
- Analyze metric trends leading to breach
- Document contributing factors and mitigations
- Update SLO targets if patterns emerge

## References

- [Google SRE Workbook - Alerting on SLOs](https://sre.google/workbook/alerting-on-slos/)
- [Multi-Window, Multi-Burn-Rate Alerts](https://sre.google/workbook/alerting-on-slos/#6-multiwindow-multi-burn-rate-alerts)
- [Prometheus Alert Manager](https://prometheus.io/docs/alerting/latest/alertmanager/)
- [FlowAi Metrics Endpoint](https://yvyjzlbosmtesldczhnm.supabase.co/functions/v1/metrics)