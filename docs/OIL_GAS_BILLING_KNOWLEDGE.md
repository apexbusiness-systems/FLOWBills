# Oil & Gas Billing Knowledge Base

**Last Updated:** January 20, 2025  
**Version:** 2.0.0

This document outlines the specialized oil & gas billing knowledge integrated into FlowAi's LLM assistants to provide industry-specific support for Canadian oil & gas operations.

---

## Core Billing Concepts

### 1. Joint Interest Billing (JIB)

**Definition:** Specialized accounting process for allocating shared expenses among multiple working interest owners based on ownership percentages.

**Key Components:**
- Working interest percentage allocation
- Cost distribution among operators and non-operators
- Joint Operating Agreement (JOA) compliance
- Transparent partner reporting and settlement
- AFE-based cost tracking across joint ventures

**FlowAi Implementation:**
- Automated cost allocation calculations
- Partner distribution reports
- JOA compliance validation
- Real-time expense tracking by working interest

---

### 2. Authorization for Expenditure (AFE)

**Definition:** Capital budgeting document that must be approved before commencing oil & gas projects or incurring expenditures.

**Workflow Stages:**
1. AFE Proposal Creation
2. Multi-level Approval Process
3. AFE Authorization
4. Cost Tracking During Execution
5. Variance Analysis (Budget vs Actual)
6. Change Orders and Supplements

**Key Elements:**
- AFE number (unique identifier)
- Project description and scope
- Estimated costs by category
- Approval thresholds and authorities
- Working interest owner information
- Well identifier (UWI) linkage

**FlowAi Implementation:**
- AFE budget validation on invoice receipt
- Variance tracking and alerts
- Change order management
- Budget vs actual reporting
- Integration with invoice approval workflows

---

### 3. Field Ticket Management

**Definition:** Service verification documents that record actual work performed in field operations, serving as proof of service delivery.

**Key Information Captured:**
- Service date, time, and duration
- GPS-validated location data
- Equipment used (IDs, serial numbers)
- Personnel hours and crew composition
- Service provider sign-off
- Customer authorization signature
- Ticket number for tracking

**Validation Methods:**
- GPS location verification
- Time-stamp accuracy
- Equipment ID validation
- Rate verification against MSA
- Authorization code checking

**FlowAi Implementation:**
- Digital field ticket integration
- GPS validation automation
- Three-way matching with PO and Invoice
- Exception flagging for missing tickets
- Integration with OpenTicket platform

---

### 4. Three-Way Matching Process

**Definition:** Validation process that reconciles three critical documents before authorizing payment.

**Document Triangle:**
1. **Purchase Order (PO):** What was contracted/ordered
2. **Field Ticket/Receiving:** What was actually performed/delivered
3. **Vendor Invoice:** What the vendor is billing

**Matching Criteria:**
- Service/item descriptions align
- Quantities match within tolerance
- Prices match contracted rates
- Service dates are consistent
- Cost coding is identical
- AFE numbers match

**Exception Handling:**
- Price variance beyond tolerance (typically 5-10%)
- Quantity discrepancies
- Missing field tickets
- Date range mismatches
- Unauthorized services

**FlowAi Implementation:**
- Automated three-way match validation
- Tolerance-based approval routing
- Exception workflow management
- Match confidence scoring
- Resolution tracking

---

## Vendor & Contract Management

### Master Service Agreements (MSA)

**Purpose:** Define contracted rates, terms, and conditions for ongoing services from vendors.

**Key Components:**
- Rate cards by service type
- Volume discounts
- Payment terms (net 30, 2/10 net 30)
- Insurance requirements
- Safety compliance standards
- Liability and indemnification
- Term and renewal provisions

**FlowAi Implementation:**
- Rate validation against MSA
- Pricing compliance alerts
- Volume discount calculation
- Term expiration warnings
- Insurance verification tracking

### Vendor Management

**Critical Elements:**
- Vendor registration and prequalification
- W9/W8 tax documentation
- Insurance certificates (CGL, WC, auto)
- Safety certifications (ISNetworld, Avetta)
- Performance scorecards
- Payment history

---

## Canadian Regulatory Compliance

### CAPL Standards

**Organization:** Canadian Association of Petroleum Landmen

**Key Standards:**
- Operating procedures
- Joint venture agreements
- Land administration
- Freehold petroleum and natural gas lease
- Farmout agreements

### Canada Energy Regulator (CER)

**Jurisdiction:** Interprovincial pipelines and international energy trade

**Requirements:**
- Toll and tariff regulation
- Accounting standards
- Safety and environmental compliance
- Incident reporting

### Provincial Regulations

**Alberta Energy Regulator (AER):**
- Well licensing and abandonment
- Production reporting
- Royalty calculations
- Liability management

**Saskatchewan Research Council (SRC) / Ministry of Energy:**
- Crown land administration
- Mineral rights management
- Production volumes

**BC Oil & Gas Commission (BCOGC):**
- Well authorizations
- Pipeline permits
- Environmental assessments

### Tax Compliance

**HST/GST by Province:**
- Alberta: 5% GST only
- Saskatchewan: 5% GST + 6% PST
- British Columbia: 5% GST + 7% PST
- Proper classification by service type
- Input tax credit tracking

**Year-End Reporting:**
- T4 for employees
- T5 for contractors
- 1099 equivalent for US services
- Information returns

---

## Common Invoice Types & Structures

### 1. Drilling Services

**Pricing Models:**
- Day rates ($/day)
- Footage rates ($/metre)
- Turnkey contracts
- Hybrid day + footage

**Key Elements:**
- Rig mobilization/demobilization
- Standby time charges
- Bit footage tracking
- Mud and cementing services
- Casing running

### 2. Completion Services

**Common Services:**
- Hydraulic fracturing ($ per stage)
- Coiled tubing operations
- Cementing services
- Wireline logging
- Perforating

**Billing Units:**
- Per stage
- Per hour
- Per barrel of fluid
- Per foot of completion

### 3. Production Services

**Service Categories:**
- Well servicing (workover rigs)
- Equipment rentals (pumps, tanks, compressors)
- Maintenance and repairs
- Production testing
- Fluid hauling and disposal

**Typical Charges:**
- Hourly rates
- Daily rental rates
- Per barrel hauled
- Per tonne disposed

### 4. Consulting & Professional Services

**Service Types:**
- Engineering (petroleum, reservoir, facilities)
- Geology and geophysics
- Land services
- Regulatory compliance

**Billing:**
- Hourly rates by expertise level
- Fixed fee projects
- Retainer agreements

---

## Exception Management

### Price Variances

**Typical Tolerance:** 5-10% from contracted rates

**Causes:**
- Rate changes not updated in system
- Additional services or overtime
- Emergency callout premiums
- Volume discount miscalculation

**Resolution:**
- Auto-approve within tolerance
- Route to approver if exceeded
- Request vendor explanation
- Update MSA if needed

### AFE Budget Overruns

**Alert Thresholds:**
- 90% of budget (warning)
- 100% of budget (hold invoices)
- Requires AFE supplement

**Process:**
- Notify AFE budget holder
- Request supplement or change order
- Hold related invoices pending approval
- Track cumulative spend

### Missing Field Tickets

**Risk:** Cannot complete three-way match

**Resolution Steps:**
1. Auto-request from vendor portal
2. Contact service provider directly
3. Obtain customer authorization if lost
4. Create exception ticket
5. Manager approval to proceed without

### Duplicate Detection

**Validation Points:**
- Same vendor + invoice number
- Same AFE + date + amount
- Same field ticket reference
- Similar line items and amounts

**Actions:**
- Flag for review
- Check payment status
- Verify with vendor
- Adjust or reject as needed

---

## ERP System Integrations

### Supported Systems

**Enterprise Solutions:**
- SAP S/4HANA Oil & Gas modules
- Oracle E-Business Suite
- Microsoft Dynamics 365 Finance & Operations
- NetSuite ERP

**Industry-Specific:**
- Quorum Execute AFE
- Enverus OpenInvoice/OpenTicket
- P2 Energy Solutions (P2 BOLO)
- WolfePak ERP

### Integration Points

**Inbound to FlowAi:**
- Vendor master data
- Purchase orders
- AFE budgets
- Cost center hierarchies
- GL account codes

**Outbound from FlowAi:**
- Approved invoice batches
- GL distributions
- Partner billing JIB summaries
- Payment recommendations
- Exception reports

---

## Industry Platforms

### Enverus OpenInvoice

**Description:** Largest e-invoicing network for oil & gas industry

**Capabilities:**
- Automated invoice submission
- EDI/API integration
- Vendor portal
- ERP connectivity (25+ systems)
- Compliance validation

### Enverus OpenTicket

**Description:** Digital field ticketing platform with GPS validation

**Features:**
- Mobile field ticket creation
- GPS geofencing and tracking
- Time validation
- Equipment tracking
- Real-time approvals
- Integration with OpenInvoice

---

## Best Practices

### Invoice Processing Efficiency

1. **Standardize Data Capture:**
   - Use consistent formats
   - Validate at receipt
   - Enrich with master data

2. **Automate Matching:**
   - Three-way match validation
   - Tolerance-based routing
   - Exception management

3. **Leverage Workflows:**
   - Threshold-based approvals
   - AFE budget holder routing
   - Joint venture notifications

4. **Monitor KPIs:**
   - Straight-through processing rate (target: 80%+)
   - Days payable outstanding (DPO)
   - Exception resolution time
   - Early payment capture rate

### Compliance Management

1. **Maintain Current Vendor Data:**
   - Insurance certificates
   - Tax forms (W9/W8)
   - Safety certifications

2. **Audit Trail Requirements:**
   - Complete approval history
   - Document retention (7 years)
   - Change tracking
   - Audit reports

3. **Segregation of Duties:**
   - Separate invoice entry from approval
   - Dual authorization for high amounts
   - No self-approval

---

## Terminology Glossary

**AFE:** Authorization for Expenditure - capital budget approval  
**CAPL:** Canadian Association of Petroleum Landmen  
**CER:** Canada Energy Regulator  
**DLS:** Dominion Land Survey system  
**EDI:** Electronic Data Interchange  
**GL:** General Ledger  
**JIB:** Joint Interest Billing  
**JOA:** Joint Operating Agreement  
**LSD:** Legal Subdivision  
**MSA:** Master Service Agreement  
**PO:** Purchase Order  
**UWI:** Unique Well Identifier  
**WI:** Working Interest percentage

---

## References

- Canadian Association of Petroleum Landmen (CAPL): https://landman.ca
- Canada Energy Regulator: https://cer-rec.gc.ca
- Alberta Energy Regulator: https://aer.ca
- Enverus OpenInvoice: https://enverus.com/products/openinvoice
- OSDU Data Platform: https://osdu.projects.opengroup.org

---

**Document Control:**
- Document Owner: FlowAi Product Team
- Review Frequency: Quarterly
- Next Review: April 2025
- Classification: Internal Use
