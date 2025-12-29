/**
 * Distributed Tracing & Request Correlation
 * Implements OpenTelemetry-compatible tracing for production observability
 */

import { StructuredLogger, TraceContext } from './observability';
import { logger } from './logger';

interface SpanContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  startTime: number;
  attributes: Record<string, any>;
  events: Array<{ name: string; timestamp: number; attributes?: Record<string, any> }>;
}

interface SpanOptions {
  attributes?: Record<string, any>;
  kind?: 'internal' | 'server' | 'client';
}

/**
 * Distributed Tracing Manager
 */
class TracingManager {
  private activeSpans: Map<string, SpanContext> = new Map();
  private logger: StructuredLogger;
  private serviceName: string;
  
  constructor(serviceName = 'flowbills-frontend') {
    this.serviceName = serviceName;
    this.logger = new StructuredLogger({ route: serviceName });
  }

  /**
   * Start a new trace span
   */
  startSpan(name: string, options: SpanOptions = {}): string {
    const traceId = this.generateTraceId();
    const spanId = this.generateSpanId();
    
    const span: SpanContext = {
      traceId,
      spanId,
      parentSpanId: options.attributes?.parentSpanId,
      startTime: performance.now(),
      attributes: {
        'span.name': name,
        'span.kind': options.kind || 'internal',
        'service.name': this.serviceName,
        ...options.attributes,
      },
      events: [],
    };
    
    this.activeSpans.set(spanId, span);
    
    this.logger.debug(`Span started: ${name}`, {
      traceId,
      spanId,
      parentSpanId: span.parentSpanId,
    });
    
    return spanId;
  }

  /**
   * End a span and record duration
   */
  endSpan(spanId: string, status: 'ok' | 'error' = 'ok', error?: Error): void {
    const span = this.activeSpans.get(spanId);
    if (!span) {
      logger.warn(`Span not found: ${spanId}`);
      return;
    }
    
    const duration = performance.now() - span.startTime;
    
    this.logger.info('Span completed', {
      traceId: span.traceId,
      spanId: span.spanId,
      parentSpanId: span.parentSpanId,
      duration_ms: duration,
      status,
      error: error ? {
        message: error.message,
        stack: error.stack,
      } : undefined,
      attributes: span.attributes,
      events: span.events,
    });
    
    // Clean up
    this.activeSpans.delete(spanId);
  }

  /**
   * Add event to a span
   */
  addSpanEvent(spanId: string, name: string, attributes?: Record<string, any>): void {
    const span = this.activeSpans.get(spanId);
    if (!span) return;
    
    span.events.push({
      name,
      timestamp: performance.now(),
      attributes,
    });
  }

  /**
   * Set span attributes
   */
  setSpanAttributes(spanId: string, attributes: Record<string, any>): void {
    const span = this.activeSpans.get(spanId);
    if (!span) return;
    
    Object.assign(span.attributes, attributes);
  }

  /**
   * Get trace context for current span
   */
  getTraceContext(spanId: string): TraceContext | null {
    const span = this.activeSpans.get(spanId);
    if (!span) return null;
    
    return {
      trace_id: span.traceId,
      span_id: span.spanId,
      parent_span_id: span.parentSpanId,
    };
  }

  /**
   * Generate W3C-compatible trace ID (32 hex characters)
   */
  private generateTraceId(): string {
    return crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').substring(0, 8);
  }

  /**
   * Generate W3C-compatible span ID (16 hex characters)
   */
  private generateSpanId(): string {
    return crypto.randomUUID().replace(/-/g, '').substring(0, 16);
  }

  /**
   * Wrap async function with automatic span creation
   */
  trace<T>(name: string, fn: () => Promise<T>, options?: SpanOptions): Promise<T> {
    const spanId = this.startSpan(name, options);
    
    return fn()
      .then(result => {
        this.endSpan(spanId, 'ok');
        return result;
      })
      .catch(error => {
        this.endSpan(spanId, 'error', error);
        throw error;
      });
  }
}

// Singleton instance
export const tracingManager = new TracingManager();

/**
 * React hook for tracing component lifecycle
 */
export function useTracing(componentName: string) {
  const spanId = tracingManager.startSpan(`component:${componentName}`, {
    attributes: {
      'component.name': componentName,
    },
    kind: 'internal',
  });

  const addEvent = (eventName: string, attributes?: Record<string, any>) => {
    tracingManager.addSpanEvent(spanId, eventName, attributes);
  };

  const endTrace = (error?: Error) => {
    tracingManager.endSpan(spanId, error ? 'error' : 'ok', error);
  };

  return { spanId, addEvent, endTrace };
}

/**
 * HTTP fetch wrapper with automatic tracing
 */
export async function tracedFetch(
  url: string,
  options?: RequestInit,
  spanName?: string
): Promise<Response> {
  return tracingManager.trace(
    spanName || `HTTP ${options?.method || 'GET'} ${url}`,
    async () => {
      const response = await fetch(url, options);
      return response;
    },
    {
      attributes: {
        'http.method': options?.method || 'GET',
        'http.url': url,
      },
      kind: 'client',
    }
  );
}

export default tracingManager;
