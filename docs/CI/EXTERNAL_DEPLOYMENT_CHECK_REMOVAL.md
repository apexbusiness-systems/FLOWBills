# External Deployment Check Removal Runbook

## Purpose

FLOWBills production frontend deployment is Cloudflare-only. `vercel.json` exists only to disable Vercel Git deployments while the external Vercel GitHub App remains attached. If a pull request still shows a blocked external deployment check, that check is produced outside this repository and must be removed from repository or provider settings by a repository administrator.

## Required Repository Settings Change

1. Open the GitHub repository settings.
2. Go to **Branches** and edit the protection rule for `main`.
3. In required status checks, remove any external deployment-provider check that is not produced by `.github/workflows/ci.yml`.
4. Go to **Integrations** or **Installed GitHub Apps** and disconnect the inactive external deployment provider from this repository.
5. Re-run checks on the pull request and confirm only repository-owned GitHub Actions checks and the Cloudflare deploy path remain.

## Validation

Run these repository checks after the settings change:

```bash
git ls-files | sed 's#^#/#' | awk '
  /\/(now\.json|netlify\.toml)$/ { bad=1; print "legacy host config still tracked: " $0 }
  /\/\.vercel\// { bad=1; print "legacy provider directory still tracked: " $0 }
  END { exit bad }
'
node -e 'const c=require("./vercel.json"); if (c.git?.deploymentEnabled !== false || c.github?.enabled !== false) process.exit(1); console.log("Vercel Git kill switch active")'
ruby -e 'require "yaml"; Dir[".github/workflows/*.yml"].each { |f| YAML.load_file(f) }; puts "workflow YAML parsed"'
npm run build
```

Expected result: no tracked legacy host config except the Vercel Git kill switch, workflow YAML parses, and the production build still emits `dist`.
