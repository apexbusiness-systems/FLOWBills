#!/usr/bin/env -S deno run --allow-read --allow-run

/**
 * P11: Incident Playbook (5-minute Recovery)
 * Edge Function verification and diagnostics script
 * 
 * Usage: ./scripts/edge-verify.ts <function-name>
 */

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

interface VerificationResult {
  passed: boolean;
  message: string;
  remediation?: string;
}

async function log(message: string, color = RESET) {
  console.log(`${color}${message}${RESET}`);
}

async function runCommand(cmd: string[]): Promise<{ success: boolean; output: string }> {
  try {
    const process = new Deno.Command(cmd[0], {
      args: cmd.slice(1),
      stdout: 'piped',
      stderr: 'piped',
    });

    const { code, stdout, stderr } = await process.output();
    const output = new TextDecoder().decode(code === 0 ? stdout : stderr);

    return { success: code === 0, output };
  } catch (error) {
    return { success: false, output: error.message };
  }
}

async function checkTypeCheck(functionName: string): Promise<VerificationResult> {
  const functionPath = `supabase/functions/${functionName}/index.ts`;
  
  const { success, output } = await runCommand(['deno', 'check', functionPath]);
  
  if (success) {
    return { passed: true, message: '✓ Type check passed' };
  } else {
    return {
      passed: false,
      message: `✗ Type check failed:\n${output}`,
      remediation: 'Fix TypeScript errors in the function code'
    };
  }
}

async function checkImports(functionName: string): Promise<VerificationResult> {
  const functionPath = `supabase/functions/${functionName}/index.ts`;
  
  try {
    const content = await Deno.readTextFile(functionPath);
    
    // Check for relative imports outside supabase/functions
    const badImportRegex = /from\s+['"](\.\.\/\.\.\/|\.\.\/\.\.\/\.\.\/)/;
    if (badImportRegex.test(content)) {
      return {
        passed: false,
        message: '✗ Invalid imports: Found imports escaping supabase/functions',
        remediation: 'Use relative imports within supabase/functions or shared utilities in _shared'
      };
    }
    
    // Check for absolute imports without import map
    const absoluteImportRegex = /from\s+['"](?!https?:\/\/|npm:|\.)/;
    if (absoluteImportRegex.test(content)) {
      return {
        passed: false,
        message: '✗ Invalid imports: Found bare imports without import map',
        remediation: 'Use explicit relative imports or add to import_map.json'
      };
    }
    
    return { passed: true, message: '✓ Import validation passed' };
  } catch (error) {
    return {
      passed: false,
      message: `✗ Could not read function file: ${error.message}`,
      remediation: 'Ensure the function file exists and is readable'
    };
  }
}

async function checkImportMap(): Promise<VerificationResult> {
  try {
    const importMapPath = 'supabase/import_map.json';
    const content = await Deno.readTextFile(importMapPath);
    JSON.parse(content); // Validate JSON
    
    return { passed: true, message: '✓ Import map is valid' };
  } catch (error) {
    return {
      passed: false,
      message: `✗ Import map invalid: ${error.message}`,
      remediation: 'Fix JSON syntax in supabase/import_map.json'
    };
  }
}

  async function checkControlFunction(): Promise<VerificationResult> {
    const controlPath = 'supabase/functions/control-hello-world/index.ts';
  
  try {
    await Deno.stat(controlPath);
    const { success } = await runCommand(['deno', 'check', controlPath]);
    
    if (success) {
      return { passed: true, message: '✓ Control function is valid' };
    } else {
      return {
        passed: false,
        message: '✗ Control function has errors',
        remediation: 'This indicates infrastructure issues - the control function should always pass'
      };
    }
  } catch {
      return {
        passed: false,
        message: '✗ Control function not found',
        remediation: 'Create supabase/functions/control-hello-world/index.ts'
      };
    }
  }

async function checkNodeisms(functionName: string): Promise<VerificationResult> {
  const functionPath = `supabase/functions/${functionName}/index.ts`;
  
  try {
    const content = await Deno.readTextFile(functionPath);
    
    const nodeisms = [
      { pattern: /\brequire\s*\(/, name: 'require()' },
      { pattern: /\bprocess\./, name: 'process' },
      { pattern: /\bBuffer\./, name: 'Buffer' },
      { pattern: /__dirname/, name: '__dirname' },
      { pattern: /__filename/, name: '__filename' },
      { pattern: /\bmodule\.exports/, name: 'module.exports' },
    ];
    
    const foundNodeisms = nodeisms.filter(n => n.pattern.test(content));
    
    if (foundNodeisms.length > 0) {
      return {
        passed: false,
        message: `✗ Node.js-only APIs detected: ${foundNodeisms.map(n => n.name).join(', ')}`,
        remediation: 'Replace with Deno/Web-standard APIs'
      };
    }
    
    return { passed: true, message: '✓ No Node.js-specific APIs detected' };
  } catch (error) {
    return {
      passed: false,
      message: `✗ Could not check for Node-isms: ${error.message}`,
      remediation: 'Ensure the function file exists and is readable'
    };
  }
}

async function main() {
  const functionName = Deno.args[0];
  
  if (!functionName) {
    await log('Usage: ./scripts/edge-verify.ts <function-name>', RED);
    Deno.exit(1);
  }
  
  await log(`\n🔍 Verifying Edge Function: ${functionName}\n`, YELLOW);
  
  const checks: Array<{ name: string; fn: () => Promise<VerificationResult> }> = [
    { name: 'Type Check', fn: () => checkTypeCheck(functionName) },
    { name: 'Import Validation', fn: () => checkImports(functionName) },
    { name: 'Import Map', fn: checkImportMap },
    { name: 'Control Function', fn: checkControlFunction },
    { name: 'Node.js APIs', fn: () => checkNodeisms(functionName) },
  ];
  
  const results: VerificationResult[] = [];
  
  for (const check of checks) {
    const result = await check.fn();
    results.push(result);
    
    await log(
      `${check.name}: ${result.message}`,
      result.passed ? GREEN : RED
    );
    
    if (!result.passed && result.remediation) {
      await log(`  → ${result.remediation}`, YELLOW);
    }
  }
  
  const allPassed = results.every(r => r.passed);
  
  await log(
    `\n${allPassed ? '✓ All checks passed' : '✗ Some checks failed'}`,
    allPassed ? GREEN : RED
  );
  
  Deno.exit(allPassed ? 0 : 1);
}

if (import.meta.main) {
  main();
}
