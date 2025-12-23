type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  // Use a getter to ensure we always read the live environment (critical for testing)
  get isDevelopment() {
    return import.meta.env.DEV;
  }

  // Initialize strictly based on the getter
  private logLevel: LogLevel = this.isDevelopment ? 'debug' : 'error';

  // Allow runtime configuration (critical for testing production behavior)
  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    // Always check the live environment at call time
    if (import.meta.env.DEV) return true;

    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentIndex = levels.indexOf(this.logLevel);
    const messageIndex = levels.indexOf(level);
    return messageIndex >= currentIndex;
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }
}

// Export singleton instance
export const logger = new Logger();
export type { LogLevel };
