// ============================================================
// APEX OMNiLiNK Type Definitions
// CONFIDENTIAL - Internal Use Only
// ============================================================

export type OmniLinkEventType =
  | 'invoice.created'
  | 'invoice.updated'
  | 'invoice.status_changed'
  | 'invoice.deleted'
  | 'approval.requested'
  | 'approval.completed'
  | 'approval.rejected'
  | 'extraction.started'
  | 'extraction.completed'
  | 'extraction.failed'
  | 'duplicate.detected'
  | 'validation.completed'
  | 'afe.budget_alert'
  | 'sync.requested'
  | 'sync.completed';

export interface OmniLinkEventBase {
  id: string;
  type: OmniLinkEventType;
  timestamp: string;
  tenantId: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

export interface InvoiceEvent extends OmniLinkEventBase {
  type: 'invoice.created' | 'invoice.updated' | 'invoice.status_changed' | 'invoice.deleted';
  payload: {
    invoiceId: string;
    invoiceNumber?: string;
    vendorName?: string;
    amount?: number;
    status?: string;
    previousStatus?: string;
  };
}

export interface ApprovalEvent extends OmniLinkEventBase {
  type: 'approval.requested' | 'approval.completed' | 'approval.rejected';
  payload: {
    approvalId: string;
    invoiceId: string;
    approverUserId?: string;
    decision?: 'approved' | 'rejected';
    comments?: string;
    amount?: number;
  };
}

export interface ExtractionEvent extends OmniLinkEventBase {
  type: 'extraction.started' | 'extraction.completed' | 'extraction.failed';
  payload: {
    extractionId: string;
    invoiceId: string;
    confidence?: number;
    extractedFields?: string[];
    errorMessage?: string;
  };
}

export interface ValidationEvent extends OmniLinkEventBase {
  type: 'validation.completed' | 'duplicate.detected';
  payload: {
    invoiceId: string;
    passed: boolean;
    rulesFailed?: string[];
    duplicateOf?: string;
  };
}

export interface AFEEvent extends OmniLinkEventBase {
  type: 'afe.budget_alert';
  payload: {
    afeId: string;
    afeNumber: string;
    utilizationPercent: number;
    budgetAmount: number;
    spentAmount: number;
    alertThreshold: number;
  };
}

export interface SyncEvent extends OmniLinkEventBase {
  type: 'sync.requested' | 'sync.completed';
  payload: {
    syncType: 'full' | 'incremental';
    recordsProcessed?: number;
    errors?: string[];
  };
}

export type OmniLinkEvent =
  | InvoiceEvent
  | ApprovalEvent
  | ExtractionEvent
  | ValidationEvent
  | AFEEvent
  | SyncEvent;

export interface OmniLinkResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  timestamp: string;
}

export interface OmniLinkHealthStatus {
  status: 'disabled' | 'ok' | 'degraded' | 'error';
  details: {
    enabled: boolean;
    baseUrlConfigured: boolean;
    tenantConfigured: boolean;
    lastHeartbeat?: string;
    latencyMs?: number;
  };
}
