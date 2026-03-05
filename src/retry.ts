import { debug } from "./debug";

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableStatusCodes: number[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableStatusCodes: [429, 500, 502, 503, 504],
};

let globalRetryConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG };

/**
 * Configure global retry behavior for all SDK API calls.
 * Retries are enabled by default (3 retries with exponential backoff).
 * Call `configureRetry({ maxRetries: 0 })` to disable.
 */
export function configureRetry(config: Partial<RetryConfig>): void {
  globalRetryConfig = { ...globalRetryConfig, ...config };
  debug.log("Retry configuration updated:", globalRetryConfig);
}

export function getRetryConfig(): RetryConfig {
  return { ...globalRetryConfig };
}

function isRetryableError(error: unknown, config: RetryConfig): boolean {
  if (error && typeof error === "object" && "response" in error) {
    const status = (error as { response?: { status?: number } }).response
      ?.status;
    if (status && config.retryableStatusCodes.includes(status)) {
      return true;
    }
  }
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code?: string }).code;
    if (
      code === "ECONNRESET" ||
      code === "ETIMEDOUT" ||
      code === "ECONNABORTED"
    ) {
      return true;
    }
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wrap an async function with exponential backoff retry logic.
 * Uses the global retry config by default, or accepts an override.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config?: Partial<RetryConfig>
): Promise<T> {
  const cfg = config
    ? { ...globalRetryConfig, ...config }
    : globalRetryConfig;

  let lastError: unknown;

  for (let attempt = 0; attempt <= cfg.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt >= cfg.maxRetries || !isRetryableError(error, cfg)) {
        throw error;
      }

      const delay = Math.min(
        cfg.initialDelayMs * Math.pow(cfg.backoffMultiplier, attempt),
        cfg.maxDelayMs
      );

      debug.log(
        `Retry attempt ${attempt + 1}/${cfg.maxRetries} after ${delay}ms`
      );
      await sleep(delay);
    }
  }

  throw lastError;
}
