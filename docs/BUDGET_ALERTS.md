# Budget Alert System

## Overview

The Budget Alert System provides real-time monitoring and notifications for AFE (Authority for Expenditure) budget thresholds. It automatically tracks budget utilization and sends email notifications when configurable thresholds are exceeded.

## Features

### Alert Rule Types

1. **Percentage-Based Alerts**
   - Trigger when budget utilization reaches a specified percentage (e.g., 80%, 90%, 95%)
   - Useful for monitoring overall budget health
   - Example: "Alert me when AFE spending reaches 80% of budget"

2. **Dollar Amount Alerts**
   - Trigger when remaining budget falls below a specified dollar amount
   - Useful for ensuring minimum budget reserves
   - Example: "Alert me when remaining budget drops below $10,000"

### Alert Severity Levels

- **Warning**: Triggered when threshold is first exceeded
- **Critical**: Automatically escalated when:
  - Budget utilization reaches 95% or higher (percentage rules)
  - Remaining budget reaches $0 or below (dollar rules)

## Configuration

### Creating Alert Rules

1. Navigate to AFE Management → Budget Alerts
2. Click "Create Rule"
3. Configure:
   - **Rule Name**: Descriptive name for the alert
   - **Alert Type**: Choose percentage or dollar amount
   - **Threshold Value**: Set the trigger point
   - **Email Recipients**: Add one or more email addresses

### Alert Rule Properties

```typescript
{
  rule_name: string;           // Display name for the rule
  alert_type: 'threshold' | 'percentage';
  threshold_value: number;     // Percentage (0-100) or dollar amount
  notification_channels: ['email'];
  email_recipients: string[];  // List of email addresses
  is_active: boolean;          // Enable/disable rule
  afe_filter?: object;         // Optional AFE filtering (future)
}
```

## Monitoring

### Alert Logs

All triggered alerts are logged with:
- AFE details (number, well name, budget info)
- Alert rule that triggered
- Severity level
- Budget utilization percentage
- Timestamp
- Metadata (budget amounts, remaining funds)

### Alert History

View recent alerts in the Budget Alerts dashboard:
- Last 10 triggered alerts displayed
- Filterable by severity, date, or AFE
- Shows budget utilization at time of alert

## Email Notifications

### Email Content

Automated emails include:
- Alert severity (Warning/Critical)
- AFE number and well name
- Detailed budget breakdown:
  - Total budget
  - Amount spent
  - Amount remaining
  - Utilization percentage
- Triggering rule name

### Email Frequency

- Maximum one alert per AFE per rule per 24 hours
- Prevents alert fatigue while ensuring visibility
- Critical alerts bypass frequency limits (future enhancement)

## Backend Architecture

### Edge Function: `budget-alert-check`

Scheduled function that:
1. Fetches all active alert rules
2. Queries active AFEs for each user
3. Calculates budget utilization
4. Compares against rule thresholds
5. Sends email notifications via Resend
6. Logs all triggered alerts
7. Updates last triggered timestamps

### Database Tables

**budget_alert_rules**
- Stores user-defined alert configurations
- RLS policies ensure users only access their own rules

**budget_alert_logs**
- Historical record of all triggered alerts
- Includes full context for audit trail
- Used for reporting and analytics

## Scheduling

### Recommended Cron Schedule

```sql
-- Check budgets every hour
SELECT cron.schedule(
  'budget-alert-check-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url:='https://ullqluvzkgnwwqijhvjr.supabase.co/functions/v1/budget-alert-check',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  ) as request_id;
  $$
);
```

### Manual Triggers

The edge function can also be invoked manually:
- Via Supabase Dashboard
- Through API calls
- Integrated with AFE update workflows

## Security

### Row-Level Security

- Users can only view/edit their own alert rules
- Alert logs are user-scoped
- Edge function uses service role for system-wide checks

### Email Validation

- Email addresses are validated on input
- Prevents injection attacks
- Rate limiting on alert sending (future)

## Usage Examples

### Example 1: High Utilization Warning

```typescript
{
  rule_name: "High Budget Alert - 80%",
  alert_type: "percentage",
  threshold_value: 80,
  email_recipients: ["manager@company.com", "accounting@company.com"]
}
```

### Example 2: Low Reserves Alert

```typescript
{
  rule_name: "Low Budget Reserve",
  alert_type: "threshold",
  threshold_value: 25000,
  email_recipients: ["cfo@company.com"]
}
```

### Example 3: Critical Overrun

```typescript
{
  rule_name: "Budget Overrun Alert",
  alert_type: "percentage",
  threshold_value: 100,
  email_recipients: ["alerts@company.com"]
}
```

## Best Practices

1. **Multiple Thresholds**: Create rules at 75%, 90%, and 100% for graduated warnings
2. **Multiple Recipients**: Include both project managers and finance team
3. **Descriptive Names**: Use clear rule names that indicate purpose and threshold
4. **Test First**: Create rules for test AFEs before production rollout
5. **Regular Review**: Audit triggered alerts monthly to tune thresholds

## Future Enhancements

- SMS/Slack notifications
- Per-AFE rule configuration
- Escalation chains
- Configurable alert frequencies
- Predictive alerts based on spending trends
- Mobile push notifications
- Alert acknowledgment system
- Custom alert templates

## Troubleshooting

### Alerts Not Sending

1. Verify rule is active (toggle is ON)
2. Check email addresses are valid
3. Verify RESEND_API_KEY is configured
4. Check edge function logs for errors
5. Ensure cron job is running

### False Positives

1. Adjust threshold values
2. Check AFE budget amounts are correct
3. Verify spent amounts are updating properly
4. Review alert logs for patterns

### Missing Alerts

1. Check AFE status (must be 'active')
2. Verify 24-hour cooldown hasn't prevented alert
3. Review edge function execution logs
4. Check Resend email delivery status

## API Reference

### Create Alert Rule

```typescript
const { data, error } = await supabase
  .from('budget_alert_rules')
  .insert({
    rule_name: 'My Alert',
    alert_type: 'percentage',
    threshold_value: 80,
    email_recipients: ['user@example.com']
  });
```

### Check Alerts Manually

```typescript
const { data, error } = await supabase.functions.invoke('budget-alert-check');
```

### Query Alert Logs

```typescript
const { data, error } = await supabase
  .from('budget_alert_logs')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(50);
```

## Integration with AFE System

The budget alert system integrates seamlessly with:
- AFE creation and updates
- Invoice processing (auto-updates spent amounts)
- Field ticket tracking
- Workflow automation
- Reporting dashboards

When AFE spent amounts are updated through any system component, the alert checker will evaluate rules on the next scheduled run.
