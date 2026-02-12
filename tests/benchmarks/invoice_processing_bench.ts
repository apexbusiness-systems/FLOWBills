
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Mocks ---

class MockSupabase {
  public dbCalls = 0;
  public storageCalls = 0;

  from(table: string) {
    return new MockQueryBuilder(this, table);
  }

  get storage() {
    return {
      from: (_bucket: string) => ({
        download: async (_path: string) => {
          this.storageCalls++;
          await delay(50); // Simulate network latency for download
          return { data: new Blob(['mock content']), error: null };
        }
      })
    };
  }

  // Edge Function invoke simulation
  functions = {
    invoke: async (_funcName: string, _options: any) => {
      // Not counting this as a DB call directly, but it's an API call
      await delay(200); // Simulate heavy processing
      return { data: { success: true }, error: null };
    }
  }
}

class MockQueryBuilder {
  constructor(private client: MockSupabase, private _table: string) {}

  select(_columns: string) { return this; }
  eq(_col: string, _val: any) { return this; }
  in(_col: string, _val: any) { return this; }

  update(_data: any) {
    return this;
  }

  // Make it awaitable
  then(resolve: (value: any) => void, _reject: (reason?: any) => void) {
    this.client.dbCalls++;
    // Simulate DB latency
    return delay(30).then(() => {
      resolve({ data: [], error: null });
    });
  }
}

// Mock extractInvoiceData hook function
async function mockExtractInvoiceData(_invoiceId: string, _fileContent: string) {
  await delay(200); // Simulate extraction time
  return { success: true };
}

// --- Scenarios ---

async function runSequential(documents: any[], supabase: MockSupabase) {
  const start = performance.now();
  const newInvoiceId = 'inv_123';

  // 1. Sequential Update
  for (const doc of documents) {
    await supabase
      .from('invoice_documents')
      .update({ invoice_id: newInvoiceId })
      .eq('id', doc.id);
  }

  // 2. Sequential Extraction
  for (const doc of documents) {
    const { data, error } = await supabase.storage
      .from('invoice-documents')
      .download(doc.file_path);

    if (error) continue;

    // Simulate file reading/base64 conversion
    await delay(10);

    await mockExtractInvoiceData(newInvoiceId, 'base64content');
  }

  return performance.now() - start;
}

async function runOptimized(documents: any[], supabase: MockSupabase) {
  const start = performance.now();
  const newInvoiceId = 'inv_123';

  // 1. Batched Update
  if (documents.length > 0) {
    const docIds = documents.map(d => d.id);
    await supabase
      .from('invoice_documents')
      .update({ invoice_id: newInvoiceId })
      .in('id', docIds);
  }

  // 2. Parallel Extraction
  await Promise.all(documents.map(async (doc) => {
    try {
      const { data, error } = await supabase.storage
        .from('invoice-documents')
        .download(doc.file_path);

      if (error) return;

      // Simulate file reading/base64 conversion
      await delay(10);

      await mockExtractInvoiceData(newInvoiceId, 'base64content');
    } catch (e) {
      // Handle error
    }
  }));

  return performance.now() - start;
}

// --- Runner ---

async function main() {
  console.log("Starting Invoice Processing Benchmark...");

  const documents = Array.from({ length: 5 }, (_, i) => ({
    id: `doc_${i}`,
    file_path: `path/to/doc_${i}.pdf`,
    file_name: `doc_${i}.pdf`
  }));

  // Run Sequential
  const sbSeq = new MockSupabase();
  const timeSeq = await runSequential(documents, sbSeq);
  console.log(`\n[Sequential (N=${documents.length})]`);
  console.log(`Time: ${timeSeq.toFixed(2)}ms`);
  console.log(`DB Calls: ${sbSeq.dbCalls}`);
  console.log(`Storage Calls: ${sbSeq.storageCalls}`); // Storage calls are not reduced, but parallelized

  // Run Optimized
  const sbOpt = new MockSupabase();
  const timeOpt = await runOptimized(documents, sbOpt);
  console.log(`\n[Optimized (N=${documents.length})]`);
  console.log(`Time: ${timeOpt.toFixed(2)}ms`);
  console.log(`DB Calls: ${sbOpt.dbCalls}`);
  console.log(`Storage Calls: ${sbOpt.storageCalls}`);

  console.log(`\n[Comparison]`);
  console.log(`Speedup: ${(timeSeq / timeOpt).toFixed(2)}x`);
  console.log(`DB Calls Reduction: ${sbSeq.dbCalls} -> ${sbOpt.dbCalls}`);
}

main();
