#!/bin/bash

# Check if gh cli is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) not found. Please install: brew install gh"
    echo "Visit: https://cli.github.com/"
    exit 1
fi

echo "🔐 FlowBills Production Secret Configuration"
echo "=========================================="
echo "This script uploads encrypted secrets to your GitHub Actions environment."
echo ""

# Function to set secret
set_secret() {
    local key=$1
    local prompt=$2
    
    echo ""
    read -s -p "$prompt: " value
    echo ""
    
    if [ ! -z "$value" ]; then
        echo "   Uploading $key..."
        gh secret set "$key" --body "$value"
        echo "   ✅ $key set"
    else
        echo "   ⚠️  Skipping $key (empty input)"
    fi
}

# Main execution
set_secret "SUPABASE_DB_URL" "Enter Supabase DB Connection String (postgres://...)"
set_secret "AWS_ACCESS_KEY_ID" "Enter AWS Access Key ID"
set_secret "AWS_SECRET_ACCESS_KEY" "Enter AWS Secret Access Key"
set_secret "BACKUP_BUCKET" "Enter S3 Bucket Name (e.g., flowbills-backups-prod)"
set_secret "BACKUP_BUCKET_SECONDARY" "Enter Secondary S3 Bucket Name (Optional)"
set_secret "SLACK_WEBHOOK_URL" "Enter Slack Webhook URL (Optional)"

echo ""
echo "🎉 Configuration Complete!"
echo "You can now manually trigger the 'Database Backup' workflow to verify."
echo "Workflow URL: https://github.com/apexbusiness-systems/FLOWBills/actions/workflows/backup.yml"

