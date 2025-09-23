import { auditLogger } from './audit-logger';

/**
 * Data Integrity and Validation System
 * Ensures data consistency and detects corruption for oil & gas financial data
 */

export interface IntegrityCheck {
  field: string;
  expected: any;
  actual: any;
  status: 'valid' | 'invalid' | 'warning';
  message: string;
}

export interface DataIntegrityResult {
  isValid: boolean;
  checksum: string;
  checks: IntegrityCheck[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}

export class DataIntegrity {
  private static instance: DataIntegrity;

  static getInstance(): DataIntegrity {
    if (!DataIntegrity.instance) {
      DataIntegrity.instance = new DataIntegrity();
    }
    return DataIntegrity.instance;
  }

  /**
   * Generate secure checksum for financial data
   */
  generateChecksum(data: any): string {
    const normalizedData = this.normalizeData(data);
    const dataString = JSON.stringify(normalizedData);
    
    // Simple checksum for demo - in production use cryptographic hash
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(16);
  }

  /**
   * Validate invoice data integrity
   */
  async validateInvoice(invoice: any): Promise<DataIntegrityResult> {
    const checks: IntegrityCheck[] = [];
    
    // Financial calculations check
    checks.push(...this.validateFinancialCalculations(invoice));
    
    // Date consistency check
    checks.push(...this.validateDateConsistency(invoice));
    
    // Required fields check
    checks.push(...this.validateRequiredFields(invoice));
    
    // Amount validation
    checks.push(...this.validateAmounts(invoice));
    
    // Vendor validation
    checks.push(...this.validateVendorData(invoice));

    const isValid = checks.every(check => check.status === 'valid');
    const hasWarnings = checks.some(check => check.status === 'warning');
    const hasErrors = checks.some(check => check.status === 'invalid');

    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (hasErrors) {
      riskLevel = checks.some(c => c.field.includes('amount')) ? 'critical' : 'high';
    } else if (hasWarnings) {
      riskLevel = 'medium';
    }

    const result: DataIntegrityResult = {
      isValid,
      checksum: this.generateChecksum(invoice),
      checks,
      riskLevel,
      timestamp: new Date()
    };

    // Log integrity issues
    if (!isValid || hasWarnings) {
      await auditLogger.logSecurity({
        action: 'DATA_INTEGRITY_ISSUE',
        entity_type: 'invoice',
        entity_id: invoice.id,
        metadata: {
          integrity_result: result,
          failed_checks: checks.filter(c => c.status !== 'valid')
        }
      });
    }

    return result;
  }

  /**
   * Validate financial calculations
   */
  private validateFinancialCalculations(invoice: any): IntegrityCheck[] {
    const checks: IntegrityCheck[] = [];
    
    // Check subtotal + tax = total
    if (invoice.subtotal && invoice.tax_amount && invoice.total_amount) {
      const expectedTotal = parseFloat(invoice.subtotal) + parseFloat(invoice.tax_amount);
      const actualTotal = parseFloat(invoice.total_amount);
      const difference = Math.abs(expectedTotal - actualTotal);
      
      checks.push({
        field: 'total_calculation',
        expected: expectedTotal,
        actual: actualTotal,
        status: difference < 0.01 ? 'valid' : 'invalid',
        message: difference < 0.01 
          ? 'Total calculation is correct' 
          : `Total calculation error: expected ${expectedTotal}, got ${actualTotal}`
      });
    }

    // Check tax rate application
    if (invoice.subtotal && invoice.tax_rate && invoice.tax_amount) {
      const expectedTax = parseFloat(invoice.subtotal) * (parseFloat(invoice.tax_rate) / 100);
      const actualTax = parseFloat(invoice.tax_amount);
      const difference = Math.abs(expectedTax - actualTax);
      
      checks.push({
        field: 'tax_calculation',
        expected: expectedTax,
        actual: actualTax,
        status: difference < 0.01 ? 'valid' : 'warning',
        message: difference < 0.01 
          ? 'Tax calculation is correct'
          : `Tax calculation discrepancy: expected ${expectedTax}, got ${actualTax}`
      });
    }

    return checks;
  }

  /**
   * Validate date consistency
   */
  private validateDateConsistency(invoice: any): IntegrityCheck[] {
    const checks: IntegrityCheck[] = [];
    
    if (invoice.invoice_date && invoice.due_date) {
      const invoiceDate = new Date(invoice.invoice_date);
      const dueDate = new Date(invoice.due_date);
      
      checks.push({
        field: 'date_sequence',
        expected: 'due_date >= invoice_date',
        actual: `${invoice.due_date} vs ${invoice.invoice_date}`,
        status: dueDate >= invoiceDate ? 'valid' : 'invalid',
        message: dueDate >= invoiceDate 
          ? 'Date sequence is correct'
          : 'Due date cannot be before invoice date'
      });

      // Check for reasonable payment terms (not more than 1 year)
      const daysDiff = (dueDate.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24);
      checks.push({
        field: 'payment_terms',
        expected: '≤ 365 days',
        actual: `${Math.round(daysDiff)} days`,
        status: daysDiff <= 365 ? 'valid' : 'warning',
        message: daysDiff <= 365 
          ? 'Payment terms are reasonable'
          : 'Payment terms exceed 1 year - verify if correct'
      });
    }

    return checks;
  }

  /**
   * Validate required fields for oil & gas compliance
   */
  private validateRequiredFields(invoice: any): IntegrityCheck[] {
    const checks: IntegrityCheck[] = [];
    
    const requiredFields = [
      'invoice_number',
      'vendor_name',
      'amount',
      'invoice_date',
      'currency'
    ];

    for (const field of requiredFields) {
      const hasValue = invoice[field] !== null && 
                      invoice[field] !== undefined && 
                      invoice[field] !== '';
      
      checks.push({
        field: field,
        expected: 'non-empty value',
        actual: hasValue ? 'present' : 'missing',
        status: hasValue ? 'valid' : 'invalid',
        message: hasValue ? `${field} is present` : `Required field ${field} is missing`
      });
    }

    return checks;
  }

  /**
   * Validate amount fields
   */
  private validateAmounts(invoice: any): IntegrityCheck[] {
    const checks: IntegrityCheck[] = [];
    
    const amountFields = ['amount', 'subtotal', 'tax_amount', 'total_amount'];
    
    for (const field of amountFields) {
      if (invoice[field] !== undefined) {
        const amount = parseFloat(invoice[field]);
        
        // Check if amount is valid number
        checks.push({
          field: `${field}_format`,
          expected: 'valid number',
          actual: isNaN(amount) ? 'invalid' : 'valid',
          status: isNaN(amount) ? 'invalid' : 'valid',
          message: isNaN(amount) ? `${field} is not a valid number` : `${field} format is valid`
        });

        // Check for negative amounts (warning for most, error for totals)
        if (!isNaN(amount) && amount < 0) {
          checks.push({
            field: `${field}_sign`,
            expected: 'positive value',
            actual: 'negative value',
            status: field.includes('total') ? 'invalid' : 'warning',
            message: `${field} has negative value - verify if correct`
          });
        }

        // Check for suspiciously large amounts
        if (!isNaN(amount) && amount > 10000000) { // > 10M CAD
          checks.push({
            field: `${field}_magnitude`,
            expected: '< CAD$10M',
            actual: `CAD$${amount.toLocaleString()}`,
            status: 'warning',
            message: `${field} exceeds CAD$10M - verify if correct`
          });
        }
      }
    }

    return checks;
  }

  /**
   * Validate vendor data consistency
   */
  private validateVendorData(invoice: any): IntegrityCheck[] {
    const checks: IntegrityCheck[] = [];
    
    if (invoice.vendor_name) {
      // Check for suspicious vendor patterns
      const suspiciousPatterns = [
        /test/i,
        /dummy/i,
        /placeholder/i,
        /example/i
      ];

      const hasSuspiciousName = suspiciousPatterns.some(pattern => 
        pattern.test(invoice.vendor_name)
      );

      checks.push({
        field: 'vendor_name_validity',
        expected: 'legitimate vendor name',
        actual: hasSuspiciousName ? 'suspicious' : 'valid',
        status: hasSuspiciousName ? 'warning' : 'valid',
        message: hasSuspiciousName 
          ? 'Vendor name appears to be test/placeholder data'
          : 'Vendor name appears legitimate'
      });
    }

    return checks;
  }

  /**
   * Normalize data for checksum calculation
   */
  private normalizeData(data: any): any {
    const normalized: any = {};
    
    // Sort keys and normalize values
    Object.keys(data).sort().forEach(key => {
      let value = data[key];
      
      // Normalize numbers to fixed precision
      if (typeof value === 'number') {
        value = Math.round(value * 100) / 100; // 2 decimal places
      }
      
      // Normalize strings (trim, lowercase for non-sensitive fields)
      if (typeof value === 'string') {
        if (key.includes('amount') || key.includes('number')) {
          value = value.trim(); // Keep case for important fields
        } else {
          value = value.trim().toLowerCase();
        }
      }
      
      normalized[key] = value;
    });
    
    return normalized;
  }

  /**
   * Verify data hasn't been tampered with
   */
  async verifyIntegrity(data: any, expectedChecksum: string): Promise<boolean> {
    const currentChecksum = this.generateChecksum(data);
    const isValid = currentChecksum === expectedChecksum;
    
    if (!isValid) {
      await auditLogger.logSecurity({
        action: 'DATA_TAMPERING_DETECTED',
        entity_type: data.entity_type || 'unknown',
        entity_id: data.id,
        metadata: {
          expected_checksum: expectedChecksum,
          actual_checksum: currentChecksum,
          data_snapshot: this.normalizeData(data)
        }
      });
    }
    
    return isValid;
  }

  /**
   * Generate integrity report for audit purposes
   */
  generateIntegrityReport(results: DataIntegrityResult[]): any {
    const totalChecks = results.length;
    const validResults = results.filter(r => r.isValid);
    const criticalIssues = results.filter(r => r.riskLevel === 'critical');
    const highRiskIssues = results.filter(r => r.riskLevel === 'high');

    return {
      summary: {
        total_records_checked: totalChecks,
        valid_records: validResults.length,
        integrity_rate: (validResults.length / totalChecks * 100).toFixed(2),
        critical_issues: criticalIssues.length,
        high_risk_issues: highRiskIssues.length
      },
      risk_distribution: {
        low: results.filter(r => r.riskLevel === 'low').length,
        medium: results.filter(r => r.riskLevel === 'medium').length,
        high: highRiskIssues.length,
        critical: criticalIssues.length
      },
      failed_checks: results.flatMap(r => 
        r.checks.filter(c => c.status !== 'valid')
      ),
      recommendations: this.generateIntegrityRecommendations(results)
    };
  }

  private generateIntegrityRecommendations(results: DataIntegrityResult[]): string[] {
    const recommendations: string[] = [];
    const allChecks = results.flatMap(r => r.checks);

    if (allChecks.some(c => c.field.includes('calculation'))) {
      recommendations.push('Review financial calculation logic and implement automated validation');
    }

    if (allChecks.some(c => c.field.includes('date'))) {
      recommendations.push('Implement date validation rules and business day calculations');
    }

    if (allChecks.some(c => c.field.includes('amount') && c.status === 'invalid')) {
      recommendations.push('Strengthen amount validation and implement range checks');
    }

    return recommendations;
  }
}

// Export singleton instance
export const dataIntegrity = DataIntegrity.getInstance();