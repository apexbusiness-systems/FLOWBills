# Move Production Deployment Assumptions to Cloudflare

## Summary

This branch makes Cloudflare the frontend deployment source of truth without changing UI, application routing code, business logic, or Supabase schema.

## Deployment Inventory

- **Cloudflare Pages:** `wrangler.json` declares `pages_build_output_dir` as `dist` for Wrangler-aware Pages deployments.
- **Cloudflare Workers static assets:** `wrangler.json` preserves the existing `assets.directory = dist` and SPA fallback behavior.
- **SPA fallback:** no `_redirects` artifact is used; Pages relies on Cloudflare default SPA serving and Workers relies on `assets.not_found_handling = single-page-application`.
- **Security headers:** `public/_headers` remains the Cloudflare-compatible header source for Pages deployments.
- **Build command/output:** `npm run build` and `dist` are unchanged.
- **Environment assumptions:** `.env.example` documents Cloudflare Pages public build variables and keeps the legacy Supabase anon alias for compatibility.
- **CI/CD:** `.github/workflows/ci.yml` deploys production frontend builds through Cloudflare Pages secrets on `main` pushes and rejects tracked legacy deployment artifacts.
- **Repository settings:** `docs/CI/EXTERNAL_DEPLOYMENT_CHECK_REMOVAL.md` documents the admin-only settings change required to remove any blocked external deployment check generated outside this repository.

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
