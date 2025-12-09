import { createClient } from 'jsr:@supabase/supabase-js@2';
import { toMessage } from '../_shared/errors.ts';

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

Deno.serve(async (req) => {
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
    const navClicks = await getNavClickMetrics(supabase);

    if (format === 'prometheus') {
      const prometheusMetrics = formatPrometheusMetrics(metrics, navClicks);
      return new Response(prometheusMetrics, {
        headers: { ...corsHeaders, 'Content-Type': 'text/plain; version=0.0.4' },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: now.toISOString(),
        time_range: timeRange,
        metrics,
        nav_clicks: navClicks,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (err: unknown) {
    console.error('Metrics collection error:', err);

    return new Response(
      JSON.stringify({
        success: false,
        error: toMessage(err),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
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
        .lte('created_at', endTime.toISOString()),
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
        .lte('resolved_at', endTime.toISOString()),
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
      policy_pass_rate: policyEvaluations.count > 0
        ? 1 - (policyTriggers / policyEvaluations.count)
        : 1,

      hil_queue_size: queueSize.count || 0,
      hil_average_resolution_time: averageResolutionTime,

      http_request_duration_avg: 150, // Mock data
      invoice_processing_duration_avg: 2500, // Mock data in ms
    };
  } catch (err: unknown) {
    console.error('Error collecting metrics:', err);
    throw err;
  }
}

async function getNavClickMetrics(
  supabase: any,
): Promise<{ total: number; by_href: Record<string, number> }> {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('metadata')
      .eq('event_type', 'nav_click')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24h

    if (error) throw error;

    const by_href: Record<string, number> = {};
    data?.forEach((log: any) => {
      const href = log.metadata?.href || 'unknown';
      by_href[href] = (by_href[href] || 0) + 1;
    });

    return { total: data?.length || 0, by_href };
  } catch {
    return { total: 0, by_href: {} };
  }
}

function formatPrometheusMetrics(
  metrics: MetricsData,
  navClicks?: { total: number; by_href: Record<string, number> },
): string {
  const body = [
    '# HELP einvoice_validated_total Validated e-invoices',
    '# TYPE einvoice_validated_total counter',
    `einvoice_validated_total ${metrics.invoice_autoapproved_total}`,
    '# HELP peppol_send_fail_total Failed Peppol sends',
    '# TYPE peppol_send_fail_total counter',
    `peppol_send_fail_total ${metrics.ocr_failures_total}`,
    '# HELP policy_eval_total Policy evaluations',
    '# TYPE policy_eval_total counter',
    `policy_eval_total ${metrics.policy_evaluations_total}`,
    '# HELP fraud_flags_total Fraud flags emitted',
    '# TYPE fraud_flags_total counter',
    `fraud_flags_total ${metrics.fraud_flags_total}`,
    '# HELP ocr_errors_total OCR pipeline errors',
    '# TYPE ocr_errors_total counter',
    `ocr_errors_total ${metrics.ocr_failures_total}`,
    '# HELP nav_link_clicks_total Total navigation link clicks',
    '# TYPE nav_link_clicks_total counter',
    `nav_link_clicks_total ${navClicks?.total || 0}`,
  ];

  // Add per-href metrics
  if (navClicks?.by_href) {
    for (const [href, count] of Object.entries(navClicks.by_href)) {
      body.push(`nav_link_clicks_total{href="${href}"} ${count}`);
    }
  }

  return body.join('\n') + '\n';
}
