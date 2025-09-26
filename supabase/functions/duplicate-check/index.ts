import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface InvoiceData {
  vendor_id: string;
  amount: number;
  invoice_date: string;
  po_number?: string;
  invoice_number: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { invoice } = await req.json() as { invoice: InvoiceData };
    
    console.log('Duplicate check for invoice:', invoice.invoice_number);

    // Generate hash for duplicate detection
    const hashString = `${invoice.vendor_id}-${invoice.amount}-${invoice.invoice_date}-${invoice.po_number || 'no-po'}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(hashString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const duplicateHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Check for exact hash match
    const { data: exactDuplicate, error: exactError } = await supabase
      .from('invoices')
      .select('id, invoice_number, vendor_id, amount')
      .eq('duplicate_hash', duplicateHash)
      .neq('id', invoice.invoice_number) // Exclude self if updating
      .limit(1);

    if (exactError) {
      console.error('Exact duplicate check error:', exactError);
      throw exactError;
    }

    // Fuzzy matching for near-duplicates
    const amountTolerance = invoice.amount * 0.05; // 5% tolerance
    const dateThreshold = new Date(invoice.invoice_date);
    dateThreshold.setDate(dateThreshold.getDate() - 7); // 7 days before
    const dateThresholdAfter = new Date(invoice.invoice_date);
    dateThresholdAfter.setDate(dateThresholdAfter.getDate() + 7); // 7 days after

    const { data: fuzzyDuplicates, error: fuzzyError } = await supabase
      .from('invoices')
      .select('id, invoice_number, vendor_id, amount, invoice_date')
      .eq('vendor_id', invoice.vendor_id)
      .gte('amount', invoice.amount - amountTolerance)
      .lte('amount', invoice.amount + amountTolerance)
      .gte('invoice_date', dateThreshold.toISOString().split('T')[0])
      .lte('invoice_date', dateThresholdAfter.toISOString().split('T')[0])
      .neq('id', invoice.invoice_number)
      .limit(5);

    if (fuzzyError) {
      console.error('Fuzzy duplicate check error:', fuzzyError);
      throw fuzzyError;
    }

    const result = {
      duplicate_hash: duplicateHash,
      is_exact_duplicate: exactDuplicate && exactDuplicate.length > 0,
      exact_match: exactDuplicate?.[0] || null,
      potential_duplicates: fuzzyDuplicates || [],
      risk_score: exactDuplicate && exactDuplicate.length > 0 ? 100 : 
                  (fuzzyDuplicates && fuzzyDuplicates.length > 0 ? 75 : 0)
    };

    console.log('Duplicate check result:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Duplicate check error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      error: errorMessage,
      duplicate_hash: null,
      is_exact_duplicate: false,
      risk_score: 0 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});