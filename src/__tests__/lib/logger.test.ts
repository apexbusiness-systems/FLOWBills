import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, log } from '@/lib/logger';

describe('Logger', () => {
  const originalEnv = import.meta.env.DEV;
  let consoleSpy: {
    debug: ReturnType<typeof vi.spyOn>;
    info: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    consoleSpy = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(import.meta, 'env', {
      value: { DEV: originalEnv },
      writable: true,
    });
  });

  describe('Development mode', () => {
    beforeEach(() => {
      Object.defineProperty(import.meta, 'env', {
        value: { DEV: true },
        writable: true,
      });
    });

    it('should log debug messages in development', () => {
      logger.debug('Test debug message');
      expect(consoleSpy.debug).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG] Test debug message'),
        ''
      );
    });

    it('should log info messages in development', () => {
      logger.info('Test info message');
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] Test info message'),
        ''
      );
    });

    it('should log warn messages in development', () => {
      logger.warn('Test warn message');
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN] Test warn message'),
        ''
      );
    });

    it('should log error messages in development', () => {
      const error = new Error('Test error');
      logger.error('Test error message', error);
      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('should include context in logs', () => {
      logger.debug('Test message', { key: 'value' });
      expect(consoleSpy.debug).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG] Test message'),
        { key: 'value' }
      );
    });
  });

  describe('Production mode', () => {
    beforeEach(() => {
      Object.defineProperty(import.meta, 'env', {
        value: { DEV: false },
        writable: true,
      });
    });

    it('should not log debug messages in production', () => {
      logger.debug('Test debug message');
      expect(consoleSpy.debug).not.toHaveBeenCalled();
    });

    it('should not log info messages in production', () => {
      logger.info('Test info message');
      expect(consoleSpy.info).not.toHaveBeenCalled();
    });

    it('should log warn messages in production', () => {
      logger.warn('Test warn message');
      expect(consoleSpy.warn).toHaveBeenCalled();
    });

    it('should log error messages in production', () => {
      const error = new Error('Test error');
      logger.error('Test error message', error);
      expect(consoleSpy.error).toHaveBeenCalled();
    });
  });

  describe('Convenience exports', () => {
    beforeEach(() => {
      Object.defineProperty(import.meta, 'env', {
        value: { DEV: true },
        writable: true,
      });
    });

    it('should export log.debug', () => {
      log.debug('Test');
      expect(consoleSpy.debug).toHaveBeenCalled();
    });

    it('should export log.info', () => {
      log.info('Test');
      expect(consoleSpy.info).toHaveBeenCalled();
    });

    it('should export log.warn', () => {
      log.warn('Test');
      expect(consoleSpy.warn).toHaveBeenCalled();
    });

    it('should export log.error', () => {
      log.error('Test');
      expect(consoleSpy.error).toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    beforeEach(() => {
      Object.defineProperty(import.meta, 'env', {
        value: { DEV: false },
        writable: true,
      });
    });

    it('should handle Error objects', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', error);
      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('should handle non-Error objects', () => {
      logger.error('Error occurred', 'string error');
      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('should handle undefined errors', () => {
      logger.error('Error occurred');
      expect(consoleSpy.error).toHaveBeenCalled();
    });
  });
});

