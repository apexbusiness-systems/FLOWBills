#!/bin/bash
# scripts/validate-build-enhanced.sh (ENHANCED VERSION)

set -e

echo "🔍 FLOWBills Bundle Validation (Enhanced)"

# --- PHASE 1: Existing empty chunk detection (PRESERVE) ---
MIN_SIZE=100000  # 100 KB minimum
# Use find to locate JS files, then sort by size.
# Note: output format of ls -l varies by OS, but this script is for CI (Ubuntu/Linux) usually.
# On Linux `ls -l` columns: permissions links owner group size date time name
# $5 is size.
MAIN_BUNDLE=$(find dist/assets/js -name "*.js" -exec ls -l {} \; | sort -k5 -rn | head -1 | awk '{print $NF}')

if [ -z "$MAIN_BUNDLE" ]; then
  echo "❌ CRITICAL: No JavaScript bundles found"
  exit 1
fi

SIZE=$(stat -c%s "$MAIN_BUNDLE")
if [ "$SIZE" -lt "$MIN_SIZE" ]; then
  echo "❌ CRITICAL: Main bundle too small: ${SIZE} bytes"
  echo "   This indicates vendor code exclusion (see 2025-12-26 incident)"
  exit 1
fi

# --- PHASE 2: NEW bundle size limit enforcement ---
echo ""
echo "📊 Bundle Size Validation"

# Check each chunk against limits
FAILED=0

# Use process substitution to avoid subshell variable scope issue
while IFS= read -r chunk; do
  SIZE=$(stat -c%s "$chunk")
  NAME=$(basename "$chunk")

  # Vendor chunks: 800 KB max
  if [ "$SIZE" -gt 800000 ]; then
    echo "❌ FAILED: $NAME exceeds 800 KB limit (${SIZE} bytes)"
    FAILED=1
  elif [ "$SIZE" -gt 600000 ]; then
    echo "⚠️  WARNING: $NAME approaching limit (${SIZE} bytes)"
  else
    echo "✅ PASS: $NAME (${SIZE} bytes)"
  fi
done < <(find dist/assets/js -name "vendor-*.js")

# Check total bundle size
TOTAL_SIZE=$(du -sb dist/assets/js | awk '{print $1}')
if [ "$TOTAL_SIZE" -gt 3500000 ]; then
  echo "❌ CRITICAL: Total bundle size exceeds 3.5 MB (${TOTAL_SIZE} bytes)"
  FAILED=1
fi

if [ "$FAILED" -eq 1 ]; then
  echo "❌ Validation failed due to size limits."
  exit 1
fi

echo ""
echo "✅ All bundle validations passed"
exit 0
