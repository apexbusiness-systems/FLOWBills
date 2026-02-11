#!/bin/bash
set -e

echo "🔍 FLOWBills Bundle Validation (Enhanced)"

# Check dist directory exists
if [ ! -d "dist" ]; then
  echo "❌ dist directory not found. Please run 'npm run build' first."
  exit 1
fi

# --- PHASE 1: Existing empty chunk detection (PRESERVE) ---
MIN_SIZE=100000  # 100 KB minimum
# Find the largest JS bundle (typically the index/main bundle or a large vendor bundle)
MAIN_BUNDLE=$(find dist/assets/js -name "*.js" -exec ls -l {} \; 2>/dev/null | sort -k5 -rn | head -1 | awk '{print $NF}')

if [ -z "$MAIN_BUNDLE" ]; then
  echo "❌ CRITICAL: No JavaScript bundles found"
  exit 1
fi

SIZE=$(stat -c%s "$MAIN_BUNDLE")
if [ "$SIZE" -lt "$MIN_SIZE" ]; then
  echo "❌ CRITICAL: Largest bundle too small: ${SIZE} bytes"
  echo "   This indicates vendor code exclusion (see 2025-12-26 incident)"
  exit 1
fi

# --- PHASE 2: NEW bundle size limit enforcement ---
echo ""
echo "📊 Bundle Size Validation"

# Check each chunk against limits
FAILED=0
WARN_THRESHOLD=600000 # 600 KB
FAIL_THRESHOLD=800000 # 800 KB

# We look specifically for vendor chunks to enforce strict limits
# If no vendor chunks are found, it might mean the chunking strategy isn't working
VENDOR_COUNT=$(find dist/assets/js -name "vendor-*.js" 2>/dev/null | wc -l)

if [ "$VENDOR_COUNT" -eq 0 ]; then
    echo "⚠️  WARNING: No 'vendor-*' chunks found. Verify manualChunks configuration."
    # We don't fail here because maybe the build changed, but it's suspicious given our strategy.
else
    echo "   Found $VENDOR_COUNT vendor chunks."
fi

for chunk in dist/assets/js/*.js; do
  [ -e "$chunk" ] || continue
  SIZE=$(stat -c%s "$chunk")
  NAME=$(basename "$chunk")

  # Check for vendor specific limits if it matches vendor-*.js
  if [[ "$NAME" == "vendor-"* ]]; then
      if [ "$SIZE" -gt "$FAIL_THRESHOLD" ]; then
        echo "❌ FAILED: $NAME exceeds 800 KB limit (${SIZE} bytes)"
        FAILED=1
      elif [ "$SIZE" -gt "$WARN_THRESHOLD" ]; then
        echo "⚠️  WARNING: $NAME approaching limit (${SIZE} bytes)"
      else
        echo "✅ PASS: $NAME (${SIZE} bytes)"
      fi
  else
      # Check other chunks (like main index or dynamic routes)
      # Route chunk limit: 300KB (max), 200KB (warn)
      if [ "$SIZE" -gt 500000 ]; then # 500KB limit for main/other chunks
         if [[ "$NAME" != "index"* ]]; then # Main index might be larger due to app code
            echo "⚠️  WARNING: Non-vendor chunk $NAME is large (${SIZE} bytes)"
         else
             # Main bundle check
             if [ "$SIZE" -gt 500000 ]; then
                 echo "⚠️  WARNING: Main bundle $NAME is large (${SIZE} bytes)"
             else
                 echo "✅ PASS: $NAME (${SIZE} bytes)"
             fi
         fi
      else
         echo "✅ PASS: $NAME (${SIZE} bytes)"
      fi
  fi
done

# Check total bundle size
TOTAL_SIZE=$(du -sb dist/assets/js | awk '{print $1}')
MAX_TOTAL=3500000 # 3.5 MB

if [ "$TOTAL_SIZE" -gt "$MAX_TOTAL" ]; then
  echo "❌ CRITICAL: Total bundle size exceeds 3.5 MB (${TOTAL_SIZE} bytes)"
  FAILED=1
else
  echo "✅ PASS: Total bundle size: ${TOTAL_SIZE} bytes"
fi

echo ""
if [ "$FAILED" -eq 1 ]; then
  echo "❌ Bundle validation FAILED"
  exit 1
else
  echo "✅ All bundle validations passed"
  exit 0
fi
