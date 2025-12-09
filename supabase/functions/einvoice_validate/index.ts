import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { z } from 'https://deno.land/x/zod@v3.23.8/mod.ts';

// Input validation schema
const ValidateRequestSchema = z.object({
  document_id: z.string().min(1, 'Document ID is required'),
  xml_content: z.string().min(1, 'XML content is required'),
  format: z.enum(['bis30', 'xrechnung', 'facturx', 'pint']),
  country_code: z.string().length(2, 'Country code must be 2 characters').optional(),
});

// E-Invoice validation functions
function validateEN16931(
  xmlContent: string,
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic EN 16931 semantic validation
  if (!xmlContent.includes('cbc:ID')) {
    errors.push('Missing required element: cbc:ID (Invoice identifier)');
  }

  if (!xmlContent.includes('cbc:IssueDate')) {
    errors.push('Missing required element: cbc:IssueDate (Invoice issue date)');
  }

  if (!xmlContent.includes('cac:AccountingSupplierParty')) {
    errors.push('Missing required element: cac:AccountingSupplierParty (Seller information)');
  }

  if (!xmlContent.includes('cac:AccountingCustomerParty')) {
    errors.push('Missing required element: cac:AccountingCustomerParty (Buyer information)');
  }

  if (!xmlContent.includes('cbc:DocumentCurrencyCode')) {
    warnings.push('Missing recommended element: cbc:DocumentCurrencyCode');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function validateBIS30(
  xmlContent: string,
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Peppol BIS Billing 3.0 CIUS constraints
  const en16931Result = validateEN16931(xmlContent);
  errors.push(...en16931Result.errors);
  warnings.push(...en16931Result.warnings);

  // BIS 3.0 specific validations
  if (
    !xmlContent.includes(
      'cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0',
    )
  ) {
    errors.push('Invalid CustomizationID for Peppol BIS Billing 3.0');
  }

  if (!xmlContent.includes('cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0')) {
    errors.push('Invalid ProfileID for Peppol BIS Billing 3.0');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function validateXRechnung(
  xmlContent: string,
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // XRechnung (Germany) specific validation
  if (!xmlContent.includes('CrossIndustryInvoice')) {
    errors.push('Missing root element: CrossIndustryInvoice (required for XRechnung)');
  }

  if (!xmlContent.includes('ram:ID')) {
    errors.push('Missing required element: ram:ID (XRechnung identifier)');
  }

  // Check for XRechnung profile
  if (
    !xmlContent.includes('urn:cen.eu:en16931:2017#compliant#urn:xoev-de:kosit:standard:xrechnung')
  ) {
    errors.push('Missing XRechnung CustomizationID');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function validateFacturX(
  xmlContent: string,
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Factur-X (France/Germany) specific validation
  if (!xmlContent.includes('CrossIndustryDocument')) {
    errors.push('Missing root element: CrossIndustryDocument (required for Factur-X)');
  }

  if (!xmlContent.includes('ram:ID')) {
    errors.push('Missing required element: ram:ID (Factur-X identifier)');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Parse and validate request
    const body = await req.json();
    const parsed = ValidateRequestSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: parsed.error.issues,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const { document_id, xml_content, format, country_code = 'CA' } = parsed.data;

    // Perform validation based on format
    let validationResult;
    let ruleType: string;

    switch (format) {
      case 'bis30':
        validationResult = validateBIS30(xml_content);
        ruleType = 'bis30';
        break;
      case 'xrechnung':
        validationResult = validateXRechnung(xml_content);
        ruleType = 'xrechnung';
        break;
      case 'facturx':
        validationResult = validateFacturX(xml_content);
        ruleType = 'facturx';
        break;
      case 'pint':
        // PINT validation stub (future implementation)
        validationResult = {
          valid: true,
          errors: [],
          warnings: ['PINT validation not yet implemented'],
        };
        ruleType = 'en16931';
        break;
      default:
        validationResult = validateEN16931(xml_content);
        ruleType = 'en16931';
    }

    // Calculate confidence score
    const confidenceScore = validationResult.valid
      ? 95
      : (validationResult.errors.length === 0
        ? 80
        : Math.max(20, 80 - (validationResult.errors.length * 10)));

    // Update document status
    const { error: updateError } = await supabase
      .from('einvoice_documents')
      .update({
        status: validationResult.valid ? 'validated' : 'failed',
        validation_results: {
          format,
          rule_type: ruleType,
          validation_passed: validationResult.valid,
          errors: validationResult.errors,
          warnings: validationResult.warnings,
          validated_at: new Date().toISOString(),
        },
        confidence_score: confidenceScore,
        updated_at: new Date().toISOString(),
      })
      .eq('document_id', document_id)
      .eq('tenant_id', body.tenant_id || 'system');

    if (updateError) {
      console.error('Failed to update document:', updateError);
    }

    // Store country-specific validation results
    const { error: validationError } = await supabase
      .from('country_validations')
      .insert({
        document_id: document_id,
        rule_type: ruleType,
        country_code,
        validation_passed: validationResult.valid,
        error_messages: validationResult.errors,
        warnings: validationResult.warnings,
        validation_metadata: {
          format,
          confidence_score: confidenceScore,
          validation_timestamp: new Date().toISOString(),
        },
        tenant_id: body.tenant_id || 'system',
      });

    if (validationError) {
      console.error('Failed to store validation result:', validationError);
    }

    // Increment metrics counter
    await supabase.from('model_stats').insert({
      tenant_id: body.tenant_id || 'system',
      model: 'einvoice_validator',
      stage: 'validation',
      confidence: confidenceScore / 100,
      payload: {
        format,
        rule_type: ruleType,
        country_code,
        validation_result: validationResult.valid ? 'success' : 'failed',
      },
    });

    const response = {
      document_id,
      format,
      rule_type: ruleType,
      validation_passed: validationResult.valid,
      confidence_score: confidenceScore,
      errors: validationResult.errors,
      warnings: validationResult.warnings,
      country_code,
      validated_at: new Date().toISOString(),
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('E-Invoice validation error:', error);
    return new Response(
      JSON.stringify({
        error: 'Validation processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
