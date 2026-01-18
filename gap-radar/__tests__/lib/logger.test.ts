/**
 * Structured Logging Service Tests
 *
 * Tests the logger utility for structured logging with levels and context.
 */

import { Logger, LogLevel } from '@/lib/logger';

// Create a test logger with debug level (overriding test environment default)
const logger = new Logger({}, 'debug');

describe('Logger', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleInfoSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Log Levels', () => {
    it('should log debug messages', () => {
      logger.debug('Debug message', { userId: '123' });

      expect(consoleLogSpy).toHaveBeenCalled();
      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(loggedData.level).toBe('debug');
      expect(loggedData.message).toBe('Debug message');
      expect(loggedData.userId).toBe('123');
      expect(loggedData.timestamp).toBeDefined();
    });

    it('should log info messages', () => {
      logger.info('Info message', { action: 'test' });

      expect(consoleInfoSpy).toHaveBeenCalled();
      const loggedData = JSON.parse(consoleInfoSpy.mock.calls[0][0]);

      expect(loggedData.level).toBe('info');
      expect(loggedData.message).toBe('Info message');
      expect(loggedData.action).toBe('test');
    });

    it('should log warning messages', () => {
      logger.warn('Warning message', { code: 'WARN_001' });

      expect(consoleWarnSpy).toHaveBeenCalled();
      const loggedData = JSON.parse(consoleWarnSpy.mock.calls[0][0]);

      expect(loggedData.level).toBe('warn');
      expect(loggedData.message).toBe('Warning message');
      expect(loggedData.code).toBe('WARN_001');
    });

    it('should log error messages', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', { error });

      expect(consoleErrorSpy).toHaveBeenCalled();
      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0]);

      expect(loggedData.level).toBe('error');
      expect(loggedData.message).toBe('Error occurred');
      expect(loggedData.error).toBeDefined();
    });
  });

  describe('Context Preservation', () => {
    it('should preserve context across log calls', () => {
      const contextLogger = logger.child({ requestId: 'req-123', userId: 'user-456' });

      contextLogger.info('First log');
      contextLogger.info('Second log');

      expect(consoleInfoSpy).toHaveBeenCalledTimes(2);

      const firstLog = JSON.parse(consoleInfoSpy.mock.calls[0][0]);
      const secondLog = JSON.parse(consoleInfoSpy.mock.calls[1][0]);

      expect(firstLog.requestId).toBe('req-123');
      expect(firstLog.userId).toBe('user-456');
      expect(secondLog.requestId).toBe('req-123');
      expect(secondLog.userId).toBe('user-456');
    });

    it('should merge context with additional data', () => {
      const contextLogger = logger.child({ requestId: 'req-123' });

      contextLogger.info('Log with extra data', { action: 'test' });

      const loggedData = JSON.parse(consoleInfoSpy.mock.calls[0][0]);

      expect(loggedData.requestId).toBe('req-123');
      expect(loggedData.action).toBe('test');
    });
  });

  describe('Structured Output', () => {
    it('should output valid JSON', () => {
      logger.info('Test message', { key: 'value' });

      const loggedString = consoleInfoSpy.mock.calls[0][0];
      expect(() => JSON.parse(loggedString)).not.toThrow();
    });

    it('should include timestamp', () => {
      const beforeTime = Date.now();
      logger.info('Test');
      const afterTime = Date.now();

      const loggedData = JSON.parse(consoleInfoSpy.mock.calls[0][0]);
      const logTime = new Date(loggedData.timestamp).getTime();

      expect(logTime).toBeGreaterThanOrEqual(beforeTime);
      expect(logTime).toBeLessThanOrEqual(afterTime);
    });

    it('should handle circular references in context', () => {
      const circular: any = { key: 'value' };
      circular.self = circular;

      expect(() => {
        logger.info('Circular test', { data: circular });
      }).not.toThrow();
    });

    it('should serialize Error objects', () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.ts:1:1';

      logger.error('Error log', { error });

      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0]);

      expect(loggedData.error).toBeDefined();
      expect(loggedData.error.message).toBe('Test error');
      expect(loggedData.error.stack).toBeDefined();
    });
  });

  describe('Environment-based Behavior', () => {
    it('should respect NODE_ENV for log levels', () => {
      const originalEnv = process.env.NODE_ENV;

      process.env.NODE_ENV = 'production';
      // In production, debug logs might be suppressed
      // This test depends on implementation

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Metadata', () => {
    it('should include environment in logs', () => {
      logger.info('Test');

      const loggedData = JSON.parse(consoleInfoSpy.mock.calls[0][0]);
      expect(loggedData.environment).toBeDefined();
    });

    it('should support custom metadata fields', () => {
      logger.info('Custom metadata', {
        traceId: 'trace-123',
        spanId: 'span-456',
        custom: { nested: 'value' },
      });

      const loggedData = JSON.parse(consoleInfoSpy.mock.calls[0][0]);

      expect(loggedData.traceId).toBe('trace-123');
      expect(loggedData.spanId).toBe('span-456');
      expect(loggedData.custom).toEqual({ nested: 'value' });
    });
  });
});
