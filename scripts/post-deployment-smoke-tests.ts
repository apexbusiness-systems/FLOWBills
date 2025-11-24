#!/usr/bin/env node
/**
 * Post-Deployment Smoke Tests for FLOWBills.ca
 * Tests all critical user flows in production environment
 * 
 * Usage: SUPABASE_URL=https://your-project.supabase.co SUPABASE_ANON_KEY=your-key node scripts/post-deployment-smoke-tests.ts
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ullqluvzkgnwwqijhvjr.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsbHFsdXZ6a2dud3dxaWpodmpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2MTY2OTEsImV4cCI6MjA3NDE5MjY5MX0.UjijCIx4OrtbSgmyDqdf455nUPD9AS0OIgOPopzaJGI';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  duration: number;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

// Test utility functions
async function testEndpoint(name: string, url: string, options: RequestInit = {}): Promise<TestResult> {
  const start = Date.now();
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        ...options.headers,
      },
    });
    
    const duration = Date.now() - start;
    
    if (!response.ok) {
      const text = await response.text();
      return {
        name,
        status: 'FAIL',
        duration,
        error: `HTTP ${response.status}: ${text}`,
      };
    }
    
    const data = await response.json();
    return {
      name,
      status: 'PASS',
      duration,
      details: data,
    };
  } catch (error) {
    const duration = Date.now() - start;
    return {
      name,
      status: 'FAIL',
      duration,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function testHealthEndpoint(path: string): Promise<TestResult> {
  return testEndpoint(
    `Health Check: ${path}`,
    `${SUPABASE_URL}/functions/v1/health-check${path}`,
    { method: 'GET' }
  );
}

async function testEdgeFunction(name: string, payload: any): Promise<TestResult> {
  return testEndpoint(
    `Edge Function: ${name}`,
    `${SUPABASE_URL}/functions/v1/${name}`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

// Test suites
async function testSystemHealth() {
  console.log('\n🏥 Testing System Health...\n');
  
  // Test /healthz endpoint
  results.push(await testHealthEndpoint('/healthz'));
  
  // Test /readyz endpoint (includes DB connectivity)
  results.push(await testHealthEndpoint('/readyz'));
  
  // Test /metrics endpoint
  const metricsResult = await testEndpoint(
    'Metrics Endpoint',
    `${SUPABASE_URL}/functions/v1/health-check/metrics`,
    { method: 'GET' }
  );
  results.push(metricsResult);
}

async function testInvoiceProcessing() {
  console.log('\n📄 Testing Invoice Processing Flow...\n');
  
  // Test duplicate check
  results.push(await testEdgeFunction('duplicate-check', {
    invoice_number: 'TEST-SMOKE-001',
    vendor_name: 'Test Vendor',
    amount: 1000.00,
    invoice_date: '2025-01-14',
    po_number: 'PO-TEST-001',
  }));
  
  // Test e-invoice validation
  results.push(await testEdgeFunction('einvoice_validate', {
    document_id: 'SMOKE-TEST-001',
    xml_content: '<?xml version="1.0" encoding="UTF-8"?><Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"><cbc:ID>SMOKE-001</cbc:ID><cbc:IssueDate>2025-01-14</cbc:IssueDate><cbc:DocumentCurrencyCode>CAD</cbc:DocumentCurrencyCode><cac:AccountingSupplierParty><cac:Party><cbc:EndpointID schemeID="0088">1234567890123</cbc:EndpointID><cac:PartyName><cbc:Name>Test Supplier</cbc:Name></cac:PartyName></cac:Party></cac:AccountingSupplierParty><cac:AccountingCustomerParty><cac:Party><cbc:EndpointID schemeID="0088">0987654321098</cbc:EndpointID><cac:PartyName><cbc:Name>Test Customer</cbc:Name></cac:PartyName></cac:Party></cac:AccountingCustomerParty></Invoice>',
    format: 'bis30',
    tenant_id: 'smoke-test-tenant',
  }));
  
  // Test HIL router
  results.push(await testEdgeFunction('hil-router', {
    document_id: 'SMOKE-TEST-001',
    confidence_scores: {
      invoice_number: 0.95,
      vendor_name: 0.98,
      amount: 0.92,
      date: 0.96,
    },
    extracted_data: {
      invoice_number: 'TEST-001',
      vendor_name: 'Test Vendor',
      amount: 1000.00,
    },
    validation_results: {
      duplicate_check: { passed: true },
      format_validation: { passed: true },
    },
  }));
}

async function testSecurityFeatures() {
  console.log('\n🔒 Testing Security Features...\n');
  
  // Test rate limiting (should succeed first time)
  const rateLimitTest = await testEndpoint(
    'Rate Limiting Test',
    `${SUPABASE_URL}/functions/v1/metrics`,
    { method: 'GET' }
  );
  results.push(rateLimitTest);
  
  // Test CSP reporting endpoint
  results.push(await testEdgeFunction('csp-report', {
    'csp-report': {
      'document-uri': 'https://flowbills.ca/',
      'violated-directive': 'script-src',
      'blocked-uri': 'https://evil.com/script.js',
    },
  }));
}

async function testAIFeatures() {
  console.log('\n🤖 Testing AI Features...\n');
  
  // Test AI assistant endpoint
  results.push(await testEdgeFunction('ai-assistant', {
    message: 'What is the status of invoice INV-001?',
    context: {
      user_id: 'smoke-test-user',
      tenant_id: 'smoke-test-tenant',
    },
  }));
  
  // Test AI suggestions
  results.push(await testEdgeFunction('ai-suggestions', {
    invoice_data: {
      vendor_name: 'Acme Oil Services',
      amount: 15000.00,
      line_items: [
        { description: 'Drilling services', amount: 15000.00 },
      ],
    },
  }));
}

async function testWorkflowAutomation() {
  console.log('\n⚙️ Testing Workflow Automation...\n');
  
  // Test budget alert check
  results.push(await testEdgeFunction('budget-alert-check', {
    afe_id: 'smoke-test-afe',
    current_spend: 85000,
    budget: 100000,
  }));
  
  // Test fraud detection
  results.push(await testEdgeFunction('fraud_detect', {
    invoice_id: 'smoke-test-invoice',
    vendor_name: 'Test Vendor',
    amount: 50000.00,
    payment_account: '1234567890',
  }));
}

async function testPerformance() {
  console.log('\n⚡ Testing Performance Metrics...\n');
  
  const start = Date.now();
  const responses = await Promise.all([
    fetch(`${SUPABASE_URL}/functions/v1/health-check/healthz`),
    fetch(`${SUPABASE_URL}/functions/v1/health-check/readyz`),
    fetch(`${SUPABASE_URL}/functions/v1/health-check/metrics`),
  ]);
  const duration = Date.now() - start;
  
  const allSuccessful = responses.every(r => r.ok);
  
  results.push({
    name: 'Parallel Request Performance',
    status: allSuccessful && duration < 1000 ? 'PASS' : 'WARN',
    duration,
    details: {
      parallel_requests: 3,
      target_latency: '< 1000ms',
      actual_latency: `${duration}ms`,
    },
  });
}

// Report generation
function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 POST-DEPLOYMENT SMOKE TEST REPORT');
  console.log('='.repeat(80) + '\n');
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const warned = results.filter(r => r.status === 'WARN').length;
  const total = results.length;
  
  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Warnings: ${warned}`);
  console.log(`\nSuccess Rate: ${((passed / total) * 100).toFixed(1)}%\n`);
  
  // Detailed results
  console.log('Detailed Results:\n');
  results.forEach((result, index) => {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${index + 1}. ${icon} ${result.name} (${result.duration}ms)`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    if (result.details && result.status !== 'PASS') {
      console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
    }
  });
  
  // Performance summary
  console.log('\n' + '='.repeat(80));
  console.log('⚡ PERFORMANCE SUMMARY');
  console.log('='.repeat(80) + '\n');
  
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  const maxDuration = Math.max(...results.map(r => r.duration));
  const p95Duration = results.map(r => r.duration).sort((a, b) => a - b)[Math.floor(results.length * 0.95)];
  
  console.log(`Average Response Time: ${avgDuration.toFixed(0)}ms`);
  console.log(`P95 Response Time: ${p95Duration}ms`);
  console.log(`Max Response Time: ${maxDuration}ms`);
  console.log(`Target P95: < 500ms ${p95Duration < 500 ? '✅' : '❌'}\n`);
  
  // Final verdict
  console.log('='.repeat(80));
  if (failed === 0 && warned === 0) {
    console.log('🎉 ALL SMOKE TESTS PASSED - PRODUCTION READY');
  } else if (failed === 0) {
    console.log('⚠️  SMOKE TESTS PASSED WITH WARNINGS - REVIEW RECOMMENDED');
  } else {
    console.log('❌ SMOKE TESTS FAILED - DO NOT PROCEED TO PRODUCTION');
  }
  console.log('='.repeat(80) + '\n');
  
  return failed === 0 ? 0 : 1;
}

// Main execution
async function main() {
  console.log('🚀 Starting Post-Deployment Smoke Tests...');
  console.log(`Environment: ${SUPABASE_URL}\n`);
  
  try {
    await testSystemHealth();
    await testInvoiceProcessing();
    await testSecurityFeatures();
    await testAIFeatures();
    await testWorkflowAutomation();
    await testPerformance();
    
    const exitCode = generateReport();
    process.exit(exitCode);
  } catch (error) {
    console.error('\n❌ Fatal error during smoke tests:', error);
    process.exit(1);
  }
}

main();
