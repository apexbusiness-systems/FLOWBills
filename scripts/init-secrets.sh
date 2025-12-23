#!/bin/bash

# Check if gh cli is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) could not be found. Please install it to continue."
    echo "Visit: https://cli.github.com/"
    exit 1
fi

echo "🔐 FlowBills Production Secret Setup"
echo "-----------------------------------"
echo "This script will upload your production secrets to GitHub Actions."
echo ""

read -p "Enter Supabase DB Connection String (postgres://...): " SUPABASE_DB_URL
read -p "Enter AWS Access Key ID: " AWS_ACCESS_KEY_ID
read -s -p "Enter AWS Secret Access Key: " AWS_SECRET_ACCESS_KEY
echo ""
read -p "Enter S3 Backup Bucket Name: " BACKUP_BUCKET
read -p "Enter Secondary S3 Backup Bucket Name (Optional): " BACKUP_BUCKET_SECONDARY

echo ""
echo "Uploading secrets to GitHub..."

if [ ! -z "$SUPABASE_DB_URL" ]; then
    gh secret set SUPABASE_DB_URL --body "$SUPABASE_DB_URL"
    echo "✅ SUPABASE_DB_URL set"
fi

if [ ! -z "$AWS_ACCESS_KEY_ID" ]; then
    gh secret set AWS_ACCESS_KEY_ID --body "$AWS_ACCESS_KEY_ID"
    echo "✅ AWS_ACCESS_KEY_ID set"
fi

if [ ! -z "$AWS_SECRET_ACCESS_KEY" ]; then
    gh secret set AWS_SECRET_ACCESS_KEY --body "$AWS_SECRET_ACCESS_KEY"
    echo "✅ AWS_SECRET_ACCESS_KEY set"
fi

if [ ! -z "$BACKUP_BUCKET" ]; then
    gh secret set BACKUP_BUCKET --body "$BACKUP_BUCKET"
    echo "✅ BACKUP_BUCKET set"
fi

if [ ! -z "$BACKUP_BUCKET_SECONDARY" ]; then
    gh secret set BACKUP_BUCKET_SECONDARY --body "$BACKUP_BUCKET_SECONDARY"
    echo "✅ BACKUP_BUCKET_SECONDARY set"
fi

echo ""
echo "🎉 Secrets configuration complete! Re-run the 'Database Backup' workflow to verify."
echo "You can manually trigger the workflow from: https://github.com/apexbusiness-systems/FLOWBills/actions/workflows/backup.yml"

