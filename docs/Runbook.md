# E-Invoicing Runbook (Local Development)

## Prerequisites
- Supabase CLI installed: `brew install supabase/tap/supabase`
- Node.js 18+ and pnpm
- Docker (for local Supabase)

## Local Setup

### 1. Start Supabase
```bash
supabase start
```

This starts:
- Postgres on `localhost:54322`
- Studio on `http://localhost:54323`
- Edge Functions runtime on `http://localhost:54321`

### 2. Get Keys
```bash
supabase status
```

Copy `API URL` and `anon key` to `.env.local`.

### 3. Create `.env.local`
```bash
cat > .env.local <<EOF
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=<anon-key-from-status>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key-from-status>
PEPPOL_WEBHOOK_SECRET=local-dev-secret-12345
PEPPOL_AP_URL=http://localhost:8080/ap/send
HIL_CONFIDENCE_THRESHOLD=70
EOF
```

### 4. Start Edge Functions
```bash
supabase functions serve --env-file .env.local
```

Functions available at:
- `http://localhost:54321/functions/v1/einvoice_validate`
- `http://localhost:54321/functions/v1/einvoice_send`
- `http://localhost:54321/functions/v1/einvoice_receive`
- `http://localhost:54321/functions/v1/metrics`

### 5. Start Frontend
```bash
pnpm dev
```

App available at `http://localhost:5173`.

## Testing Workflows

### Validate BIS3 Invoice
```bash
curl -X POST http://localhost:54321/functions/v1/einvoice_validate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -d '{
    "document_id": "INV-001",
    "xml_content": "'"$(cat fixtures/bis3.xml | tr -d '\n')"'",
    "format": "bis30",
    "tenant_id": "test-tenant"
  }'
```

Expected response:
```json
{
  "document_id": "INV-001",
  "format": "bis30",
  "validation_passed": true,
  "confidence_score": 95,
  "errors": [],
  "warnings": []
}
```

### Send Validated Invoice
```bash
curl -X POST http://localhost:54321/functions/v1/einvoice_send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -d '{
    "document_id": "INV-001",
    "sender_participant_id": "0088:1234567890123",
    "receiver_participant_id": "0088:0987654321098",
    "tenant_id": "test-tenant"
  }'
```

Expected response (queued if mock AP fails):
```json
{
  "message_id": "INV-001-1234567890",
  "status": "queued",
  "job_id": "job-1234567890-abc123",
  "will_retry": true
}
```

### Receive Inbound Invoice (Mock Webhook)
```bash
curl -X POST http://localhost:54321/functions/v1/einvoice_receive \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: local-dev-secret-12345" \
  -d '{
    "message_id": "MSG-INBOUND-001",
    "sender_participant_id": "0088:1111111111111",
    "receiver_participant_id": "0088:2222222222222",
    "document_type_id": "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
    "process_id": "urn:fdc:peppol.eu:2017:poacc:billing:01:1.0",
    "xml_content": "'"$(cat fixtures/bis3.xml | tr -d '\n')"'",
    "tenant_id": "test-tenant"
  }'
```

### Check Metrics
```bash
# JSON format
curl http://localhost:54321/functions/v1/metrics

# Prometheus format
curl http://localhost:54321/functions/v1/metrics?format=prometheus
```

Expected Prometheus output:
```
# HELP einvoice_validated_total Validated e-invoices
# TYPE einvoice_validated_total counter
einvoice_validated_total 1
# HELP peppol_send_fail_total Failed Peppol sends
# TYPE peppol_send_fail_total counter
peppol_send_fail_total 0
...
```

## Database Queries

### Check Validation Status
```sql
SELECT document_id, format, status, confidence_score, validation_results 
FROM einvoice_documents 
ORDER BY created_at DESC 
LIMIT 10;
```

### Check Peppol Message Queue
```sql
SELECT message_id, direction, status, retry_count, error_details 
FROM peppol_messages 
ORDER BY created_at DESC 
LIMIT 10;
```

### Check HIL Queue
```sql
SELECT r.id, r.reason, r.confidence_score, e.document_id 
FROM review_queue r 
JOIN einvoice_documents e ON r.invoice_id = e.id 
WHERE r.resolved_at IS NULL;
```

## Troubleshooting

### Edge Function Logs
```bash
# Watch all function logs
supabase functions logs --tail

# Watch specific function
supabase functions logs einvoice_validate --tail
```

### Reset Local DB
```bash
supabase db reset
```

### Clear Queue Jobs
```sql
DELETE FROM queue_jobs WHERE queue_name = 'peppol_send';
```

## Production Deployment

### Deploy Functions
```bash
supabase functions deploy einvoice_validate
supabase functions deploy einvoice_send
supabase functions deploy einvoice_receive
supabase functions deploy metrics
```

### Set Secrets
```bash
supabase secrets set PEPPOL_WEBHOOK_SECRET=<strong-secret>
supabase secrets set PEPPOL_AP_URL=<ap-url>
supabase secrets set PEPPOL_AP_TOKEN=<ap-token>
```

### Verify Deployment
```bash
curl https://yvyjzlbosmtesldczhnm.supabase.co/functions/v1/metrics?format=prometheus
```
