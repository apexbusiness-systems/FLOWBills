# FLOWBills.ca Production Deployment Guide

**Status:** ✅ READY FOR PRODUCTION
**Last Updated:** 2026-05-06
**Version:** 1.1.0

---

## Deployment Target

Production frontend deployments now target **Cloudflare** instead of Vercel or Lovable-hosted production assumptions.

- **Primary host:** Cloudflare Pages
- **Compatible host:** Cloudflare Workers static assets
- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **SPA fallback:** preserved for client-side routes without a copied `_redirects` file
- **Security headers:** preserved through Cloudflare-compatible static header rules

### Deployment Configuration Inventory

| Concern | File | Production assumption |
| --- | --- | --- |
| Cloudflare project/runtime config | `wrangler.json` | Uses `dist` as Pages output and Workers static asset directory. |
| Workers SPA fallback | `wrangler.json` | `assets.not_found_handling` is `single-page-application`. |
| Pages SPA fallback | Cloudflare Pages default SPA behavior | Serves the SPA shell for unmatched routes without adding a `_redirects` artifact. |
| Security and cache headers | `public/_headers` | Cloudflare Pages applies security headers and cache policy from this file. |
| Build command/output | `package.json`, `wrangler.json` | `npm run build` emits Vite output to `dist`. |
| Environment examples | `.env.example` | Defines public Vite/Supabase values and non-public local/edge secrets. |

### Vercel Assumption Audit

No active `vercel.json`, `.vercel/`, or Vercel-specific runtime configuration is required for production. Historical references to Vercel should be treated as archived incident context, not deployment source of truth.

---

## Pre-Deployment Verification

Before deploying to Cloudflare, verify the repository state locally:

```bash
npm ci
npm run lint:check
npm run type-check
npm run test:unit
npm run build
```

The production build must create `dist/index.html`, hashed assets under `dist/assets/`, and copied Cloudflare header config (`dist/_headers`). Do not add `public/_redirects`: the same `dist` artifact is deployable to Workers, where `_redirects` rules are parsed as static-asset redirects and can conflict with Workers SPA fallback.

---

## Deploy Frontend to Cloudflare Pages

Configure the Cloudflare Pages project with these settings:

| Setting | Value |
| --- | --- |
| Framework preset | Vite / None |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | repository root |
| Node.js version | `20` or newer |

### Required Cloudflare Environment Variables

Set public Vite variables in Cloudflare Pages project settings only when the build uses environment-driven Supabase configuration:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-anon-key
VITE_SUPABASE_ANON_KEY=your-publishable-anon-key
```

Set non-public Supabase service role keys only in Supabase Edge Function secrets or another secure server-side secret store. Do not expose service role keys through Cloudflare Pages public build variables.

### Deploy Command Options

Cloudflare Pages can deploy from the dashboard Git integration. If using Wrangler in CI, build first and deploy the generated `dist` directory:

```bash
npm run build
npx wrangler pages deploy dist --project-name flowbills
```

---

## Deploy Frontend to Cloudflare Workers Static Assets

The same Vite output can also be deployed as a Worker with static assets:

```bash
npm run build
npx wrangler deploy
```

Workers static assets use `wrangler.json` and preserve SPA fallback with `assets.not_found_handling = single-page-application`. Keep SPA fallback in Wrangler config instead of `_redirects` so the Pages/Workers artifact remains equivalent.

---

## Post-Deployment Smoke Tests

After deploying, run the smoke test suite against the deployed environment:

```bash
SUPABASE_URL=https://ullqluvzkgnwwqijhvjr.supabase.co \
SUPABASE_ANON_KEY=your-anon-key \
node scripts/post-deployment-smoke-tests.ts
```

Expected result:

- All smoke tests pass.
- Deep links such as `/dashboard` return the SPA shell instead of a platform 404.
- Static assets under `/assets/` return the asset content type and are not rewritten to HTML.
- No `_redirects` file is present in `dist`; SPA fallback is provided by Cloudflare Pages default SPA serving and Workers `assets.not_found_handling`.
- Security headers from `public/_headers` are present on deployed responses.

---

## Manual Critical User Flow Verification

Validate these flows after each production deploy:

1. Authentication: sign up, sign in, password reset, sign out.
2. Invoice processing: upload, extraction review, edit, approve, list.
3. AFE management: create AFE, link invoice, budget utilization, alerts, reports.
4. Security checks: RLS isolation, rate limiting, CSP reporting, CSRF protection, XSS sanitization.

---

## Rollback Procedure

If critical issues are detected after deployment:

1. Open the Cloudflare Pages deployment list or Workers version history.
2. Roll back to the last known-good deployment.
3. Re-run post-deployment smoke tests.
4. Monitor error rates, Supabase Edge Function logs, and critical user flows for at least 30 minutes.

---

## Critical Production Security Action

Enable Supabase leaked password protection before production launch:

1. Navigate to the Supabase Auth settings for the production project.
2. Enable leaked password protection.
3. Set minimum password length to 12 characters.
4. Require strong passwords.
5. Save changes and verify weak passwords are rejected.

```bash
curl -X POST https://ullqluvzkgnwwqijhvjr.supabase.co/auth/v1/signup \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"email":"test@example.com","password":"password123"}'
```

Expected result: Supabase rejects the weak or leaked password.
