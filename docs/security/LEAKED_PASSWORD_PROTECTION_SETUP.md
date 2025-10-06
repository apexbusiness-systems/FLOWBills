# 🔒 Enable Leaked Password Protection - Required Before Production

## What is Leaked Password Protection?

Leaked Password Protection prevents users from setting passwords that have been compromised in known data breaches. This is a **critical security control** required for production deployment.

When enabled, Supabase checks new passwords against the [Have I Been Pwned](https://haveibeenpwned.com/) database of breached credentials.

---

## ⚠️ WHY THIS MATTERS

**Without this protection:**
- Users can set passwords like "password123" or "qwerty" that are in breach databases
- Accounts are vulnerable to credential stuffing attacks
- Your platform becomes a target for automated attacks
- Non-compliance with modern security standards (OWASP, NIST)

**With this protection:**
- ✅ Users are forced to choose unique, secure passwords
- ✅ Reduces account takeover risk by ~90%
- ✅ Meets OWASP ASVS Level 2 requirements
- ✅ Complies with PIPEDA/PIPA security safeguard obligations

---

## 🎯 HOW TO ENABLE (3 Steps)

### Step 1: Open Supabase Auth Settings

Navigate to your project's Auth configuration:

**Direct Link:**
```
https://supabase.com/dashboard/project/yvyjzlbosmtesldczhnm/auth/providers
```

Or manually:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select project: `yvyjzlbosmtesldczhnm`
3. Click **Authentication** in left sidebar
4. Click **Providers** tab
5. Scroll to **Email** provider section

### Step 2: Enable Leaked Password Protection

1. In the **Email** provider section, find:
   ```
   Password requirements
   └─ Leaked password protection
   ```

2. Toggle the switch to **ENABLED** (green)

3. Review the options:
   - **Block passwords found in breaches** ✅ Recommended
   - **Minimum password strength:** Set to "Strong" or higher
   - **Minimum password length:** Set to 12+ characters

### Step 3: Save & Test

1. Click **Save** at bottom of page

2. **Test the protection:**
   ```bash
   # Try signing up with a known breached password
   curl -X POST 'https://yvyjzlbosmtesldczhnm.supabase.co/auth/v1/signup' \
     -H "apikey: YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "password123"
     }'
   
   # Expected response:
   # {"error": "Password has been found in a data breach"}
   ```

3. **Test with strong password:**
   ```bash
   # Try with a unique strong password
   curl -X POST 'https://yvyjzlbosmtesldczhnm.supabase.co/auth/v1/signup' \
     -H "apikey: YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test2@example.com",
       "password": "Xk9#mP2$vQ8@wL5^"
     }'
   
   # Expected: Success (200 OK)
   ```

---

## 📋 RECOMMENDED SETTINGS

For production deployment of FlowBills.ca:

```yaml
Email Provider Configuration:
  ✅ Enable signup: true
  ✅ Confirm email: true (recommended for production)
  ✅ Secure email change: true
  
  Password Requirements:
    ✅ Leaked password protection: ENABLED
    ✅ Minimum strength: Strong
    ✅ Minimum length: 12 characters
    ✅ Require uppercase: true
    ✅ Require lowercase: true
    ✅ Require numbers: true
    ✅ Require special characters: true
```

---

## 🔍 VERIFICATION CHECKLIST

After enabling, verify:

- [ ] Leaked password protection is **enabled** (green toggle)
- [ ] Test signup with "password123" → should be **rejected**
- [ ] Test signup with strong unique password → should **succeed**
- [ ] Check security logs for "leaked_password_detected" events
- [ ] Update user documentation about password requirements
- [ ] Notify existing users to update weak passwords (optional)

---

## 📊 MONITORING

After enabling, monitor these metrics:

```sql
-- Count rejected passwords due to breach detection
SELECT 
  COUNT(*) as rejected_passwords,
  DATE(created_at) as date
FROM auth.audit_log_entries
WHERE 
  event_message LIKE '%leaked password%'
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

**Expected Results:**
- 5-10% of signup attempts rejected in first week
- Decreases to <2% after users learn requirements

---

## 🚨 TROUBLESHOOTING

### Issue: Can't find the setting

**Solution:** Ensure you're on the correct project and have **Owner** or **Admin** role.

### Issue: Existing users have weak passwords

**Solution:** Force password reset for high-risk accounts:

```sql
-- Find users with potentially weak passwords (registered before protection)
SELECT 
  email,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE 
  created_at < '2025-10-06'  -- Date you enabled protection
  AND email_confirmed_at IS NOT NULL
ORDER BY last_sign_in_at DESC;

-- Optionally send password reset emails to these users
```

### Issue: Users complaining about password requirements

**Solution:** Add clear password requirements to your signup UI:

```typescript
// Add to your Auth.tsx or signup component
<div className="text-sm text-muted-foreground mb-4">
  <p className="font-medium mb-2">Password requirements:</p>
  <ul className="list-disc pl-5 space-y-1">
    <li>At least 12 characters long</li>
    <li>Contains uppercase and lowercase letters</li>
    <li>Contains numbers and special characters</li>
    <li>Not found in known data breaches</li>
  </ul>
</div>
```

---

## 📚 REFERENCES

- [Supabase Password Security Guide](https://supabase.com/docs/guides/auth/password-security)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Have I Been Pwned API](https://haveibeenpwned.com/API/v3)
- [NIST Digital Identity Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)

---

## ✅ STATUS TRACKING

Update this section once completed:

```yaml
Status: ⚠️ PENDING
Enabled By: _________________
Date Enabled: _________________
Tested By: _________________
Production Verified: ⬜ Yes  ⬜ No
```

---

**⚠️ CRITICAL:** This setting MUST be enabled before production launch. It is a non-negotiable security requirement for FlowBills.ca.
