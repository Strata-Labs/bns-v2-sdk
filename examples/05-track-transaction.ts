/**
 * Example 05: Track Transaction Status
 *
 * Demonstrates the transaction tracking helpers:
 * - getTransactionStatus() for a one-shot status check
 * - waitForTransaction() to poll until confirmation
 *
 * Run: npx ts-node 05-track-transaction.ts
 */

import { getTransactionStatus, waitForTransaction } from "bns-v2-sdk";

const NETWORK = "mainnet" as const;

async function main() {
  // Replace with a real transaction ID to test
  const txId = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

  // 1. One-shot status check
  console.log(`\nChecking status of ${txId}...`);

  const status = await getTransactionStatus(txId, NETWORK);
  console.log("  Status:", status.status);

  if (status.blockHeight) {
    console.log("  Block height:", status.blockHeight);
  }
  if (status.error) {
    console.log("  Error:", status.error);
  }

  // 2. Wait for a transaction to confirm (with status change callback)
  // Uncomment below with a real pending tx ID to test polling:
  //
  // console.log("\nWaiting for transaction to confirm...");
  //
  // const result = await waitForTransaction({
  //   txId: "0x<your-pending-tx-id>",
  //   network: NETWORK,
  //   pollingIntervalMs: 10_000,  // check every 10 seconds
  //   timeoutMs: 600_000,         // give up after 10 minutes
  //   onStatusChange: (update) => {
  //     console.log(`  Status changed: ${update.status}`);
  //   },
  // });
  //
  // console.log("\nFinal result:");
  // console.log("  Status:", result.status);
  // console.log("  Block:", result.blockHeight);
}

main().catch(console.error);
