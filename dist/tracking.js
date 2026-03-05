"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransactionStatus = getTransactionStatus;
exports.waitForTransaction = waitForTransaction;
const axios_1 = __importDefault(require("axios"));
const debug_1 = require("./debug");
const retry_1 = require("./retry");
const TERMINAL_STATUSES = [
    "success",
    "abort_by_response",
    "abort_by_post_condition",
];
function getApiUrl(network) {
    return network === "mainnet"
        ? "https://api.hiro.so"
        : "https://api.testnet.hiro.so";
}
function mapStatus(apiStatus) {
    switch (apiStatus) {
        case "success":
            return "success";
        case "pending":
            return "pending";
        case "abort_by_response":
            return "abort_by_response";
        case "abort_by_post_condition":
            return "abort_by_post_condition";
        default:
            if (apiStatus.startsWith("abort")) {
                return "abort_by_response";
            }
            return "pending";
    }
}
/**
 * Check the current status of a transaction.
 * Makes a single request to the Stacks API.
 */
async function getTransactionStatus(txId, network) {
    const apiUrl = getApiUrl(network);
    const url = `${apiUrl}/extended/v1/tx/${txId}`;
    debug_1.debug.log("Checking transaction status:", { txId, url });
    try {
        const response = await (0, retry_1.withRetry)(() => axios_1.default.get(url));
        const data = response.data;
        const status = mapStatus(data.tx_status);
        const result = {
            txId,
            status,
            raw: data,
        };
        if (data.block_height) {
            result.blockHeight = data.block_height;
        }
        if (data.block_hash) {
            result.blockHash = data.block_hash;
        }
        if (status.startsWith("abort") && data.tx_result?.repr) {
            result.error = data.tx_result.repr;
        }
        return result;
    }
    catch (error) {
        if (axios_1.default.isAxiosError(error) && error.response?.status === 404) {
            return { txId, status: "not_found" };
        }
        throw error;
    }
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Wait for a transaction to reach a terminal state (success or abort).
 * Polls the Stacks API at the configured interval until the transaction
 * is confirmed, aborted, or the timeout is reached.
 */
async function waitForTransaction(options) {
    const { txId, network, pollingIntervalMs = 10000, timeoutMs = 600000, onStatusChange, } = options;
    debug_1.debug.log("Waiting for transaction:", {
        txId,
        network,
        pollingIntervalMs,
        timeoutMs,
    });
    const startTime = Date.now();
    let lastStatus;
    while (true) {
        const result = await getTransactionStatus(txId, network);
        if (result.status !== lastStatus) {
            lastStatus = result.status;
            debug_1.debug.log("Transaction status changed:", {
                txId,
                status: result.status,
            });
            if (onStatusChange) {
                onStatusChange(result);
            }
        }
        if (TERMINAL_STATUSES.includes(result.status)) {
            return result;
        }
        const elapsed = Date.now() - startTime;
        if (elapsed + pollingIntervalMs > timeoutMs) {
            debug_1.debug.error("Transaction tracking timed out:", { txId, elapsed });
            throw new Error(`Transaction ${txId} did not reach a terminal state within ${timeoutMs}ms`);
        }
        await sleep(pollingIntervalMs);
    }
}
