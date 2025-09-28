# Country-Specific E-Invoicing Packs

## Overview

FlowBills supports multiple country-specific e-invoicing formats and compliance requirements through dedicated adapter functions. This document outlines the implementation, legal requirements, and testing procedures for each supported country.

## Supported Countries & Formats

### 🇵🇱 Poland - KSeF (Krajowy System e-Faktur)

**Legal Deadline:** Mandatory from 1 February 2026, phased rollout through April 2026

**Implementation:**
- Format: KSeF XML (Polish Ministry of Finance standard)
- Adapter: `pl-ksef` edge function
- Authentication: Bearer token-based
- Rate limiting: Built-in with exponential backoff

**Key Features:**
- Real-time validation against KSeF 2.0 API
- Automatic retry with idempotency
- Support for both test and production environments
- Status tracking for submitted invoices

**Configuration:**
```env
KSEF_TOKEN=your_ksef_token_here
KSEF_ENVIRONMENT=test|production
```

**Test Endpoint:** https://ksef-test.mf.gov.pl/api
**Production Endpoint:** https://ksef.mf.gov.pl/api

### 🇪🇸 Spain - Veri*factu

**Legal Deadline:** 
- Corporates: 1 January 2026
- Broader scope: 1 July 2026

**Implementation:**
- Format: Veri*factu JSON + tamper-evident logbook
- Adapter: `es-verifactu` edge function
- Security: Digital signatures with AEAT certificates
- Compliance: Royal Decree 254/2025

**Key Features:**
- Tamper-evident hash chain logging
- QR code generation for verification
- AEAT API integration for submissions
- Two-phase rollout support with feature flags

**Configuration:**
```env
AEAT_CERTIFICATE=base64_encoded_certificate
AEAT_PRIVATE_KEY=base64_encoded_private_key
AEAT_ENVIRONMENT=test|production
```

### 🇫🇷 France - B2B E-Invoicing & E-Reporting

**Legal Deadline:** Mandatory from 1 September 2026

**Implementation:**
- Format: Factur-X (hybrid PDF/XML)
- Compliance: Finance Ministry guidelines
- Phased approach: Size-based issuance ramp (2026→2027)

**Key Features:**
- "Receive-ready" status validation
- Size-based issuance rules in policy engine
- Integration with French e-reporting platform
- Multi-format support (UBL, CII)

**Feature Flags:**
- `FR_EREPORTING_ENABLED`: Enable French e-reporting features
- `FR_SIZE_BASED_RULES`: Apply size-based compliance rules

### 🇩🇪 Germany - XRechnung

**Legal Requirements:**
- Must receive from 1 January 2025
- Issuance phases through 2028

**Implementation:**
- Format: XRechnung (German UBL profile)
- Strict mode validation
- Tenant readiness scoring
- Timeline compliance hints

**Key Features:**
- EN 16931 compliance validation
- Readiness score calculation
- Timeline-based guardrails
- Integration with ZUGFeRD for hybrid formats

**Feature Flags:**
- `DE_XR_STRICT`: Enable strict XRechnung validation mode

### 🌍 PINT (Pan-European Invoice Transaction)

**Purpose:** OpenPeppol interoperability standard for cross-border transactions

**Implementation:**
- Format: PINT UBL (based on EN 16931)
- Adapter: `pint` edge function
- Identifier migration: Wildcard support
- Multi-format conversion: BIS 3.0, XRechnung, Factur-X

**Key Features:**
- Cross-format conversion capabilities
- ISO/IEC 6523 identifier scheme validation
- Readiness assessment tools
- Future-proof identifier policy

## Feature Flags

Enable/disable country-specific features through environment variables:

```env
# Poland KSeF
PL_KSEF_ENABLED=true

# Spain Veri*factu
ES_VERIFACTU_ENABLED=true

# France E-Reporting
FR_EREPORTING_ENABLED=true

# Germany XRechnung Strict Mode
DE_XR_STRICT=true

# PINT Support
PINT_ENABLED=true
```

## Testing & Validation

### End-to-End Testing

Run country-specific tests:
```bash
# Poland KSeF
npm run test:e2e -- --country=pl --format=ksef

# Spain Veri*factu
npm run test:e2e -- --country=es --format=verifactu

# PINT compliance
npm run test:e2e -- --format=pint
```

### Test Fixtures

Sample files for testing:
- `fixtures/ksef_sample.xml` - Polish KSeF format
- `fixtures/verifactu_sample.json` - Spanish Veri*factu format
- `fixtures/pint_invoice.xml` - PINT-compliant invoice

### Validation Endpoints

Test adapters locally:
```bash
# Start edge functions
supabase functions serve

# Test KSeF validation
curl -X POST http://localhost:54321/functions/v1/adapters/pl-ksef \
  -H "Content-Type: application/json" \
  -d '{"operation": "validate", "invoiceXml": "..."}'

# Test Veri*factu logbook
curl -X POST http://localhost:54321/functions/v1/adapters/es-verifactu \
  -H "Content-Type: application/json" \
  -d '{"operation": "generate", "invoiceData": {...}}'

# Test PINT compliance
curl -X POST http://localhost:54321/functions/v1/adapters/pint \
  -H "Content-Type: application/json" \
  -d '{"operation": "validate", "invoiceData": {...}}'
```

## Acceptance Criteria

### Poland (KSeF)
- ✅ KSeF sandbox send/receive functionality
- ✅ Automatic retries with idempotency
- ✅ Comprehensive error mapping
- ✅ Production-ready token management

### Spain (Veri*factu)
- ✅ Tamper-evident logbook generation
- ✅ QR code creation and validation
- ✅ Hash chain integrity verification
- ✅ AEAT API integration stub

### France (B2B E-Invoicing)
- ✅ "Receive-ready" status validation
- ✅ Size-based issuance rules implementation
- ✅ Policy engine integration
- ✅ Timeline compliance tracking

### Germany (XRechnung)
- ✅ Readiness score calculation (green for receive)
- ✅ Strict validation mode
- ✅ Issuance guardrails documentation
- ✅ EN 16931 compliance verification

### PINT
- ✅ Serializer/validator passes all test fixtures
- ✅ Multi-format conversion capabilities
- ✅ Identifier policy migration readiness
- ✅ OpenPeppol compliance validation

## Compliance References

### Official Sources
- 🇵🇱 [Poland KSeF](https://www.gov.pl/web/kas/krajowy-system-e-faktur)
- 🇪🇸 [Spain BOE](https://www.boe.es/eli/es/rd/2025/04/15/254)
- 🇫🇷 [France impots.gouv.fr](https://www.impots.gouv.fr/portail/professionnel/questions/facturation-electronique-b2b-de-quoi-sagit-il)
- 🇩🇪 [European Commission](https://ec.europa.eu/digital-building-blocks/wikis/display/DIGITAL/eInvoicing+in+Germany)
- 🌍 [OpenPeppol PINT](https://docs.peppol.eu/pint/pint/1.0/)

### Monitoring & Maintenance

- **Daily:** Automated code list synchronization (EN 16931/PINT)
- **Weekly:** Sandbox connectivity tests for all adapters
- **Monthly:** Compliance rule updates from official sources
- **Quarterly:** Full end-to-end testing across all country packs

### Error Handling & Logging

All adapters implement comprehensive error handling:
- Structured error responses with country-specific codes
- Audit trail logging for compliance purposes
- Rate limiting with exponential backoff
- Automated retry mechanisms for transient failures

### Performance Metrics

Target SLAs per adapter:
- **Validation latency:** < 300ms (p95)
- **Submission latency:** < 500ms (p95, excluding external API transit)
- **Availability:** 99.9% (30-day rolling)
- **Success rate:** ≥ 99.0% (7-day rolling, excluding partner outages)

---

**Last Updated:** January 2025  
**Next Review:** March 2025 (pre-Poland KSeF mandatory date)