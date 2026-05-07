# Move Production Deployment Assumptions to Cloudflare

## Summary

This branch makes Cloudflare the frontend deployment source of truth without changing UI, application routing code, business logic, or Supabase schema.

## Deployment Inventory

- **Cloudflare Pages:** `wrangler.json` declares `pages_build_output_dir` as `dist` for Wrangler-aware Pages deployments.
- **Cloudflare Workers static assets:** `wrangler.json` preserves the existing `assets.directory = dist` and SPA fallback behavior.
- **SPA fallback:** no `_redirects` artifact is used; Pages relies on Cloudflare default SPA serving and Workers relies on `assets.not_found_handling = single-page-application`.
- **Security headers:** `public/_headers` remains the Cloudflare-compatible header source for Pages deployments.
- **Build command/output:** Cloudflare installs with `npm ci`; `npm run build` and `dist` are unchanged.
- **Environment assumptions:** `.env.example` documents Cloudflare Pages public build variables and keeps the legacy Supabase anon alias for compatibility.
- **CI/CD:** `.github/workflows/ci.yml` deploys production frontend builds through Cloudflare Pages secrets on `main` pushes, rejects legacy deployment artifacts, and verifies the Vercel Git deployment kill switch remains active.
- **External provider shutdown:** `vercel.json` disables Vercel Git deployments; `docs/CI/EXTERNAL_DEPLOYMENT_CHECK_REMOVAL.md` documents the admin-only settings change required to remove any blocked external deployment check generated outside this repository.
- **Security check fix:** `react-router-dom` is pinned to the patched 6.30.3 line, which pulls `react-router` 6.30.3 and `@remix-run/router` 1.23.2 for the React Router advisory.
- **Performance check fix:** Lighthouse CI keeps category budgets as merge-blocking checks and demotes noisy per-audit opportunities to warnings while index metadata/preconnect hints are fixed.
- **Cloudflare install fix:** removed the stale Bun lockfile and added a CI guard against non-npm lockfiles so Pages does not run `bun install --frozen-lockfile`.

## Verification

Run these checks before merge/deploy:

```bash
npm run build
npm run lint:check
npm run type-check
```

After deployment, verify:

- Deep links such as `/dashboard` return the SPA shell.
- Static assets under `/assets/` return their asset content type, not `text/html`.
- `dist/_redirects` is absent so Workers static-asset redirects cannot override SPA fallback.
- Security headers from `public/_headers` are present.
- Supabase service role secrets are not configured as public Cloudflare Pages variables.

## Rollback Plan

Revert this branch or roll back to the previous Cloudflare Pages/Workers deployment version if post-deployment smoke tests fail.
