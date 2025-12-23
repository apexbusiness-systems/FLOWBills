type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private manualEnv?: boolean;

  // Public accessors to allow tests to override environment behavior
  public get isDevelopment() {
    return this.manualEnv ?? import.meta.env.DEV;
  }

  public set isDevelopment(value: boolean) {
    this.manualEnv = value;
  }

  private logLevel: LogLevel = this.isDevelopment ? 'debug' : 'error';

  private getEffectiveLogLevel(): LogLevel {
    if (this.isDevelopment) return 'debug';
    // Prevent stale debug level when toggling to production in tests
    return this.logLevel === 'debug' ? 'error' : this.logLevel;
  }

  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const effectiveLevel = this.getEffectiveLogLevel();
    if (effectiveLevel === 'debug') return true;
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentIndex = levels.indexOf(effectiveLevel);
    const messageIndex = levels.indexOf(level);
    return messageIndex >= currentIndex;
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) console.debug(`[DEBUG] ${message}`, ...args);
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) console.info(`[INFO] ${message}`, ...args);
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) console.warn(`[WARN] ${message}`, ...args);
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) console.error(`[ERROR] ${message}`, ...args);
  }
}

export const logger = new Logger();
export type { LogLevel };
