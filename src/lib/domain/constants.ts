export const INVOICE_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  VALIDATED: 'validated',
  APPROVED_AUTO: 'approved_auto',
  NEEDS_REVIEW: 'needs_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type InvoiceStatus = typeof INVOICE_STATUS[keyof typeof INVOICE_STATUS];

export const APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type ApprovalStatus = typeof APPROVAL_STATUS[keyof typeof APPROVAL_STATUS];

export const EDGE_FUNCTIONS = {
  INVOICE_EXTRACT: 'invoice-extract',
  INVOICE_INTAKE: 'invoice-intake',
  HIL_ROUTER: 'hil-router',
  DUPLICATE_CHECK: 'duplicate-check',
  METRICS: 'metrics',
  HEALTH_CHECK: 'health-check',
} as const;
