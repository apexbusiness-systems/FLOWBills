
import { assertEquals } from "https://deno.land/std@0.190.0/testing/asserts.ts";
import { processBudgetAlerts } from "./core.ts";

// Mock Data
const RULES_COUNT = 100;
const AFES_PER_USER = 5;

const MOCK_RULES = Array.from({ length: RULES_COUNT }, (_, i) => ({
  id: `rule_${i}`,
  user_id: `user_${i}`,
  rule_name: `Rule ${i}`,
  alert_type: 'threshold',
  threshold_value: 1000,
  email_recipients: [`user${i}@example.com`],
  is_active: true,
  last_triggered_at: null,
}));

// Helper to generate AFEs
const generateAfes = (userIds: string[]) => {
    const afes = [];
    for (const userId of userIds) {
        for (let i=0; i<AFES_PER_USER; i++) {
            afes.push({
                id: `afe_${userId}_${i}`,
                user_id: userId,
                afe_number: `AFE-${userId}-${i}`,
                budget_amount: 10000,
                spent_amount: 9500, // 500 remaining < 1000 threshold
                status: 'active',
                well_name: `Well ${i}`,
            });
        }
    }
    return afes;
}

// Mock Supabase Client
class MockSupabaseClient {
  public queries = 0;

  from(table: string) {
    return new MockQueryBuilder(table, this);
  }
}

class MockQueryBuilder {
  private filters: any = {};

  constructor(private table: string, private client: MockSupabaseClient) {}

  select(columns: string) {
    return this;
  }

  eq(column: string, value: any) {
    this.filters[column] = value;
    return this;
  }

  in(column: string, values: any[]) {
      this.filters[column] = { in: values };
      return this;
  }

  gte(column: string, value: any) {
    return this;
  }

  limit(count: number) {
    return this;
  }

  insert(data: any) {
    // Bulk insert counts as 1 query
    this.client.queries++;
    return { error: null };
  }

  update(data: any) {
    // Bulk update counts as 1 query
    this.client.queries++;
    return this;
  }

  async then(resolve: any, reject: any) {
    this.client.queries++;

    // Simulate latency
    await new Promise(r => setTimeout(r, 1));

    if (this.table === 'budget_alert_rules') {
        resolve({ data: MOCK_RULES, error: null });
    } else if (this.table === 'afes') {
        // Handle .in('user_id', ...)
        let afes = [];
        if (this.filters['user_id'] && this.filters['user_id'].in) {
            afes = generateAfes(this.filters['user_id'].in);
        } else {
            // Fallback or specific user eq
             afes = generateAfes(MOCK_RULES.map(r => r.user_id));
        }
        resolve({ data: afes, error: null });
    } else if (this.table === 'budget_alert_logs') {
        // Return empty logs to trigger alerts
        resolve({ data: [], error: null });
    } else {
        resolve({ data: [], error: null });
    }
  }
}

Deno.test("Optimized Performance Test", async () => {
  const mockSupabase = new MockSupabaseClient();
  let emailCount = 0;

  const mockSendEmail = async (params: any) => {
      emailCount++;
      await new Promise(r => setTimeout(r, 10)); // Mock latency
      return true;
  };

  const metrics = await processBudgetAlerts(mockSupabase as any, mockSendEmail, 50, 10); // Batch 50

  console.log('\n--- Optimized Results ---');
  console.log(`Duration: ${metrics.duration_ms.toFixed(2)}ms`);
  console.log(`DB Queries: ${mockSupabase.queries}`);
  console.log(`Emails Sent: ${emailCount}`);
  console.log(`Alerts Triggered: ${metrics.alerts_triggered}`);
  console.log(`Batches: ${metrics.batches_processed}`);

  // Assertions
  // 100 rules, batch size 50 => 2 batches.
  // Queries per batch:
  // 1. Fetch AFEs
  // 2. Fetch Logs
  // 3. Insert Logs (if alerts)
  // 4. Update Rules (if alerts)
  // Total per batch = 4 queries.
  // + 1 query for fetching rules initially.
  // Total = 1 + (2 * 4) = 9 queries (approx).

  // N+1 was 1601 queries.

  assertEquals(mockSupabase.queries < 20, true, "Should have significantly reduced queries");
  assertEquals(emailCount, 500, "Should send 500 emails");
});
