// Secure logging utility - prevents sensitive data leaks in production
export class SecureLogger {
  private static isProduction = process.env.NODE_ENV === 'production';

  /**
   * Log info messages (disabled in production)
   */
  static log(...args: any[]) {
    if (!this.isProduction) {
      console.log(...args);
    }
  }

  /**
   * Log warnings (disabled in production)
   */
  static warn(...args: any[]) {
    if (!this.isProduction) {
      console.warn(...args);
    }
  }

  /**
   * Log errors (sanitized in production)
   */
  static error(...args: any[]) {
    if (this.isProduction) {
      // In production, only log generic error without sensitive details
      console.error('An error occurred');
    } else {
      console.error(...args);
    }
  }

  /**
   * Log sensitive data (completely disabled in production)
   */
  static debug(...args: any[]) {
    if (!this.isProduction && __DEV__) {
      console.log('[DEBUG]', ...args);
    }
  }

  /**
   * Sanitize sensitive data before logging
   */
  static sanitize(data: any): any {
    if (typeof data === 'string') {
      // Hide sensitive patterns
      return data
        .replace(/AIzaSy[A-Za-z0-9_-]{33}/g, 'API_KEY_HIDDEN')
        .replace(/\b\d{10,}\b/g, 'PHONE_HIDDEN')
        .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, 'EMAIL_HIDDEN');
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data };
      const sensitiveKeys = ['password', 'token', 'key', 'secret', 'phone', 'email', 'address'];
      
      for (const key in sanitized) {
        if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
          sanitized[key] = 'HIDDEN';
        }
      }
      
      return sanitized;
    }
    
    return data;
  }

  /**
   * Production-safe logging with sanitization
   */
  static safelog(message: string, data?: any) {
    if (this.isProduction) {
      // Only log message in production, no data
      console.log(message);
    } else {
      // In development, log sanitized data
      if (data) {
        console.log(message, this.sanitize(data));
      } else {
        console.log(message);
      }
    }
  }
}

// Replace console methods in production
if (process.env.NODE_ENV === 'production') {
  // Override console methods to prevent accidental logging
  const originalConsole = { ...console };
  
  console.log = (...args: any[]) => {
    // Silent in production
  };
  
  console.warn = (...args: any[]) => {
    // Silent in production
  };
  
  console.error = (...args: any[]) => {
    // Only show generic error
    originalConsole.error('Application error occurred');
  };
  
  console.debug = (...args: any[]) => {
    // Silent in production
  };
}
