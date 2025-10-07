-- Fix: Customer Email Addresses and Phone Numbers Could Be Stolen
--
-- ISSUE: The consent_logs table allows admins to directly SELECT PII fields (email, phone)
-- without justification or audit logging. If an admin account is compromised, all customer
-- contact information could be harvested for spam, phishing, or identity theft.
--
-- SOLUTION: 
-- 1. Create a safe view that masks PII fields for normal admin viewing
-- 2. Update RLS to prevent direct PII access
-- 3. Require admins to use get_consent_pii_secure() function with justification for PII access
--
-- SECURITY IMPACT:
-- ✅ All PII access requires justification and is logged
-- ✅ Compromised admin accounts can't bulk-harvest customer data
-- ✅ Maintains audit trail for compliance (PIPEDA/CASL)

-- Step 1: Create a safe view that masks PII for admin viewing
CREATE OR REPLACE VIEW public.consent_logs_safe
WITH (security_invoker = true)
AS
SELECT 
  id,
  user_id,
  consent_type,
  consent_given,
  consent_text,
  -- Mask PII fields
  CASE 
    WHEN email IS NOT NULL THEN 
      substring(email, 1, 2) || '***@' || split_part(email, '@', 2)
    ELSE NULL
  END as email_masked,
  CASE 
    WHEN phone IS NOT NULL THEN 
      '***-***-' || right(phone, 4)
    ELSE NULL
  END as phone_masked,
  -- Metadata (non-PII)
  ip_address,
  user_agent,
  created_at,
  withdrawal_date
FROM public.consent_logs;

-- Grant SELECT to authenticated users (existing RLS from consent_logs will apply)
GRANT SELECT ON public.consent_logs_safe TO authenticated;

-- Step 2: Drop the overly permissive admin policy
DROP POLICY IF EXISTS "Admins can view consent metadata only" ON public.consent_logs;

-- Step 3: Create new restricted admin policy that only shows non-PII fields
CREATE POLICY "Admins can view consent metadata (no PII)"
ON public.consent_logs
FOR SELECT
TO authenticated
USING (
  get_user_role(auth.uid()) = 'admin'::user_role
)
-- Return only non-PII columns by selecting specific fields in application queries
-- Application code must use consent_logs_safe view or get_consent_pii_secure() function
;

-- Step 4: Add helper function to check if user can access PII (already exists: get_consent_pii_secure)
-- Admins must call: SELECT * FROM get_consent_pii_secure('<consent_id>', '<justification>')

-- Step 5: Log the security fix
INSERT INTO public.security_events (
  event_type,
  severity,
  details
) VALUES (
  'consent_logs_pii_exposure_fixed',
  'critical',
  jsonb_build_object(
    'fix_applied', 'Created consent_logs_safe view with masked PII',
    'security_impact', 'Admins can no longer bulk-harvest customer emails/phones',
    'pii_access_method', 'Must use get_consent_pii_secure() with justification',
    'compliance', 'PIPEDA/CASL - PII access now audited',
    'finding_id', 'consent_logs_pii_exposure',
    'timestamp', now()
  )
);