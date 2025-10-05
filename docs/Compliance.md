# FlowAi Compliance Framework

## Overview

FlowAi implements a comprehensive compliance framework designed to meet the regulatory requirements of the oil & gas industry while ensuring data privacy, security, and auditability.

## Regulatory Standards Compliance

### ASVS (Application Security Verification Standard)

Our implementation addresses key ASVS controls across multiple categories:

#### V1: Architecture, Design and Threat Modeling
- **V1.1.1**: Secure software development lifecycle implemented
- **V1.2.1**: Component identification and security assessment
- **V1.4.1**: Access control enforcement points identified

#### V2: Authentication
- **V2.1.1**: User authentication mechanisms via Supabase Auth
- **V2.1.3**: Secure password policy enforcement
- **V2.2.1**: Multi-factor authentication support available
- **V2.7.1**: Service authentication between components

#### V3: Session Management
- **V3.1.1**: Session token generation using cryptographically secure methods
- **V3.2.1**: Session timeout and invalidation controls
- **V3.3.1**: Session-based authentication state management

#### V4: Access Control
- **V4.1.1**: Principle of least privilege enforcement
- **V4.1.3**: Role-Based Access Control (RBAC) implementation
- **V4.2.1**: Attribute-based access control for sensitive operations
- **V4.3.1**: Directory traversal protection

#### V7: Error Handling and Logging
- **V7.1.1**: Error messages don't reveal sensitive information
- **V7.3.1**: Comprehensive audit logging for security events
- **V7.3.2**: Log integrity protection mechanisms
- **V7.4.1**: Time synchronization for audit logs

#### V8: Data Protection
- **V8.1.1**: Sensitive data classification and handling
- **V8.2.1**: Client-side sensitive data protection
- **V8.3.1**: Sensitive data encryption at rest
- **V8.3.2**: Personal data stored with appropriate encryption

#### V14: Configuration
- **V14.1.1**: Secure-by-default configuration
- **V14.2.1**: Security configuration deployment verification
- **V14.4.1**: HTTP security headers implementation

### PIPEDA Compliance (Personal Information Protection and Electronic Documents Act)

#### Principle 1: Accountability
- **Data Controller**: FlowAi Energy Solutions designated as data controller
- **Privacy Officer**: Appointed privacy officer responsible for compliance
- **Documentation**: Comprehensive privacy policies and procedures maintained

#### Principle 2: Identifying Purposes
- **Purpose Specification**: Clear identification of data collection purposes
  - Invoice processing and accounts payable management
  - Vendor relationship management
  - Regulatory compliance and audit requirements
  - Fraud detection and prevention
- **Collection Limitation**: Data collection limited to identified purposes

#### Principle 3: Consent
- **Explicit Consent**: User consent obtained before data collection
- **Consent Logging**: All consent events logged in `consent_logs` table
- **Withdrawal Rights**: Users can withdraw consent at any time
- **Implementation**: 
  ```sql
  INSERT INTO consent_logs (user_id, consent_type, consent_given, consent_text)
  VALUES (user_id, 'data_processing', true, 'I consent to processing of my personal data for invoice management');
  ```

#### Principle 4: Limiting Collection
- **Data Minimization**: Only necessary personal data collected
- **Purpose Limitation**: Collection limited to specified purposes
- **Regular Review**: Periodic review of data collection practices

#### Principle 5: Limiting Use, Disclosure, and Retention
- **Use Limitation**: Personal data used only for specified purposes
- **Retention Policies**: Data retention periods defined and enforced
- **Secure Disposal**: Secure deletion of data beyond retention period
- **Access Controls**: RLS policies prevent unauthorized data access

#### Principle 6: Accuracy
- **Data Quality**: Procedures to maintain data accuracy
- **Update Mechanisms**: Users can update their personal information
- **Verification**: Regular verification of data accuracy

#### Principle 7: Safeguards
- **Technical Safeguards**: 
  - Data encryption at rest and in transit
  - Row Level Security (RLS) policies
  - Secure authentication and authorization
  - Regular security assessments
- **Administrative Safeguards**:
  - Employee training on privacy requirements
  - Access controls and monitoring
  - Incident response procedures

#### Principle 8: Openness
- **Privacy Policy**: Clear, accessible privacy policy available at `/privacy`
- **Transparency**: Information about data handling practices
- **Contact Information**: Privacy officer contact details provided

#### Principle 9: Individual Access
- **Access Rights**: Users can access their personal information
- **Request Processing**: Procedures for handling access requests
- **Implementation**: User dashboard provides access to personal data

#### Principle 10: Challenging Compliance
- **Complaint Mechanism**: Process for handling privacy complaints
- **Investigation**: Procedures for investigating compliance issues
- **Remediation**: Corrective actions for non-compliance

### CASL Compliance (Canada's Anti-Spam Legislation)

#### Consent Requirements
- **Express Consent**: Obtained before sending commercial electronic messages
- **Consent Elements**:
  - Clear identification of person/organization seeking consent
  - Contact information of sender
  - Clear description of purposes for consent
  - Clear and prominent unsubscribe mechanism

#### Implementation
```javascript
// Example consent logging for CASL
await supabase.from('consent_logs').insert({
  user_id: userId,
  email: userEmail,
  consent_type: 'email_marketing',
  consent_given: true,
  consent_text: 'I consent to receive commercial electronic messages from FlowAi regarding invoice processing updates and product information.',
  ip_address: clientIP,
  user_agent: userAgent
});
```

#### Identification Requirements
- **Sender Identification**: All emails clearly identify FlowAi as sender
- **Contact Information**: Valid contact information included in all messages
- **Physical Address**: Business address included in commercial messages

#### Unsubscribe Mechanism
- **Easy Unsubscribe**: One-click unsubscribe available
- **Processing Timeline**: Unsubscribe requests processed within 10 business days
- **Implementation**: Automated unsubscribe handling with consent log updates

### NIST AI Risk Management Framework 1.0

#### AI System Governance
- **AI Risk Assessment**: Regular assessment of AI-related risks in OCR and fraud detection
- **Responsible AI Practices**: Ethical AI development and deployment
- **Human Oversight**: Human-in-the-loop (HIL) processes for AI decisions

#### Risk Management Process
1. **Identify**: AI risks in invoice processing and fraud detection
2. **Assess**: Impact and likelihood of identified risks
3. **Mitigate**: Controls to reduce AI-related risks
4. **Monitor**: Ongoing monitoring of AI system performance

#### Implementation Areas
- **OCR Confidence Scoring**: Transparency in OCR accuracy
- **Fraud Detection**: Human review for high-risk fraud flags
- **Bias Monitoring**: Regular assessment of AI system bias
- **Explainability**: Clear reasoning for AI-driven decisions

### PCI DSS v4.0.1 (Future Consideration)

Currently, FlowAi does not process, store, or transmit cardholder data. If future requirements include payment processing:

#### Scope Considerations
- **Data Flow Analysis**: Map all cardholder data flows
- **Network Segmentation**: Isolate cardholder data environment
- **Access Controls**: Restrict access to cardholder data

#### Compliance Approach
- **SAQ Selection**: Choose appropriate Self-Assessment Questionnaire
- **Control Implementation**: Implement required PCI DSS controls
- **Validation**: Regular compliance validation and testing

## Audit and Monitoring

### Audit Logging
All system activities are comprehensively logged in the `audit_logs` table:

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Fraud Detection and Monitoring
- **Real-time Monitoring**: Continuous monitoring for fraud indicators
- **Risk Scoring**: Automated risk assessment for vendors and transactions
- **Alert Generation**: Immediate alerts for high-risk activities
- **Investigation Support**: Tools for fraud investigation and resolution

### Data Integrity
- **Hash Verification**: Critical data integrity verification using hashes
- **Audit Trail**: Complete audit trail for all data modifications
- **Backup and Recovery**: Regular backup and tested recovery procedures

## Security Controls

### Encryption
- **Data at Rest**: All sensitive data encrypted using AES-256
- **Data in Transit**: TLS 1.3 for all communications
- **Key Management**: Secure key management using Supabase Vault

### Access Controls
- **Row Level Security**: Database-level access controls
- **Role-Based Access**: Granular role-based permissions
- **Multi-Factor Authentication**: Available for enhanced security

### Network Security
- **HTTPS Only**: All communications encrypted
- **CORS Configuration**: Proper cross-origin resource sharing controls
- **Rate Limiting**: Protection against abuse and DoS attacks

## Compliance Monitoring and Reporting

### Regular Assessments
- **Monthly Reviews**: Monthly compliance status reviews
- **Quarterly Audits**: Comprehensive quarterly compliance audits
- **Annual Assessments**: Annual third-party security assessments

### Key Performance Indicators (KPIs)
- **Policy Compliance Rate**: >95% adherence to defined policies
- **Audit Finding Resolution**: <30 days average resolution time
- **Security Incident Response**: <24 hours initial response time
- **Data Breach Prevention**: Zero data breaches target

### Reporting
- **Compliance Dashboard**: Real-time compliance status monitoring
- **Executive Reports**: Monthly executive compliance summaries
- **Regulatory Reports**: Timely submission of required regulatory reports

## Documentation and Training

### Documentation Maintenance
- **Policy Updates**: Regular review and update of policies
- **Procedure Documentation**: Detailed operational procedures
- **Compliance Evidence**: Comprehensive compliance evidence collection

### Training Programs
- **Employee Training**: Regular privacy and security training
- **Role-Specific Training**: Specialized training based on job functions
- **Compliance Awareness**: Ongoing compliance awareness programs

## Contact Information

### Privacy Officer
- **Name**: [To be designated]
- **Email**: privacy@flowai.ca
- **Phone**: [To be provided]
- **Address**: [Company address]

### Security Team
- **Email**: security@flowai.ca
- **Emergency**: [24/7 emergency contact]

## Updates and Revisions

This compliance framework is reviewed quarterly and updated as needed to reflect:
- Changes in regulatory requirements
- Updates to industry best practices
- System modifications and enhancements
- Lessons learned from compliance activities

## E-Invoicing Standards Compliance

### EN 16931 (European Semantic Model)
FlowBills.ca validates invoices against the **EN 16931** core semantic data model, which defines the minimum information requirements for cross-border e-invoices in the EU.

**Validation Coverage**:
- ✅ Mandatory business terms (BT-1 to BT-205)
- ✅ Seller/Buyer party identification
- ✅ Invoice line items with prices and VAT
- ✅ Payment instructions
- ⚠️ Optional: Allowances/Charges (user input required)

**Responsibility Boundary**:
- FlowBills validates **semantic correctness** (required fields, data types, code lists)
- Users are responsible for **business accuracy** (correct amounts, valid VAT rates, legitimate parties)

### Peppol BIS Billing 3.0
Peppol Business Interoperability Specification (BIS) Billing 3.0 is a **CIUS** (Core Invoice Usage Specification) built on EN 16931.

**Additional Validation**:
- ✅ CustomizationID and ProfileID identifiers
- ✅ Peppol Endpoint IDs (scheme + identifier)
- ✅ SBDH envelope structure for AS4 transmission
- ✅ Restricted code lists (e.g., ISO 4217 currencies, UNCL5305 VAT categories)

**Peppol Network Compliance**:
- FlowBills generates correct SBDH envelopes per [Peppol Transport Infrastructure](https://docs.peppol.eu/edelivery/envelope/)
- Partner **Peppol Access Point** handles:
  - AS4 protocol conformance
  - SMP lookups for receiver capabilities
  - Certificate-based message signing
  - Network-level transmission

### XRechnung (Germany)
**Standard Version**: XRechnung 2.3 (based on EN 16931)

**Validation**:
- ✅ CrossIndustryInvoice format (UN/CEFACT CII)
- ✅ CustomizationID: `urn:cen.eu:en16931:2017#compliant#urn:xoev-de:kosit:standard:xrechnung_2.3`
- ✅ BuyerReference (Leitweg-ID) for B2G invoices
- ⚠️ German-specific VAT rules (19% standard, 7% reduced) — user responsibility

**Regulatory Note**:
- Mandatory for B2G in Germany since November 27, 2020
- FlowBills ensures **technical compliance**; users ensure **tax compliance** (correct VAT ID, reverse charge logic, etc.)

### Factur-X (France/Germany)
**Standard**: Factur-X 1.0 (hybrid PDF/A-3 + XML)

**Validation**:
- ✅ CrossIndustryDocument format
- ✅ Profile: `urn:factur-x.eu:1p0:basicwl` (Basic Without Lines) or higher
- ⚠️ PDF/A-3 embedding not validated (use certified Factur-X tool for PDF generation)

**French B2B Mandate**:
- E-invoicing mandatory for French B2B from 2026 (phased rollout)
- FlowBills validates **XML structure**; users must ensure PDF rendering matches legal requirements

## Responsibility Matrix

| Requirement | FlowBills Responsibility | User Responsibility | Partner AP Responsibility |
|-------------|--------------------------|---------------------|---------------------------|
| EN 16931 semantic validation | ✅ Full | Accurate business data | N/A |
| BIS 3.0 CIUS validation | ✅ Full | Valid Peppol IDs | N/A |
| SBDH envelope format | ✅ Full | N/A | AS4 transmission |
| XRechnung format | ✅ Full | German VAT compliance | N/A |
| Factur-X XML | ✅ Full | PDF/A-3 generation | N/A |
| Network delivery | Enqueue + retry | N/A | ✅ Full (SMP, AS4, certs) |
| Data privacy (PIPEDA) | ✅ Full | Consent for email notifications | N/A |
| Tax compliance | N/A | ✅ Full (VAT rates, IDs) | N/A |

---

**Last Updated**: October 2025
**Next Review**: January 2026
**Version**: 3.0