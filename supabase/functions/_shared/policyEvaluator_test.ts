import { assertEquals, assertThrows } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { ConditionSchema, evaluateCondition, hasStringExpression } from './policyEvaluator.ts';

Deno.test('supports allowed operators deterministically', () => {
  const context = { amount: 150, status: 'approved', text: 'invoice-123' };

  const checks = [
    { field: 'status', operator: 'equals', value: 'approved', expected: true },
    { field: 'status', operator: 'not_equals', value: 'pending', expected: true },
    { field: 'amount', operator: 'gt', value: 100, expected: true },
    { field: 'amount', operator: 'gte', value: 150, expected: true },
    { field: 'amount', operator: 'lt', value: 200, expected: true },
    { field: 'amount', operator: 'lte', value: 150, expected: true },
    { field: 'text', operator: 'includes', value: '123', expected: true },
  ] as const;

  for (const check of checks) {
    const condition = ConditionSchema.parse(check);
    const first = evaluateCondition(condition, context);
    const second = evaluateCondition(condition, context);
    assertEquals(first, check.expected);
    assertEquals(second, check.expected);
  }
});

Deno.test('rejects string expression conditions', () => {
  assertEquals(hasStringExpression({ rule: 'amount > 1000' }), true);
  assertEquals(hasStringExpression({ rule: { field: 'amount', operator: 'gt', value: 1000 } }), false);
});

Deno.test('regex operator disabled by default', () => {
  const condition = ConditionSchema.parse({ field: 'text', operator: 'regex', value: '^invoice' });
  assertThrows(() => evaluateCondition(condition, { text: 'invoice-123' }), Error, 'regex operator is disabled');
});
