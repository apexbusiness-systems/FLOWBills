# Row Level Security (RLS) Implementation

## Overview

FlowAi implements comprehensive Row Level Security (RLS) policies to ensure tenant isolation and protect Personally Identifiable Information (PII). All tables containing sensitive data have RLS enabled with tenant-scoped access controls.

## RLS-Enabled Tables

### Core Business Tables
- **invoices**: Invoice processing data with user/tenant isolation
- **vendors**: Vendor information with operator/admin access only
- **approvals**: Approval workflow data with role-based access
- **audit_logs**: System audit trail with admin-only read access

### Security & Compliance Tables  
- **security_events**: Security monitoring with admin-only access
- **consent_logs**: CASL/PIPEDA consent tracking with user-specific access
- **fraud_flags**: Fraud detection flags with operator/admin access
- **user_roles**: Role assignments with admin management
- **user_sessions**: Session tracking with user/admin access

### Policy & Configuration Tables
- **policies**: Business rule policies with admin management
- **compliance_records**: Compliance tracking with admin access
- **exceptions**: Exception handling with operator/admin access

## Security Principles

### 1. Tenant Isolation
All multi-tenant tables implement strict tenant-scoped access:
```sql
-- Example: Users can only view their own invoices
CREATE POLICY "Users can view their own invoices" 
ON public.invoices 
FOR SELECT 
USING (auth.uid() = user_id);
```

### 2. Role-Based Access Control (RBAC)
Three-tier role system with escalating privileges:
- **viewer**: Read-only access to owned resources
- **operator**: Manage invoices, vendors, approvals, exceptions
- **admin**: Full system access including user management and security events

### 3. PII Protection
Tables containing PII use additional safeguards:
- **consent_logs**: Users can only access own records + admin audit trail
- **vendors**: Operator/admin access only (contains payment details)
- **security_events**: Admin-only access with audit logging

## Policy Categories

### User Data Policies
```sql
-- Users can view/manage their own data
USING (auth.uid() = user_id)
```

### Role-Based Policies  
```sql
-- Operators and admins can manage business data
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'operator'::user_role]))
```

### Admin-Only Policies
```sql
-- Critical system data restricted to admins
USING (get_user_role(auth.uid()) = 'admin'::user_role)
```

### System Policies
```sql
-- System functions can insert audit/security events
WITH CHECK (true)
```

## Testing RLS Policies

### Automated Tests
- Anonymous user access (should return empty results)
- Cross-tenant access prevention
- Role-based access verification
- Policy existence validation

### Manual Verification
1. Test with different user roles
2. Verify tenant boundary enforcement
3. Confirm PII access restrictions
4. Validate audit logging for admin PII access

## Security Functions

### get_user_role(uuid)
Security definer function that safely retrieves user roles without RLS recursion:
```sql
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid)
RETURNS user_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role FROM public.user_roles WHERE user_id = user_uuid;
$$;
```

### log_admin_pii_access(text, text)
Logs administrative access to PII for compliance:
```sql
-- Automatically logs when admins access PII tables
SELECT log_admin_pii_access('consent_logs', record_id)
```

## Compliance Alignment

### OWASP ASVS Controls
- **V4.1**: Access Control Architecture
- **V4.2**: Operation Level Access Control  
- **V4.3**: Other Access Control Considerations

### PIPEDA/CASL Requirements
- Principle of least privilege
- Purpose limitation for PII access
- Audit trail for administrative access
- User consent tracking and access

## Monitoring & Alerts

### RLS Policy Violations
- Failed access attempts logged to security_events
- Automated alerting on policy bypass attempts
- Regular policy effectiveness reviews

### Audit Requirements
- All policy changes tracked in audit_logs
- Before/after state capture for modifications
- Quarterly access review and validation

## Incident Response

### Policy Bypass Detection
1. Monitor security_events for RLS violations
2. Investigate failed cross-tenant access attempts
3. Review admin PII access patterns
4. Escalate suspicious activity immediately

### Policy Updates
1. Test new policies in development environment
2. Document business justification for changes
3. Review with security team before deployment
4. Monitor effectiveness post-deployment

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [OWASP ASVS v4.0](https://owasp.org/www-project-application-security-verification-standard/)
- [PIPEDA Privacy Guidelines](https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/)