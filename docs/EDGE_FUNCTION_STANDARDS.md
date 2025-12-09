# Edge Function Standards (P0-P12)

This document outlines the comprehensive standards and guardrails for all Supabase Edge Functions in FlowAi.

## P0 — Global Guardrails

### Enforcement Rules
1. **ESM-only** with `Deno.serve` entrypoint
2. **Explicit relative imports** only (./ or ../)
3. **Shared code** lives in `supabase/functions/_shared`
4. **Single import map** at `supabase/import_map.json`
5. **Root deno.json** with strict compiler options
6. **CI gates** run on every PR: fmt, lint, check

### Non-Negotiable Requirements
- All changes must be idempotent
- All changes must be backward-compatible
- All changes must handle overload gracefully

## P1 — Canonical Entry Shape

Every `index.ts` follows this baseline:

```typescript
Deno.serve(async (req) => {
  const body = await req.json().catch(() => ({}));
  
  return new Response(JSON.stringify({ 
    ok: true, 
    echo: body 
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

Business logic is reattached via helpers in `_shared`.

## P2 — Shared Code Layout

### Directory Structure
```
supabase/functions/
├── _shared/
│   ├── cors.ts          # CORS headers
│   ├── errors.ts        # Error utilities
│   ├── health.ts        # Health check utilities
│   ├── idempotency.ts   # Idempotency middleware
│   ├── response.ts      # Response helpers
│   └── validation.ts    # Input validation
├── control-hello-world/ # Control function for infra testing
│   └── index.ts
└── [functions]/
    └── index.ts         # Function entry point
```

### Import Rules
- Use explicit relative imports: `../_shared/cors.ts`
- Never traverse outside `supabase/functions`
- Add frequently used imports to `import_map.json`

## P3 — Single Import Map

- **Location**: `supabase/import_map.json`
- **Usage**: Editor, local serve, and deploy all use this map
- **Referenced in**: Root `deno.json`

## P4 — Deno Config

Root `deno.json` provides:
- Import map reference
- Strict compiler options
- Consistent type libs: `["deno.ns", "dom"]`
- Formatting and linting rules

## P5 — Dependency Strategy

### Pinned Versions
- Use Deno-compatible ESM (JSR/npm specifiers)
- Pin `@supabase/supabase-js` to known-good version
- Weekly canary job tests latest versions
- Production stays pinned unless canary passes

### Approved Dependencies
- `@supabase/supabase-js` (npm:)
- `zod` (deno.land/x)
- `stripe` (esm.sh)

## P6 — Control Function

**Purpose**: Isolate infrastructure vs code failures

**Location**: `supabase/functions/control-hello-world/index.ts`

This function must always deploy successfully if infrastructure is working.

## P7 — Local ≡ Deploy Equivalence

**Script**: `scripts/equivalence-check.sh`

Guarantees parity by:
1. Running `deno check` on each function
2. Verifying import resolution
3. Comparing local vs deploy behavior

## P8 — Golden Regression

CI automatically tests `_shared` modules to catch import/parse regressions.

## P9 — Node-ism Detector

### Banned APIs
- `require()`
- `process.*`
- `Buffer`
- `__dirname`, `__filename`
- `module.exports`

### Approved Replacements
- `import` instead of `require()`
- `Deno.env` instead of `process.env`
- `Uint8Array`, `TextEncoder/TextDecoder` instead of `Buffer`
- `import.meta.url` instead of `__dirname`
- `export` instead of `module.exports`

## P10 — Pre-Commit Hygiene

Pre-commit hook runs:
1. `deno fmt --check` on changed files
2. `deno lint` on changed files
3. `deno check` on changed functions

Commits are rejected on any failure.

## P11 — Incident Playbook

**Script**: `scripts/edge-verify.ts <function-name>`

5-minute recovery diagnostics:
1. Runs `deno check` on entry and dependencies
2. Validates imports are relative and within bounds
3. Confirms import map path
4. Tests control function to isolate infra issues
5. Reports any recent dependency changes

## P12 — Targeted Fix Template

**Script**: `scripts/fix-template.sh <function-name>`

When a function breaks:
1. Backup current implementation
2. Replace with canonical baseline
3. Deploy to verify infrastructure
4. Re-add imports one by one
5. Confirm `deno check` after each step
6. Run equivalence check
7. Commit only when all gates pass

## CI/CD Integration

All checks run automatically in `.github/workflows/edge-function-gates.yml`:
- Deno format, lint, type checks
- Control function validation
- Equivalence testing
- Node-ism detection
- Import discipline validation
- Import map validation
- Golden regression tests

## Quick Reference Commands

```bash
# Verify a function
./scripts/edge-verify.ts my-function

# Run equivalence checks
./scripts/equivalence-check.sh

# Apply fix template
./scripts/fix-template.sh my-function

# Type check all functions
deno check --import-map=./supabase/import_map.json supabase/functions/*/index.ts

# Format all functions
deno fmt supabase/functions/

# Lint all functions
deno lint supabase/functions/
```

## Troubleshooting

### Module not found errors
1. Check import map at `supabase/import_map.json`
2. Verify no individual `deno.json` files in function folders
3. Use explicit relative imports

### Type check failures
1. Run `./scripts/edge-verify.ts <function>`
2. Check for Node.js-specific APIs
3. Verify all imports are resolvable

### Deploy parse errors
1. Deploy control function first to isolate infra issues
2. Run equivalence check
3. Apply fix template if needed
4. Re-add logic incrementally

## Compliance

All edge functions must:
- ✅ Pass `deno fmt --check`
- ✅ Pass `deno lint`
- ✅ Pass `deno check`
- ✅ Use only Deno/Web APIs
- ✅ Follow import discipline
- ✅ Use shared utilities from `_shared`
- ✅ Be idempotent and backward-compatible
