"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureRetry = configureRetry;
exports.getRetryConfig = getRetryConfig;
exports.withRetry = withRetry;
const debug_1 = require("./debug");
const DEFAULT_RETRY_CONFIG = {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    retryableStatusCodes: [429, 500, 502, 503, 504],
};
let globalRetryConfig = { ...DEFAULT_RETRY_CONFIG };
/**
 * Configure global retry behavior for all SDK API calls.
 * Retries are enabled by default (3 retries with exponential backoff).
 * Call `configureRetry({ maxRetries: 0 })` to disable.
 */
function configureRetry(config) {
    globalRetryConfig = { ...globalRetryConfig, ...config };
    debug_1.debug.log("Retry configuration updated:", globalRetryConfig);
}
function getRetryConfig() {
    return { ...globalRetryConfig };
}
function isRetryableError(error, config) {
    if (error && typeof error === "object" && "response" in error) {
        const status = error.response
            ?.status;
        if (status && config.retryableStatusCodes.includes(status)) {
            return true;
        }
    }
    if (error && typeof error === "object" && "code" in error) {
        const code = error.code;
        if (code === "ECONNRESET" ||
            code === "ETIMEDOUT" ||
            code === "ECONNABORTED") {
            return true;
        }
    }
    return false;
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Wrap an async function with exponential backoff retry logic.
 * Uses the global retry config by default, or accepts an override.
 */
async function withRetry(fn, config) {
    const cfg = config
        ? { ...globalRetryConfig, ...config }
        : globalRetryConfig;
    let lastError;
    for (let attempt = 0; attempt <= cfg.maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            if (attempt >= cfg.maxRetries || !isRetryableError(error, cfg)) {
                throw error;
            }
            const delay = Math.min(cfg.initialDelayMs * Math.pow(cfg.backoffMultiplier, attempt), cfg.maxDelayMs);
            debug_1.debug.log(`Retry attempt ${attempt + 1}/${cfg.maxRetries} after ${delay}ms`);
            await sleep(delay);
        }
    }
    throw lastError;
}
