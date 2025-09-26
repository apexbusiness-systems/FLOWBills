import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MetricsData {
  // STP (Straight Through Processing) metrics
  invoice_autoapproved_total: number;
  invoice_manual_review_total: number;
  stp_rate: number;

  // OCR metrics  
  ocr_extractions_total: number;
  ocr_failures_total: number;
  ocr_average_confidence: number;

  // Fraud detection metrics
  fraud_flags_total: number;
  fraud_flags_by_type: Record<string, number>;

  // Policy evaluation metrics
  policy_evaluations_total: number;
  policy_triggers_total: number;
  policy_pass_rate: number;

  // HIL (Human in Loop) metrics
  hil_queue_size: number;
  hil_average_resolution_time: number;

  // Performance metrics
  http_request_duration_avg: number;
  invoice_processing_duration_avg: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const format = new URL(req.url).searchParams.get('format');
    const timeRange = new URL(req.url).searchParams.get('range') || '24h';

    // Calculate time range
    const now = new Date();
    let startTime: Date;
    
    switch (timeRange) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    console.log(`Generating metrics for range: ${timeRange}, from: ${startTime.toISOString()}`);

    const metrics = await collectMetrics(supabase, startTime, now);

    if (format === 'prometheus') {
      const prometheusMetrics = formatPrometheusMetrics(metrics);
      return new Response(prometheusMetrics, {
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      timestamp: now.toISOString(),
      time_range: timeRange,
      metrics
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Metrics collection error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function collectMetrics(supabase: any, startTime: Date, endTime: Date): Promise<MetricsData> {
  try {
    // STP Metrics - invoices auto-approved vs manual review
    const [autoApproved, manualReview] = await Promise.all([
      supabase
        .from('invoices')
        .select('id', { count: 'exact' })
        .eq('status', 'approved')
        .gte('created_at', startTime.toISOString())
        .lte('created_at', endTime.toISOString()),
      
      supabase
        .from('review_queue')
        .select('id', { count: 'exact' })
        .gte('created_at', startTime.toISOString())
        .lte('created_at', endTime.toISOString())
    ]);

    const totalInvoices = (autoApproved.count || 0) + (manualReview.count || 0);
    const stpRate = totalInvoices > 0 ? (autoApproved.count || 0) / totalInvoices : 0;

    // OCR Metrics
    const ocrExtractions = await supabase
      .from('audit_logs')
      .select('id, new_values', { count: 'exact' })
      .eq('action', 'OCR_EXTRACTION')
      .gte('created_at', startTime.toISOString())
      .lte('created_at', endTime.toISOString());

    let ocrFailures = 0;
    let totalConfidence = 0;
    let confidenceCount = 0;

    if (ocrExtractions.data) {
      ocrExtractions.data.forEach((extraction: any) => {
        if (extraction.new_values?.ocr_confidence !== undefined) {
          if (extraction.new_values.ocr_confidence < 0.7) {
            ocrFailures++;
          }
          totalConfidence += extraction.new_values.ocr_confidence;
          confidenceCount++;
        }
      });
    }

    // Fraud Flags Metrics
    const fraudFlags = await supabase
      .from('fraud_flags')
      .select('flag_type')
      .gte('created_at', startTime.toISOString())
      .lte('created_at', endTime.toISOString());

    const fraudFlagsByType: Record<string, number> = {};
    if (fraudFlags.data) {
      fraudFlags.data.forEach((flag: any) => {
        fraudFlagsByType[flag.flag_type] = (fraudFlagsByType[flag.flag_type] || 0) + 1;
      });
    }

    // Policy Evaluation Metrics
    const policyEvaluations = await supabase
      .from('audit_logs')
      .select('new_values', { count: 'exact' })
      .eq('action', 'POLICY_EVALUATION')
      .gte('created_at', startTime.toISOString())
      .lte('created_at', endTime.toISOString());

    let policyTriggers = 0;
    if (policyEvaluations.data) {
      policyEvaluations.data.forEach((evaluation: any) => {
        if (evaluation.new_values?.policies_triggered > 0) {
          policyTriggers++;
        }
      });
    }

    // HIL Queue Metrics
    const [queueSize, resolvedItems] = await Promise.all([
      supabase
        .from('review_queue')
        .select('id', { count: 'exact' })
        .is('resolved_at', null),
      
      supabase
        .from('review_queue')
        .select('created_at, resolved_at')
        .not('resolved_at', 'is', null)
        .gte('resolved_at', startTime.toISOString())
        .lte('resolved_at', endTime.toISOString())
    ]);

    let averageResolutionTime = 0;
    if (resolvedItems.data && resolvedItems.data.length > 0) {
      const totalTime = resolvedItems.data.reduce((sum: number, item: any) => {
        const created = new Date(item.created_at).getTime();
        const resolved = new Date(item.resolved_at).getTime();
        return sum + (resolved - created);
      }, 0);
      averageResolutionTime = totalTime / resolvedItems.data.length / 1000 / 60; // minutes
    }

    return {
      invoice_autoapproved_total: autoApproved.count || 0,
      invoice_manual_review_total: manualReview.count || 0,
      stp_rate: stpRate,
      
      ocr_extractions_total: ocrExtractions.count || 0,
      ocr_failures_total: ocrFailures,
      ocr_average_confidence: confidenceCount > 0 ? totalConfidence / confidenceCount : 0,
      
      fraud_flags_total: fraudFlags.count || 0,
      fraud_flags_by_type: fraudFlagsByType,
      
      policy_evaluations_total: policyEvaluations.count || 0,
      policy_triggers_total: policyTriggers,
      policy_pass_rate: policyEvaluations.count > 0 ? 1 - (policyTriggers / policyEvaluations.count) : 1,
      
      hil_queue_size: queueSize.count || 0,
      hil_average_resolution_time: averageResolutionTime,
      
      http_request_duration_avg: 150, // Mock data
      invoice_processing_duration_avg: 2500, // Mock data in ms
    };

  } catch (error) {
    console.error('Error collecting metrics:', error);
    throw error;
  }
}

function formatPrometheusMetrics(metrics: MetricsData): string {
  const lines = [
    `# HELP invoice_autoapproved_total Total number of auto-approved invoices`,
    `# TYPE invoice_autoapproved_total counter`,
    `invoice_autoapproved_total ${metrics.invoice_autoapproved_total}`,
    
    `# HELP invoice_manual_review_total Total number of invoices requiring manual review`,
    `# TYPE invoice_manual_review_total counter`, 
    `invoice_manual_review_total ${metrics.invoice_manual_review_total}`,
    
    `# HELP stp_rate Straight Through Processing rate (0-1)`,
    `# TYPE stp_rate gauge`,
    `stp_rate ${metrics.stp_rate.toFixed(3)}`,
    
    `# HELP fraud_flags_total Total number of fraud flags raised`,
    `# TYPE fraud_flags_total counter`,
    `fraud_flags_total ${metrics.fraud_flags_total}`,
    
    `# HELP hil_queue_size Current size of human-in-loop review queue`,
    `# TYPE hil_queue_size gauge`,
    `hil_queue_size ${metrics.hil_queue_size}`,
    
    `# HELP ocr_average_confidence Average OCR confidence score (0-1)`,
    `# TYPE ocr_average_confidence gauge`,
    `ocr_average_confidence ${metrics.ocr_average_confidence.toFixed(3)}`,
  ];

  // Add fraud flags by type
  Object.entries(metrics.fraud_flags_by_type).forEach(([type, count]) => {
    lines.push(`fraud_flags_by_type{type="${type}"} ${count}`);
  });

  return lines.join('\n') + '\n';
}