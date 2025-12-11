// P1 — Pricing Model (Seatless, Volume-Based)
// Starter & Growth plans with invoice-based metering

export const PRICING_PLANS = {
  STARTER: {
    id: 'starter',
    name: 'Starter',
    base_price_cents: 209900, // $2,099.00/mo
    included_invoices: 1500,
    overage_price_per_invoice_cents: 25, // $0.25/invoice
    currency: 'USD',
  },
  GROWTH: {
    id: 'growth',
    name: 'Growth',
    base_price_cents: 350000, // $3,500.00/mo
    included_invoices: 5000,
    overage_price_per_invoice_cents: 20, // $0.20/invoice
    currency: 'USD',
  },
} as const;

export type PlanId = keyof typeof PRICING_PLANS;

// User access model
export const USER_ACCESS = {
  INTERNAL_USERS: 'unlimited', // Internal staff - no limit
  VENDOR_USERS: 'unlimited', // Direct vendors - no limit, view-only
  VIEW_ONLY: 'free', // Read-only access
} as const;

/**
 * Calculate monthly bill for a given plan and invoice count.
 * Uses currency-safe integer math (cents) to avoid floating point errors.
 * 
 * @param planId - 'starter' or 'growth'
 * @param invoiceCount - Total invoices processed in the billing period
 * @returns Object with base price, overage, and total in cents
 */
export function calculateMonthlyBill(
  planId: PlanId,
  invoiceCount: number
): {
  base_price_cents: number;
  overage_count: number;
  overage_price_cents: number;
  total_price_cents: number;
  currency: string;
} {
  const plan = PRICING_PLANS[planId];
  
  // Ensure non-negative invoice count
  const safeInvoiceCount = Math.max(0, Math.floor(invoiceCount));
  
  // Calculate overage
  const overageCount = Math.max(0, safeInvoiceCount - plan.included_invoices);
  const overagePriceCents = overageCount * plan.overage_price_per_invoice_cents;
  
  // Total = base + overage
  const totalPriceCents = plan.base_price_cents + overagePriceCents;
  
  return {
    base_price_cents: plan.base_price_cents,
    overage_count: overageCount,
    overage_price_cents: overagePriceCents,
    total_price_cents: totalPriceCents,
    currency: plan.currency,
  };
}

/**
 * Format cents to currency string
 */
export function formatCurrency(cents: number, currency: string = 'USD'): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(dollars);
}

/**
 * Calculate per-invoice cost for a given usage level.
 * Useful for displaying effective rate in calculator.
 */
export function calculateEffectiveRate(
  planId: PlanId,
  invoiceCount: number
): {
  per_invoice_cents: number;
  formatted: string;
} {
  if (invoiceCount <= 0) {
    return { per_invoice_cents: 0, formatted: '$0.00' };
  }
  
  const bill = calculateMonthlyBill(planId, invoiceCount);
  const perInvoiceCents = Math.floor(bill.total_price_cents / invoiceCount);
  
  return {
    per_invoice_cents: perInvoiceCents,
    formatted: formatCurrency(perInvoiceCents, bill.currency),
  };
}

/**
 * Get recommended plan based on expected invoice volume
 */
export function getRecommendedPlan(expectedMonthlyInvoices: number): {
  plan_id: PlanId;
  reason: string;
  estimated_bill_cents: number;
} {
  const starterBill = calculateMonthlyBill('STARTER', expectedMonthlyInvoices);
  const growthBill = calculateMonthlyBill('GROWTH', expectedMonthlyInvoices);
  
  // Recommend Growth if it's cheaper or within 5% of Starter cost
  if (growthBill.total_price_cents < starterBill.total_price_cents) {
    return {
      plan_id: 'GROWTH',
      reason: `At ${expectedMonthlyInvoices} invoices/mo, Growth saves ${formatCurrency(starterBill.total_price_cents - growthBill.total_price_cents)}`,
      estimated_bill_cents: growthBill.total_price_cents,
    };
  }
  
  // If Starter has significant overage (>50% base price), suggest Growth
  if (starterBill.overage_price_cents > (PRICING_PLANS.STARTER.base_price_cents * 0.5)) {
    return {
      plan_id: 'GROWTH',
      reason: 'Heavy overage on Starter. Growth provides better value at this volume.',
      estimated_bill_cents: growthBill.total_price_cents,
    };
  }
  
  return {
    plan_id: 'STARTER',
    reason: 'Starter covers your expected volume efficiently',
    estimated_bill_cents: starterBill.total_price_cents,
  };
}

// Export type for TypeScript consumers
export type BillingCalculation = ReturnType<typeof calculateMonthlyBill>;
