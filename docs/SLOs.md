# FlowAi Service Level Objectives (SLOs)

## Overview

This document defines Service Level Objectives (SLOs) for FlowAi's invoice processing system. SLOs establish measurable targets for service reliability and performance, enabling proactive monitoring and incident response through burn rate alerting.

## Core SLOs

### 1. Invoice Processing Availability
**Objective**: 99.5% availability for invoice processing services
- **Measurement Window**: 30 days
- **Error Budget**: 0.5% (3.6 hours per month)
- **Definition**: Successful invoice upload, OCR processing, and policy evaluation

**SLI (Service Level Indicator)**:
```
Availability = (Successful Requests / Total Requests) * 100
```

**Implementation**:
- Monitor HTTP 200 responses vs total requests
- Exclude planned maintenance windows
- Track across all invoice processing endpoints

### 2. OCR Processing Latency
**Objective**: 95% of OCR extractions complete within 10 seconds
- **Measurement Window**: 7 days
- **Error Budget**: 5% of requests may exceed 10 seconds
- **Definition**: Time from file upload to OCR results availability

**SLI**:
```
Latency_P95 = 95th percentile of OCR processing duration
```

**Implementation**:
- Track processing time in `ocr_metadata.processing_time`
- Alert if P95 exceeds 10 seconds over 1-hour window

### 3. Straight Through Processing (STP) Rate
**Objective**: ≥85% of invoices auto-approved without human intervention
- **Measurement Window**: 30 days
- **Error Budget**: Up to 15% requiring manual review
- **Definition**: Invoices approved automatically via policy engine

**SLI**:
```
STP_Rate = (Auto_Approved_Invoices / Total_Processed_Invoices) * 100
```

**Implementation**:
```sql
-- Daily STP rate calculation
SELECT 
  DATE(created_at) as date,
  COUNT(*) FILTER (WHERE status = 'approved' AND auto_approved = true) * 100.0 / COUNT(*) as stp_rate
FROM invoices 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### 4. Fraud Detection Response Time
**Objective**: 99% of fraud flags reviewed within 4 hours
- **Measurement Window**: 7 days
- **Error Budget**: 1% may exceed 4 hours
- **Definition**: Time from flag creation to human review

**SLI**:
```
Response_Time_P99 = 99th percentile of (resolved_at - created_at)
```

**Implementation**:
- Monitor `fraud_flags` table resolution times
- Alert if unresolved flags older than 4 hours

### 5. Database Query Performance
**Objective**: 95% of database queries complete within 500ms
- **Measurement Window**: 1 hour
- **Error Budget**: 5% may exceed 500ms
- **Definition**: End-to-end database query execution time

**SLI**:
```
Query_Latency_P95 = 95th percentile of database query duration
```

**Implementation**:
- Monitor Supabase query metrics
- Track slow query logs
- Alert on degraded performance

### 6. API Error Rate
**Objective**: <1% error rate for all API endpoints
- **Measurement Window**: 1 hour
- **Error Budget**: 1% of requests may return errors
- **Definition**: HTTP 5xx responses and application errors

**SLI**:
```
Error_Rate = (5xx_Responses / Total_Responses) * 100
```

**Implementation**:
- Monitor edge function error rates
- Track application exceptions
- Exclude user errors (4xx responses)

## Multi-Window, Multi-Burn-Rate Alerting

Following Google SRE best practices, we implement multi-window burn rate alerting to balance detection speed with false positive reduction.

### Fast Burn Rate Alerts (2% budget consumed in 1 hour)
**Trigger Conditions**:
- **1-hour window**: Error rate > 2% (fast burn)
- **5-minute window**: Error rate > 2% (short confirmation)

**Alert Configuration**:
```yaml
# Example for Invoice Processing Availability SLO
- alert: HighErrorRateFast
  expr: |
    (
      (sum(rate(http_requests_total{job="invoice-api",code=~"5.."}[1h])) /
       sum(rate(http_requests_total{job="invoice-api"}[1h]))) > (14.4 * 0.005)
    )
    and
    (
      (sum(rate(http_requests_total{job="invoice-api",code=~"5.."}[5m])) /
       sum(rate(http_requests_total{job="invoice-api"}[5m]))) > (14.4 * 0.005)
    )
  for: 2m
  labels:
    severity: page
  annotations:
    summary: "High error rate on invoice API (fast burn)"
    description: "Error rate is consuming error budget at 2%/hour"
```

### Slow Burn Rate Alerts (10% budget consumed in 6 hours)
**Trigger Conditions**:
- **6-hour window**: Error rate > 0.83% (slow burn)
- **30-minute window**: Error rate > 0.83% (confirmation)

**Alert Configuration**:
```yaml
- alert: HighErrorRateSlow
  expr: |
    (
      (sum(rate(http_requests_total{job="invoice-api",code=~"5.."}[6h])) /
       sum(rate(http_requests_total{job="invoice-api"}[6h]))) > (6 * 0.005)
    )
    and
    (
      (sum(rate(http_requests_total{job="invoice-api",code=~"5.."}[30m])) /
       sum(rate(http_requests_total{job="invoice-api"}[30m]))) > (6 * 0.005)
    )
  for: 15m
  labels:
    severity: ticket
  annotations:
    summary: "Sustained error rate on invoice API"
    description: "Error rate is consuming error budget at 10%/6hours"
```

### Burn Rate Calculation Formula

For a 30-day SLO with X% error budget:
```
Burn_Rate_Multiplier = (30 days * 24 hours) / Alert_Window_Hours
Alert_Threshold = Burn_Rate_Multiplier * Error_Budget_Percentage
```

**Example for 99.5% availability (0.5% error budget)**:
- 1-hour fast burn: `(30*24)/1 * 0.005 = 3.6% error rate`
- 6-hour slow burn: `(30*24)/6 * 0.005 = 0.6% error rate`

## SLO Implementation Details

### Metrics Collection
**Prometheus Metrics Endpoint**: `/functions/v1/metrics`

Key metrics exposed:
```prometheus
# Invoice processing metrics
invoice_autoapproved_total
invoice_manual_review_total
invoice_processing_duration_seconds

# OCR metrics
ocr_extractions_total
ocr_failures_total
ocr_processing_duration_seconds

# Fraud detection metrics
fraud_flags_total
fraud_resolution_duration_seconds

# API metrics
http_request_duration_seconds
http_requests_total
```

### Dashboard Integration
**Grafana Dashboard Sections**:
1. **SLO Overview**: Current SLO compliance status
2. **Error Budget Burn**: Real-time error budget consumption
3. **Performance Trends**: Historical performance analysis
4. **Alerting Status**: Active alerts and resolution tracking

### Error Budget Policies

#### Budget Exhaustion Response
When error budget reaches:
- **50% consumed**: Engineering review of reliability
- **75% consumed**: Halt feature development, focus on reliability
- **90% consumed**: Incident response activation
- **100% consumed**: Service degradation accepted until reset

#### Budget Reset
- **Frequency**: Monthly (aligns with 30-day measurement window)
- **Exception**: Critical incidents may trigger early reset
- **Documentation**: All resets logged with justification

## SLO Review Process

### Monthly SLO Review Meeting
**Attendees**: Engineering, Operations, Product, Leadership
**Agenda**:
1. SLO compliance status review
2. Error budget consumption analysis
3. Incident impact on SLOs
4. SLO target adjustments (if needed)
5. Reliability improvement initiatives

### Quarterly SLO Assessment
**Objective**: Evaluate SLO relevance and targets
**Activities**:
- Customer satisfaction correlation analysis
- Business impact assessment
- Competitive benchmarking
- SLO target refinement

### Annual SLO Strategy Review
**Scope**: Complete SLO framework evaluation
**Deliverables**:
- SLO effectiveness assessment
- Framework improvements
- Tool and process enhancements
- Training and documentation updates

## Reliability Engineering Practices

### Chaos Engineering
**Monthly Chaos Testing**:
- Database failover scenarios
- Network partition simulation
- High load stress testing
- Edge function timeout testing

### Capacity Planning
**Quarterly Capacity Reviews**:
- Transaction volume projections
- Resource utilization trends
- Scaling thresholds and automation
- Cost optimization opportunities

### Incident Response Integration
**SLO Impact Assessment**:
- All incidents evaluated for SLO impact
- Error budget consumption calculated
- Post-incident reliability improvements
- SLO alerting refinement

## Tools and Infrastructure

### Monitoring Stack
- **Metrics**: Prometheus + Grafana
- **Logging**: Supabase Analytics + Custom dashboards
- **Alerting**: PagerDuty integration
- **Tracing**: Edge function performance monitoring

### Automation
- **SLO Calculations**: Automated daily/weekly reports
- **Alert Routing**: Intelligent escalation based on burn rate
- **Budget Tracking**: Real-time error budget dashboards
- **Reporting**: Automated SLO compliance reports

## Documentation and Training

### Runbooks
- **SLO Violation Response**: Step-by-step incident response
- **Error Budget Management**: Budget tracking and policy enforcement
- **Tool Usage**: Monitoring and alerting tool guides
- **Escalation Procedures**: When and how to escalate SLO issues

### Training Program
- **SRE Fundamentals**: SLO concepts and implementation
- **Tool Training**: Monitoring and alerting tools
- **Incident Response**: SLO-focused incident management
- **Regular Updates**: Quarterly training updates

## E-Invoicing Infrastructure SLOs

### Availability
- **Target**: 99.9% availability over 30-day rolling window
- **Scope**: Edge Functions (`einvoice_validate`, `einvoice_send`, `einvoice_receive`)
- **Error Budget**: 43 minutes downtime per month
- **Measurement**: HTTP 5xx responses / total requests

### Latency (p95)
- **`/einvoice_validate`**: < 300ms
- **`/einvoice_send`**: < 500ms (excluding partner AP transit time)
- **`/einvoice_receive`**: < 400ms
- **`/metrics`**: < 100ms

### Peppol AP Send Success Rate
- **Target**: ≥ 99.0% over 7-day rolling window
- **Scope**: Outbound messages to Peppol Access Point
- **Exclusions**: Partner AP outages (verified via status page)
- **Measurement**: `(sent_count / (sent_count + failed_after_retries)) * 100`

## Multi-Window Burn Rate Alerting

Implements Google SRE [multi-window, multi-burn-rate](https://sre.google/workbook/alerting-on-slos/) approach.

### Critical Alert (Page)
**Trigger**: 2% error budget consumed in 1 hour
- Short window burn rate (1h): ≥ 14.4x
- Long window burn rate (5m): ≥ 14.4x
- **Action**: Page on-call engineer immediately

### High Alert (Ticket)
**Trigger**: 5% error budget consumed in 6 hours
- Short window burn rate (6h): ≥ 6.0x
- Long window burn rate (30m): ≥ 6.0x
- **Action**: Create incident ticket, investigate within 4 hours

### Medium Alert (Ticket)
**Trigger**: 10% error budget consumed in 24 hours
- Short window burn rate (24h): ≥ 3.0x
- Long window burn rate (2h): ≥ 3.0x
- **Action**: Create backlog ticket, review in next business day

### Formulas
```
error_budget_remaining = 1 - (error_rate_30d / (1 - slo_target))
burn_rate = error_rate_window / (1 - slo_target)
```

Example: For 99.9% SLO (0.1% error budget):
- 1h window with 1.44% errors = 14.4x burn rate → **PAGE**
- 6h window with 0.6% errors = 6.0x burn rate → **TICKET HIGH**

## Monitoring Dashboard Panels

1. **Availability**: 30d rolling error rate vs 0.1% threshold
2. **Latency Heatmap**: p50, p95, p99 for each endpoint
3. **Error Budget**: Remaining % with burn-down projection
4. **Queue Depth**: `peppol_send` queue size and age
5. **HIL Metrics**: Queue size, resolution time, STP rate

---

**Document Metadata**:
- **Last Updated**: October 2025
- **Next Review**: January 2026
- **Owner**: Platform Engineering Team
- **Reviewers**: Engineering Leadership, Operations Team