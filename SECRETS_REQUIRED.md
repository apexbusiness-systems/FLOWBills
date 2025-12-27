# FLOWBills - Required Secrets Configuration

## Backup Workflow (CRITICAL - Configure within 24h of production)

1. **SUPABASE_DB_URL**
   - Get from: https://supabase.com/dashboard/project/yvyjzlbosmtesldczhnm/settings/database
   - Format: `postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres`

2. **AWS Credentials**
   - Create IAM user: `flowbills-backup-service`
   - Attach policy: S3 write access to backup bucket
   - Generate access key
   - Add to secrets:
     - AWS_ACCESS_KEY_ID
     - AWS_SECRET_ACCESS_KEY

3. **BACKUP_BUCKET**
   - Create bucket: `aws s3 mb s3://flowbills-backups-prod --region us-east-1`
   - Value: `flowbills-backups-prod`

## Daily Report Workflow (OPTIONAL)

1. **SLACK_WEBHOOK_URL**
   - Create at: https://api.slack.com/messaging/webhooks
   - Choose channel: #flowbills-alerts (or similar)
   - Copy webhook URL

## Configuration Steps

1. Go to: https://github.com/apexbusiness-systems/FLOWBills/settings/secrets/actions
2. Click "New repository secret"
3. Add each secret from above
4. Re-enable scheduled workflows in:
   - `.github/workflows/dr-drill-weekly.yml`
   - `.github/workflows/daily-report-scheduler.yml`

## Testing

After configuring secrets:
```bash
# Manually trigger backup workflow
gh workflow run backup.yml

# Check status
gh run list --workflow=backup.yml --limit 1
```
