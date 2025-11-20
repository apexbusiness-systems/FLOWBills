/**
 * SLO Monitoring & Burn Rate Alerting
 * Implements Google SRE-style multi-window burn rate alerting
 */

import { supabase } from '@/integrations/supabase/client';
import { SLO_BURN_WINDOWS, calculateBurnRate, shouldAlert } from './observability';

export interface SLODefinition {
  name: string;
  target: number; // e.g., 0.995 for 99.5%
  errorBudget: number; // Calculated: 1 - target
  window: string; // e.g., '30d'
}

export interface SLOMetrics {
  totalRequests: number;
  successfulRequests: number;
  errorCount: number;
  successRate: number;
  errorRate: number;
  burnRate: number;
  budgetRemaining: number;
}

export interface SLOViolation {
  sloName: string;
  violationType: 'burn_rate' | 'error_budget';
  severity: 'critical' | 'warning' | 'info';
  burnRate: number;
  errorBudgetConsumed: number;
  windowDuration: string;
  details: Record<string, any>;
}

/**
 * SLO Monitor for tracking and alerting on service level objectives
 */
class SLOMonitor {
  private slos: Map<string, SLODefinition> = new Map();
  private metrics: Map<string, SLOMetrics> = new Map();

  /**
   * Register an SLO
   */
  registerSLO(slo: SLODefinition): void {
    this.slos.set(slo.name, {
      ...slo,
      errorBudget: 1 - slo.target,
    });
    
    this.metrics.set(slo.name, {
      totalRequests: 0,
      successfulRequests: 0,
      errorCount: 0,
      successRate: 1,
      errorRate: 0,
      burnRate: 0,
      budgetRemaining: 100,
    });
  }

  /**
   * Record a successful request
   */
  recordSuccess(sloName: string): void {
    const metrics = this.metrics.get(sloName);
    if (!metrics) return;

    metrics.totalRequests++;
    metrics.successfulRequests++;
    this.updateMetrics(sloName, metrics);
  }

  /**
   * Record a failed request
   */
  recordError(sloName: string): void {
    const metrics = this.metrics.get(sloName);
    if (!metrics) return;

    metrics.totalRequests++;
    metrics.errorCount++;
    this.updateMetrics(sloName, metrics);
  }

  /**
   * Update calculated metrics and check for violations
   */
  private updateMetrics(sloName: string, metrics: SLOMetrics): void {
    const slo = this.slos.get(sloName);
    if (!slo || metrics.totalRequests === 0) return;

    metrics.successRate = metrics.successfulRequests / metrics.totalRequests;
    metrics.errorRate = metrics.errorCount / metrics.totalRequests;
    
    // Calculate burn rate
    metrics.burnRate = calculateBurnRate(
      metrics.errorCount,
      metrics.totalRequests,
      slo.target
    );
    
    // Calculate budget remaining
    metrics.budgetRemaining = Math.max(
      0,
      100 - (metrics.errorRate / slo.errorBudget) * 100
    );

    this.metrics.set(sloName, metrics);

    // Check for burn rate violations
    this.checkBurnRateViolations(sloName, metrics);
  }

  /**
   * Check for burn rate violations across all windows
   */
  private async checkBurnRateViolations(sloName: string, metrics: SLOMetrics): Promise<void> {
    const slo = this.slos.get(sloName);
    if (!slo) return;

    for (const window of SLO_BURN_WINDOWS) {
      if (shouldAlert(metrics.burnRate, window)) {
        await this.recordViolation({
          sloName,
          violationType: 'burn_rate',
          severity: this.getSeverity(window.name),
          burnRate: metrics.burnRate,
          errorBudgetConsumed: 100 - metrics.budgetRemaining,
          windowDuration: window.name,
          details: {
            totalRequests: metrics.totalRequests,
            errorCount: metrics.errorCount,
            errorRate: metrics.errorRate,
            threshold: window.threshold,
            sloTarget: slo.target,
          },
        });
      }
    }
  }

  /**
   * Determine severity based on window duration
   */
  private getSeverity(window: string): 'critical' | 'warning' | 'info' {
    if (window === '1h') return 'critical';
    if (window === '6h') return 'warning';
    return 'info';
  }

  /**
   * Record SLO violation to database
   */
  private async recordViolation(violation: SLOViolation): Promise<void> {
    try {
      const { error } = await supabase
        .from('slo_violations')
        .insert({
          slo_name: violation.sloName,
          violation_type: violation.violationType,
          severity: violation.severity,
          burn_rate: violation.burnRate,
          error_budget_consumed: violation.errorBudgetConsumed,
          window_duration: violation.windowDuration,
          details: violation.details,
        });

      if (error) {
        console.error('Failed to record SLO violation:', error);
      } else {
        console.warn(`🚨 SLO Violation: ${violation.sloName}`, violation);
      }
    } catch (error) {
      console.error('Error recording SLO violation:', error);
    }
  }

  /**
   * Get current metrics for an SLO
   */
  getMetrics(sloName: string): SLOMetrics | null {
    return this.metrics.get(sloName) || null;
  }

  /**
   * Get all SLO metrics
   */
  getAllMetrics(): Record<string, SLOMetrics> {
    const result: Record<string, SLOMetrics> = {};
    this.metrics.forEach((metrics, name) => {
      result[name] = metrics;
    });
    return result;
  }

  /**
   * Reset metrics for an SLO
   */
  resetMetrics(sloName: string): void {
    const metrics = this.metrics.get(sloName);
    if (metrics) {
      this.metrics.set(sloName, {
        totalRequests: 0,
        successfulRequests: 0,
        errorCount: 0,
        successRate: 1,
        errorRate: 0,
        burnRate: 0,
        budgetRemaining: 100,
      });
    }
  }
}

// Singleton instance
export const sloMonitor = new SLOMonitor();

// Register default SLOs for FlowBills
sloMonitor.registerSLO({
  name: 'api_availability',
  target: 0.995, // 99.5%
  errorBudget: 0.005,
  window: '30d',
});

sloMonitor.registerSLO({
  name: 'invoice_processing',
  target: 0.99, // 99%
  errorBudget: 0.01,
  window: '30d',
});

sloMonitor.registerSLO({
  name: 'auth_success_rate',
  target: 0.999, // 99.9%
  errorBudget: 0.001,
  window: '30d',
});

export default sloMonitor;
