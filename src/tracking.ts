import axios from "axios";
import { NetworkType } from "./config";
import { debug } from "./debug";
import { withRetry } from "./retry";

export type TransactionStatus =
  | "pending"
  | "success"
  | "abort_by_response"
  | "abort_by_post_condition"
  | "not_found";

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

const TERMINAL_STATUSES: TransactionStatus[] = [
  "success",
  "abort_by_response",
  "abort_by_post_condition",
];

function getApiUrl(network: NetworkType): string {
  return network === "mainnet"
    ? "https://api.hiro.so"
    : "https://api.testnet.hiro.so";
}

function mapStatus(apiStatus: string): TransactionStatus {
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
export async function getTransactionStatus(
  txId: string,
  network: NetworkType
): Promise<TransactionStatusResult> {
  const apiUrl = getApiUrl(network);
  const url = `${apiUrl}/extended/v1/tx/${txId}`;

  debug.log("Checking transaction status:", { txId, url });

  try {
    const response = await withRetry(() => axios.get(url));
    const data = response.data;

    const status = mapStatus(data.tx_status);

    const result: TransactionStatusResult = {
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
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return { txId, status: "not_found" };
    }
    throw error;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wait for a transaction to reach a terminal state (success or abort).
 * Polls the Stacks API at the configured interval until the transaction
 * is confirmed, aborted, or the timeout is reached.
 */
export async function waitForTransaction(
  options: TrackTransactionOptions
): Promise<TransactionStatusResult> {
  const {
    txId,
    network,
    pollingIntervalMs = 10_000,
    timeoutMs = 600_000,
    onStatusChange,
  } = options;

  debug.log("Waiting for transaction:", {
    txId,
    network,
    pollingIntervalMs,
    timeoutMs,
  });

  const startTime = Date.now();
  let lastStatus: TransactionStatus | undefined;

  while (true) {
    const result = await getTransactionStatus(txId, network);

    if (result.status !== lastStatus) {
      lastStatus = result.status;
      debug.log("Transaction status changed:", {
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
      debug.error("Transaction tracking timed out:", { txId, elapsed });
      throw new Error(
        `Transaction ${txId} did not reach a terminal state within ${timeoutMs}ms`
      );
    }

    await sleep(pollingIntervalMs);
  }
}
