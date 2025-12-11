// P7: Observability & Tracing Utilities

function uuidv4(): string {
  return crypto.randomUUID();
}

export interface TraceContext {
  trace_id: string;
  span_id: string;
  parent_span_id?: string;
  tenant?: string;
  route?: string;
  user_id?: string;
}

export interface MetricLabels {
  tenant?: string;
  route?: string;
  status?: string;
  method?: string;
}

export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  trace_context?: TraceContext;
  labels?: MetricLabels;
  data?: Record<string, any>;
}

/**
 * Structured logger with trace context propagation
 */
export class StructuredLogger {
  private context: TraceContext;

  constructor(context?: Partial<TraceContext>) {
    this.context = {
      trace_id: context?.trace_id || uuidv4(),
      span_id: uuidv4(),
      parent_span_id: context?.parent_span_id,
      tenant: context?.tenant,
      route: context?.route,
      user_id: context?.user_id,
    };
  }

  private log(level: LogEntry['level'], message: string, data?: Record<string, any>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      trace_context: this.context,
      data,
    };

    // Structured JSON logging
    console.log(JSON.stringify(entry));
  }

  debug(message: string, data?: Record<string, any>) {
    this.log('debug', message, data);
  }

  info(message: string, data?: Record<string, any>) {
    this.log('info', message, data);
  }

  warn(message: string, data?: Record<string, any>) {
    this.log('warn', message, data);
  }

  error(message: string, data?: Record<string, any>) {
    this.log('error', message, data);
  }

  /**
   * Create a child span for distributed tracing
   */
  child(labels?: Partial<TraceContext>): StructuredLogger {
    return new StructuredLogger({
      ...this.context,
      parent_span_id: this.context.span_id,
      span_id: uuidv4(),
      ...labels,
    });
  }

  getContext(): TraceContext {
    return { ...this.context };
  }
}

/**
 * P7: SLO Burn Rate Calculator
 * Implements multi-window burn-rate alerting per Google SRE workbook
 */
export interface BurnRateWindow {
  name: string;
  duration_minutes: number;
  threshold: number;
}

export const SLO_BURN_WINDOWS: BurnRateWindow[] = [
  { name: '1h', duration_minutes: 60, threshold: 14.4 }, // 1% budget in 1 hour
  { name: '6h', duration_minutes: 360, threshold: 6 },   // 5% budget in 6 hours
  { name: '24h', duration_minutes: 1440, threshold: 3 }, // 10% budget in 24 hours
  { name: '72h', duration_minutes: 4320, threshold: 1 }, // 30% budget in 72 hours
];

export function calculateBurnRate(
  errorCount: number,
  totalRequests: number,
  sloTarget: number = 0.995 // 99.5% SLO
): number {
  if (totalRequests === 0) return 0;
  
  const errorRate = errorCount / totalRequests;
  const errorBudget = 1 - sloTarget;
  
  return errorRate / errorBudget;
}

/**
 * Check if burn rate exceeds threshold for alerting
 */
export function shouldAlert(
  burnRate: number,
  window: BurnRateWindow
): boolean {
  return burnRate > window.threshold;
}

/**
 * Performance timer for critical operations
 */
export class PerformanceTimer {
  private start: number;
  private label: string;
  private logger: StructuredLogger;

  constructor(label: string, logger?: StructuredLogger) {
    this.label = label;
    this.start = performance.now();
    this.logger = logger || new StructuredLogger();
  }

  end(): number {
    const duration = performance.now() - this.start;
    this.logger.info(`Performance: ${this.label}`, {
      duration_ms: duration,
      label: this.label,
    });
    return duration;
  }
}

/**
 * Request de-duper to prevent duplicate operations
 */
export class RequestDeduper {
  private pending: Map<string, Promise<any>> = new Map();

  async once<T>(key: string, fn: () => Promise<T>): Promise<T> {
    if (this.pending.has(key)) {
      return this.pending.get(key) as Promise<T>;
    }

    const promise = fn().finally(() => {
      this.pending.delete(key);
    });

    this.pending.set(key, promise);
    return promise;
  }
}

export const deduper = new RequestDeduper();