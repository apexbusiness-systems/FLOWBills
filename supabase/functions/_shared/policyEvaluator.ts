import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

export const ALLOW_REGEX_OPERATOR = false;

export const ConditionSchema = z.object({
  field: z.string().min(1),
  operator: z.enum(['equals', 'not_equals', 'gt', 'gte', 'lt', 'lte', 'includes', 'regex']),
  value: z.any(),
});

export function evaluateCondition(condition: z.infer<typeof ConditionSchema>, context: Record<string, unknown>): boolean {
  const fieldValue = context[condition.field];

  switch (condition.operator) {
    case 'equals':
      return fieldValue === condition.value;
    case 'not_equals':
      return fieldValue !== condition.value;
    case 'gt':
      return Number(fieldValue) > Number(condition.value);
    case 'gte':
      return Number(fieldValue) >= Number(condition.value);
    case 'lt':
      return Number(fieldValue) < Number(condition.value);
    case 'lte':
      return Number(fieldValue) <= Number(condition.value);
    case 'includes':
      return String(fieldValue ?? '').includes(String(condition.value));
    case 'regex':
      if (!ALLOW_REGEX_OPERATOR) {
        throw new Error('regex operator is disabled');
      }
      return new RegExp(String(condition.value)).test(String(fieldValue ?? ''));
    default:
      return false;
  }
}

export function hasStringExpression(conditions: Record<string, unknown>): boolean {
  return Object.values(conditions).some((value) => typeof value === 'string');
}
