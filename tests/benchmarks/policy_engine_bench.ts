
// To run this benchmark:
// bun tests/benchmarks/policy_engine_bench.ts

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Mocks ---

class MockSupabase {
  public dbCalls = 0;

  from(table: string) {
    return new MockQueryBuilder(this, table);
  }
}

class MockQueryBuilder {
  constructor(private client: MockSupabase, private table: string) {}

  select(columns: string) { return this; }
  eq(col: string, val: any) { return this; }
  in(col: string, val: any) { return this; }

  async insert(data: any) {
    this.client.dbCalls++;
    await delay(10); // Simulate DB latency per insert
    return { data: null, error: null };
  }

  update(data: any) {
    return this;
  }

  // Chainable update().eq() needs to handle the promise at the end
  async then(resolve: any, reject: any) {
    // If it's an update, we count the call here when awaited
    if (this.table === 'einvoice_documents') {
       this.client.dbCalls++;
       await delay(10);
    }
    resolve({ data: null, error: null });
  }
}

// --- Data ---

const triggeredPolicies = Array.from({ length: 20 }, (_, i) => ({
  policy_name: `Policy ${i}`,
  actions: [
    { type: 'require_manual_review', priority: 1 },
    { type: 'flag_for_fraud', risk_score: 80 },
    { type: 'update_status', new_status: 'rejected' } // Only the last one really matters for status
  ]
}));

const document = { id: 'doc_123' };
const tenant_id = 'tenant_abc';

// --- Old Logic ---

async function runOldLogic(supabase: MockSupabase) {
  const start = performance.now();
  let finalDecision = 'approved';
  const executedActions: any[] = [];

  for (const policy of triggeredPolicies) {
    for (const action of policy.actions || []) {
      switch (action.type) {
        case 'require_manual_review':
          finalDecision = 'requires_review';
          await supabase.from('review_queue').insert({
            invoice_id: document.id,
            reason: `Policy triggered: ${policy.policy_name}`,
            priority: action.priority || 3,
            flagged_fields: { policy_triggered: true, policy_name: policy.policy_name }
          });
          executedActions.push({ policy: policy.policy_name, action: 'routed_to_review' });
          break;
        case 'flag_for_fraud':
          await supabase.from('fraud_flags_einvoice').insert({
            document_id: document.id,
            flag_type: action.flag_type || 'vendor_mismatch',
            risk_score: action.risk_score || 50,
            details: { policy_triggered: policy.policy_name, ...action.details },
            tenant_id: tenant_id
          });
          executedActions.push({ policy: policy.policy_name, action: 'flagged_for_fraud' });
          break;
        case 'update_status':
          await supabase
            .from('einvoice_documents')
            .update({ status: action.new_status })
            .eq('id', document.id);
          executedActions.push({ policy: policy.policy_name, action: 'status_updated', new_status: action.new_status });
          break;
      }
    }
  }
  return performance.now() - start;
}

// --- New Logic ---

async function runNewLogic(supabase: MockSupabase) {
  const start = performance.now();
  let finalDecision = 'approved';
  const executedActions: any[] = [];

  const reviewQueueInserts: any[] = [];
  const fraudFlagInserts: any[] = [];
  let finalStatusUpdate: string | null = null;

  for (const policy of triggeredPolicies) {
    for (const action of policy.actions || []) {
      switch (action.type) {
        case 'require_manual_review':
          finalDecision = 'requires_review';
          reviewQueueInserts.push({
            invoice_id: document.id,
            reason: `Policy triggered: ${policy.policy_name}`,
            priority: action.priority || 3,
            flagged_fields: { policy_triggered: true, policy_name: policy.policy_name }
          });
          executedActions.push({ policy: policy.policy_name, action: 'routed_to_review' });
          break;
        case 'flag_for_fraud':
          fraudFlagInserts.push({
            document_id: document.id,
            flag_type: action.flag_type || 'vendor_mismatch',
            risk_score: action.risk_score || 50,
            details: { policy_triggered: policy.policy_name, ...action.details },
            tenant_id: tenant_id
          });
          executedActions.push({ policy: policy.policy_name, action: 'flagged_for_fraud' });
          break;
        case 'update_status':
          finalStatusUpdate = action.new_status;
          executedActions.push({ policy: policy.policy_name, action: 'status_updated', new_status: action.new_status });
          break;
      }
    }
  }

  // Batch Executions in Parallel
  const promises = [];

  if (reviewQueueInserts.length > 0) {
    promises.push(supabase.from('review_queue').insert(reviewQueueInserts));
  }

  if (fraudFlagInserts.length > 0) {
    promises.push(supabase.from('fraud_flags_einvoice').insert(fraudFlagInserts));
  }

  if (finalStatusUpdate) {
    promises.push(
      supabase
        .from('einvoice_documents')
        .update({ status: finalStatusUpdate })
        .eq('id', document.id)
    );
  }

  await Promise.all(promises);

  return performance.now() - start;
}

// --- Main Runner ---

async function main() {
  console.log("Starting Policy Engine Benchmark...");

  // Run Old
  const sbOld = new MockSupabase();
  const timeOld = await runOldLogic(sbOld);
  console.log(`\n[Old Logic]`);
  console.log(`Time: ${timeOld.toFixed(2)}ms`);
  console.log(`DB Calls: ${sbOld.dbCalls}`); // Expect 20 policies * 3 actions = 60 calls

  // Run New
  const sbNew = new MockSupabase();
  const timeNew = await runNewLogic(sbNew);
  console.log(`\n[New Logic]`);
  console.log(`Time: ${timeNew.toFixed(2)}ms`);
  console.log(`DB Calls: ${sbNew.dbCalls}`); // Expect ~3 calls (1 batch insert reviews, 1 batch insert fraud, 1 update status)

  console.log(`\n[Comparison]`);
  console.log(`Speedup: ${(timeOld / timeNew).toFixed(2)}x`);
  console.log(`IO Reduction: ${((1 - sbNew.dbCalls / sbOld.dbCalls) * 100).toFixed(1)}%`);
}

main();
