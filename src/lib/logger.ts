/**
 * Centralized logging utility
 * Replace with Sentry, LogRocket, or other service in production
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  
  /**
   * Log info message (development only)
   */
    info(message: string, data?: unknown, context?: string) {
    if (this.isDevelopment) {
      console.log(`[INFO] ${context ? `[${context}] ` : ''}${message}`, data || '');
    }
  }

  /**
   * Log warning message
   */
    warn(message: string, data?: unknown, context?: string) {
    if (this.isDevelopment) {
      console.warn(`[WARN] ${context ? `[${context}] ` : ''}${message}`, data || '');
    }
    // In production, send to error tracking service
    this.sendToErrorTracking('warn', message, data, context);
  }

  /**
   * Log error message
   */
    error(message: string, error?: unknown, context?: string) {
    // Always log errors
    console.error(`[ERROR] ${context ? `[${context}] ` : ''}${message}`, error || '');
    
    // Send to error tracking service
    this.sendToErrorTracking('error', message, error, context);
  }

  /**
   * Log debug message (development only)
   */
    debug(message: string, data?: unknown, context?: string) {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${context ? `[${context}] ` : ''}${message}`, data || '');
    }
  }

  /**
   * Send to error tracking service (Sentry, LogRocket, etc.)
   * Implement when you add error tracking
   */
  private sendToErrorTracking(
    _level: LogLevel,
    _message: string,
    _data?: unknown,
    _context?: string
  ) {
    // TODO: Implement Sentry or other error tracking
    // Example:
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   Sentry.captureMessage(message, {
    //     level: level === 'warn' ? 'warning' : level,
    //     extra: { data, context }
    //   });
    // }
  }

  /**
   * Log API errors with standardized format
   */
apiError(endpoint: string, error: unknown, statusCode?: number) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.error(
        `API Error: ${endpoint}`,
        {
          message: err.message,
          status: statusCode,
          stack: err.stack,
      },
      'API'
    );
  }

  /**
   * Log payment errors specifically
   */
  paymentError(message: string, error: unknown, metadata?: Record<string, unknown>) {
    const err = error instanceof Error ? error : new Error(String(error));
    this.error(
      message,
      {
        error: err.message,
        ...metadata,
      },
      'PAYMENT'
    );
  }
}

// Export singleton instance
export const logger = new Logger();

// Export for testing or specific use cases
export default logger;
