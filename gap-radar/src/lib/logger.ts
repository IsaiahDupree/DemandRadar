/**
 * Structured Logging Service
 *
 * Provides structured logging with levels, context preservation, and JSON output.
 * Compatible with log aggregation services (Datadog, CloudWatch, etc.).
 *
 * Usage:
 * ```ts
 * import { logger } from '@/lib/logger';
 *
 * logger.info('User logged in', { userId: '123' });
 * logger.error('API call failed', { error, endpoint: '/api/runs' });
 *
 * const contextLogger = logger.child({ requestId: 'req-123' });
 * contextLogger.info('Processing request');
 * ```
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: any;
}

interface LogEntry extends LogContext {
  level: LogLevel;
  message: string;
  timestamp: string;
  environment: string;
}

class Logger {
  private context: LogContext;
  private minLevel: LogLevel;

  constructor(context: LogContext = {}, minLevel?: LogLevel) {
    this.context = context;
    this.minLevel = minLevel || this.getMinLevelFromEnv();
  }

  /**
   * Determine minimum log level based on environment
   */
  private getMinLevelFromEnv(): LogLevel {
    // Check for explicit override via environment variable
    const levelOverride = process.env.LOG_LEVEL as LogLevel;
    if (levelOverride && ['debug', 'info', 'warn', 'error'].includes(levelOverride)) {
      return levelOverride;
    }

    const env = process.env.NODE_ENV;

    if (env === 'test') {
      return 'error'; // Suppress logs in tests unless explicitly needed
    }

    if (env === 'production') {
      return 'info'; // No debug logs in production
    }

    return 'debug'; // Development: log everything
  }

  /**
   * Check if a log level should be emitted
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const minIndex = levels.indexOf(this.minLevel);
    const currentIndex = levels.indexOf(level);

    return currentIndex >= minIndex;
  }

  /**
   * Serialize context data, handling special cases
   */
  private serializeContext(data: LogContext): LogContext {
    const serialized: LogContext = {};

    for (const [key, value] of Object.entries(data)) {
      if (value instanceof Error) {
        // Serialize Error objects
        serialized[key] = {
          message: value.message,
          name: value.name,
          stack: value.stack,
          ...(value as any), // Include any custom properties
        };
      } else if (typeof value === 'object' && value !== null) {
        // Handle circular references
        try {
          JSON.stringify(value);
          serialized[key] = value;
        } catch (e) {
          serialized[key] = '[Circular Reference]';
        }
      } else {
        serialized[key] = value;
      }
    }

    return serialized;
  }

  /**
   * Create a log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    data: LogContext = {}
  ): LogEntry {
    const serializedData = this.serializeContext(data);
    const serializedContext = this.serializeContext(this.context);

    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      ...serializedContext,
      ...serializedData,
    };
  }

  /**
   * Output log entry
   */
  private write(entry: LogEntry): void {
    const output = JSON.stringify(entry);

    switch (entry.level) {
      case 'debug':
        console.log(output);
        break;
      case 'info':
        console.info(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'error':
        console.error(output);
        break;
    }
  }

  /**
   * Log a debug message
   */
  debug(message: string, data?: LogContext): void {
    if (!this.shouldLog('debug')) return;

    const entry = this.createLogEntry('debug', message, data);
    this.write(entry);
  }

  /**
   * Log an info message
   */
  info(message: string, data?: LogContext): void {
    if (!this.shouldLog('info')) return;

    const entry = this.createLogEntry('info', message, data);
    this.write(entry);
  }

  /**
   * Log a warning message
   */
  warn(message: string, data?: LogContext): void {
    if (!this.shouldLog('warn')) return;

    const entry = this.createLogEntry('warn', message, data);
    this.write(entry);
  }

  /**
   * Log an error message
   */
  error(message: string, data?: LogContext): void {
    if (!this.shouldLog('error')) return;

    const entry = this.createLogEntry('error', message, data);
    this.write(entry);
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    return new Logger({
      ...this.context,
      ...context,
    }, this.minLevel);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export Logger class for testing
export { Logger };
