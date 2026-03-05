export interface RetryConfig {
    maxRetries: number;
    initialDelayMs: number;
    maxDelayMs: number;
    backoffMultiplier: number;
    retryableStatusCodes: number[];
}
/**
 * Configure global retry behavior for all SDK API calls.
 * Retries are enabled by default (3 retries with exponential backoff).
 * Call `configureRetry({ maxRetries: 0 })` to disable.
 */
export declare function configureRetry(config: Partial<RetryConfig>): void;
export declare function getRetryConfig(): RetryConfig;
/**
 * Wrap an async function with exponential backoff retry logic.
 * Uses the global retry config by default, or accepts an override.
 */
export declare function withRetry<T>(fn: () => Promise<T>, config?: Partial<RetryConfig>): Promise<T>;
