// Comprehensive Error Handler for Production
import { SecureLogger } from './logger';

export class ErrorHandler {
  /**
   * Handle and log errors safely
   */
  static handleError(error: any, context: string): void {
    try {
      const errorInfo = {
        context,
        message: error?.message || 'Unknown error',
        stack: __DEV__ ? error?.stack : undefined,
        timestamp: new Date().toISOString()
      };

      SecureLogger.error(`Error in ${context}:`, errorInfo);
      
      // In development, also log to console for debugging
      if (__DEV__) {
        console.error(`[${context}] Error:`, error);
      }
    } catch (loggingError) {
      // Fallback if even error logging fails
      console.error('Critical: Error handler failed:', loggingError);
    }
  }

  /**
   * Safe async error wrapper
   */
  static async safeAsync<T>(
    asyncFn: () => Promise<T>,
    context: string,
    fallback?: T
  ): Promise<T | undefined> {
    try {
      return await asyncFn();
    } catch (error) {
      this.handleError(error, context);
      return fallback;
    }
  }

  /**
   * Safe sync error wrapper
   */
  static safeSync<T>(
    syncFn: () => T,
    context: string,
    fallback?: T
  ): T | undefined {
    try {
      return syncFn();
    } catch (error) {
      this.handleError(error, context);
      return fallback;
    }
  }
}
