/**
 * Example 03: Register a Name (Two-Step Flow)
 *
 * Demonstrates building transaction payloads for the preorder + register flow.
 * The SDK builds the payloads — you sign and broadcast them with @stacks/transactions.
 *
 * Flow:
 *   1. buildPreorderNameTx()  → sign & broadcast → wait for confirmation
 *   2. buildRegisterNameTx()  → sign & broadcast → wait for confirmation
 *
 * Run: npx ts-node 03-register-name.ts
 */

import {
  canRegisterName,
  buildPreorderNameTx,
  buildRegisterNameTx,
  getNamePrice,
} from "bns-v2-sdk";

const NETWORK = "testnet" as const;

async function main() {
  const name = "myname";
  const namespace = "btc";
  const fqn = `${name}.${namespace}`;
  const senderAddress = "ST2QEZ06AGJ3RKJPBV14SY1V5BBFNAW33D9SZJQ0M";

  // 1. Check availability first
  console.log(`\nChecking if "${fqn}" is available...`);
  const available = await canRegisterName({
    fullyQualifiedName: fqn,
    network: NETWORK,
  });

  if (!available) {
    console.log("  Name is not available for registration.");
    return;
  }
  console.log("  Name is available!");

  // 2. Check the price
  console.log(`\nGetting price for "${fqn}"...`);
  const price = BigInt(await getNamePrice({
    fullyQualifiedName: fqn,
    network: NETWORK,
  }));
  console.log(`  Price: ${price.toString()} microSTX`);

  // 3. Build the preorder transaction payload
  console.log("\nBuilding preorder transaction...");
  const preorderPayload = buildPreorderNameTx({
    fullyQualifiedName: fqn,
    salt: "random-salt-string",
    stxToBurn: price,
    senderAddress,
    network: NETWORK,
  });

  console.log("  Contract:", preorderPayload.contractAddress);
  console.log("  Function:", preorderPayload.functionName);
  console.log("  Post-conditions:", preorderPayload.postConditions.length);

  // 4. Build the register transaction payload
  console.log("\nBuilding register transaction...");
  const registerPayload = buildRegisterNameTx({
    fullyQualifiedName: fqn,
    salt: "random-salt-string",
    stxToBurn: price,
    senderAddress,
    network: NETWORK,
  });

  console.log("  Contract:", registerPayload.contractAddress);
  console.log("  Function:", registerPayload.functionName);
  console.log("  Post-conditions:", registerPayload.postConditions.length);

  // Next steps (not handled by SDK):
  // 1. Sign preorderPayload with @stacks/transactions or your wallet
  // 2. Broadcast the signed preorder transaction
  // 3. Wait for preorder confirmation (use waitForTransaction)
  // 4. Sign registerPayload
  // 5. Broadcast the signed register transaction
  // 6. Wait for register confirmation
  console.log("\n--- Payloads built successfully ---");
  console.log("Sign and broadcast these with @stacks/transactions or your wallet adapter.");
}

main().catch(console.error);
