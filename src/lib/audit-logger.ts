import { supabase } from '@/integrations/supabase/client';

export interface AuditEvent {
  action: string;
  entity_type: string;
  entity_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  metadata?: Record<string, any>;
  risk_level?: 'low' | 'medium' | 'high' | 'critical';
  compliance_flags?: string[];
}

export class AuditLogger {
  private static instance: AuditLogger;
  private pendingEvents: AuditEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  constructor() {
    // Batch audit events for performance
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 5000); // Flush every 5 seconds
  }

  /**
   * Log high-priority audit events for oil & gas compliance
   */
  async logCritical(event: AuditEvent): Promise<void> {
    const auditRecord = this.prepareAuditRecord({
      ...event,
      risk_level: 'critical'
    });

    // Critical events are logged immediately
    try {
      await this.persistAuditEvent(auditRecord);
      console.log('CRITICAL AUDIT EVENT:', auditRecord);
    } catch (error) {
      console.error('Failed to log critical audit event:', error);
      // Store locally as backup
      this.storeLocalBackup(auditRecord);
    }
  }

  /**
   * Log financial transaction events
   */
  async logFinancial(event: Omit<AuditEvent, 'risk_level'>): Promise<void> {
    await this.logCritical({
      ...event,
      risk_level: 'critical',
      compliance_flags: ['SOC2', 'FINANCIAL_AUDIT', ...(event.compliance_flags || [])]
    });
  }

  /**
   * Log compliance-related events
   */
  async logCompliance(event: Omit<AuditEvent, 'risk_level'>): Promise<void> {
    const auditRecord = this.prepareAuditRecord({
      ...event,
      risk_level: 'high',
      compliance_flags: ['REGULATORY_COMPLIANCE', ...(event.compliance_flags || [])]
    });

    this.pendingEvents.push(auditRecord);
  }

  /**
   * Log general user activities
   */
  async logActivity(event: Omit<AuditEvent, 'risk_level'>): Promise<void> {
    const auditRecord = this.prepareAuditRecord({
      ...event,
      risk_level: event.metadata?.sensitive ? 'medium' : 'low'
    });

    this.pendingEvents.push(auditRecord);
  }

  /**
   * Log security events
   */
  async logSecurity(event: Omit<AuditEvent, 'risk_level'>): Promise<void> {
    await this.logCritical({
      ...event,
      risk_level: 'critical',
      compliance_flags: ['SECURITY_INCIDENT', ...(event.compliance_flags || [])]
    });
  }

  private prepareAuditRecord(event: AuditEvent): AuditEvent & {
    timestamp: Date;
    session_id: string;
    user_agent: string;
    ip_address: string;
  } {
    return {
      ...event,
      timestamp: new Date(),
      session_id: this.getSessionId(),
      user_agent: navigator.userAgent,
      ip_address: 'client-side', // Would be populated server-side
      metadata: {
        ...event.metadata,
        browser: this.getBrowserInfo(),
        screen_resolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };
  }

  private async persistAuditEvent(event: AuditEvent & any): Promise<void> {
    const { error } = await supabase.from('activities').insert({
      activity_type: 'AUDIT',
      description: `${event.action} on ${event.entity_type}`,
      entity_type: event.entity_type,
      entity_id: event.entity_id,
      user_id: (await supabase.auth.getUser()).data.user?.id || '00000000-0000-0000-0000-000000000000',
      metadata: {
        audit_event: event,
        risk_level: event.risk_level,
        compliance_flags: event.compliance_flags,
        old_values: event.old_values,
        new_values: event.new_values
      },
      user_agent: event.user_agent
    });

    if (error) {
      throw error;
    }
  }

  private async flush(): Promise<void> {
    if (this.pendingEvents.length === 0) return;

    const events = [...this.pendingEvents];
    this.pendingEvents = [];

    try {
      await Promise.all(events.map(event => this.persistAuditEvent(event)));
    } catch (error) {
      console.error('Failed to flush audit events:', error);
      // Re-queue failed events
      this.pendingEvents.unshift(...events);
    }
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('audit_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('audit_session_id', sessionId);
    }
    return sessionId;
  }

  private getBrowserInfo(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private storeLocalBackup(event: any): void {
    try {
      const backups = JSON.parse(localStorage.getItem('audit_backups') || '[]');
      backups.push(event);
      // Keep only last 100 events
      if (backups.length > 100) {
        backups.splice(0, backups.length - 100);
      }
      localStorage.setItem('audit_backups', JSON.stringify(backups));
    } catch (error) {
      console.error('Failed to store audit backup:', error);
    }
  }

  /**
   * Retrieve local backup events for recovery
   */
  getLocalBackups(): any[] {
    try {
      return JSON.parse(localStorage.getItem('audit_backups') || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flush(); // Final flush
  }
}

// Export singleton instance
export const auditLogger = AuditLogger.getInstance();

// Industry-specific audit helpers
export const OilGasAudit = {
  /**
   * Log invoice processing events
   */
  invoiceProcessed: (invoiceId: string, amount: number, vendor: string) => {
    auditLogger.logFinancial({
      action: 'INVOICE_PROCESSED',
      entity_type: 'invoice',
      entity_id: invoiceId,
      metadata: { amount, vendor, currency: 'CAD' },
      compliance_flags: ['FINANCIAL_RECORD', 'NOV_COMPLIANCE']
    });
  },

  /**
   * Log compliance violations
   */
  complianceViolation: (violationType: string, details: any) => {
    auditLogger.logCompliance({
      action: 'COMPLIANCE_VIOLATION',
      entity_type: 'compliance',
      metadata: { violation_type: violationType, ...details },
      compliance_flags: ['VIOLATION', 'REGULATORY_RISK']
    });
  },

  /**
   * Log data access events
   */
  dataAccessed: (dataType: string, recordId: string, action: string) => {
    auditLogger.logActivity({
      action: `DATA_${action.toUpperCase()}`,
      entity_type: dataType,
      entity_id: recordId,
      metadata: { data_classification: 'sensitive' },
      compliance_flags: ['DATA_ACCESS', 'PRIVACY_AUDIT']
    });
  },

  /**
   * Log system integration events
   */
  integrationEvent: (system: string, eventType: string, details: any) => {
    auditLogger.logActivity({
      action: `INTEGRATION_${eventType.toUpperCase()}`,
      entity_type: 'integration',
      metadata: { external_system: system, ...details },
      compliance_flags: ['SYSTEM_INTEGRATION', 'DATA_EXCHANGE']
    });
  }
};
