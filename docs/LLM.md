# FLOWBills Oil & Gas LLM Documentation

## Overview

FLOWBills uses a locked, industry-specific Large Language Model (LLM) configuration designed specifically for oil and gas operations. The system incorporates strict security controls, industry-standard RAG (Retrieval-Augmented Generation), and compliance monitoring.

## Model Configuration

### Manifest System (`llm/manifest.json`)

The LLM configuration is immutable at runtime and protected by cryptographic checksums:

```json
{
  "name": "FLOWBills-OilGas-Lock",
  "provider": "openai", 
  "model_id": "gpt-4o",
  "temperature": 0.2,
  "rag": true,
  "reference_policy": "must-cite"
}
```

### Security Guardrails

**Runtime Verification**: Every LLM request validates:
- `LLM_LOCK=1` environment flag
- Manifest checksum integrity  
- Model ID consistency
- Provider endpoint verification

**Failure Mode**: If any security check fails, the system returns HTTP 503 and logs the security violation.

## Industry Expertise

### Standards Coverage

- **WITSML** - Wellsite Information Transfer Standard (drilling, completion)
- **RESQML** - Reservoir models and geological interpretations  
- **PRODML** - Production data management and reporting
- **SPE PRMS** - Petroleum Resources Management System (reserves classification)
- **OSDU** - Open Subsurface Data Universe platform
- **ISO 15926** - Asset lifecycle management semantics
- **PPDM** - Petroleum Professional Data Management

### Query Processing

1. **Input Validation**: Length limits, content filtering
2. **RAG Retrieval**: Industry-specific context from vetted sources
3. **Citation Enforcement**: All responses must include source references
4. **Audit Logging**: Full request/response tracking for compliance

## Change Control

### CODEOWNERS Protection

```
/llm/** @cto-team
/supabase/functions/oil-gas-assistant/** @cto-team
```

### CI/CD Enforcement (`.github/workflows/llm-integrity.yml`)

- **Checksum Verification**: Fails builds on manifest tampering
- **Authorization Check**: Requires CTO approval for LLM changes
- **Secret Scanning**: Detects hardcoded API keys

### Pre-commit Hooks (`.husky/pre-commit`)

Local development protection prevents accidental commits to locked directories.

## Rollback Procedures

### Emergency Rollback

1. **Immediate**: Set `LLM_LOCK=0` to disable LLM access
2. **Revert**: Use Git to restore previous manifest version
3. **Verify**: Run `pnpm build` to confirm system stability
4. **Re-enable**: Set `LLM_LOCK=1` after verification

### Planned Updates

1. Create PR with CTO approval
2. Update manifest with new checksum
3. Deploy via standard CI/CD pipeline
4. Monitor system metrics post-deployment

## API Endpoints

### Oil & Gas Assistant (`/functions/oil-gas-assistant`)

**Request Format**:
```json
{
  "query": "Map LAS curve mnemonic GR to WITSML element",
  "user_id": "uuid",
  "context": []
}
```

**Response Format**:
```json
{
  "response": "The GR (Gamma Ray) curve maps to...",
  "citations": ["WITSML v2.1 specification..."],
  "model": "gpt-4o",
  "context_used": true
}
```

## Monitoring & Alerts

### Key Metrics

- **Response Time**: Target < 3 seconds for 95th percentile
- **Accuracy**: Citation presence in >95% of responses
- **Security**: Zero bypass attempts allowed
- **Availability**: 99.9% uptime SLA

### Alert Thresholds

- **Security Violation**: Immediate PagerDuty escalation
- **High Error Rate**: >5% in 5-minute window
- **Response Degradation**: >5 second average response time

## Compliance

### OWASP ASVS Controls

- **V1**: Authentication and session management
- **V3**: Input validation and output encoding
- **V9**: Data protection and encryption
- **V10**: Malicious code protection
- **V14**: Configuration and security headers

### NIST AI RMF Controls

- **GOVERN**: AI governance and risk management
- **MAP**: Risk identification and categorization  
- **MEASURE**: AI system measurement and monitoring
- **MANAGE**: Risk response and mitigation

## Troubleshooting

### Common Issues

**"LLM_LOCK disabled"**: Check environment configuration
**"Checksum mismatch"**: Manifest file has been modified
**"Model ID drift"**: Environment variables don't match manifest

### Debug Commands

```bash
# Verify manifest integrity
shasum -a 256 llm/manifest.json

# Check environment configuration  
env | grep LLM_

# Test security lock
curl -X POST /functions/oil-gas-assistant -d '{"query":"test"}'
```

## Support Contacts

- **Technical Issues**: engineering-team@flowai.ca
- **Security Violations**: security-team@flowai.ca  
- **LLM Changes**: cto-team@flowai.ca