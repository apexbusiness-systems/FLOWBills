# FLOWBills.ca API Documentation

## Edge Functions Reference

This document provides comprehensive documentation for all Supabase Edge Functions in the FLOWBills.ca platform.

---

## Authentication

All authenticated endpoints require a valid Supabase JWT token in the Authorization header:

```bash
Authorization: Bearer <JWT_TOKEN>
```

Public endpoints (marked with `verify_jwt = false` in config.toml) do not require authentication.

---

## Health & Monitoring Functions

### `health-check`

**Endpoint**: `https://ullqluvzkgnwwqijhvjr.supabase.co/functions/v1/health-check`  
**Method**: `GET`  
**Authentication**: Not required  
**Purpose**: System health monitoring

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2025-09-30T12:00:00Z",
  "database": "connected",
  "version": "1.0.0"
}
```

**Usage**:
```bash
curl https://ullqluvzkgnwwqijhvjr.supabase.co/functions/v1/health-check
```

---

### `metrics`

**Endpoint**: `https://ullqluvzkgnwwqijhvjr.supabase.co/functions/v1/metrics`  
**Method**: `GET`  
**Authentication**: Not required  
**Purpose**: Prometheus metrics export for monitoring

**Response**: Prometheus text format
```
# HELP invoice_autoapproved_total Total invoices auto-approved
# TYPE invoice_autoapproved_total counter
invoice_autoapproved_total 1234

# HELP invoice_dup_detected_total Total duplicate invoices detected
# TYPE invoice_dup_detected_total counter
invoice_dup_detected_total 56
```

---

## Invoice Processing Functions

### `duplicate-check`

**Endpoint**: `https://ullqluvzkgnwwqijhvjr.supabase.co/functions/v1/duplicate-check`  
**Method**: `POST`  
**Authentication**: Required  
**Purpose**: Detect duplicate invoices before approval

**Request**:
```json
{
  "invoiceId": "uuid-here",
  "vendorId": "uuid-here",
  "amount": 1234.56,
  "invoiceDate": "2025-09-30",
  "poNumber": "PO-12345"
}
```

**Response**:
```json
{
  "isDuplicate": false,
  "confidence": 0.95,
  "matchedInvoices": [],
  "reasons": []
}
```

**Duplicate Detection Logic**:
- Hash-based exact match (vendor + date + amount + PO)
- Fuzzy matching for near-duplicates
- Flags invoices within 24 hours with ±2% amount variance

---

### `hil-router`

**Endpoint**: `https://ullqluvzkgnwwqijhvjr.supabase.co/functions/v1/hil-router`  
**Method**: `POST`  
**Authentication**: Required  
**Purpose**: Route low-confidence invoices to human review queue

**Request**:
```json
{
  "invoiceId": "uuid-here",
  "confidenceScore": 65,
  "extractedData": {
    "amount": 1234.56,
    "vendor": "Acme Corp",
    "date": "2025-09-30"
  },
  "flaggedFields": ["amount", "po_number"]
}
```

**Response**:
```json
{
  "action": "review",
  "reviewQueueId": "uuid-here",
  "priority": 2,
  "reason": "Low confidence on critical fields"
}
```

**Routing Logic**:
- Confidence ≥80: Auto-approve
- Confidence 60-79: Route to review queue
- Confidence <60: Reject with error

---

### `fraud-detect`

**Endpoint**: `https://ullqluvzkgnwwqijhvjr.supabase.co/functions/v1/fraud-detect`  
**Method**: `POST`  
**Authentication**: Required  
**Purpose**: Detect fraudulent invoice patterns

**Request**:
```json
{
  "invoiceId": "uuid-here",
  "vendorId": "uuid-here",
  "amount": 9999.99,
  "patterns": {
    "unusualAmount": true,
    "newVendor": true,
    "weekendSubmission": false
  }
}
```

**Response**:
```json
{
  "isFraudulent": false,
  "riskScore": 45,
  "flags": [
    {
      "type": "unusual_amount",
      "severity": "medium",
      "description": "Amount significantly higher than vendor average"
    }
  ],
  "action": "review"
}
```

**Fraud Patterns Checked**:
- Unusual amounts (>3σ from vendor average)
- New vendors with high-value invoices
- Duplicate bank accounts across vendors
- Suspicious timing (weekends, holidays)
- Bank account changes

---

### `ocr-extract`

**Endpoint**: `https://ullqluvzkgnwwqijhvjr.supabase.co/functions/v1/ocr-extract`  
**Method**: `POST`  
**Authentication**: Required  
**Purpose**: Extract structured data from invoice images/PDFs

**Request**:
```json
{
  "fileUrl": "https://...",
  "fileType": "application/pdf"
}
```

**Response**:
```json
{
  "success": true,
  "extractedData": {
    "invoiceNumber": "INV-12345",
    "vendor": "Acme Corp",
    "amount": 1234.56,
    "date": "2025-09-30",
    "dueDate": "2025-10-30",
    "poNumber": "PO-67890",
    "lineItems": [
      {
        "description": "Widget A",
        "quantity": 10,
        "unitPrice": 100.00,
        "total": 1000.00
      }
    ]
  },
  "confidence": {
    "overall": 92,
    "fields": {
      "invoiceNumber": 98,
      "amount": 95,
      "date": 90
    }
  },
  "rawText": "..."
}
```

---

## E-Invoicing Functions

### `einvoice_validate`

**Endpoint**: `https://ullqluvzkgnwwqijhvjr.supabase.co/functions/v1/einvoice_validate`  
**Method**: `POST`  
**Authentication**: Required  
**Purpose**: Validate e-invoices against EN 16931 and country-specific rules

**Request**:
```json
{
  "documentId": "uuid-here",
  "format": "peppol_bis3",
  "countryCode": "CA",
  "xmlContent": "<Invoice>...</Invoice>"
}
```

**Response**:
```json
{
  "valid": true,
  "errors": [],
  "warnings": [
    {
      "code": "BT-19",
      "message": "BuyerReference is recommended but not mandatory",
      "severity": "warning"
    }
  ],
  "validatedRules": ["EN16931", "PEPPOL-BIS3", "CA-SPECIFIC"]
}
```

---

### `einvoice_send`

**Endpoint**: `https://ullqluvzkgnwwqijhvjr.supabase.co/functions/v1/einvoice_send`  
**Method**: `POST`  
**Authentication**: Required  
**Purpose**: Send e-invoices via Peppol network

**Request**:
```json
{
  "documentId": "uuid-here",
  "receiverParticipantId": "9908:987654321",
  "documentTypeId": "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
  "processId": "urn:fdc:peppol.eu:2017:poacc:billing:01:1.0"
}
```

**Response**:
```json
{
  "success": true,
  "messageId": "msg_abc123",
  "status": "queued",
  "estimatedDelivery": "2025-09-30T12:05:00Z"
}
```

---

### `einvoice_receive`

**Endpoint**: `https://ullqluvzkgnwwqijhvjr.supabase.co/functions/v1/einvoice_receive`  
**Method**: `POST`  
**Authentication**: Required (webhook from Access Point)  
**Purpose**: Receive incoming e-invoices from Peppol

**Request** (from Access Point):
```json
{
  "messageId": "msg_xyz789",
  "senderParticipantId": "9908:123456789",
  "documentTypeId": "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
  "xmlContent": "<Invoice>...</Invoice>"
}
```

**Response**:
```json
{
  "received": true,
  "documentId": "uuid-here",
  "status": "processing"
}
```

---

## Policy & AI Functions

### `policy-engine`

**Endpoint**: `https://ullqluvzkgnwwqijhvjr.supabase.co/functions/v1/policy-engine`  
**Method**: `POST`  
**Authentication**: Required  
**Purpose**: Execute approval policies based on business rules

**Request**:
```json
{
  "invoiceId": "uuid-here",
  "amount": 5000.00,
  "vendor": "Acme Corp",
  "category": "office_supplies"
}
```

**Response**:
```json
{
  "approved": false,
  "reason": "Amount exceeds single-approver limit",
  "requiredApprovals": 2,
  "nextApprovers": ["manager@company.com", "director@company.com"],
  "policyId": "uuid-here",
  "policyName": "High-Value Approval Policy"
}
```

**Policy Logic**:
- Amount-based thresholds
- Vendor risk scoring
- Multi-level approval routing
- Exception handling

---

### `ai-assistant`

**Endpoint**: `https://ullqluvzkgnwwqijhvjr.supabase.co/functions/v1/ai-assistant`  
**Method**: `POST`  
**Authentication**: Required  
**Purpose**: AI-powered assistance for invoice processing

**Request**:
```json
{
  "query": "Analyze this invoice for potential issues",
  "invoiceId": "uuid-here",
  "context": {
    "vendor": "Acme Corp",
    "amount": 1234.56
  }
}
```

**Response**:
```json
{
  "answer": "The invoice appears normal. Amount is within expected range for this vendor. No red flags detected.",
  "confidence": 0.89,
  "suggestions": [
    "Verify PO number matches purchase order",
    "Confirm delivery receipt was signed"
  ]
}
```

---

### `oil-gas-assistant`

**Endpoint**: `https://ullqluvzkgnwwqijhvjr.supabase.co/functions/v1/oil-gas-assistant`  
**Method**: `POST`  
**Authentication**: Required  
**Purpose**: Industry-specific AI assistance for oil & gas sector

**Request**:
```json
{
  "query": "What are typical AFE charges for drilling operations?",
  "context": {
    "project": "Well Site Alpha",
    "afe": "AFE-2025-001"
  }
}
```

**Response**:
```json
{
  "answer": "Typical AFE charges for drilling include rig rental, fuel, drilling mud, casing, cementing services, and directional drilling. Expected range: $50K-$200K/day.",
  "references": ["AFE Best Practices Guide", "Industry Standards 2024"],
  "confidence": 0.92
}
```

---

## Country-Specific Adapters

### Spain: VerificaTu (`es-verifactu`)

**Endpoint**: `https://ullqluvzkgnwwqijhvjr.supabase.co/functions/v1/adapters/es-verifactu`  
**Method**: `POST`  
**Authentication**: Public (verify_jwt = false)  
**Purpose**: Validate invoices for Spanish tax authority (AEAT)

**Request**:
```json
{
  "invoiceData": {
    "serie": "A",
    "numero": "12345",
    "fecha": "2025-09-30",
    "emisor": { "nif": "B12345678", "nombre": "Acme SL" },
    "receptor": { "nif": "B87654321", "nombre": "Client SA" },
    "importe": 1234.56
  }
}
```

**Response**:
```json
{
  "valid": true,
  "qrCode": "data:image/png;base64,...",
  "hash": "abc123def456",
  "errors": []
}
```

---

### Poland: KSeF (`pl-ksef`)

**Endpoint**: `https://ullqluvzkgnwwqijhvjr.supabase.co/functions/v1/adapters/pl-ksef`  
**Method**: `POST`  
**Authentication**: Public (verify_jwt = false)  
**Purpose**: Submit invoices to Polish National e-Invoice System

**Request**:
```json
{
  "invoiceXml": "<Faktura>...</Faktura>",
  "issuerNip": "1234567890",
  "recipientNip": "0987654321"
}
```

**Response**:
```json
{
  "success": true,
  "ksefId": "KSeF-2025-09-30-12345",
  "referenceNumber": "REF123456789",
  "timestamp": "2025-09-30T12:00:00Z"
}
```

---

### PINT (`pint`)

**Endpoint**: `https://ullqluvzkgnwwqijhvjr.supabase.co/functions/v1/adapters/pint`  
**Method**: `POST`  
**Authentication**: Public (verify_jwt = false)  
**Purpose**: Validate invoices against PINT (Peppol International) model

**Request**:
```json
{
  "xmlInvoice": "<Invoice>...</Invoice>",
  "syntax": "UBL",
  "countryCode": "SG"
}
```

**Response**:
```json
{
  "valid": true,
  "profileCompliant": "urn:fdc:peppol.eu:2017:poacc:billing:01:1.0",
  "errors": [],
  "warnings": []
}
```

---

## Document Management API

The Document Management system provides endpoints for uploading, previewing, and managing invoice attachments.

### Storage Bucket Configuration

**Bucket**: `invoice-documents`  
**Max File Size**: 20MB  
**Allowed MIME Types**: `application/pdf`, `image/png`, `image/jpeg`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `text/csv`, `application/xml`

---

### Upload Document

**Method**: Supabase Storage SDK  
**Authentication**: Required (User must be authenticated)  
**Purpose**: Upload invoice documents to secure storage

**Usage (TypeScript)**:
```typescript
import { supabase } from "@/integrations/supabase/client";

const uploadDocument = async (file: File, invoiceId: string) => {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  const filePath = `${userId}/${invoiceId}/${file.name}`;
  
  const { data, error } = await supabase.storage
    .from('invoice-documents')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;
  
  // Record in database
  await supabase.from('invoice_documents').insert({
    invoice_id: invoiceId,
    file_name: file.name,
    file_path: filePath,
    file_size: file.size,
    file_type: file.type,
    uploaded_by: userId
  });

  return data;
};
```

**Response**:
```json
{
  "path": "user-uuid/invoice-uuid/document.pdf",
  "id": "file-uuid",
  "fullPath": "invoice-documents/user-uuid/invoice-uuid/document.pdf"
}
```

---

### Get Document Preview URL

**Method**: Supabase Storage SDK  
**Authentication**: Required  
**Purpose**: Generate signed URL for document preview

**Usage (TypeScript)**:
```typescript
const getPreviewUrl = async (filePath: string) => {
  const { data, error } = await supabase.storage
    .from('invoice-documents')
    .createSignedUrl(filePath, 3600); // 1 hour expiry

  if (error) throw error;
  return data.signedUrl;
};
```

**Response**:
```json
{
  "signedUrl": "https://ullqluvzkgnwwqijhvjr.supabase.co/storage/v1/object/sign/invoice-documents/..."
}
```

---

### Download Document

**Method**: Supabase Storage SDK  
**Authentication**: Required  
**Purpose**: Download document as blob

**Usage (TypeScript)**:
```typescript
const downloadDocument = async (filePath: string) => {
  const { data, error } = await supabase.storage
    .from('invoice-documents')
    .download(filePath);

  if (error) throw error;
  
  // Create download link
  const url = URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.download = filePath.split('/').pop() || 'document';
  link.click();
  URL.revokeObjectURL(url);
};
```

---

### Delete Document

**Method**: Supabase Storage SDK  
**Authentication**: Required (Owner only via RLS)  
**Purpose**: Remove document from storage

**Usage (TypeScript)**:
```typescript
const deleteDocument = async (filePath: string, documentId: string) => {
  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('invoice-documents')
    .remove([filePath]);

  if (storageError) throw storageError;

  // Remove database record
  const { error: dbError } = await supabase
    .from('invoice_documents')
    .delete()
    .eq('id', documentId);

  if (dbError) throw dbError;
};
```

---

### List Invoice Documents

**Method**: Supabase Database Query  
**Authentication**: Required (RLS enforced)  
**Purpose**: Retrieve all documents for an invoice

**Usage (TypeScript)**:
```typescript
const listDocuments = async (invoiceId: string) => {
  const { data, error } = await supabase
    .from('invoice_documents')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};
```

**Response**:
```json
[
  {
    "id": "uuid",
    "invoice_id": "invoice-uuid",
    "file_name": "invoice-scan.pdf",
    "file_path": "user-uuid/invoice-uuid/invoice-scan.pdf",
    "file_size": 1048576,
    "file_type": "application/pdf",
    "uploaded_by": "user-uuid",
    "created_at": "2025-12-13T10:00:00Z",
    "updated_at": "2025-12-13T10:00:00Z"
  }
]
```

---

### Reorder Documents (Client-Side)

**Method**: React Drag-and-Drop  
**Library**: `@hello-pangea/dnd`  
**Purpose**: Reorder documents in UI (client-side state management)

**Usage (React)**:
```tsx
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const DocumentList = ({ documents, onReorder }) => {
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const reordered = Array.from(documents);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    
    onReorder(reordered);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="documents">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps}>
            {documents.map((doc, index) => (
              <Draggable key={doc.id} draggableId={doc.id} index={index}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    {doc.file_name}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};
```

---

### RLS Policies for Document Storage

Documents are secured with Row-Level Security:

| Operation | Policy | Condition |
|-----------|--------|-----------|
| **SELECT** | Users can view their invoice documents | `invoice.user_id = auth.uid()` |
| **INSERT** | Operators can upload documents | `user_role IN ('admin', 'operator') AND invoice.user_id = auth.uid()` |
| **UPDATE** | Operators can update documents | `user_role IN ('admin', 'operator') AND invoice.user_id = auth.uid()` |
| **DELETE** | Operators can delete documents | `user_role IN ('admin', 'operator') AND invoice.user_id = auth.uid()` |

---

## Error Handling

All functions follow a consistent error format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "specific field with error",
    "value": "problematic value"
  },
  "timestamp": "2025-09-30T12:00:00Z"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_REQUIRED` | 401 | Missing or invalid JWT token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `DUPLICATE_DETECTED` | 409 | Duplicate invoice detected |
| `RATE_LIMITED` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Internal server error |

---

## Rate Limiting

All endpoints are subject to rate limiting:
- **Authenticated**: 100 requests/minute per user
- **Public**: 20 requests/minute per IP

Rate limit headers included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1696089600
```

---

## Monitoring & Logs

### Viewing Edge Function Logs

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/ullqluvzkgnwwqijhvjr/functions
2. Click on function name
3. Navigate to "Logs" tab

### Key Metrics to Monitor

- **Invocation rate**: Requests/second
- **Error rate**: Failed requests/total
- **Latency**: P50, P95, P99 response times
- **Cold start time**: Initial function startup time

---

## Testing

### cURL Examples

**Health Check**:
```bash
curl https://ullqluvzkgnwwqijhvjr.supabase.co/functions/v1/health-check
```

**Duplicate Check** (requires auth):
```bash
curl -X POST \
  https://ullqluvzkgnwwqijhvjr.supabase.co/functions/v1/duplicate-check \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceId": "uuid-here",
    "vendorId": "uuid-here",
    "amount": 1234.56,
    "invoiceDate": "2025-09-30"
  }'
```

---

## SDK Usage

### JavaScript/TypeScript

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ullqluvzkgnwwqijhvjr.supabase.co',
  'YOUR_ANON_KEY'
);

// Call duplicate-check function
const { data, error } = await supabase.functions.invoke('duplicate-check', {
  body: {
    invoiceId: 'uuid-here',
    vendorId: 'uuid-here',
    amount: 1234.56,
    invoiceDate: '2025-09-30'
  }
});

if (error) {
  console.error('Function error:', error);
} else {
  console.log('Result:', data);
}
```

---

## ERP Integration

FLOWBills provides webhook-based integration with major ERP systems for seamless invoice data synchronization.

---

### Webhook Configuration

#### Outgoing Webhooks

FLOWBills can send invoice events to your ERP system via webhooks.

**Supported Events**:
| Event | Description |
|-------|-------------|
| `invoice.created` | New invoice uploaded and extracted |
| `invoice.approved` | Invoice approved (manual or auto) |
| `invoice.rejected` | Invoice rejected |
| `invoice.paid` | Invoice marked as paid |
| `invoice.exception` | Invoice flagged for review |
| `duplicate.detected` | Duplicate invoice detected |

**Webhook Payload Structure**:
```json
{
  "event": "invoice.approved",
  "timestamp": "2025-12-13T14:30:00Z",
  "data": {
    "invoice_id": "uuid-here",
    "invoice_number": "INV-2025-001",
    "vendor_name": "Acme Oilfield Services",
    "amount": 15000.00,
    "currency": "CAD",
    "invoice_date": "2025-12-10",
    "due_date": "2025-01-10",
    "afe_number": "AFE-2025-0042",
    "uwi": "100/06-12-045-05W5/0",
    "status": "approved",
    "approved_by": "user-uuid",
    "approved_at": "2025-12-13T14:30:00Z",
    "line_items": [
      {
        "description": "Drilling Services",
        "quantity": 24,
        "unit_price": 500.00,
        "amount": 12000.00,
        "service_code": "DRILL-001"
      }
    ]
  },
  "metadata": {
    "source": "flowbills",
    "version": "1.1.0",
    "environment": "production"
  }
}
```

**Webhook Security**:
- All webhooks are signed using HMAC-SHA256
- Signature header: `X-FlowBills-Signature`
- Verify signature before processing:

```typescript
import { createHmac } from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return signature === `sha256=${expectedSignature}`;
}
```

---

### SAP Integration

#### Configuration

**Endpoint**: Configure in FlowBills Settings → Integrations → SAP

| Setting | Description | Example |
|---------|-------------|---------|
| SAP Host | SAP Gateway URL | `https://sap.company.com/sap/opu/odata/` |
| Client ID | SAP client number | `100` |
| Username | SAP service account | `FLOWBILLS_SVC` |
| Password | Service account password | Stored encrypted |
| Company Code | SAP company code | `1000` |

#### Invoice Sync Mapping

| FlowBills Field | SAP Field | Description |
|-----------------|-----------|-------------|
| `invoice_number` | `BELNR` | Document number |
| `vendor_name` | `LIFNR` | Vendor number (lookup) |
| `amount` | `WRBTR` | Amount in document currency |
| `invoice_date` | `BLDAT` | Document date |
| `due_date` | `ZFBDT` | Baseline date for payment |
| `afe_number` | `KOSTL` | Cost center |
| `uwi` | `AUFNR` | Order number |

#### Webhook to SAP IDoc

```json
{
  "webhook_url": "https://sap.company.com/sap/bc/srt/idoc",
  "events": ["invoice.approved", "invoice.paid"],
  "transform": {
    "idoc_type": "INVOIC02",
    "mapping": {
      "BELNR": "{{invoice_number}}",
      "LIFNR": "{{vendor_lookup(vendor_name)}}",
      "WRBTR": "{{amount}}",
      "WAERS": "{{currency}}"
    }
  }
}
```

---

### Oracle Financials Integration

#### Configuration

**Endpoint**: Configure in FlowBills Settings → Integrations → Oracle

| Setting | Description | Example |
|---------|-------------|---------|
| Oracle Host | Oracle Cloud URL | `https://fa-xxxx.oraclecloud.com` |
| Username | Integration user | `flowbills_integration` |
| Password | Integration password | Stored encrypted |
| Business Unit | Oracle BU ID | `300000001234567` |

#### Invoice Sync Mapping

| FlowBills Field | Oracle Field | Description |
|-----------------|--------------|-------------|
| `invoice_number` | `InvoiceNumber` | Supplier invoice number |
| `vendor_name` | `VendorName` | Supplier name |
| `amount` | `InvoiceAmount` | Total invoice amount |
| `invoice_date` | `InvoiceDate` | Invoice date |
| `due_date` | `PaymentDueDate` | Payment due date |
| `afe_number` | `ProjectNumber` | Project allocation |

#### REST API Payload

```json
{
  "webhook_url": "https://fa-xxxx.oraclecloud.com/fscmRestApi/resources/invoices",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer {{oauth_token}}"
  },
  "body": {
    "InvoiceNumber": "{{invoice_number}}",
    "VendorName": "{{vendor_name}}",
    "InvoiceAmount": "{{amount}}",
    "InvoiceCurrencyCode": "{{currency}}",
    "InvoiceDate": "{{invoice_date}}",
    "BusinessUnit": "{{business_unit}}",
    "PaymentTerms": "Net 30"
  }
}
```

---

### QuickBooks Online Integration

#### Configuration

**Endpoint**: Configure in FlowBills Settings → Integrations → QuickBooks

| Setting | Description | Example |
|---------|-------------|---------|
| Realm ID | QuickBooks company ID | `1234567890` |
| OAuth Client ID | App client ID | `ABcd1234...` |
| OAuth Client Secret | App secret | Stored encrypted |
| Refresh Token | OAuth refresh token | Auto-managed |

#### Invoice Sync Mapping

| FlowBills Field | QuickBooks Field | Description |
|-----------------|------------------|-------------|
| `invoice_number` | `DocNumber` | Bill reference number |
| `vendor_name` | `VendorRef.name` | Vendor display name |
| `amount` | `TotalAmt` | Total amount |
| `invoice_date` | `TxnDate` | Transaction date |
| `due_date` | `DueDate` | Payment due date |
| `line_items` | `Line[]` | Bill line items |

#### REST API Payload

```json
{
  "webhook_url": "https://quickbooks.api.intuit.com/v3/company/{{realm_id}}/bill",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer {{access_token}}"
  },
  "body": {
    "VendorRef": {
      "name": "{{vendor_name}}"
    },
    "DocNumber": "{{invoice_number}}",
    "TxnDate": "{{invoice_date}}",
    "DueDate": "{{due_date}}",
    "TotalAmt": "{{amount}}",
    "Line": [
      {
        "Amount": "{{line_items[0].amount}}",
        "DetailType": "AccountBasedExpenseLineDetail",
        "AccountBasedExpenseLineDetail": {
          "AccountRef": {
            "name": "{{expense_account}}"
          }
        },
        "Description": "{{line_items[0].description}}"
      }
    ]
  }
}
```

---

### Microsoft Dynamics 365 Integration

#### Configuration

| Setting | Description | Example |
|---------|-------------|---------|
| Dynamics URL | D365 environment URL | `https://org.crm.dynamics.com` |
| Tenant ID | Azure AD tenant | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| Client ID | App registration ID | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| Client Secret | App secret | Stored encrypted |

#### Invoice Sync Mapping

| FlowBills Field | D365 Field | Description |
|-----------------|------------|-------------|
| `invoice_number` | `msdyn_invoicenumber` | Vendor invoice number |
| `vendor_name` | `msdyn_vendor` | Vendor lookup |
| `amount` | `msdyn_totalamount` | Invoice total |
| `invoice_date` | `msdyn_invoicedate` | Invoice date |

---

### Webhook Retry Policy

FLOWBills implements automatic retry for failed webhook deliveries:

| Attempt | Delay | Max Attempts |
|---------|-------|--------------|
| 1 | Immediate | - |
| 2 | 1 minute | - |
| 3 | 5 minutes | - |
| 4 | 30 minutes | - |
| 5 | 2 hours | Final |

**Failure Handling**:
- Failed webhooks are logged to `integration_status` table
- Admin notifications sent after 3 consecutive failures
- Manual retry available via dashboard

---

### Testing Webhooks

Use the webhook test endpoint to validate your integration:

```bash
curl -X POST https://ullqluvzkgnwwqijhvjr.supabase.co/functions/v1/webhook-test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "webhook_url": "https://your-erp.com/webhook",
    "event": "invoice.approved",
    "test_data": {
      "invoice_number": "TEST-001",
      "amount": 100.00
    }
  }'
```

---

## Security Best Practices

1. **Never expose service role keys** in client code
2. **Use RLS policies** to restrict data access at the database level
3. **Validate all inputs** both client and server-side
4. **Log security events** to `security_events` table
5. **Rotate secrets regularly** via Supabase dashboard
6. **Monitor for anomalies** in audit logs
7. **Verify webhook signatures** before processing ERP callbacks
8. **Use OAuth 2.0** for ERP authentication where supported
9. **Encrypt credentials at rest** using Supabase secrets management

---

## Support

For API issues or questions:
- **Email**: api-support@flowbills.ca
- **Documentation**: https://flowbills.ca/docs
- **Status Page**: https://status.flowbills.ca
- **ERP Integration Support**: integrations@flowbills.ca

---

**Last Updated**: December 13, 2025  
**API Version**: 1.1.0
