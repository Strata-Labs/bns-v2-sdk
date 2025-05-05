// Define error types for better error handling
export enum ErrorCode {
  API_ERROR = "API_ERROR",
  CONTRACT_ERROR = "CONTRACT_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
  UNEXPECTED_RESPONSE = "UNEXPECTED_RESPONSE",
  CACHE_ERROR = "CACHE_ERROR",
  ZONEFILE_ERROR = "ZONEFILE_ERROR",
  CIRCUIT_BREAKER_OPEN = "CIRCUIT_BREAKER_OPEN",
  PERMISSION_ERROR = "PERMISSION_ERROR",
  TIMEOUT_ERROR = "TIMEOUT_ERROR",
}

export class BnsError extends Error {
  public code: ErrorCode;
  public details?: any;
  public originalError?: Error;

  constructor(
    code: ErrorCode,
    message: string,
    details?: any,
    originalError?: Error
  ) {
    super(message);
    this.name = "BnsError";
    this.code = code;
    this.details = details;
    this.originalError = originalError;

    // Properly maintain stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BnsError);
    }
  }

  // Format error for logging
  public toString(): string {
    let result = `[${this.code}] ${this.message}`;
    if (this.details) {
      result += `\nDetails: ${JSON.stringify(this.details)}`;
    }
    if (this.originalError) {
      result += `\nOriginal error: ${this.originalError.message}`;
    }
    return result;
  }
}

// Helper to create specific errors
export function createApiError(
  message: string,
  details?: any,
  originalError?: Error
): BnsError {
  return new BnsError(ErrorCode.API_ERROR, message, details, originalError);
}

export function createContractError(
  message: string,
  details?: any,
  originalError?: Error
): BnsError {
  return new BnsError(
    ErrorCode.CONTRACT_ERROR,
    message,
    details,
    originalError
  );
}

export function createNetworkError(
  message: string,
  details?: any,
  originalError?: Error
): BnsError {
  return new BnsError(ErrorCode.NETWORK_ERROR, message, details, originalError);
}

export function createValidationError(
  message: string,
  details?: any,
  originalError?: Error
): BnsError {
  return new BnsError(
    ErrorCode.VALIDATION_ERROR,
    message,
    details,
    originalError
  );
}

export function createNotFoundError(
  message: string,
  details?: any,
  originalError?: Error
): BnsError {
  return new BnsError(ErrorCode.NOT_FOUND, message, details, originalError);
}

export function createUnexpectedResponseError(
  message: string,
  details?: any,
  originalError?: Error
): BnsError {
  return new BnsError(
    ErrorCode.UNEXPECTED_RESPONSE,
    message,
    details,
    originalError
  );
}

export function createCacheError(
  message: string,
  details?: any,
  originalError?: Error
): BnsError {
  return new BnsError(ErrorCode.CACHE_ERROR, message, details, originalError);
}

export function createZonefileError(
  message: string,
  details?: any,
  originalError?: Error
): BnsError {
  return new BnsError(
    ErrorCode.ZONEFILE_ERROR,
    message,
    details,
    originalError
  );
}

export function createCircuitBreakerError(
  message: string,
  details?: any,
  originalError?: Error
): BnsError {
  return new BnsError(
    ErrorCode.CIRCUIT_BREAKER_OPEN,
    message,
    details,
    originalError
  );
}

export function createPermissionError(
  message: string,
  details?: any,
  originalError?: Error
): BnsError {
  return new BnsError(
    ErrorCode.PERMISSION_ERROR,
    message,
    details,
    originalError
  );
}

export function createTimeoutError(
  message: string,
  details?: any,
  originalError?: Error
): BnsError {
  return new BnsError(ErrorCode.TIMEOUT_ERROR, message, details, originalError);
}

// Error handling utilities
export function isAxiosError(error: any): boolean {
  return error && error.isAxiosError === true;
}

export function isBnsError(error: any): error is BnsError {
  return error instanceof BnsError;
}

export function convertError(error: any): BnsError {
  if (isBnsError(error)) {
    return error;
  }

  if (isAxiosError(error)) {
    const statusCode = error.response?.status;
    const responseData = error.response?.data;

    if (statusCode === 404) {
      return createNotFoundError(
        "Resource not found",
        { statusCode, responseData, url: error.config?.url },
        error
      );
    }

    if (statusCode === 403 || statusCode === 401) {
      return createPermissionError(
        "Permission denied",
        { statusCode, responseData },
        error
      );
    }

    if (statusCode >= 500) {
      return createApiError(
        "Server error",
        { statusCode, responseData },
        error
      );
    }

    return createApiError(
      error.message || "API request failed",
      { statusCode, responseData },
      error
    );
  }

  // If it's a string, convert to error
  if (typeof error === "string") {
    return new BnsError(ErrorCode.UNEXPECTED_RESPONSE, error);
  }

  // Default case - unknown error type
  return new BnsError(
    ErrorCode.UNEXPECTED_RESPONSE,
    error?.message || "Unknown error occurred",
    error,
    error instanceof Error ? error : undefined
  );
}
