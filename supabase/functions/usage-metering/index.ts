// P3: Usage Metering Job - Nightly MTD Reporting (America/Edmonton timezone)
import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import pLimit from "p-limit";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Retry wrapper for Stripe API calls with exponential backoff
async function reportUsageToStripe(
  stripe: any,
  subscriptionItemId: string,
  quantity: number,
  timestamp: number,
  retries = 3
): Promise<boolean> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
        quantity,
        timestamp,
        action: 'set',
      });
      return true;
    } catch (error: any) {
      if (error.type === 'StripeRateLimitError' && attempt < retries) {
        // Exponential backoff: 2^attempt * 1000ms
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }
      console.error(`Stripe error (attempt ${attempt}/${retries}):`, error);
      if (attempt === retries) return false;
    }
  }
  return false;
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

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Get current period in America/Edmonton timezone
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Edmonton',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    
    const [month, day, year] = formatter.format(now).split('/');
    const periodStart = new Date(`${year}-${month}-01T00:00:00-06:00`); // MST offset
    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    console.log(`Metering period: ${periodStart.toISOString()} to ${periodEnd.toISOString()}`);

    // STEP 1: Batch fetch all active subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('billing_subscriptions')
      .select('id, customer_id, stripe_subscription_id, plan_id')
      .eq('status', 'active');

    if (subError) throw subError;

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No active subscriptions found',
        processed: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // STEP 2: Batch fetch usage metrics using RPC
    const customerIds = subscriptions.map((s: any) => s.customer_id);
    const { data: usageMetrics, error: rpcError } = await supabase
      .rpc('get_usage_metrics_batch', {
        p_period_start: periodStart.toISOString(),
        p_period_end: periodEnd.toISOString(),
        p_customer_ids: customerIds,
      });

    if (rpcError) throw rpcError;

    // STEP 3: Create lookup map for O(1) access
    const usageMap = new Map(
      (usageMetrics || []).map((m: any) => [m.customer_id, m])
    );

    // STEP 4: Prepare bulk upsert data
    const billingUsageRecords = subscriptions.map((sub: any) => {
      const usage = usageMap.get(sub.customer_id) || { invoice_count: 0 };
      return {
        customer_id: sub.customer_id,
        metric: 'invoices_processed',
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
        quantity: usage.invoice_count,
      };
    });

    // STEP 5: Bulk upsert (single query)
    const { error: upsertError } = await supabase
      .from('billing_usage')
      .upsert(billingUsageRecords, {
        onConflict: 'customer_id,metric,period_start,period_end',
      });

    if (upsertError) {
      console.error('Failed to bulk upsert usage records:', upsertError);
      throw upsertError;
    }

    // STEP 6: Parallel Stripe API calls with concurrency control
    const limit = pLimit(10);
    const timestamp = Math.floor(now.getTime() / 1000);

    const stripeReportingTasks = subscriptions.map((sub: any) =>
      limit(async () => {
        const usage = usageMap.get(sub.customer_id) || { invoice_count: 0 };

        try {
          // Fetch Stripe subscription (cached by Stripe SDK ideally, but here distinct calls)
          const stripeSubscription = await stripe.subscriptions.retrieve(
            sub.stripe_subscription_id
          );

          const usageItem = stripeSubscription.items.data.find(
            (item: { price: { recurring?: { usage_type?: string } } }) => item.price.recurring?.usage_type === 'metered'
          );

          if (!usageItem) {
            return { customer_id: sub.customer_id, reported: false, reason: 'No metered item' };
          }

          // Report usage with retry
          const success = await reportUsageToStripe(
            stripe,
            usageItem.id,
            usage.invoice_count,
            timestamp
          );

          return {
            customer_id: sub.customer_id,
            quantity: usage.invoice_count,
            reported: success
          };
        } catch (error) {
          console.error(`Stripe reporting failed for ${sub.customer_id}:`, error);
          return {
            customer_id: sub.customer_id,
            reported: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    const results = await Promise.allSettled(stripeReportingTasks);

    // STEP 7: Batch update reported_to_stripe_at for successful reports
    const successfulCustomerIds = results
      .filter((r) => r.status === 'fulfilled' && r.value.reported)
      .map((r: any) => r.value.customer_id);

    if (successfulCustomerIds.length > 0) {
      const { error: updateError } = await supabase
        .from('billing_usage')
        .update({ reported_to_stripe_at: now.toISOString() })
        .in('customer_id', successfulCustomerIds)
        .eq('period_start', periodStart.toISOString()); // Ensure we update the correct period

      if (updateError) {
         console.error('Failed to update reported status:', updateError);
         // Non-fatal, just means we might retry later if logic depended on this flag
      }
    }

    const processed = results.length;
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.reported).length;
    const failed = results.filter(r => r.status === 'rejected' || !r.value.reported).length;

    return new Response(JSON.stringify({
      success: true,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      processed,
      successful,
      failed,
      results: results.map(r => r.status === 'fulfilled' ? r.value : { error: r.reason }),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    console.error('Usage metering error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
