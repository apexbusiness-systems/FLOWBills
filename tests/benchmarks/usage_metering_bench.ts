
// To run this benchmark:
// bun add p-limit
// bun tests/benchmarks/usage_metering_bench.ts

import pLimit from "p-limit";

// --- Helpers ---

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Mocks ---

class MockSupabase {
  public dbCalls = 0;

  from(table: string) {
    return new MockQueryBuilder(this, table);
  }

  rpc(func: string, args: any) {
    this.dbCalls++;
    return delay(50).then(() => {
           if (func === 'get_usage_metrics_batch') {
             const customerIds = args.p_customer_ids;
             const data = customerIds.map((cid: string) => ({
               customer_id: cid,
               user_id: `user_${cid}`,
               invoice_count: Math.floor(Math.random() * 10)
             }));
             return { data, error: null };
           }
           return { data: [], error: null };
        });
  }
}

class MockQueryBuilder {
  constructor(private client: MockSupabase, private table: string) {}

  select(columns: string, options?: any) { return this; }
  eq(col: string, val: any) { return this; }
  gte(col: string, val: any) { return this; }
  lt(col: string, val: any) { return this; }
  in(col: string, val: any) { return this; } // Added 'in' method

  single() {
    this.client.dbCalls++;
    return delay(50).then(() => ({ data: { user_id: 'user_123' }, error: null }));
  }

  upsert(data: any, options?: any) {
    this.client.dbCalls++;
    return delay(50).then(() => ({ error: null }));
  }

  update(data: any) { return this; }

  then(cb: any, errCb?: any) {
    this.client.dbCalls++;
    return delay(50).then(() => {
      let data: any = [];
      if (this.table === 'billing_subscriptions') {
        data = Array.from({ length: 100 }, (_, i) => ({
            id: `sub_${i}`,
            customer_id: `cust_${i}`,
            stripe_subscription_id: `sub_stripe_${i}`,
            plan_id: 'plan_123'
        }));
      } else if (this.table === 'invoices') {
          return cb({ count: 5, data: [], error: null });
      }
      return cb({ data, error: null });
    });
  }
}

class MockStripe {
  public apiCalls = 0;

  subscriptions = {
    retrieve: async (id: string) => {
      this.apiCalls++;
      await delay(50);
      return {
        items: {
          data: [
            { id: `si_${id}`, price: { recurring: { usage_type: 'metered' } } }
          ]
        }
      };
    }
  };

  subscriptionItems = {
    createUsageRecord: async (id: string, params: any) => {
      this.apiCalls++;
      await delay(50);
      return {};
    }
  };
}

// --- Old Logic Simulation ---

async function runOldLogic(supabase: MockSupabase, stripe: MockStripe) {
  const start = performance.now();

  const { data: subscriptions } = await supabase
    .from('billing_subscriptions')
    .select('*')
    .eq('status', 'active');

  for (const subscription of subscriptions || []) {
    const { data: customer } = await supabase
      .from('billing_customers')
      .select('user_id')
      .eq('id', subscription.customer_id)
      .single();

    if (!customer) continue;

    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', customer.user_id);

    const quantity = count || 0;

    await supabase
      .from('billing_usage')
      .upsert({
        customer_id: subscription.customer_id,
        quantity,
      });

    try {
      const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
      const usageItem = stripeSubscription.items.data[0];

      if (usageItem) {
        await stripe.subscriptionItems.createUsageRecord(usageItem.id, {
          quantity,
          action: 'set',
        });

        await supabase
          .from('billing_usage')
          .update({ reported_to_stripe_at: new Date().toISOString() })
          .eq('customer_id', subscription.customer_id);
      }
    } catch (stripeErr) {
      console.error(stripeErr);
    }
  }

  return performance.now() - start;
}

// --- New Logic Simulation ---

async function runNewLogic(supabase: MockSupabase, stripe: MockStripe) {
  const start = performance.now();

  // STEP 1: Batch fetch all active subscriptions
  const { data: subscriptions } = await supabase
    .from('billing_subscriptions')
    .select('*')
    .eq('status', 'active');

  if (!subscriptions) return 0;

  // STEP 2: Batch fetch usage metrics using RPC
  const customerIds = subscriptions.map((s: any) => s.customer_id);
  const { data: usageMetrics } = await supabase
    .rpc('get_usage_metrics_batch', {
        p_customer_ids: customerIds,
    });

  // STEP 3: Create lookup map
  const usageMap = new Map(
    (usageMetrics || []).map((m: any) => [m.customer_id, m])
  );

  // STEP 4: Prepare bulk upsert data
  const billingUsageRecords = subscriptions.map((sub: any) => {
    const usage = usageMap.get(sub.customer_id) || { invoice_count: 0 };
    return {
      customer_id: sub.customer_id,
      quantity: usage.invoice_count,
    };
  });

  // STEP 5: Bulk upsert
  await supabase
    .from('billing_usage')
    .upsert(billingUsageRecords);

  // STEP 6: Parallel Stripe API calls with concurrency control
  const limit = pLimit(10);

  const stripeReportingTasks = subscriptions.map((sub: any) =>
    limit(async () => {
      const usage = usageMap.get(sub.customer_id) || { invoice_count: 0 };

      const stripeSubscription = await stripe.subscriptions.retrieve(
        sub.stripe_subscription_id
      );

      const usageItem = stripeSubscription.items.data[0];

      if (usageItem) {
        await stripe.subscriptionItems.createUsageRecord(usageItem.id, {
          quantity: usage.invoice_count,
          action: 'set',
        });

        return { success: true, customer_id: sub.customer_id };
      }
      return { success: false, customer_id: sub.customer_id };
    })
  );

  const results = await Promise.allSettled(stripeReportingTasks);

  // STEP 7: Batch update reported_to_stripe_at
  const successfulCustomerIds = results
    .filter((r: any) => r.status === 'fulfilled' && r.value.success)
    .map((r: any) => r.value.customer_id);

  if (successfulCustomerIds.length > 0) {
      await supabase
        .from('billing_usage')
        .update({ reported_to_stripe_at: new Date().toISOString() })
        .in('customer_id', successfulCustomerIds);
  }

  return performance.now() - start;
}

// --- Main Runner ---

async function main() {
  console.log("Starting Benchmark...");

  // Run Old
  const sbOld = new MockSupabase();
  const stOld = new MockStripe();
  const timeOld = await runOldLogic(sbOld, stOld);
  console.log(`\n[Old Logic]`);
  console.log(`Time: ${timeOld.toFixed(2)}ms`);
  console.log(`DB Calls: ${sbOld.dbCalls}`);
  console.log(`Stripe Calls: ${stOld.apiCalls}`);
  console.log(`Total IO: ${sbOld.dbCalls + stOld.apiCalls}`);

  // Run New
  const sbNew = new MockSupabase();
  const stNew = new MockStripe();
  const timeNew = await runNewLogic(sbNew, stNew);
  console.log(`\n[New Logic]`);
  console.log(`Time: ${timeNew.toFixed(2)}ms`);
  console.log(`DB Calls: ${sbNew.dbCalls}`);
  console.log(`Stripe Calls: ${stNew.apiCalls}`);
  console.log(`Total IO: ${sbNew.dbCalls + stNew.apiCalls}`);

  console.log(`\n[Comparison]`);
  console.log(`Speedup: ${(timeOld / timeNew).toFixed(2)}x`);
  console.log(`IO Reduction: ${((1 - (sbNew.dbCalls + stNew.apiCalls) / (sbOld.dbCalls + stOld.apiCalls)) * 100).toFixed(1)}%`);
}

main();
