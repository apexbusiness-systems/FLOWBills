#!/bin/bash
set -e

echo "🔍 Validating Vite build output..."

# Check dist directory exists
if [ ! -d "dist" ]; then
  echo "❌ dist directory not found"
  exit 1
fi

# Find the largest JS bundle (this is typically the main app bundle)
MAIN_BUNDLE=$(find dist/assets/js -name "*.js" -type f -exec ls -l {} \; 2>/dev/null | sort -k5 -rn | head -1 | awk '{print $NF}')

if [ -z "$MAIN_BUNDLE" ]; then
  echo "❌ No JavaScript bundles found"
  echo "Available files:"
  ls -lh dist/assets/js/ 2>/dev/null || echo "  No JS files found"
  exit 1
fi

# Check bundle size (should be > 100KB for React app)
SIZE=$(stat -c%s "$MAIN_BUNDLE" 2>/dev/null)
MIN_SIZE=100000 # 100KB minimum

if [ "$SIZE" -lt "$MIN_SIZE" ]; then
  echo "❌ Largest bundle too small: ${SIZE} bytes (expected > ${MIN_SIZE})"
  echo "   This indicates vendor code is missing from the bundle"
  echo "   File: $MAIN_BUNDLE"
  echo ""
  echo "Top 5 largest bundles:"
  find dist/assets/js -name "*.js" -type f -exec ls -lh {} \; 2>/dev/null | sort -k5 -rh | head -5
  exit 1
fi

# Check for empty chunk warnings (should not exist in build log)
if [ -f "build.log" ]; then
  if grep -q "Generated an empty chunk" build.log; then
    echo "⚠️  Warning: Build log contains 'Generated an empty chunk' warnings"
    grep "Generated an empty chunk" build.log
  fi
fi

# List all generated chunks for verification
echo ""
echo "✅ Build validation passed"
echo ""
echo "Main bundle:"
echo "   $(basename $MAIN_BUNDLE)"
echo "   Size: ${SIZE} bytes ($(echo "scale=2; $SIZE/1024" | bc) KB)"
echo ""
echo "All generated chunks:"
ls -lh dist/assets/js/*.js 2>/dev/null | awk '{print "   " $9 " - " $5}'
echo ""
echo "Total bundle size:"
du -sh dist/assets/js 2>/dev/null | awk '{print "   " $1}'
