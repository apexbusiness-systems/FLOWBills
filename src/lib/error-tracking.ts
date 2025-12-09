/**
 * Production Error Tracking Infrastructure
 * Integrates with Sentry, LogRocket, or custom error tracking
 */

import { StructuredLogger } from "./observability";
import { supabase } from "@/integrations/supabase/client";

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  route?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export interface TrackedError {
  id: string;
  message: string;
  stack?: string;
  level: "error" | "warning" | "info";
  context: ErrorContext;
  timestamp: Date;
  fingerprint: string;
}

/**
 * Production Error Tracker
 */
class ErrorTracker {
  private logger: StructuredLogger;
  private errorQueue: TrackedError[] = [];
  private maxQueueSize = 50;
  private flushInterval = 30000; // 30 seconds
  private flushTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.logger = new StructuredLogger({ route: "error-tracker" });

    // Start periodic flush
    if (!import.meta.env.DEV) {
      this.startPeriodicFlush();
    }
  }

  /**
   * Capture and track an error
   */
  captureError(
    error: Error | string,
    context?: ErrorContext,
    level: "error" | "warning" | "info" = "error"
  ): void {
    const message = typeof error === "string" ? error : error.message;
    const stack = typeof error === "string" ? undefined : error.stack;

    const trackedError: TrackedError = {
      id: crypto.randomUUID(),
      message,
      stack,
      level,
      context: context || {},
      timestamp: new Date(),
      fingerprint: this.generateFingerprint(message, stack),
    };

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error("[ErrorTracker]", trackedError);
    }

    // Add to queue
    this.errorQueue.push(trackedError);

    // Flush if queue is full
    if (this.errorQueue.length >= this.maxQueueSize) {
      this.flush();
    }

    // Log with structured logger
    this.logger.error(message, {
      errorId: trackedError.id,
      fingerprint: trackedError.fingerprint,
      stack: stack?.split("\n").slice(0, 5).join("\n"), // First 5 lines
      context,
    });
  }

  /**
   * Capture exception with automatic context
   */
  captureException(error: Error, context?: ErrorContext): void {
    this.captureError(error, context, "error");
  }

  /**
   * Capture message (warning or info)
   */
  captureMessage(
    message: string,
    level: "warning" | "info" = "info",
    context?: ErrorContext
  ): void {
    this.captureError(message, context, level);
  }

  /**
   * Add breadcrumb (for debugging context)
   */
  addBreadcrumb(message: string, data?: Record<string, any>): void {
    this.logger.debug("Breadcrumb", {
      message,
      ...data,
    });
  }

  /**
   * Set user context for error tracking
   */
  setUserContext(userId: string, email?: string, username?: string): void {
    this.logger = new StructuredLogger({
      user_id: userId,
      route: "error-tracker",
    });
  }

  /**
   * Clear user context (on logout)
   */
  clearUserContext(): void {
    this.logger = new StructuredLogger({ route: "error-tracker" });
  }

  /**
   * Flush error queue to backend
   */
  private async flush(): Promise<void> {
    if (this.errorQueue.length === 0) return;

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    try {
      // Send to Supabase (or external error tracking service)
      const { error } = await supabase.from("system_health_metrics").insert(
        errors.map((err) => ({
          metric_name: "frontend_error",
          metric_value: 1,
          metric_unit: "count",
          status: err.level,
          metadata: {
            errorId: err.id,
            message: err.message,
            stack: err.stack || "",
            fingerprint: err.fingerprint,
            userId: err.context.userId,
            route: err.context.route,
            component: err.context.component,
            timestamp: err.timestamp.toISOString(),
          } as any,
        }))
      );

      if (error) {
        console.error("Failed to flush errors:", error);
        // Re-add to queue for retry
        this.errorQueue.unshift(...errors);
      }
    } catch (error) {
      console.error("Error flushing error queue:", error);
      // Re-add to queue for retry
      this.errorQueue.unshift(...errors);
    }
  }

  /**
   * Start periodic error flush
   */
  private startPeriodicFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  /**
   * Stop periodic flush
   */
  stopPeriodicFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Generate error fingerprint for deduplication
   */
  private generateFingerprint(message: string, stack?: string): string {
    const content = stack
      ? stack.split("\n").slice(0, 3).join("\n") // First 3 stack frames
      : message;

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(36);
  }

  /**
   * Flush remaining errors on unload
   */
  async onUnload(): Promise<void> {
    this.stopPeriodicFlush();
    await this.flush();
  }
}

// Singleton instance
export const errorTracker = new ErrorTracker();

// Global error handlers integration
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    errorTracker.captureException(event.error, {
      route: window.location.pathname,
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    errorTracker.captureError(event.reason instanceof Error ? event.reason : String(event.reason), {
      route: window.location.pathname,
      metadata: {
        type: "unhandled_rejection",
      },
    });
  });

  window.addEventListener("beforeunload", () => {
    errorTracker.onUnload();
  });
}

export default errorTracker;
