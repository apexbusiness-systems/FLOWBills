// ============================================================
// APEX OMNiLiNK Integration Module
// CONFIDENTIAL - Internal Use Only
// ============================================================
//
// This module provides integration with the APEX OMNiLiNK Hub.
// It is DORMANT by default and only activates when explicitly configured.
//
// Required environment variables:
// - VITE_OMNILINK_ENABLED=true
// - VITE_OMNILINK_BASE_URL=<hub-url>
// - VITE_OMNILINK_TENANT_ID=<tenant-id>
//
// Usage:
// import { omniLinkAdapter, isOmniLinkReady } from '@/integrations/omnilink';
//
// if (isOmniLinkReady()) {
//   await omniLinkAdapter.sendEvent({ ... });
// }
// ============================================================

// Configuration exports
export {
  getOmniLinkConfig,
  getOmniLinkStatus,
  isOmniLinkReady,
  type OmniLinkConfig,
  type OmniLinkStatus,
} from './config';

// Type exports
export type {
  OmniLinkEventType,
  OmniLinkEventBase,
  OmniLinkEvent,
  InvoiceEvent,
  ApprovalEvent,
  ExtractionEvent,
  ValidationEvent,
  AFEEvent,
  SyncEvent,
  OmniLinkResponse,
  OmniLinkHealthStatus,
} from './types';

// Adapter exports
export { omniLinkAdapter, OmniLinkAdapter } from './adapter';

// ============================================================
// Event Helper Functions
// These are safe to call anywhere - they no-op when disabled
// ============================================================

import { omniLinkAdapter } from './adapter';
import type { InvoiceEvent, ApprovalEvent, ExtractionEvent, ValidationEvent, AFEEvent } from './types';

/**
 * Emit an invoice event to OMNiLiNK Hub
 */
export const emitInvoiceEvent = async (
  type: InvoiceEvent['type'],
  payload: InvoiceEvent['payload'],
  correlationId?: string
): Promise<void> => {
  await omniLinkAdapter.sendEvent({
    id: crypto.randomUUID(),
    type,
    timestamp: new Date().toISOString(),
    tenantId: '', // Will be set by adapter
    correlationId,
    payload,
  } as InvoiceEvent);
};

/**
 * Emit an approval event to OMNiLiNK Hub
 */
export const emitApprovalEvent = async (
  type: ApprovalEvent['type'],
  payload: ApprovalEvent['payload'],
  correlationId?: string
): Promise<void> => {
  await omniLinkAdapter.sendEvent({
    id: crypto.randomUUID(),
    type,
    timestamp: new Date().toISOString(),
    tenantId: '',
    correlationId,
    payload,
  } as ApprovalEvent);
};

/**
 * Emit an extraction event to OMNiLiNK Hub
 */
export const emitExtractionEvent = async (
  type: ExtractionEvent['type'],
  payload: ExtractionEvent['payload'],
  correlationId?: string
): Promise<void> => {
  await omniLinkAdapter.sendEvent({
    id: crypto.randomUUID(),
    type,
    timestamp: new Date().toISOString(),
    tenantId: '',
    correlationId,
    payload,
  } as ExtractionEvent);
};

/**
 * Emit a validation event to OMNiLiNK Hub
 */
export const emitValidationEvent = async (
  type: ValidationEvent['type'],
  payload: ValidationEvent['payload'],
  correlationId?: string
): Promise<void> => {
  await omniLinkAdapter.sendEvent({
    id: crypto.randomUUID(),
    type,
    timestamp: new Date().toISOString(),
    tenantId: '',
    correlationId,
    payload,
  } as ValidationEvent);
};

/**
 * Emit an AFE budget alert event to OMNiLiNK Hub
 */
export const emitAFEEvent = async (
  payload: AFEEvent['payload'],
  correlationId?: string
): Promise<void> => {
  await omniLinkAdapter.sendEvent({
    id: crypto.randomUUID(),
    type: 'afe.budget_alert',
    timestamp: new Date().toISOString(),
    tenantId: '',
    correlationId,
    payload,
  } as AFEEvent);
};
