import { createClient } from "npm:@supabase/supabase-js@2.58.0"
import { corsHeaders } from '../_shared/cors.ts'
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

// Input validation schema
const FraudDetectionSchema = z.object({
  document_id: z.string().min(1, "Document ID is required"),
  check_types: z.array(z.enum(['duplicate_bank', 'duplicate_tax_id', 'amount_anomaly', 'frequency_anomaly', 'vendor_mismatch'])).optional(),
});

interface FraudFlag {
  flag_type: string;
  risk_score: number;
  details: any;
  evidence: string[];
}

// Extract bank account information from XML
function extractBankInfo(xmlContent: string): { iban?: string; account_number?: string; bank_code?: string } {
  const bankInfo: any = {};
  
  // IBAN extraction
  const ibanMatch = xmlContent.match(/<cbc:ID[^>]*>([A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}[A-Z0-9]{1,23})<\/cbc:ID>/);
  if (ibanMatch) {
    bankInfo.iban = ibanMatch[1];
  }
  
  // Account number extraction
  const accountMatch = xmlContent.match(/<cbc:ID[^>]*>(\d{8,12})<\/cbc:ID>/);
  if (accountMatch) {
    bankInfo.account_number = accountMatch[1];
  }
  
  return bankInfo;
}

// Extract tax information from XML
function extractTaxInfo(xmlContent: string): { vat_id?: string; tax_id?: string } {
  const taxInfo: any = {};
  
  // VAT ID extraction
  const vatMatch = xmlContent.match(/<cbc:CompanyID[^>]*schemeID="VAT"[^>]*>([^<]+)<\/cbc:CompanyID>/);
  if (vatMatch) {
    taxInfo.vat_id = vatMatch[1];
  }
  
  // Tax ID extraction
  const taxMatch = xmlContent.match(/<cbc:CompanyID[^>]*>([^<]+)<\/cbc:CompanyID>/);
  if (taxMatch) {
    taxInfo.tax_id = taxMatch[1];
  }
  
  return taxInfo;
}

// Check for duplicate bank accounts across different vendors
async function checkDuplicateBank(supabase: any, document: any, tenantId: string): Promise<FraudFlag | null> {
  if (!document.xml_content) return null;
  
  const bankInfo = extractBankInfo(document.xml_content);
  if (!bankInfo.iban && !bankInfo.account_number) return null;
  
  // Check vendors table for duplicate bank information
  let query = supabase
    .from('vendors')
    .select('*')
    .neq('id', document.vendor_id || 'none');
    
  if (bankInfo.iban) {
    const { data: ibanMatches } = await query.eq('iban', bankInfo.iban);
    if (ibanMatches && ibanMatches.length > 0) {
      return {
        flag_type: 'duplicate_bank',
        risk_score: 85,
        details: {
          duplicate_iban: bankInfo.iban,
          conflicting_vendors: ibanMatches.map((v: any) => ({ id: v.id, name: v.vendor_name }))
        },
        evidence: [
          `IBAN ${bankInfo.iban} is associated with ${ibanMatches.length} other vendor(s)`,
          `Vendors: ${ibanMatches.map((v: any) => v.vendor_name).join(', ')}`
        ]
      };
    }
  }
  
  if (bankInfo.account_number) {
    const { data: accountMatches } = await query.eq('bank_account', bankInfo.account_number);
    if (accountMatches && accountMatches.length > 0) {
      return {
        flag_type: 'duplicate_bank',
        risk_score: 80,
        details: {
          duplicate_account: bankInfo.account_number,
          conflicting_vendors: accountMatches.map((v: any) => ({ id: v.id, name: v.vendor_name }))
        },
        evidence: [
          `Bank account ${bankInfo.account_number} is associated with ${accountMatches.length} other vendor(s)`,
          `Vendors: ${accountMatches.map((v: any) => v.vendor_name).join(', ')}`
        ]
      };
    }
  }
  
  return null;
}

// Check for duplicate tax IDs
async function checkDuplicateTaxId(supabase: any, document: any, tenantId: string): Promise<FraudFlag | null> {
  if (!document.xml_content) return null;
  
  const taxInfo = extractTaxInfo(document.xml_content);
  if (!taxInfo.vat_id && !taxInfo.tax_id) return null;
  
  let query = supabase
    .from('vendors')
    .select('*')
    .neq('id', document.vendor_id || 'none');
    
  if (taxInfo.vat_id) {
    const { data: vatMatches } = await query.eq('tax_id', taxInfo.vat_id);
    if (vatMatches && vatMatches.length > 0) {
      return {
        flag_type: 'duplicate_tax_id',
        risk_score: 90,
        details: {
          duplicate_vat_id: taxInfo.vat_id,
          conflicting_vendors: vatMatches.map((v: any) => ({ id: v.id, name: v.vendor_name }))
        },
        evidence: [
          `VAT ID ${taxInfo.vat_id} is associated with ${vatMatches.length} other vendor(s)`,
          `Vendors: ${vatMatches.map((v: any) => v.vendor_name).join(', ')}`
        ]
      };
    }
  }
  
  return null;
}

// Check for amount anomalies
async function checkAmountAnomaly(supabase: any, document: any, tenantId: string): Promise<FraudFlag | null> {
  if (!document.total_amount || !document.sender_id) return null;
  
  // Get historical amounts for this sender
  const { data: historicalDocs } = await supabase
    .from('einvoice_documents')
    .select('total_amount')
    .eq('sender_id', document.sender_id)
    .eq('tenant_id', tenantId)
    .neq('id', document.id)
    .order('created_at', { ascending: false })
    .limit(50);
    
  if (!historicalDocs || historicalDocs.length < 5) return null; // Need enough data
  
  const amounts = historicalDocs.map((d: any) => parseFloat(d.total_amount)).filter((a: number) => !isNaN(a));
  if (amounts.length === 0) return null;
  
  // Calculate statistical thresholds
  const mean = amounts.reduce((sum: number, a: number) => sum + a, 0) / amounts.length;
  const variance = amounts.reduce((sum: number, a: number) => sum + Math.pow(a - mean, 2), 0) / amounts.length;
  const stdDev = Math.sqrt(variance);
  
  const currentAmount = parseFloat(document.total_amount);
  const zScore = Math.abs((currentAmount - mean) / stdDev);
  
  // Flag if more than 3 standard deviations from mean
  if (zScore > 3) {
    return {
      flag_type: 'amount_anomaly',
      risk_score: Math.min(95, 50 + (zScore * 10)),
      details: {
        current_amount: currentAmount,
        historical_mean: mean,
        standard_deviation: stdDev,
        z_score: zScore,
        samples: amounts.length
      },
      evidence: [
        `Invoice amount ${currentAmount} is ${zScore.toFixed(2)} standard deviations from historical mean of ${mean.toFixed(2)}`,
        `Based on ${amounts.length} historical invoices from sender ${document.sender_id}`
      ]
    };
  }
  
  return null;
}

// Check for frequency anomalies
async function checkFrequencyAnomaly(supabase: any, document: any, tenantId: string): Promise<FraudFlag | null> {
  if (!document.sender_id) return null;
  
  // Check frequency in last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const { data: recentDocs } = await supabase
    .from('einvoice_documents')
    .select('id')
    .eq('sender_id', document.sender_id)
    .eq('tenant_id', tenantId)
    .gte('created_at', oneDayAgo);
    
  if (!recentDocs) return null;
  
  const frequency = recentDocs.length;
  const normalThreshold = 5; // More than 5 invoices per day might be suspicious
  
  if (frequency > normalThreshold) {
    return {
      flag_type: 'frequency_anomaly',
      risk_score: Math.min(90, 30 + (frequency * 5)),
      details: {
        frequency_24h: frequency,
        sender_id: document.sender_id,
        threshold: normalThreshold
      },
      evidence: [
        `${frequency} invoices received from ${document.sender_id} in the last 24 hours`,
        `This exceeds the normal threshold of ${normalThreshold} invoices per day`
      ]
    };
  }
  
  return null;
}

// Check for vendor mismatches
async function checkVendorMismatch(supabase: any, document: any, tenantId: string): Promise<FraudFlag | null> {
  if (!document.sender_id) return null;
  
  // Check if sender_id matches any known vendor codes or identifiers
  const { data: vendors } = await supabase
    .from('vendors')
    .select('*')
    .or(`vendor_code.eq.${document.sender_id},tax_id.eq.${document.sender_id}`);
    
  if (!vendors || vendors.length === 0) {
    return {
      flag_type: 'vendor_mismatch',
      risk_score: 60,
      details: {
        sender_id: document.sender_id,
        reason: 'Unknown sender participant ID'
      },
      evidence: [
        `Sender participant ID ${document.sender_id} does not match any known vendor`,
        'This could indicate a new vendor or potential impersonation'
      ]
    };
  }
  
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse and validate request
    const body = await req.json();
    const parsed = FraudDetectionSchema.safeParse(body);
    
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Validation failed',
          details: parsed.error.issues 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { document_id, check_types = ['duplicate_bank', 'duplicate_tax_id', 'amount_anomaly', 'frequency_anomaly', 'vendor_mismatch'] } = parsed.data;
    const tenantId = body.tenant_id || 'system';

    // Get document data
    const { data: document, error: docError } = await supabase
      .from('einvoice_documents')
      .select('*')
      .eq('document_id', document_id)
      .eq('tenant_id', tenantId)
      .single();

    if (docError || !document) {
      return new Response(
        JSON.stringify({ error: 'Document not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Run fraud checks
    const fraudFlags: FraudFlag[] = [];
    const checkResults: any = {};

    for (const checkType of check_types) {
      let flag: FraudFlag | null = null;
      
      switch (checkType) {
        case 'duplicate_bank':
          flag = await checkDuplicateBank(supabase, document, tenantId);
          break;
        case 'duplicate_tax_id':
          flag = await checkDuplicateTaxId(supabase, document, tenantId);
          break;
        case 'amount_anomaly':
          flag = await checkAmountAnomaly(supabase, document, tenantId);
          break;
        case 'frequency_anomaly':
          flag = await checkFrequencyAnomaly(supabase, document, tenantId);
          break;
        case 'vendor_mismatch':
          flag = await checkVendorMismatch(supabase, document, tenantId);
          break;
      }
      
      checkResults[checkType] = flag ? 'flagged' : 'clean';
      if (flag) {
        fraudFlags.push(flag);
      }
    }

    // Store fraud flags in database
    for (const flag of fraudFlags) {
      await supabase.from('fraud_flags_einvoice').insert({
        document_id: document.id,
        flag_type: flag.flag_type,
        risk_score: flag.risk_score,
        details: {
          ...flag.details,
          evidence: flag.evidence,
          detected_at: new Date().toISOString()
        },
        tenant_id: tenantId
      });
    }

    // Calculate overall risk score
    const overallRiskScore = fraudFlags.length > 0 ? 
      Math.max(...fraudFlags.map(f => f.risk_score)) : 0;

    // Log metrics
    await supabase.from('model_stats').insert({
      tenant_id: tenantId,
      model: 'fraud_detector',
      stage: 'fraud_detection',
      confidence: (100 - overallRiskScore) / 100,
      payload: {
        document_id,
        checks_performed: check_types,
        flags_found: fraudFlags.length,
        overall_risk_score: overallRiskScore,
        flag_types: fraudFlags.map(f => f.flag_type)
      }
    });

    const response = {
      document_id,
      overall_risk_score: overallRiskScore,
      flags_detected: fraudFlags.length,
      fraud_flags: fraudFlags,
      check_results: checkResults,
      recommendations: fraudFlags.length > 0 ? [
        'Manual review recommended due to fraud indicators',
        'Verify vendor identity and banking information',
        'Cross-reference with historical transaction patterns'
      ] : [
        'No fraud indicators detected',
        'Document passed all automated fraud checks'
      ],
      detected_at: new Date().toISOString()
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Fraud detection error:', error);
    return new Response(JSON.stringify({ 
      error: 'Fraud detection failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});