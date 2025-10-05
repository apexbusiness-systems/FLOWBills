# E-Invoicing Infrastructure

## Overview

FlowBills.ca implements EU-compliant e-invoicing with support for:
- **Peppol BIS Billing 3.0** (Pan-European standard)
- **XRechnung** (Germany)
- **Factur-X** (France/Germany)
- **EN 16931** (European core semantic model)

## Architecture

### Inbound Flow
1. Partner AP → `einvoice_receive` webhook
2. Verify webhook secret + idempotency check
3. Extract metadata, calculate confidence score
4. Validate against format-specific rules
5. Route to HIL if confidence < threshold (default 70%)
6. Auto-approve if confidence ≥ threshold

### Outbound Flow
1. User validates invoice via `einvoice_validate`
2. User triggers send via `einvoice_send`
3. Build BIS 3.0 SBDH envelope
4. Attempt immediate send to Peppol AP
5. On failure, enqueue to `peppol_send` queue with exponential backoff
6. Queue processor retries with idempotency

## Validation Rules

### EN 16931 Core Requirements
- Invoice ID (`cbc:ID`)
- Issue Date (`cbc:IssueDate`)
- Seller Party (`cac:AccountingSupplierParty`)
- Buyer Party (`cac:AccountingCustomerParty`)
- Currency (`cbc:DocumentCurrencyCode`)
- Line items with amounts

### BIS 3.0 Additional Constraints
- CustomizationID: `urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0`
- ProfileID: `urn:fdc:peppol.eu:2017:poacc:billing:01:1.0`
- Peppol Endpoint IDs with scheme `0088` (GLN) or `0192` (Norwegian Org)

### XRechnung (Germany)
- Root element: `CrossIndustryInvoice`
- CustomizationID: `urn:cen.eu:en16931:2017#compliant#urn:xoev-de:kosit:standard:xrechnung_2.3`
- BuyerReference (Leitweg-ID) required for B2G

### Factur-X (France/Germany)
- Root element: `CrossIndustryDocument`
- Profile: `urn:factur-x.eu:1p0:basicwl` (Basic WL) or higher
- Embedded PDF/A-3 for hybrid format

## Database Schema

### `einvoice_documents`
- `document_id`: External invoice ID
- `format`: Enum (bis30, xrechnung, facturx, pint)
- `status`: Enum (pending, validated, sent, failed)
- `xml_content`: Full XML payload
- `confidence_score`: 0-100
- `validation_results`: JSONB with errors/warnings

### `peppol_messages`
- `message_id`: Unique per send attempt
- `direction`: 'inbound' | 'outbound'
- `sender_participant_id`: ISO 6523 format
- `receiver_participant_id`: ISO 6523 format
- `status`: queued, sent, failed
- `retry_count`, `error_details`

### `country_validations`
- Per-country validation results
- `rule_type`: Specific validation ruleset
- `validation_passed`, `error_messages`, `warnings`

## Queue Processing (pgmq)

### `peppol_send` Queue
- Processes failed sends with exponential backoff
- Max retries: 3 (configurable)
- Backoff: 2^retry_count minutes
- DLQ: Messages exceeding max_retries move to `peppol_send_dlq`

### Idempotency
- Uses `message_id` (document_id + timestamp) as deduplication key
- Checks `peppol_messages` table before processing
- Returns existing result if already processed

## Compliance & Responsibility Boundary

FlowBills.ca is responsible for:
✅ Validating invoices against EN 16931 / BIS 3.0 / XRechnung / Factur-X rules
✅ Building correct SBDH envelopes per Peppol spec
✅ Ensuring idempotent sends and retry logic
✅ Routing low-confidence invoices to human review

Partner Peppol Access Point is responsible for:
- Actual network transmission to receiving AP
- SMP lookups and capability matching
- AS4 protocol compliance
- Certificate management

## Country Pack Roadmap

| Country | Standard | Status | Priority |
|---------|----------|--------|----------|
| Germany | XRechnung 2.3 | ✅ Implemented | P0 |
| France | Factur-X | ✅ Implemented | P0 |
| EU | Peppol BIS 3.0 | ✅ Implemented | P0 |
| Italy | FatturaPA | 🟡 Planned | P1 |
| Spain | TicketBAI / Verifactu | 🟡 Planned | P1 |
| Poland | KSeF | 🟡 Planned | P2 |

## Testing

### Fixtures
- `fixtures/bis3.xml`: Minimal valid BIS 3.0 invoice
- `fixtures/xrechnung.xml`: XRechnung 2.3 sample
- `fixtures/facturx.xml`: Factur-X Basic WL sample

### Local Testing
```bash
# Start Supabase
supabase start

# Serve functions
supabase functions serve --env-file .env.local

# Validate a document
curl -X POST http://localhost:54321/functions/v1/einvoice_validate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -d @test-payload.json

# Check metrics
curl http://localhost:54321/functions/v1/metrics?format=prometheus
```

### CI/CD
- E2E smoke tests run on every PR via `.github/workflows/e2e-smoke.yml`
- Tests validate BIS3 fixture and verify metrics endpoint

## References
- [EN 16931 Specification](https://ec.europa.eu/digital-building-blocks/wikis/display/DIGITAL/Obtaining+a+copy+of+the+European+standard+on+eInvoicing)
- [Peppol BIS Billing 3.0](https://docs.peppol.eu/poacc/billing/3.0/)
- [XRechnung Standard](https://www.xoev.de/xrechnung)
- [Factur-X Specification](https://fnfe-mpe.org/factur-x/)
