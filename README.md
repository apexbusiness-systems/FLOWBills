# FlowBills.ca - E-Invoicing Platform

Enterprise-grade e-invoicing platform for Canadian oil & gas industry with Peppol network integration.

## 🚨 Pre-Production Security Checklist

**CRITICAL:** Before deploying to production, complete this mandatory security setup:

### 1. Enable Leaked Password Protection ⚠️ REQUIRED
- 📖 **Guide:** `docs/security/LEAKED_PASSWORD_PROTECTION_SETUP.md`
- 🔗 **Dashboard:** [Supabase Auth Providers](https://supabase.com/dashboard/project/yvyjzlbosmtesldczhnm/auth/providers)
- ⏱️ **Time:** 5 minutes
- **Steps:**
  1. Open Supabase Auth settings (link above)
  2. Find "Email" provider → "Password requirements"
  3. Enable "Leaked password protection" toggle
  4. Set minimum length to 12 characters
  5. Set minimum strength to "Strong"
  6. Click Save

### 2. Verify Security Configuration
```bash
# Run security linter
npm run db:lint

# Run E2E tests
npm run test:e2e
```

### 3. Complete Full Checklist
See `docs/security/PRE_PRODUCTION_CHECKLIST.md` for complete deployment requirements.

---

## Quick Start

```bash
npm install
npm run dev
```

## Project Technologies

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (Database, Auth, Edge Functions)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test:e2e` - Run end-to-end tests
- `npm run db:lint` - Run database security linter
