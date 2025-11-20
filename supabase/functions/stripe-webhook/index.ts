// P2: Stripe Webhook Handler - Idempotent Processing
import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET');

    if (!signature || !webhookSecret) {
      throw new Error('Missing signature or webhook secret');
    }

    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Idempotency check - prevent duplicate processing
    const { data: existingEvent } = await supabase
      .from('billing_events')
      .select('id')
      .eq('stripe_event_id', event.id)
      .single();

    if (existingEvent) {
      console.log(`Event ${event.id} already processed`);
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Store event for idempotency
    await supabase.from('billing_events').insert({
      stripe_event_id: event.id,
      event_type: event.type,
      event_data: event.data,
    });

    // Process different event types
    switch (event.type) {
      case 'customer.created':
      case 'customer.updated': {
        const customer = event.data.object as Stripe.Customer;
        await supabase.from('billing_customers').upsert({
          stripe_customer_id: customer.id,
          user_id: customer.metadata?.user_id,
          email: customer.email,
        }, { onConflict: 'stripe_customer_id' });
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const { data: customer } = await supabase
          .from('billing_customers')
          .select('id')
          .eq('stripe_customer_id', subscription.customer as string)
          .single();

        if (customer) {
          await supabase.from('billing_subscriptions').upsert({
            customer_id: customer.id,
            stripe_subscription_id: subscription.id,
            stripe_price_id: subscription.items.data[0]?.price.id,
            plan_id: subscription.items.data[0]?.price.metadata?.plan_id || 'starter',
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
          }, { onConflict: 'stripe_subscription_id' });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await supabase
          .from('billing_subscriptions')
          .update({ status: 'canceled' })
          .eq('stripe_subscription_id', subscription.id);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`Payment succeeded for invoice ${invoice.id}`);
        // Log to security_events for audit trail
        await supabase.from('security_events').insert({
          event_type: 'payment_succeeded',
          severity: 'info',
          details: {
            invoice_id: invoice.id,
            amount: invoice.amount_paid,
            customer: invoice.customer,
          },
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.error(`Payment failed for invoice ${invoice.id}`);
        await supabase.from('security_events').insert({
          event_type: 'payment_failed',
          severity: 'high',
          details: {
            invoice_id: invoice.id,
            customer: invoice.customer,
            attempt_count: invoice.attempt_count,
          },
        });
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    console.error('Webhook error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});