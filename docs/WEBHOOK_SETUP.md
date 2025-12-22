# FlowC Webhook Setup Guide

## Webhook Endpoint

**Function Name**: `flowc-webhook`  
**Supabase Endpoint**: `https://[project-id].supabase.co/functions/v1/flowc-webhook`  
**Custom Domain** (if configured): `https://flowbills.ca/api/flowc/webhook`

## Configuration

### 1. Set Webhook Secret

In Supabase Dashboard → Settings → Edge Functions → Secrets:

```
FLOWBILLS_WEBHOOK_SECRET=<your-secret-here>
```

**Generate a secure secret**:
```bash
openssl rand -hex 32
```

Or use PowerShell:
```powershell
$bytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$hex = ($bytes | ForEach-Object { $_.ToString('x2') }) -join ''
Write-Output $hex
```

### 2. Configure FlowC to Call This Webhook

In FlowC's configuration, set the callback URL to:

```
https://[project-id].supabase.co/functions/v1/flowc-webhook
```

Or if custom domain is configured:

```
https://flowbills.ca/api/flowc/webhook
```

### 3. Webhook Payload Format

FlowC should send POST requests with:

**Headers**:
```
Content-Type: application/json
x-flowc-signature: <HMAC-SHA256 signature>
```

**Body**:
```json
{
  "invoice_id": "uuid",
  "action": "HOLD" | "ROUTE_TO_REVIEW" | "CLEAR",
  "compliance_code": "NA_ACH_DUPLICATE",
  "risk_score": 0.89,
  "details": "Potential duplicate detected...",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### 4. Signature Verification

The webhook verifies HMAC-SHA256 signatures using `FLOWBILLS_WEBHOOK_SECRET`.

FlowC should generate the signature as:
```javascript
const signature = await crypto.subtle.sign(
  'HMAC',
  key,
  new TextEncoder().encode(JSON.stringify(payload))
);
const signatureHex = Array.from(new Uint8Array(signature))
  .map(b => b.toString(16).padStart(2, '0'))
  .join('');
```

### 5. Response Format

**Success** (200 OK):
```json
{
  "received": true,
  "invoice_id": "uuid",
  "action": "HOLD",
  "processed_at": "2025-01-15T10:30:00Z"
}
```

**Error** (4xx/5xx):
```json
{
  "error": "Error message"
}
```

## Actions

### HOLD
- Sets invoice status to `on_hold`
- Adds invoice to review queue with high priority
- Logs security event

### ROUTE_TO_REVIEW
- Sets invoice status to `needs_review`
- Adds invoice to review queue with medium priority
- Logs security event

### CLEAR
- Sets invoice status back to `processing`
- Removes invoice from review queue (if added for compliance)
- Resumes normal processing

## Testing

Test the webhook with curl:

```bash
# Generate test signature (use same secret as FLOWBILLS_WEBHOOK_SECRET)
# Then send:
curl -X POST https://[project-id].supabase.co/functions/v1/flowc-webhook \
  -H "Content-Type: application/json" \
  -H "x-flowc-signature: <generated-signature>" \
  -d '{
    "invoice_id": "test-uuid",
    "action": "HOLD",
    "compliance_code": "TEST",
    "risk_score": 0.9,
    "details": "Test webhook",
    "timestamp": "2025-01-15T10:30:00Z"
  }'
```

## Security

- ✅ HMAC signature verification
- ✅ No JWT required (webhook-to-webhook communication)
- ✅ All actions logged to `security_events` table
- ✅ Idempotent operations (safe to retry)

## Troubleshooting

**401 Unauthorized**: Check that `FLOWBILLS_WEBHOOK_SECRET` is set and signature is correct  
**404 Not Found**: Verify function is deployed: `supabase functions deploy flowc-webhook`  
**500 Internal Server Error**: Check Supabase function logs for details

---

**Last Updated**: 2025-12-18

