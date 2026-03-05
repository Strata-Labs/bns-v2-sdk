import { NetworkType } from "./config";
export type TransactionStatus = "pending" | "success" | "abort_by_response" | "abort_by_post_condition" | "not_found";
export interface TransactionStatusResult {
    txId: string;
    status: TransactionStatus;
    blockHeight?: number;
    blockHash?: string;
    error?: string;
    raw?: unknown;
}
export interface TrackTransactionOptions {
    txId: string;
    network: NetworkType;
    /** Polling interval in milliseconds (default: 10000) */
    pollingIntervalMs?: number;
    /** Timeout in milliseconds (default: 600000 = 10 minutes) */
    timeoutMs?: number;
    /** Called whenever the transaction status changes */
    onStatusChange?: (result: TransactionStatusResult) => void;
}
/**
 * Check the current status of a transaction.
 * Makes a single request to the Stacks API.
 */
export declare function getTransactionStatus(txId: string, network: NetworkType): Promise<TransactionStatusResult>;
/**
 * Wait for a transaction to reach a terminal state (success or abort).
 * Polls the Stacks API at the configured interval until the transaction
 * is confirmed, aborted, or the timeout is reached.
 */
export declare function waitForTransaction(options: TrackTransactionOptions): Promise<TransactionStatusResult>;
