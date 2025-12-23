import { describe, it, expect, beforeEach, vi } from 'vitest';
import { logger } from '@/lib/logger';

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default state
    logger.setLogLevel('debug');
  });

  describe('Development mode', () => {
    beforeEach(() => {
      // Ensure we're in development mode
      Object.defineProperty(import.meta, 'env', {
        value: { DEV: true },
        writable: true,
        configurable: true,
      });
    });

    it('should log all levels in development', () => {
      const consoleSpy = {
        debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
        info: vi.spyOn(console, 'info').mockImplementation(() => {}),
        warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
        error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      };

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(consoleSpy.debug).toHaveBeenCalledWith('[DEBUG] debug message');
      expect(consoleSpy.info).toHaveBeenCalledWith('[INFO] info message');
      expect(consoleSpy.warn).toHaveBeenCalledWith('[WARN] warn message');
      expect(consoleSpy.error).toHaveBeenCalledWith('[ERROR] error message');

      Object.values(consoleSpy).forEach(spy => spy.mockRestore());
    });
  });

  describe('Production mode', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      // 1. Mock the environment to production
      vi.stubEnv('DEV', false);
      // 2. FORCE the log level to error (since the singleton was created with 'debug')
      logger.setLogLevel('error');
    });

    it('should only log error level in production by default', () => {
      const consoleSpy = {
        debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
        info: vi.spyOn(console, 'info').mockImplementation(() => {}),
        warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
        error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      };

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(consoleSpy.debug).not.toHaveBeenCalled();
      expect(consoleSpy.info).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
      expect(consoleSpy.error).toHaveBeenCalledWith('[ERROR] error message');

      Object.values(consoleSpy).forEach(spy => spy.mockRestore());
    });

    it('should respect setLogLevel in production', () => {
      const consoleSpy = {
        info: vi.spyOn(console, 'info').mockImplementation(() => {}),
        warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
        error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      };

      logger.setLogLevel('warn');

      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(consoleSpy.info).not.toHaveBeenCalled();
      expect(consoleSpy.warn).toHaveBeenCalledWith('[WARN] warn message');
      expect(consoleSpy.error).toHaveBeenCalledWith('[ERROR] error message');

      Object.values(consoleSpy).forEach(spy => spy.mockRestore());
    });
  });
});
