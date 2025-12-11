// P3: Usage Metering Job - Nightly MTD Reporting (America/Edmonton timezone)
import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Get all active subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('billing_subscriptions')
      .select('id, customer_id, stripe_subscription_id, plan_id')
      .eq('status', 'active');

    if (subError) throw subError;

    const results = [];

    for (const subscription of subscriptions || []) {
      // Count invoices processed in this period
      const { data: customer } = await supabase
        .from('billing_customers')
        .select('user_id')
        .eq('id', subscription.customer_id)
        .single();

      if (!customer) continue;

      const { count } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', customer.user_id)
        .gte('created_at', periodStart.toISOString())
        .lt('created_at', periodEnd.toISOString());

      const quantity = count || 0;

      // Upsert usage record (idempotent by unique constraint)
      const { error: usageError } = await supabase
        .from('billing_usage')
        .upsert({
          customer_id: subscription.customer_id,
          metric: 'invoices_processed',
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          quantity,
        }, {
          onConflict: 'customer_id,metric,period_start,period_end',
        });

      if (usageError) {
        console.error(`Failed to store usage for ${subscription.customer_id}:`, usageError);
        continue;
      }

      // Report to Stripe with 'set' action (idempotent)
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
        const usageItem = stripeSubscription.items.data.find(
          (item: { price: { recurring?: { usage_type?: string } } }) => item.price.recurring?.usage_type === 'metered'
        );

        if (usageItem) {
          await stripe.subscriptionItems.createUsageRecord(usageItem.id, {
            quantity,
            timestamp: Math.floor(now.getTime() / 1000),
            action: 'set', // Idempotent: always sets to absolute value
          });

          await supabase
            .from('billing_usage')
            .update({ reported_to_stripe_at: now.toISOString() })
            .eq('customer_id', subscription.customer_id)
            .eq('period_start', periodStart.toISOString());

          results.push({
            customer_id: subscription.customer_id,
            quantity,
            reported: true,
          });
        }
      } catch (stripeErr) {
        console.error(`Stripe reporting failed for ${subscription.customer_id}:`, stripeErr);
        results.push({
          customer_id: subscription.customer_id,
          quantity,
          reported: false,
          error: stripeErr instanceof Error ? stripeErr.message : 'Unknown error',
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      processed: results.length,
      results,
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