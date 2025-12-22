import { toast } from "@/hooks/use-toast";
import { logger } from "./logger";

export interface AppError {
  code: string;
  message: string;
  details?: unknown;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: AppError[] = [];

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  handle(error: AppError | Error | unknown) {
    let appError: AppError;

    if (error instanceof Error) {
      appError = {
        code: 'GENERAL_ERROR',
        message: error.message,
        details: error.stack,
        severity: 'error'
      };
    } else if (this.isAppError(error)) {
      appError = error;
    } else {
      appError = {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
        details: error,
        severity: 'error'
      };
    }

    this.logError(appError);
    this.notifyUser(appError);
    
    // Report to monitoring service in production
    this.reportError(appError);
  }

  private isAppError(error: unknown): error is AppError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      'message' in error &&
      'severity' in error &&
      typeof (error as AppError).code === 'string' &&
      typeof (error as AppError).message === 'string' &&
      typeof (error as AppError).severity === 'string'
    );
  }

  private logError(error: AppError) {
    const errorWithTimestamp = {
      ...error,
      timestamp: new Date().toISOString(),
    };
    
    this.errorLog.push(errorWithTimestamp);

    // Keep only last 100 errors
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100);
    }

    // Log error using logger
    logger.error(
      `[${error.severity.toUpperCase()}] ${error.code}: ${error.message}`,
      undefined,
      { details: error.details }
    );
  }

  private notifyUser(error: AppError) {
    if (error.severity === 'critical' || error.severity === 'error') {
      toast({
        title: "Error",
        description: this.getUserFriendlyMessage(error),
        variant: "destructive",
      });
    } else if (error.severity === 'warning') {
      toast({
        title: "Warning",
        description: error.message,
      });
    }
  }

  private getUserFriendlyMessage(error: AppError): string {
    const friendlyMessages: Record<string, string> = {
      'VALIDATION_ERROR': 'Please check your input and try again.',
      'NETWORK_ERROR': 'Network connection issue. Please try again.',
      'FILE_UPLOAD_ERROR': 'File upload failed. Please check file size and format.',
      'RATE_LIMIT_ERROR': 'Too many requests. Please wait a moment.',
      'PERMISSION_ERROR': 'You do not have permission to perform this action.',
      'SESSION_EXPIRED': 'Your session has expired. Please log in again.',
      'DATA_CORRUPTION': 'Data integrity issue detected. Please contact support.',
    };

    return friendlyMessages[error.code] || error.message;
  }

  private reportError(error: AppError) {
    // Enhanced error reporting with performance context
    const errorReport = {
      ...error,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      performanceContext: this.gatherPerformanceContext()
    };

    // Send to monitoring service
    if (typeof window !== 'undefined') {
      // Store in localStorage for batch reporting
      const errors = JSON.parse(localStorage.getItem('error_reports') || '[]');
      errors.push(errorReport);
      
      // Keep only last 50 errors
      if (errors.length > 50) {
        errors.splice(0, errors.length - 50);
      }
      
      localStorage.setItem('error_reports', JSON.stringify(errors));
      
      // In production, send to monitoring service immediately for critical errors
      if (error.severity === 'critical') {
        this.sendToMonitoringService(errorReport);
      }
    }
  }

  private gatherPerformanceContext() {
    if (typeof window === 'undefined') return {};

    return {
      memory: (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
      } : null,
      connection: (navigator as any).connection ? {
        effectiveType: (navigator as any).connection.effectiveType,
        downlink: (navigator as any).connection.downlink
      } : null,
      timing: performance.timing ? {
        loadEventEnd: performance.timing.loadEventEnd,
        navigationStart: performance.timing.navigationStart
      } : null
    };
  }

  private async sendToMonitoringService(errorReport: Record<string, unknown>) {
    try {
      // In production, replace with actual monitoring service endpoint
      const response = await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorReport)
      });
      
      if (!response.ok) {
        logger.error('Failed to send error report to monitoring service');
      }
    } catch (error) {
      logger.error('Error reporting failed', error);
    }
  }

  // Get stored error reports
  getStoredErrors(): AppError[] {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('error_reports') || '[]') as AppError[];
    } catch {
      return [];
    }
  }

  // Clear stored errors
  clearStoredErrors() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('error_reports');
    }
  }

  getRecentErrors(limit: number = 10): AppError[] {
    return this.errorLog.slice(-limit);
  }

  clearErrors() {
    this.errorLog = [];
  }
}

// Predefined error types for consistency
export const ErrorTypes = {
  VALIDATION: (message: string, details?: unknown): AppError => ({
    code: 'VALIDATION_ERROR',
    message,
    details,
    severity: 'error'
  }),

  NETWORK: (message: string, details?: unknown): AppError => ({
    code: 'NETWORK_ERROR',
    message,
    details,
    severity: 'error'
  }),

  FILE_UPLOAD: (message: string, details?: unknown): AppError => ({
    code: 'FILE_UPLOAD_ERROR',
    message,
    details,
    severity: 'error'
  }),

  RATE_LIMIT: (message: string = 'Rate limit exceeded'): AppError => ({
    code: 'RATE_LIMIT_ERROR',
    message,
    severity: 'warning'
  }),

  PERMISSION: (message: string = 'Permission denied'): AppError => ({
    code: 'PERMISSION_ERROR',
    message,
    severity: 'error'
  }),

  DATA_CORRUPTION: (message: string, details?: unknown): AppError => ({
    code: 'DATA_CORRUPTION',
    message,
    details,
    severity: 'critical'
  })
};

export const errorHandler = ErrorHandler.getInstance();
