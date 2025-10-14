# P13: Data Subject Access Request (DSAR) Runbook

## Overview
This runbook provides step-by-step procedures for handling Data Subject Access Requests (DSARs) under PIPEDA (Canada) and GDPR (EU) compliance requirements.

## Timezone
All timestamps and deadlines are in **America/Edmonton** timezone.

## Request Types

### 1. Access Request
Subject wants to know what personal data we hold.

**Deadline:** 30 days (PIPEDA), 30 days (GDPR)

**Procedure:**
```sql
-- Step 1: Identify user by email
SELECT id, email FROM auth.users WHERE email = '[subject_email]';

-- Step 2: Export all PII associated with user
SELECT 
  'consent_logs' as table_name,
  id, user_id, consent_type, consent_given, email, phone, 
  ip_address, created_at
FROM public.consent_logs 
WHERE user_id = '[user_id]' OR email = '[subject_email]';

-- Step 3: Export invoice data
SELECT 
  'invoices' as table_name,
  id, invoice_number, vendor_id, amount, invoice_date, 
  created_at, user_id
FROM public.invoices 
WHERE user_id = '[user_id]';

-- Step 4: Export billing data
SELECT 
  'billing_customers' as table_name,
  bc.id, bc.user_id, bc.email, bc.stripe_customer_id, bc.created_at
FROM public.billing_customers bc
WHERE bc.user_id = '[user_id]';

-- Step 5: Export audit logs
SELECT 
  'audit_logs' as table_name,
  id, entity_type, action, user_id, created_at, old_values, new_values
FROM public.audit_logs 
WHERE user_id = '[user_id]';

-- Step 6: Export security events
SELECT 
  'security_events' as table_name,
  id, event_type, severity, user_id, ip_address, created_at, details
FROM public.security_events 
WHERE user_id = '[user_id]';
```

**Delivery:**
1. Export results to CSV (redact internal IDs if needed)
2. Generate PDF summary in plain language
3. Send via secure email or portal
4. Log DSAR fulfillment in `security_events`

### 2. Rectification Request
Subject wants to correct inaccurate data.

**Deadline:** 30 days

**Procedure:**
```sql
-- Example: Update consent email
UPDATE public.consent_logs
SET email = '[corrected_email]'
WHERE user_id = '[user_id]' AND email = '[old_email]';

-- Log the rectification
INSERT INTO public.security_events (
  event_type, severity, user_id, details
) VALUES (
  'dsar_rectification',
  'info',
  '[user_id]',
  jsonb_build_object(
    'request_type', 'rectification',
    'field', 'email',
    'old_value', '[old_email]',
    'new_value', '[corrected_email]',
    'processed_at', now(),
    'processed_by', '[admin_user_id]'
  )
);
```

### 3. Erasure Request (Right to be Forgotten)
Subject wants their data deleted.

**Deadline:** 30 days

**Procedure:**
```sql
-- CRITICAL: Consult legal before full deletion
-- May need to retain certain records for legal/tax compliance

-- Step 1: Anonymize consent logs (retain for audit)
UPDATE public.consent_logs
SET 
  email = 'deleted-' || id::text || '@anonymized.local',
  phone = NULL,
  ip_address = NULL,
  user_agent = 'DELETED'
WHERE user_id = '[user_id]';

-- Step 2: Remove personal data from billing
UPDATE public.billing_customers
SET 
  email = 'deleted-' || id::text || '@anonymized.local'
WHERE user_id = '[user_id]';

-- Step 3: Anonymize audit logs (keep structure for compliance)
UPDATE public.audit_logs
SET 
  old_values = jsonb_build_object('anonymized', true),
  new_values = jsonb_build_object('anonymized', true)
WHERE user_id = '[user_id]';

-- Step 4: Delete user from auth.users (if legally permissible)
-- NOTE: This cascades to many tables via foreign keys
DELETE FROM auth.users WHERE id = '[user_id]';

-- Step 5: Log erasure
INSERT INTO public.security_events (
  event_type, severity, user_id, details
) VALUES (
  'dsar_erasure',
  'critical',
  NULL, -- User deleted
  jsonb_build_object(
    'request_type', 'erasure',
    'original_user_id', '[user_id]',
    'processed_at', now(),
    'processed_by', '[admin_user_id]',
    'legal_hold', false
  )
);
```

### 4. Portability Request
Subject wants data in machine-readable format.

**Deadline:** 30 days

**Procedure:**
1. Run Access Request queries (above)
2. Export as JSON instead of CSV
3. Include schema documentation
4. Provide via secure download link

```json
{
  "export_date": "2025-10-14T00:00:00-06:00",
  "timezone": "America/Edmonton",
  "subject_email": "[email]",
  "data": {
    "consent_logs": [...],
    "invoices": [...],
    "billing": [...]
  }
}
```

### 5. Restriction Request
Subject wants to limit processing temporarily.

**Deadline:** 30 days

**Procedure:**
```sql
-- Mark user for restricted processing
INSERT INTO public.user_roles (user_id, role)
VALUES ('[user_id]', 'restricted');

-- Log restriction
INSERT INTO public.security_events (
  event_type, severity, user_id, details
) VALUES (
  'dsar_restriction',
  'high',
  '[user_id]',
  jsonb_build_object(
    'request_type', 'restriction',
    'restrictions', 'No new invoices, no marketing',
    'applied_at', now()
  )
);
```

## Automated Retention Policy

**Schedule:** Daily at 03:00 America/Edmonton

```sql
-- Call cleanup function (already created in migration)
SELECT public.cleanup_expired_data();
SELECT public.cleanup_consent_rate_limits();

-- Additional retention rules
DELETE FROM public.audit_logs 
WHERE created_at < (now() - interval '7 years'); -- Tax retention

DELETE FROM public.security_events 
WHERE created_at < (now() - interval '2 years') 
  AND severity NOT IN ('high', 'critical');
```

## Response Template

```
Subject: Your Data Subject Access Request - [Request ID]

Dear [Name],

Thank you for your data subject access request received on [Date].

We have processed your request for [ACCESS/RECTIFICATION/ERASURE/PORTABILITY].

[Attach export or confirmation of changes]

If you have any questions or concerns, please contact:
Privacy Officer: privacy@flowbills.ca
Response deadline: [30 days from receipt]

Sincerely,
FLOWBills.ca Data Protection Team
```

## Compliance Checklist

- [ ] Request received and logged
- [ ] Identity verified (2FA, email confirmation)
- [ ] Legal hold check (litigation, tax audit)
- [ ] Data extracted/modified per request type
- [ ] Changes logged in `security_events`
- [ ] Response sent within 30 days
- [ ] Follow-up confirmation received

## Emergency Contacts

- **Privacy Officer:** privacy@flowbills.ca
- **Legal Counsel:** legal@flowbills.ca
- **On-call Admin:** Supabase dashboard → Auth → Users

## Audit Trail

All DSAR actions MUST be logged to `security_events` with:
- `event_type`: 'dsar_[access|rectification|erasure|portability|restriction]'
- `severity`: 'critical'
- `details`: Full context of request and actions taken

## References

- [PIPEDA: Individual's Request for Access](https://www.priv.gc.ca/en/privacy-topics/access-to-personal-information/)
- [GDPR: Right of Access](https://gdpr-info.eu/art-15-gdpr/)
- [GDPR: Right to Erasure](https://gdpr-info.eu/art-17-gdpr/)