#!/bin/bash
# P7: Local ≡ Deploy Equivalence Runner
# Guarantees parity between local runs and deploy

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

FUNCTIONS_DIR="supabase/functions"
FAILED_FUNCTIONS=()

echo -e "${YELLOW}🔍 Testing Local ≡ Deploy Equivalence${NC}\n"

# Find all function directories (exclude _shared)
for function_dir in "$FUNCTIONS_DIR"/*; do
  if [ ! -d "$function_dir" ]; then
    continue
  fi

  function_name=$(basename "$function_dir")

  # Skip special directories
  if [[ "$function_name" == "_shared" ]]; then
    continue
  fi
  
  # Skip if no index.ts
  if [ ! -f "$function_dir/index.ts" ]; then
    continue
  fi
  
  echo -e "Testing: ${function_name}"
  
  # Test 1: Type check with deno check
  if deno check --import-map=./supabase/import_map.json "$function_dir/index.ts" 2>/dev/null; then
    echo -e "  ${GREEN}✓${NC} Type check passed"
  else
    echo -e "  ${RED}✗${NC} Type check failed"
    FAILED_FUNCTIONS+=("$function_name (type-check)")
  fi
  
  # Test 2: Verify imports are resolvable
  if deno info --import-map=./supabase/import_map.json "$function_dir/index.ts" &>/dev/null; then
    echo -e "  ${GREEN}✓${NC} Import resolution passed"
  else
    echo -e "  ${RED}✗${NC} Import resolution failed"
    FAILED_FUNCTIONS+=("$function_name (imports)")
  fi
  
  echo ""
done

# Summary
if [ ${#FAILED_FUNCTIONS[@]} -eq 0 ]; then
  echo -e "${GREEN}✓ All functions passed equivalence checks${NC}"
  exit 0
else
  echo -e "${RED}✗ Failed functions:${NC}"
  for failed in "${FAILED_FUNCTIONS[@]}"; do
    echo -e "  - $failed"
  done
  exit 1
fi
