import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

// Input validation schema
const InvoiceIn = z.object({
  invoice_number: z.string().min(1),
  vendor_id: z.string().uuid(),
  amount_cents: z.number().int().positive(),
  invoice_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  po_number: z.string().optional().nullable(),
});

// Rate limiting configuration
const RATE_LIMIT = {
  maxRequests: 100,
  windowMs: 60000, // 1 minute
};

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function getRateLimitKey(req: Request): string {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
             req.headers.get('x-real-ip') || 
             'unknown';
  return `duplicate-check:${ip}`;
}

function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT.windowMs });
    return { allowed: true, remaining: RATE_LIMIT.maxRequests - 1 };
  }

  if (record.count >= RATE_LIMIT.maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: RATE_LIMIT.maxRequests - record.count };
}

function sanitizeErrorMessage(error: Error): string {
  // Remove sensitive information from error messages
  const message = error.message.toLowerCase();
  if (message.includes('password') || message.includes('secret') || message.includes('key')) {
    return 'Internal processing error';
  }
  return error.message.substring(0, 200); // Truncate long messages
}

function minusDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

function plusDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting check
  const rateLimitKey = getRateLimitKey(req);
  const rateLimit = checkRateLimit(rateLimitKey);
  
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded' }),
      { 
        status: 429,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': '0',
          'Retry-After': '60'
        }
      }
    );
  }

  try {
    // Use service role for secure database operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Enhanced input parsing and validation
    let body;
    try {
      const rawBody = await req.text();
      if (!rawBody || rawBody.trim() === '') {
        throw new Error('Request body is required');
      }
      
      body = JSON.parse(rawBody);
      if (typeof body !== 'object' || Array.isArray(body)) {
        throw new Error('Request body must be a valid object');
      }
      
    } catch (parseError) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON format' }),
        { 
          status: 400,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': rateLimit.remaining.toString()
          }
        }
      );
    }

    // Validate input against schema
    const parsed = InvoiceIn.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Validation failed',
          details: parsed.error.issues.map((issue: any) => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        }),
        { 
          status: 400,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': rateLimit.remaining.toString()
          }
        }
      );
    }

    const invoice = parsed.data;
    
    console.log('Duplicate check for invoice:', invoice.invoice_number);

    // Generate hash for duplicate detection with enhanced security
    const hashString = `${invoice.vendor_id}-${invoice.amount_cents}-${invoice.invoice_date}-${invoice.po_number || 'no-po'}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(hashString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const duplicateHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Check for exact hash match using safe queries with timeout
    const { data: exactDuplicate, error: exactError } = await supabase
      .from('invoices')
      .select('id, invoice_number, vendor_id, amount')
      .eq('duplicate_hash', duplicateHash)
      .neq('invoice_number', invoice.invoice_number)
      .limit(1);

    if (exactError) {
      console.error('Exact duplicate check error:', exactError);
      throw exactError;
    }

    // Fuzzy matching with safe parameterized queries
    const { data: fuzzyDuplicates, error: fuzzyError } = await supabase
      .from('invoices')
      .select('id, invoice_number, vendor_id, amount, invoice_date')
      .eq('vendor_id', invoice.vendor_id)
      .gte('invoice_date', minusDays(invoice.invoice_date, 7))
      .lte('invoice_date', plusDays(invoice.invoice_date, 7))
      .gte('amount', Math.round((invoice.amount_cents / 100) * 0.99))
      .lte('amount', Math.round((invoice.amount_cents / 100) * 1.01))
      .neq('invoice_number', invoice.invoice_number)
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
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': rateLimit.remaining.toString()
      },
    });

  } catch (error) {
    console.error('Duplicate check error:', error);
    
    // Log security event for monitoring
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await supabase.from('security_events').insert({
        event_type: 'duplicate_check_error',
        severity: 'medium',
        ip_address: req.headers.get('x-forwarded-for')?.split(',')[0],
        user_agent: req.headers.get('user-agent'),
        details: { 
          error_type: error instanceof Error ? error.name : 'unknown',
          endpoint: 'duplicate-check',
          timestamp: new Date().toISOString()
        }
      });
    } catch (logError) {
      console.error('Failed to log security event:', logError);
    }
    
    const errorMessage = error instanceof Error ? sanitizeErrorMessage(error) : 'Processing error';
    return new Response(JSON.stringify({ 
      error: errorMessage,
      duplicate_hash: null,
      is_exact_duplicate: false,
      risk_score: 0 
    }), {
      status: 500,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': rateLimit.remaining.toString()
      },
    });
  }
});
