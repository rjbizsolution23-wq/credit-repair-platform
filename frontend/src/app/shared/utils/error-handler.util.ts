export class ErrorHandlerUtil {
  /**
   * Safely converts any data type to a displayable string
   * @param data - The data to sanitize
   * @returns A safe string representation
   */
  static sanitizeObject(data: any): string {
    try {
      // Handle null or undefined
      if (data === null || data === undefined) {
        return '';
      }

      // Handle primitive types
      if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
        return String(data);
      }

      // Handle Error objects
      if (data instanceof Error) {
        return data.message || 'An error occurred';
      }

      // Handle objects with common error properties
      if (typeof data === 'object') {
        if (data.message && data.title) {
          return `${data.title}: ${data.message}`;
        }
        if (data.message) {
          return data.message;
        }
        if (data.error) {
          return this.sanitizeObject(data.error);
        }
        if (data.statusText && data.status) {
          return `${data.status}: ${data.statusText}`;
        }
        
        // Safely stringify objects
        try {
          return JSON.stringify(data, this.getCircularReplacer(), 2);
        } catch (stringifyError) {
          return '[Object - Cannot display]';
        }
      }

      // Fallback
      return String(data);
    } catch (error) {
      console.error('Error sanitizing object:', error);
      return '[Error processing data]';
    }
  }

  /**
   * Handles circular references in JSON.stringify
   */
  private static getCircularReplacer() {
    const seen = new WeakSet();
    return (key: string, value: any) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular Reference]';
        }
        seen.add(value);
      }
      return value;
    };
  }

  /**
   * Extracts error message from various error formats
   * @param error - The error object
   * @returns A user-friendly error message
   */
  static extractErrorMessage(error: any): string {
    if (!error) return 'Unknown error occurred';
    
    if (typeof error === 'string') return error;
    
    if (error.message) return error.message;
    
    if (error.error && error.error.message) return error.error.message;
    
    if (error.statusText) return error.statusText;
    
    return this.sanitizeObject(error);
  }

  /**
   * Checks if the error is a network/backend error
   * @param error - The error object
   * @returns True if it's a network error
   */
  static isNetworkError(error: any): boolean {
    if (!error) return false;
    
    // Check for common network error indicators
    if (error.status === 0 || error.status >= 500) return true;
    if (error.name === 'NetworkError') return true;
    if (error.message && error.message.includes('network')) return true;
    if (error.type === 'error' && !error.status) return true;
    
    return false;
  }

  /**
   * Formats error for logging
   * @param error - The error object
   * @param context - Additional context
   * @returns Formatted error string
   */
  static formatErrorForLogging(error: any, context?: string): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}] ` : '';
    const errorStr = this.sanitizeObject(error);
    
    return `${timestamp} ${contextStr}${errorStr}`;
  }
}