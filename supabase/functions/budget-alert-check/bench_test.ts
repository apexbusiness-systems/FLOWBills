
import { assertEquals } from "https://deno.land/std@0.190.0/testing/asserts.ts";

// Mock data
const MOCK_RULES = Array.from({ length: 100 }, (_, i) => ({
  id: `rule_${i}`,
  user_id: `user_${i}`,
  rule_name: `Rule ${i}`,
  alert_type: 'threshold',
  threshold_value: 1000,
  email_recipients: [`user${i}@example.com`],
  is_active: true,
  last_triggered_at: null,
}));

const MOCK_AFES = (userId: string) => Array.from({ length: 5 }, (_, i) => ({
  id: `afe_${userId}_${i}`,
  user_id: userId,
  afe_number: `AFE-${userId}-${i}`,
  budget_amount: 10000,
  spent_amount: 9500, // 500 remaining < 1000 threshold
  status: 'active',
  well_name: `Well ${i}`,
}));

// Mock Supabase Client
class MockSupabaseClient {
  public queries = 0;

  from(table: string) {
    return new MockQueryBuilder(table, this);
  }
}

class MockQueryBuilder {
  constructor(private table: string, private client: MockSupabaseClient) {}

  select(columns: string) {
    return this;
  }

  eq(column: string, value: any) {
    return this;
  }

  gte(column: string, value: any) {
    return this;
  }

  limit(count: number) {
    return this;
  }

  insert(data: any) {
    // In real Supabase, insert is a builder too
    return this;
  }

  update(data: any) {
    // Update returns a builder
    return this;
  }

  async then(resolve: any, reject: any) {
    this.client.queries++;

    // Simulate latency
    await new Promise(r => setTimeout(r, 1));

    if (this.table === 'budget_alert_rules') {
        // Return all rules
        resolve({ data: MOCK_RULES, error: null });
    } else if (this.table === 'afes') {
        // Return AFEs for a user (we don't track the specific eq call in this simple mock, just return generic data)
        // In the real code, it filters by user_id. We'll return 5 AFEs.
        // To be more accurate, we should capture the user_id from .eq, but for N+1 proof, just returning data is enough.
        resolve({ data: MOCK_AFES('mock_user'), error: null });
    } else if (this.table === 'budget_alert_logs') {
        // Check for recent alerts - return empty to trigger alert
        resolve({ data: [], error: null });
    } else {
        resolve({ data: [], error: null });
    }
  }
}

// Baseline implementation (Copy of index.ts logic)
async function runBaseline(supabase: any) {
  console.log('Starting baseline benchmark...');
  const start = performance.now();
  let emailCount = 0;

  // 1. Fetch all active alert rules
  const { data: rules } = await supabase
    .from('budget_alert_rules')
    .select('*')
    .eq('is_active', true);

  if (!rules) return;

  // 2. Check each rule
  for (const rule of rules) {
    // N+1: Fetch AFEs for this user
    const { data: afes } = await supabase
      .from('afes')
      .select('*')
      .eq('user_id', rule.user_id)
      .eq('status', 'active');

    if (!afes) continue;

    for (const afe of afes) {
      const budgetAmount = Number(afe.budget_amount);
      const spentAmount = Number(afe.spent_amount);
      const remainingAmount = budgetAmount - spentAmount;
      const utilizationPercentage = (spentAmount / budgetAmount) * 100;

      let shouldAlert = false;
      // Simple logic check (threshold is 1000, remaining is 500)
      if (remainingAmount <= rule.threshold_value) {
        shouldAlert = true;
      }

      if (shouldAlert) {
        // N+1: Check recent alerts
        const { data: recentAlerts } = await supabase
          .from('budget_alert_logs')
          .select('id')
          .eq('afe_id', afe.id)
          .eq('alert_rule_id', rule.id)
          .gte('created_at', '2023-01-01') // simplified
          .limit(1);

        if (recentAlerts && recentAlerts.length > 0) continue;

        // N+1: Insert log
        await supabase.from('budget_alert_logs').insert({});

        // N+1: Send Email (mocked)
        emailCount++;
        await new Promise(r => setTimeout(r, 10)); // Mock email latency

        // N+1: Update rule
        await supabase
            .from('budget_alert_rules')
            .update({ last_triggered_at: new Date().toISOString() })
            .eq('id', rule.id);
      }
    }
  }

  const duration = performance.now() - start;
  return {
    duration,
    queries: supabase.queries,
    emailCount
  };
}

Deno.test("Baseline Performance Test", async () => {
  const mockSupabase = new MockSupabaseClient();
  const result = await runBaseline(mockSupabase);

  console.log('\n--- Baseline Results ---');
  console.log(`Duration: ${result?.duration.toFixed(2)}ms`);
  console.log(`DB Queries: ${result?.queries}`);
  console.log(`Emails Sent: ${result?.emailCount}`);

  // Assertions for N+1 behavior
  // 100 rules
  // 1 query for rules
  // 100 queries for AFEs
  // 5 AFEs per rule -> 500 total AFEs
  // Each triggers alert -> 500 checks for recent logs
  // 500 inserts
  // 500 updates
  // Total ~ 1 + 100 + 500 + 500 + 500 = ~1601 queries

  // We expect a high number of queries
  if (result) {
      assertEquals(result.queries > 1000, true, "Should have N+1 query behavior");
  }
});
