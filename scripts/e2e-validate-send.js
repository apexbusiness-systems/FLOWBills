#!/usr/bin/env node
/**
 * E2E validation and send test script
 * Usage: node scripts/e2e-validate-send.js
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  console.log('🧪 E2E Test: Validate and Send BIS3 Invoice\n');

  // Load fixture
  const bis3Xml = fs.readFileSync('fixtures/bis3.xml', 'utf-8');
  const documentId = `TEST-${Date.now()}`;

  // Step 1: Validate
  console.log(`📝 Step 1: Validating document ${documentId}...`);
  const { data: validateResp, error: validateError } = await supabase.functions.invoke(
    'einvoice_validate',
    {
      body: {
        document_id: documentId,
        xml_content: bis3Xml,
        format: 'bis30',
        tenant_id: 'test-tenant',
      },
    }
  );

  if (validateError) {
    console.error('❌ Validation failed:', validateError);
    process.exit(1);
  }

  console.log('✅ Validation response:', JSON.stringify(validateResp, null, 2));

  if (!validateResp.validation_passed) {
    console.error('❌ Validation did not pass:', validateResp.errors);
    process.exit(1);
  }

  // Step 2: Send
  console.log(`\n📤 Step 2: Sending document ${documentId}...`);
  const { data: sendResp, error: sendError } = await supabase.functions.invoke(
    'einvoice_send',
    {
      body: {
        document_id: documentId,
        sender_participant_id: '0088:1234567890123',
        receiver_participant_id: '0088:0987654321098',
        tenant_id: 'test-tenant',
      },
    }
  );

  if (sendError) {
    console.error('❌ Send failed:', sendError);
    process.exit(1);
  }

  console.log('✅ Send response:', JSON.stringify(sendResp, null, 2));

  // Step 3: Check Metrics
  console.log('\n📊 Step 3: Checking metrics...');
  const { data: metricsResp, error: metricsError } = await supabase.functions.invoke(
    'metrics',
    { body: {} }
  );

  if (metricsError) {
    console.error('⚠️  Metrics check failed:', metricsError);
  } else {
    console.log('✅ Metrics:', JSON.stringify(metricsResp, null, 2));
  }

  console.log('\n🎉 E2E test completed successfully!');
}

main().catch((err) => {
  console.error('💥 Unexpected error:', err);
  process.exit(1);
});
