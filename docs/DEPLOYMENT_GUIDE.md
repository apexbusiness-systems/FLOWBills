# FLOWBills.ca Production Deployment Guide

**Status:** ✅ READY FOR PRODUCTION
**Last Updated:** 2026-05-06
**Version:** 1.1.0

---

## Deployment Target

Production frontend deployments target **Cloudflare**.

- **Primary host:** Cloudflare Pages
- **Compatible host:** Cloudflare Workers static assets
- **Install command:** `npm ci`
- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **SPA fallback:** preserved for client-side routes without a copied `_redirects` file
- **Security headers:** preserved through Cloudflare-compatible static header rules

### Deployment Configuration Inventory

| Concern | File | Production assumption |
| --- | --- | --- |
| Cloudflare project/runtime config | `wrangler.json` | Uses `dist` as Pages output and Workers static asset directory. |
| External Vercel kill switch | `vercel.json` | Disables Vercel Git deployments while the external GitHub App remains attached. |
| Workers SPA fallback | `wrangler.json` | `assets.not_found_handling` is `single-page-application`. |
| Pages SPA fallback | Cloudflare Pages default SPA behavior | Serves the SPA shell for unmatched routes without adding a `_redirects` artifact. |
| Security and cache headers | `public/_headers` | Cloudflare Pages applies security headers and cache policy from this file. |
| Build command/output | `package.json`, `package-lock.json`, `wrangler.json` | `npm ci` installs dependencies and `npm run build` emits Vite output to `dist`. |
| Environment examples | `.env.example` | Defines public Vite/Supabase values and non-public local/edge secrets. |

### Legacy Deployment Audit

`vercel.json` is retained only as a Vercel Git kill switch, not as a production deployment target. Cloudflare is the only frontend deployment source of truth in this repository; disconnect any external deployment app that still posts pull-request checks outside this codebase.

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

Cloudflare must install with npm from `package-lock.json`; do not commit `bun.lock`, `bun.lockb`, `pnpm-lock.yaml`, or `yarn.lock`, because Pages may switch package managers and fail frozen-lockfile installs.

The production build must create `dist/index.html`, hashed assets under `dist/assets/`, and copied Cloudflare header config (`dist/_headers`). Do not add `public/_redirects`: the same `dist` artifact is deployable to Workers, where `_redirects` rules are parsed as static-asset redirects and can conflict with Workers SPA fallback.

---

## Deploy Frontend to Cloudflare Pages

Configure the Cloudflare Pages project with these settings:

| Setting | Value |
| --- | --- |
| Framework preset | Vite / None |
| Install command | `npm ci` |
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

### GitHub CI/CD Deployment

The repository CI deploy job is Cloudflare-only and runs on `main` pushes after tests and security checks pass. Configure these GitHub repository secrets for that job:

```bash
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN_FLOW=your-cloudflare-pages-token
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-anon-key
```

`vercel.json` sets `git.deploymentEnabled=false` so Vercel Git deployments are disabled even before the external app is removed. If a pull request still shows a failing check from an external legacy deployment app, follow `docs/CI/EXTERNAL_DEPLOYMENT_CHECK_REMOVAL.md` to disconnect that app from the repository or remove it from required branch protection checks. That check is generated outside this repository and is not controlled by GitHub Actions workflow files.

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
