/**
 * Error Handler Utility
 * Provides consistent error handling and user-friendly error messages across the app
 */

export interface AppError {
  type: 'network' | 'auth' | 'validation' | 'server' | 'unknown';
  message: string;
  originalError?: any;
}

/**
 * Parse and categorize errors from Appwrite or network requests
 */
export function parseError(error: any): AppError {
  // Network errors
  if (!navigator.onLine || error.message?.includes('network') || error.message?.includes('fetch')) {
    return {
      type: 'network',
      message: 'No internet connection. Please check your network and try again.',
      originalError: error,
    };
  }

  // Appwrite errors
  if (error.code) {
    switch (error.code) {
      case 401:
        return {
          type: 'auth',
          message: 'Invalid credentials. Please try again.',
          originalError: error,
        };
      case 404:
        return {
          type: 'auth',
          message: 'Account not found.',
          originalError: error,
        };
      case 409:
        return {
          type: 'auth',
          message: 'An account with this phone number already exists.',
          originalError: error,
        };
      case 429:
        return {
          type: 'server',
          message: 'Too many attempts. Please try again later.',
          originalError: error,
        };
      case 500:
      case 502:
      case 503:
        return {
          type: 'server',
          message: 'Server error. Please try again in a moment.',
          originalError: error,
        };
      default:
        break;
    }
  }

  // Validation errors
  if (error.message?.includes('invalid') || error.message?.includes('required')) {
    return {
      type: 'validation',
      message: error.message || 'Please check your input and try again.',
      originalError: error,
    };
  }

  // Default error
  return {
    type: 'unknown',
    message: error.message || 'Something went wrong. Please try again.',
    originalError: error,
  };
}

/**
 * Validate phone number format
 */
export function validatePhoneNumber(phone: string): { valid: boolean; message?: string } {
  if (!phone || phone.trim().length === 0) {
    return { valid: false, message: 'Phone number is required' };
  }

  // Remove any non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');

  if (digitsOnly.length < 10) {
    return { valid: false, message: 'Phone number must be at least 10 digits' };
  }

  if (digitsOnly.length > 15) {
    return { valid: false, message: 'Phone number is too long' };
  }

  return { valid: true };
}

/**
 * Validate name format
 */
export function validateName(name: string): { valid: boolean; message?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, message: 'Name is required' };
  }

  if (name.trim().length < 2) {
    return { valid: false, message: 'Name must be at least 2 characters' };
  }

  return { valid: true };
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on auth or validation errors
      const parsedError = parseError(error);
      if (parsedError.type === 'auth' || parsedError.type === 'validation') {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, baseDelay * Math.pow(2, i)));
      }
    }
  }

  throw lastError;
}
