/**
 * Example 04: Marketplace Operations
 *
 * Demonstrates building marketplace transaction payloads:
 * - List a name for sale
 * - Buy a listed name
 * - Unlist a name
 *
 * Run: npx ts-node 04-marketplace.ts
 */

import {
  buildListInUstxTx,
  buildBuyInUstxTx,
  buildUnlistInUstxTx,
  getIdFromBns,
} from "bns-v2-sdk";

const NETWORK = "testnet" as const;

async function main() {
  const fqn = "myname.btc";
  const sellerAddress = "ST2QEZ06AGJ3RKJPBV14SY1V5BBFNAW33D9SZJQ0M";
  const buyerAddress = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
  const commissionTraitAddress = "ST2QEZ06AGJ3RKJPBV14SY1V5BBFNAW33D9SZJQ0M";
  const commissionTraitName = "commission-trait";

  // Get the name's token ID (needed for marketplace operations)
  console.log(`\nGetting token ID for "${fqn}"...`);
  const tokenIdRaw = await getIdFromBns({
    fullyQualifiedName: fqn,
    network: NETWORK,
  });
  const tokenId = BigInt(tokenIdRaw);
  console.log(`  Token ID: ${tokenId.toString()}`);

  // 1. List a name for sale (1000 STX = 1,000,000,000 microSTX)
  const listPrice = BigInt(1_000_000_000);
  console.log(`\nBuilding list transaction (${listPrice} microSTX)...`);

  const listPayload = buildListInUstxTx({
    id: tokenId,
    price: listPrice,
    commissionTraitAddress,
    commissionTraitName,
    senderAddress: sellerAddress,
    network: NETWORK,
  });

  console.log("  Function:", listPayload.functionName);
  console.log("  Post-conditions:", listPayload.postConditions.length);

  // 2. Buy a listed name (owner is fetched automatically by the SDK)
  console.log("\nBuilding buy transaction...");

  const buyPayload = buildBuyInUstxTx({
    id: Number(tokenId),
    expectedPrice: listPrice,
    commissionTraitAddress,
    commissionTraitName,
    senderAddress: buyerAddress,
    network: NETWORK,
  });

  console.log("  Function:", buyPayload.functionName);
  console.log("  Post-conditions:", buyPayload.postConditions.length);

  // 3. Unlist a name
  console.log("\nBuilding unlist transaction...");

  const unlistPayload = buildUnlistInUstxTx({
    id: tokenId,
    senderAddress: sellerAddress,
    network: NETWORK,
  });

  console.log("  Function:", unlistPayload.functionName);
  console.log("  Post-conditions:", unlistPayload.postConditions.length);

  console.log("\n--- All marketplace payloads built successfully ---");
  console.log("Sign and broadcast with @stacks/transactions or your wallet adapter.");
}

main().catch(console.error);
