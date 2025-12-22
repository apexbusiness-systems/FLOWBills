/**
 * Centralized logging utility
 * Replaces console.log/warn/error with environment-aware logging
 * Production: Only errors logged
 * Development: All logs enabled
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private logLevel: LogLevel = this.isDevelopment ? 'debug' : 'error';

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true;
    
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentIndex = levels.indexOf(this.logLevel);
    const messageIndex = levels.indexOf(level);
    return messageIndex >= currentIndex;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    return context ? `${prefix} ${message}` : `${prefix} ${message}`;
  }

  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog('debug')) return;
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message), context || '');
    }
  }

  info(message: string, context?: LogContext): void {
    if (!this.shouldLog('info')) return;
    if (this.isDevelopment) {
      console.info(this.formatMessage('info', message), context || '');
    }
  }

  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog('warn')) return;
    console.warn(this.formatMessage('warn', message), context || '');
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (!this.shouldLog('error')) return;
    
    const errorContext: LogContext = {
      ...context,
      ...(error instanceof Error
        ? { message: error.message, stack: error.stack }
        : { error }),
    };
    
    console.error(this.formatMessage('error', message), errorContext);
    
    // In production, also send to error tracking (async, non-blocking)
    if (!this.isDevelopment && typeof window !== 'undefined') {
      // Use error handler if available
      import('./error-handler')
        .then(({ errorHandler }) => {
          if (error instanceof Error) {
            errorHandler.handle(error);
          } else {
            errorHandler.handle({
              code: 'LOG_ERROR',
              message: String(error || message),
              severity: 'error',
              details: errorContext,
            });
          }
        })
        .catch(() => {
          // Error handler not available, skip silently
        });
    }
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }
}

export const logger = new Logger();

// Convenience exports
export const log = {
  debug: (message: string, context?: LogContext) => logger.debug(message, context),
  info: (message: string, context?: LogContext) => logger.info(message, context),
  warn: (message: string, context?: LogContext) => logger.warn(message, context),
  error: (message: string, error?: Error | unknown, context?: LogContext) =>
    logger.error(message, error, context),
};

