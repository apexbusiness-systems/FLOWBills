import { supabase } from '@/integrations/supabase/client';
import { auditLogger } from './audit-logger';

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  regulation: 'SOC2' | 'PIPEDA' | 'PIPA' | 'NOV' | 'IFRS' | 'GAAP' | 'INTERNAL';
  severity: 'low' | 'medium' | 'high' | 'critical';
  automated: boolean;
  checkFunction: (data: any) => ComplianceResult;
}

export interface ComplianceResult {
  passed: boolean;
  violations: ComplianceViolation[];
  recommendations?: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface ComplianceViolation {
  rule: string;
  field?: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  remediation: string;
  regulatoryImpact: string;
}

/**
 * Oil & Gas Industry Compliance Monitor
 * Handles Canadian regulations and industry standards
 */
export class ComplianceMonitor {
  private static instance: ComplianceMonitor;
  private rules: ComplianceRule[] = [];

  static getInstance(): ComplianceMonitor {
    if (!ComplianceMonitor.instance) {
      ComplianceMonitor.instance = new ComplianceMonitor();
    }
    return ComplianceMonitor.instance;
  }

  constructor() {
    this.initializeRules();
  }

  private initializeRules(): void {
    this.rules = [
      // SOC 2 Compliance Rules
      {
        id: 'soc2-data-encryption',
        name: 'Data Encryption Requirements',
        description: 'All sensitive data must be encrypted in transit and at rest',
        regulation: 'SOC2',
        severity: 'critical',
        automated: true,
        checkFunction: (data) => this.checkDataEncryption(data)
      },

      // PIPEDA Compliance (Canada)
      {
        id: 'pipeda-consent',
        name: 'Personal Information Consent',
        description: 'User consent required for personal information collection',
        regulation: 'PIPEDA',
        severity: 'high',
        automated: true,
        checkFunction: (data) => this.checkConsentCompliance(data)
      },

      // NOV (National Oil Variances) Compliance
      {
        id: 'nov-invoice-validation',
        name: 'NOV Invoice Validation',
        description: 'Invoices must meet NOV regulatory requirements',
        regulation: 'NOV',
        severity: 'critical',
        automated: true,
        checkFunction: (data) => this.checkNOVCompliance(data)
      },

      // Financial Reporting (IFRS/GAAP)
      {
        id: 'financial-accuracy',
        name: 'Financial Data Accuracy',
        description: 'Financial data must meet accounting standards',
        regulation: 'IFRS',
        severity: 'critical',
        automated: true,
        checkFunction: (data) => this.checkFinancialAccuracy(data)
      },

      // Data Retention
      {
        id: 'data-retention',
        name: 'Data Retention Compliance',
        description: 'Data retention must comply with industry standards',
        regulation: 'INTERNAL',
        severity: 'medium',
        automated: true,
        checkFunction: (data) => this.checkDataRetention(data)
      }
    ];
  }

  /**
   * Run compliance checks on invoice data
   */
  async checkInvoiceCompliance(invoiceData: any): Promise<ComplianceResult> {
    const results: ComplianceResult[] = [];
    
    for (const rule of this.rules) {
      if (rule.automated) {
        try {
          const result = rule.checkFunction(invoiceData);
          results.push(result);
          
          if (!result.passed) {
            await auditLogger.logCompliance({
              action: 'COMPLIANCE_CHECK_FAILED',
              entity_type: 'invoice',
              entity_id: invoiceData.id,
              metadata: {
                rule: rule.name,
                violations: result.violations,
                regulation: rule.regulation
              }
            });
          }
        } catch (error) {
          console.error(`Compliance rule ${rule.id} failed:`, error);
        }
      }
    }

    return this.aggregateResults(results);
  }

  /**
   * Run compliance checks on user data
   */
  async checkUserDataCompliance(userData: any): Promise<ComplianceResult> {
    const pipedaRules = this.rules.filter(rule => rule.regulation === 'PIPEDA');
    const results: ComplianceResult[] = [];

    for (const rule of pipedaRules) {
      const result = rule.checkFunction(userData);
      results.push(result);
    }

    return this.aggregateResults(results);
  }

  /**
   * Monitor real-time compliance violations
   */
  async startRealTimeMonitoring(): Promise<void> {
    // Set up event listeners for data changes
    window.addEventListener('beforeunload', () => {
      this.performExitCompliance();
    });

    // Monitor for suspicious activities
    this.setupActivityMonitoring();
  }

  private checkDataEncryption(data: any): ComplianceResult {
    const violations: ComplianceViolation[] = [];

    // Check if sensitive fields are properly handled
    const sensitiveFields = ['amount', 'account_number', 'tax_id', 'social_insurance'];
    
    for (const field of sensitiveFields) {
      if (data[field] && typeof data[field] === 'string') {
        // In a real implementation, check if data is encrypted
        if (data[field].includes('plain_')) {
          violations.push({
            rule: 'soc2-data-encryption',
            field,
            message: `Field ${field} contains unencrypted sensitive data`,
            severity: 'critical',
            remediation: 'Encrypt sensitive data before storage',
            regulatoryImpact: 'SOC 2 Type II failure, potential audit findings'
          });
        }
      }
    }

    return {
      passed: violations.length === 0,
      violations,
      riskLevel: violations.some(v => v.severity === 'critical') ? 'critical' : 'low'
    };
  }

  private checkConsentCompliance(data: any): ComplianceResult {
    const violations: ComplianceViolation[] = [];

    // Check for personal information without consent
    if (data.personal_info && !data.consent_given) {
      violations.push({
        rule: 'pipeda-consent',
        message: 'Personal information collected without explicit consent',
        severity: 'high',
        remediation: 'Obtain explicit user consent before processing personal data',
        regulatoryImpact: 'PIPEDA violation, potential CAN$100,000 penalty'
      });
    }

    return {
      passed: violations.length === 0,
      violations,
      riskLevel: violations.length > 0 ? 'high' : 'low'
    };
  }

  private checkNOVCompliance(data: any): ComplianceResult {
    const violations: ComplianceViolation[] = [];

    // Check NOV-specific requirements
    if (data.entity_type === 'invoice') {
      // Must have valid NOV classification code
      if (!data.nov_classification || !this.isValidNOVCode(data.nov_classification)) {
        violations.push({
          rule: 'nov-invoice-validation',
          field: 'nov_classification',
          message: 'Invalid or missing NOV classification code',
          severity: 'critical',
          remediation: 'Assign valid NOV classification code',
          regulatoryImpact: 'NOV compliance failure, potential regulatory sanctions'
        });
      }

      // Check amount thresholds for additional reporting
      if (data.amount > 100000 && !data.regulatory_approval) {
        violations.push({
          rule: 'nov-invoice-validation',
          field: 'regulatory_approval',
          message: 'High-value transaction requires regulatory pre-approval',
          severity: 'high',
          remediation: 'Obtain regulatory approval for transactions over CAD$100,000',
          regulatoryImpact: 'NOV reporting requirements not met'
        });
      }
    }

    return {
      passed: violations.length === 0,
      violations,
      riskLevel: violations.some(v => v.severity === 'critical') ? 'critical' : 'medium'
    };
  }

  private checkFinancialAccuracy(data: any): ComplianceResult {
    const violations: ComplianceViolation[] = [];

    if (data.entity_type === 'invoice') {
      // Check for required financial fields
      const requiredFields = ['amount', 'currency', 'tax_amount', 'invoice_date'];
      
      for (const field of requiredFields) {
        if (!data[field]) {
          violations.push({
            rule: 'financial-accuracy',
            field,
            message: `Required financial field ${field} is missing`,
            severity: 'high',
            remediation: `Provide complete ${field} information`,
            regulatoryImpact: 'IFRS/GAAP compliance issue, audit findings likely'
          });
        }
      }

      // Validate amount calculations
      if (data.amount && data.tax_amount) {
        const calculatedTotal = parseFloat(data.amount) + parseFloat(data.tax_amount);
        if (data.total_amount && Math.abs(calculatedTotal - parseFloat(data.total_amount)) > 0.01) {
          violations.push({
            rule: 'financial-accuracy',
            field: 'total_amount',
            message: 'Total amount calculation error detected',
            severity: 'critical',
            remediation: 'Verify and correct amount calculations',
            regulatoryImpact: 'Financial misstatement, potential fraud indicator'
          });
        }
      }
    }

    return {
      passed: violations.length === 0,
      violations,
      riskLevel: violations.some(v => v.severity === 'critical') ? 'critical' : 'medium'
    };
  }

  private checkDataRetention(data: any): ComplianceResult {
    const violations: ComplianceViolation[] = [];
    const now = new Date();
    const sevenYears = 7 * 365 * 24 * 60 * 60 * 1000; // 7 years in milliseconds

    // Check if data is past retention period
    if (data.created_at) {
      const createdDate = new Date(data.created_at);
      const age = now.getTime() - createdDate.getTime();
      
      if (age > sevenYears && data.entity_type === 'invoice') {
        violations.push({
          rule: 'data-retention',
          message: 'Financial data exceeds 7-year retention requirement',
          severity: 'medium',
          remediation: 'Archive or securely delete data per retention policy',
          regulatoryImpact: 'Data retention policy violation'
        });
      }
    }

    return {
      passed: violations.length === 0,
      violations,
      riskLevel: violations.length > 0 ? 'medium' : 'low'
    };
  }

  private isValidNOVCode(code: string): boolean {
    // Mock NOV code validation - in reality would check against official registry
    return /^NOV-\d{4}-[A-Z]{2}-\d{3}$/.test(code);
  }

  private aggregateResults(results: ComplianceResult[]): ComplianceResult {
    const allViolations = results.flatMap(r => r.violations);
    const allPassed = results.every(r => r.passed);
    
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (allViolations.some(v => v.severity === 'critical')) riskLevel = 'critical';
    else if (allViolations.some(v => v.severity === 'high')) riskLevel = 'high';
    else if (allViolations.some(v => v.severity === 'medium')) riskLevel = 'medium';

    return {
      passed: allPassed,
      violations: allViolations,
      riskLevel,
      recommendations: this.generateRecommendations(allViolations)
    };
  }

  private generateRecommendations(violations: ComplianceViolation[]): string[] {
    const recommendations: string[] = [];
    
    if (violations.some(v => v.rule.includes('encryption'))) {
      recommendations.push('Implement end-to-end encryption for all sensitive data');
    }
    
    if (violations.some(v => v.rule.includes('consent'))) {
      recommendations.push('Review and update privacy consent processes');
    }
    
    if (violations.some(v => v.rule.includes('nov'))) {
      recommendations.push('Establish NOV compliance review process');
    }
    
    return recommendations;
  }

  private setupActivityMonitoring(): void {
    // Monitor for rapid successive actions (potential automation/attack)
    let actionCount = 0;
    let lastActionTime = Date.now();

    document.addEventListener('click', () => {
      const now = Date.now();
      if (now - lastActionTime < 100) { // Actions less than 100ms apart
        actionCount++;
        if (actionCount > 10) {
          auditLogger.logSecurity({
            action: 'SUSPICIOUS_ACTIVITY',
            entity_type: 'session',
            metadata: { 
              type: 'rapid_clicking',
              count: actionCount,
              timespan: now - lastActionTime 
            }
          });
        }
      } else {
        actionCount = 0;
      }
      lastActionTime = now;
    });
  }

  private performExitCompliance(): void {
    // Check for unsaved sensitive data before user leaves
    const forms = document.querySelectorAll('form');
    let hasSensitiveData = false;

    forms.forEach(form => {
      const formData = new FormData(form);
      for (const [key, value] of formData.entries()) {
        if (typeof value === 'string' && 
            (key.includes('amount') || key.includes('account') || key.includes('tax'))) {
          hasSensitiveData = true;
        }
      }
    });

    if (hasSensitiveData) {
      auditLogger.logSecurity({
        action: 'UNSAVED_SENSITIVE_DATA',
        entity_type: 'session',
        metadata: { risk: 'data_loss' }
      });
    }
  }

  /**
   * Get compliance status dashboard data
   */
  async getComplianceDashboard(): Promise<any> {
    try {
      // Get recent compliance records
      const { data: records } = await supabase
        .from('compliance_records')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      const violations = records?.filter(r => r.status === 'violation') || [];
      const critical = violations.filter(v => v.risk_level === 'high');

      return {
        totalRecords: records?.length || 0,
        violations: violations.length,
        criticalViolations: critical.length,
        complianceRate: records ? ((records.length - violations.length) / records.length * 100) : 100,
        lastUpdate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get compliance dashboard:', error);
      return null;
    }
  }
}

// Export singleton instance
export const complianceMonitor = ComplianceMonitor.getInstance();