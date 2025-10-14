#!/bin/bash
# P14 — Rollback & DR Drills: Safe reversion to previous release

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SUPABASE_PROJECT_ID="${SUPABASE_PROJECT_ID:-yvyjzlbosmtesldczhnm}"
DRY_RUN="${DRY_RUN:-false}"
TARGET_SHA="${1:-}"

log() {
  echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
  echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" >&2
}

warn() {
  echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Validate inputs
if [ -z "$TARGET_SHA" ]; then
  error "Usage: $0 <target-sha> [--dry-run]"
  error "Example: $0 abc123def --dry-run"
  exit 1
fi

if [[ "$2" == "--dry-run" ]]; then
  DRY_RUN=true
fi

log "======================================"
log "FlowAi Rollback Script"
log "======================================"
log "Target SHA: $TARGET_SHA"
log "Dry Run: $DRY_RUN"
log "Project ID: $SUPABASE_PROJECT_ID"
log "======================================"

START_TIME=$(date +%s)

# Step 1: Validate target commit exists
log "Step 1: Validating target commit..."
if ! git rev-parse --verify "$TARGET_SHA" >/dev/null 2>&1; then
  error "Invalid commit SHA: $TARGET_SHA"
  exit 1
fi

# Get commit details
COMMIT_DATE=$(git show -s --format=%ci "$TARGET_SHA")
COMMIT_MESSAGE=$(git show -s --format=%s "$TARGET_SHA")
CURRENT_SHA=$(git rev-parse HEAD)

log "Current SHA: $CURRENT_SHA"
log "Target SHA: $TARGET_SHA"
log "Target commit: $COMMIT_MESSAGE"
log "Target date: $COMMIT_DATE"

if [[ "$DRY_RUN" == "true" ]]; then
  warn "DRY RUN: Would rollback to commit $TARGET_SHA"
fi

# Step 2: Create backup of current state
log "Step 2: Creating backup of current state..."
BACKUP_BRANCH="backup-$(date +%Y%m%d-%H%M%S)-$CURRENT_SHA"

if [[ "$DRY_RUN" == "false" ]]; then
  git branch "$BACKUP_BRANCH"
  log "Created backup branch: $BACKUP_BRANCH"
else
  warn "DRY RUN: Would create backup branch: $BACKUP_BRANCH"
fi

# Step 3: Check for pending migrations
log "Step 3: Checking for database migrations between commits..."
MIGRATION_FILES=$(git diff --name-only "$TARGET_SHA" "$CURRENT_SHA" -- 'supabase/migrations/*.sql' || echo "")

if [ -n "$MIGRATION_FILES" ]; then
  warn "Database migrations found between current and target state:"
  echo "$MIGRATION_FILES"
  
  if [[ "$DRY_RUN" == "false" ]]; then
    read -p "Migration rollback may be required. Continue? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      error "Rollback cancelled by user"
      exit 1
    fi
  else
    warn "DRY RUN: Migration rollback would be required"
  fi
fi

# Step 4: Revert code to target SHA
log "Step 4: Reverting code to target SHA..."
if [[ "$DRY_RUN" == "false" ]]; then
  git checkout "$TARGET_SHA"
  log "Code reverted to $TARGET_SHA"
else
  warn "DRY RUN: Would revert code to $TARGET_SHA"
fi

# Step 5: Install dependencies
log "Step 5: Installing dependencies..."
if [[ "$DRY_RUN" == "false" ]]; then
  pnpm install --frozen-lockfile
  log "Dependencies installed"
else
  warn "DRY RUN: Would install dependencies"
fi

# Step 6: Build application
log "Step 6: Building application..."
if [[ "$DRY_RUN" == "false" ]]; then
  pnpm build
  log "Application built successfully"
else
  warn "DRY RUN: Would build application"
fi

# Step 7: Health check validation
log "Step 7: Running health checks..."
HEALTH_ENDPOINTS=(
  "https://$SUPABASE_PROJECT_ID.supabase.co/functions/v1/health-check"
  "https://$SUPABASE_PROJECT_ID.supabase.co/functions/v1/metrics"
)

validate_health() {
  local endpoint=$1
  local response
  
  if [[ "$DRY_RUN" == "false" ]]; then
    response=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint" || echo "000")
    if [[ "$response" == "200" ]]; then
      log "✓ $endpoint: OK ($response)"
      return 0
    else
      error "✗ $endpoint: FAILED ($response)"
      return 1
    fi
  else
    warn "DRY RUN: Would validate $endpoint"
    return 0
  fi
}

HEALTH_CHECK_PASSED=true
for endpoint in "${HEALTH_ENDPOINTS[@]}"; do
  if ! validate_health "$endpoint"; then
    HEALTH_CHECK_PASSED=false
  fi
done

# Step 8: Create rollback report
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
REPORT_FILE="rollback-report-$(date +%Y%m%d-%H%M%S).json"

cat > "$REPORT_FILE" << EOF
{
  "rollback_timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "duration_seconds": $DURATION,
  "from_sha": "$CURRENT_SHA",
  "to_sha": "$TARGET_SHA",
  "target_commit_message": "$COMMIT_MESSAGE",
  "target_commit_date": "$COMMIT_DATE",
  "backup_branch": "$BACKUP_BRANCH",
  "dry_run": $DRY_RUN,
  "health_checks_passed": $HEALTH_CHECK_PASSED,
  "migration_changes_detected": $([ -n "$MIGRATION_FILES" ] && echo "true" || echo "false"),
  "executed_by": "${USER:-unknown}",
  "git_ref": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'detached')"
}
EOF

log "Rollback report saved: $REPORT_FILE"
cat "$REPORT_FILE"

# Final summary
log "======================================"
log "Rollback Summary"
log "======================================"
log "Duration: ${DURATION}s"
log "Health Checks: $([ "$HEALTH_CHECK_PASSED" == "true" ] && echo "✓ PASSED" || echo "✗ FAILED")"
log "Backup Branch: $BACKUP_BRANCH"
log "Report: $REPORT_FILE"
log "======================================"

if [[ "$DRY_RUN" == "true" ]]; then
  warn "DRY RUN COMPLETE - No actual changes made"
  warn "To execute rollback, run: $0 $TARGET_SHA"
else
  if [[ "$HEALTH_CHECK_PASSED" == "true" ]]; then
    log "Rollback completed successfully!"
  else
    error "Rollback completed with health check failures!"
    error "Review the health check results and consider additional validation."
    exit 1
  fi
fi

exit 0
