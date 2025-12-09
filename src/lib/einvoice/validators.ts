// E-Invoice validators library for EN 16931, BIS 3.0, XRechnung, Factur-X
// Used by both client-side validation and edge functions

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  confidence: number;
}

export function validateEN16931(xmlContent: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Core EN 16931 semantic requirements
  if (!xmlContent.includes("cbc:ID")) {
    errors.push("Missing required element: cbc:ID (Invoice identifier)");
  }

  if (!xmlContent.includes("cbc:IssueDate")) {
    errors.push("Missing required element: cbc:IssueDate");
  }

  if (!xmlContent.includes("cac:AccountingSupplierParty")) {
    errors.push("Missing required element: cac:AccountingSupplierParty (Seller)");
  }

  if (!xmlContent.includes("cac:AccountingCustomerParty")) {
    errors.push("Missing required element: cac:AccountingCustomerParty (Buyer)");
  }

  if (!xmlContent.includes("cbc:DocumentCurrencyCode")) {
    warnings.push("Missing recommended: cbc:DocumentCurrencyCode");
  }

  const confidence = errors.length === 0 ? 95 : Math.max(20, 80 - errors.length * 10);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    confidence,
  };
}

export function validateBIS30(xmlContent: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Include EN 16931 base validation
  const en16931Result = validateEN16931(xmlContent);
  errors.push(...en16931Result.errors);
  warnings.push(...en16931Result.warnings);

  // Peppol BIS Billing 3.0 CIUS constraints
  if (
    !xmlContent.includes(
      "urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0"
    )
  ) {
    errors.push("Invalid CustomizationID for Peppol BIS Billing 3.0");
  }

  if (!xmlContent.includes("urn:fdc:peppol.eu:2017:poacc:billing:01:1.0")) {
    errors.push("Invalid ProfileID for Peppol BIS Billing 3.0");
  }

  // Check endpoint IDs
  if (!xmlContent.includes("cbc:EndpointID")) {
    errors.push("Missing required cbc:EndpointID for Peppol routing");
  }

  const confidence = errors.length === 0 ? 95 : Math.max(20, 80 - errors.length * 10);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    confidence,
  };
}

export function validateXRechnung(xmlContent: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // XRechnung (Germany) uses CII format
  if (!xmlContent.includes("CrossIndustryInvoice")) {
    errors.push("Missing root element: CrossIndustryInvoice (required for XRechnung)");
  }

  if (!xmlContent.includes("ram:ID")) {
    errors.push("Missing required element: ram:ID");
  }

  if (
    !xmlContent.includes("urn:cen.eu:en16931:2017#compliant#urn:xoev-de:kosit:standard:xrechnung")
  ) {
    errors.push("Missing XRechnung CustomizationID");
  }

  if (!xmlContent.includes("ram:BuyerReference")) {
    warnings.push("Missing recommended: ram:BuyerReference (Leitweg-ID)");
  }

  const confidence = errors.length === 0 ? 95 : Math.max(20, 80 - errors.length * 10);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    confidence,
  };
}

export function validateFacturX(xmlContent: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Factur-X (France/Germany) uses CII format
  if (
    !xmlContent.includes("CrossIndustryDocument") &&
    !xmlContent.includes("CrossIndustryInvoice")
  ) {
    errors.push(
      "Missing root element: CrossIndustryDocument/CrossIndustryInvoice (required for Factur-X)"
    );
  }

  if (!xmlContent.includes("ram:ID")) {
    errors.push("Missing required element: ram:ID");
  }

  if (
    !xmlContent.includes("urn:factur-x.eu:1p0") &&
    !xmlContent.includes("urn:cen.eu:en16931:2017")
  ) {
    warnings.push("Missing Factur-X profile identifier");
  }

  const confidence = errors.length === 0 ? 95 : Math.max(20, 80 - errors.length * 10);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    confidence,
  };
}

// BIS 3.0 envelope builder for Peppol transmission
export function buildBIS30(
  invoiceXml: string,
  metadata: {
    sender_participant_id: string;
    receiver_participant_id: string;
    document_type_id?: string;
    process_id?: string;
  }
): string {
  const messageId = `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const docTypeId =
    metadata.document_type_id || "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2";
  const processId = metadata.process_id || "urn:fdc:peppol.eu:2017:poacc:billing:01:1.0";

  return `<?xml version="1.0" encoding="UTF-8"?>
<StandardBusinessDocument xmlns="http://www.unece.org/cefact/namespaces/StandardBusinessDocumentHeader">
  <StandardBusinessDocumentHeader>
    <HeaderVersion>1.0</HeaderVersion>
    <Sender>
      <Identifier Authority="iso6523-actorid-upis">${metadata.sender_participant_id}</Identifier>
    </Sender>
    <Receiver>
      <Identifier Authority="iso6523-actorid-upis">${metadata.receiver_participant_id}</Identifier>
    </Receiver>
    <DocumentIdentification>
      <Standard>urn:oasis:names:specification:ubl:schema:xsd:Invoice-2</Standard>
      <TypeVersion>2.1</TypeVersion>
      <InstanceIdentifier>${messageId}</InstanceIdentifier>
      <Type>${docTypeId}</Type>
      <CreationDateAndTime>${new Date().toISOString()}</CreationDateAndTime>
    </DocumentIdentification>
    <BusinessScope>
      <Scope>
        <Type>DOCUMENTID</Type>
        <InstanceIdentifier>${docTypeId}</InstanceIdentifier>
      </Scope>
      <Scope>
        <Type>PROCESSID</Type>
        <InstanceIdentifier>${processId}</InstanceIdentifier>
      </Scope>
    </BusinessScope>
  </StandardBusinessDocumentHeader>
  ${invoiceXml}
</StandardBusinessDocument>`;
}
