# CI/CD Pipeline Status Notes

This document maps all CI jobs, their commands, and how to debug them locally.

## CI Workflows Overview

### 1. Enhanced CI Pipeline (`.github/workflows/ci-enhanced.yml`)

**Job: `ci-pipeline`**
- **Commands**: 
  - `npm ci` - Install dependencies
  - `npm run ci` - Runs lint:check, type-check, test:unit, build
  - `npx tsc --noEmit` - TypeScript type checking
  - `npm run lint:check` - ESLint with max-warnings=0
  - `npm run test:unit` - Unit tests with coverage
- **Local Debug**: Run `npm ci && npm run lint:check && npm run type-check && npm run test:unit && npm run build`
- **Status**: ✅ TypeScript and Lint are blocking (no continue-on-error)

**Job: `rls-tests`**
- **Commands**: `npm run test -- --grep "RLS"` - RLS policy tests
- **Local Debug**: Run `npm test -- --grep "RLS"`
- **Status**: ⚠️ Has continue-on-error (non-blocking)

### 2. E2E Smoke Tests (`.github/workflows/e2e-smoke.yml`)

**Job: `e2e-smoke`**
- **Commands**:
  - `npm ci` - Install dependencies
  - `npm run build` - Build application
  - Checks for `dist/index.html` and `dist/assets/*.js` bundles
  - Supabase CLI checks (optional, continue-on-error)
- **Local Debug**: 
  1. Run `npm run build`
  2. Verify `dist/index.html` exists
  3. Verify `dist/assets/*.js` files exist (Vite outputs to `dist/assets/js/` with hash)
- **Known Issue**: Bundle path check uses `dist/assets/*.js` but Vite outputs to `dist/assets/js/*.js`
- **Status**: ❌ Bundle path mismatch needs fixing

### 3. P15 — CI Quality Gates (`.github/workflows/quality-gates.yml`)

**Job: `typecheck-lint-test`**
- **Commands**:
  - `npx tsc --noEmit` - TypeScript check
  - `npm run lint:check || npm run lint -- --max-warnings=999` - ESLint
  - `npm run test:unit || npm test` - Unit tests
  - `npm run test:integration` - Integration tests
- **Local Debug**: Run `npm run type-check && npm run lint:check && npm run test:unit`
- **Status**: ✅ Blocking on typecheck/lint

**Job: `sbom-security`**
- **Commands**:
  - `npx @cyclonedx/cyclonedx-npm --output-format JSON --output-file sbom.json` - Generate SBOM
  - `npm audit --json > audit-report.json` - Security audit
  - Trivy vulnerability scan
- **Local Debug**: Run `npx @cyclonedx/cyclonedx-npm --output-format JSON --output-file sbom.json`
- **Status**: ⚠️ Has continue-on-error (non-blocking)

**Job: `lighthouse-performance`**
- **Commands**:
  - `npm run build` - Build application
  - Lighthouse CI against `http://localhost:4173` (preview server)
- **Local Debug**: 
  1. Run `npm run build && npm run preview`
  2. Run Lighthouse CI manually: `npx @lhci/cli autorun`
- **Status**: ⚠️ Requires preview server running (continue-on-error)

**Job: `bundle-analysis`**
- **Commands**:
  - `npm run build` - Build application
  - Checks `dist/assets/index-*.js` (gzipped size)
  - Budget: 75KB gzipped
- **Local Debug**: 
  1. Run `npm run build`
  2. Find main bundle: `find dist/assets -name "index-*.js" -type f`
  3. Check gzipped size: `gzip -c dist/assets/js/index-*.js | wc -c`
- **Known Issue**: Bundle path uses `dist/assets/index-*.js` but Vite outputs to `dist/assets/js/index-*.js`
- **Status**: ❌ Bundle path mismatch needs fixing

**Job: `quality-summary`**
- **Purpose**: Aggregates results from all quality gates
- **Status**: ✅ Only fails on critical gate (typecheck-lint-test)

### 4. Edge Function Quality Gates (`.github/workflows/edge-function-gates.yml`)

**Job: `deno-checks`**
- **Commands**:
  - `deno fmt --check supabase/functions/` - Format check
  - `deno lint supabase/functions/` - Lint check
  - `deno check --import-map=./supabase/import_map.json "${function_dir}index.ts"` - Type check each function
- **Local Debug**: 
  1. Install Deno: `curl -fsSL https://deno.land/install.sh | sh`
  2. Run `deno fmt --check supabase/functions/`
  3. Run `deno lint supabase/functions/`
  4. For each function: `deno check --import-map=./supabase/import_map.json supabase/functions/{function}/index.ts`
- **Status**: ⚠️ Has continue-on-error (non-blocking warnings)

**Job: `control-function-check`**
- **Commands**: Checks for `control-hello-world` function (not `_control_hello-world`)
- **Local Debug**: Verify `supabase/functions/control-hello-world/index.ts` exists
- **Status**: ✅ Function exists at correct path

**Job: `node-ism-detector`**
- **Commands**: Scans for Node.js-specific APIs (require, process, Buffer, __dirname, etc.)
- **Local Debug**: Run `grep -rE "require\s*\(" supabase/functions/ --include="*.ts"`
- **Status**: ✅ Non-blocking warning

**Job: `import-discipline`**
- **Commands**: Validates imports don't escape `supabase/functions` directory
- **Local Debug**: Run `grep -rE "from\s+['\"](\.\./\.\./\.\.|\.\.\/\.\.\/)" supabase/functions/ --include="*.ts"`
- **Status**: ✅ Blocking on violations

**Job: `import-map-validation`**
- **Commands**: 
  - Validates single import map at `supabase/import_map.json`
  - Validates JSON syntax
- **Local Debug**: 
  1. Check for multiple import maps: `find supabase/functions -name "import_map.json" -o -name "deno.json"`
  2. Validate JSON: `python3 -m json.tool supabase/import_map.json`
- **Status**: ✅ Blocking (critical gate)

**Job: `golden-regression`**
- **Commands**: Tests `_shared` modules can be imported
- **Local Debug**: Run `deno check --import-map=./supabase/import_map.json supabase/functions/_shared/*.ts`
- **Status**: ⚠️ Has continue-on-error (non-blocking)

### 5. LLM Integrity Protection (`.github/workflows/llm-integrity.yml`)

**Job: `llm-protection`**
- **Commands**:
  - Checks for unauthorized changes to `llm/`, `supabase/functions/llm/`, `supabase/functions/oil-gas-assistant/`, `rag/`
  - Verifies LLM manifest structure (`llm/manifest.json`)
  - Validates expected values: provider=openai, model_id=gpt-4o, adapter=energy-lora-v1
  - Scans for hardcoded API keys
- **Local Debug**: 
  1. Check manifest: `cat llm/manifest.json | jq`
  2. Verify values match expected
  3. Check for secrets: `grep -r -i "api[_-]key\s*=\s*['\"][^'\"]*['\"]" llm/ supabase/functions/llm/`
- **Status**: ✅ Blocking on unauthorized changes
- **Note**: Manifest has checksum field but CI doesn't verify it (only structure)

### 6. CI/CD Pipeline (`.github/workflows/ci.yml`)

**Job: `lint-and-format`**
- **Commands**: `npm run lint:check`, `npm run type-check`, `npm run format:check`
- **Status**: ✅ Blocking

**Job: `notify`**
- **Commands**: Uses `8398a7/action-slack@v3` (deprecated)
- **Status**: ❌ Needs update to maintained Slack action

### 7. FlowAi CI/CD Pipeline (`.github/workflows/ci-tests.yml`)

**Job: `quality-gates`**
- **Commands**: TypeScript check, ESLint, unit/integration tests
- **Status**: ✅ Blocking

**Job: `smoke-tests`**
- **Commands**: Build + check `dist/assets/*.js` bundles
- **Status**: ❌ Bundle path mismatch (same as e2e-smoke)

## Common Issues & Fixes

### Issue 1: Bundle Path Mismatch
**Problem**: CI checks `dist/assets/*.js` but Vite outputs to `dist/assets/js/*.js`
**Fix**: Update smoke test scripts to check `dist/assets/js/*.js` or use glob pattern

### Issue 2: Node.js Version Inconsistency
**Problem**: Some workflows use Node 18, should use Node 20 LTS
**Fix**: Update all `node-version: '18'` to `node-version: '20.x'` or use `.nvmrc`

### Issue 3: Deprecated Slack Action
**Problem**: `8398a7/action-slack@v3` is deprecated
**Fix**: Replace with `slackapi/slack-github-action` or use curl with webhook

### Issue 4: Supabase CLI Function Names
**Problem**: Invalid function names like `_control_hello-world` (underscore prefix not allowed)
**Fix**: Ensure all functions use valid names (no underscore prefix, use hyphens)

### Issue 5: ESLint `no-explicit-any` in Edge Functions
**Problem**: Edge functions may need `any` for raw payloads
**Fix**: Add ESLint overrides for `supabase/functions/**` to allow `any` or use `unknown` with validation

## How to Update LLM Manifest Checksum

The LLM manifest (`llm/manifest.json`) has a `checksum_sha256` field, but the CI doesn't currently verify it. If you need to update it:

1. Remove the `checksum_sha256` field from `llm/manifest.json`
2. Compute new checksum: `sha256sum llm/manifest.json | awk '{print $1}'`
3. Add the checksum back to the manifest
4. Commit the change

**Note**: The current CI only validates structure and expected values, not the checksum.

## Local Testing Checklist

Before pushing, verify locally:

- [ ] `npm ci` succeeds
- [ ] `npm run lint:check` passes
- [ ] `npm run type-check` passes
- [ ] `npm run build` succeeds and creates `dist/` with bundles
- [ ] `npm run test:unit` passes
- [ ] Deno checks pass: `deno fmt --check supabase/functions/ && deno lint supabase/functions/`
- [ ] All edge functions type-check: `deno check --import-map=./supabase/import_map.json supabase/functions/{function}/index.ts`

## CI Job Dependencies

```
ci-enhanced.yml:
  ci-pipeline → rls-tests

quality-gates.yml:
  typecheck-lint-test, sbom-security, lighthouse-performance, bundle-analysis → quality-summary

edge-function-gates.yml:
  deno-checks → control-function-check, equivalence-check, golden-regression
  All jobs → summary

ci.yml:
  lint-and-format → test → performance, security → build-and-deploy → notify
```

