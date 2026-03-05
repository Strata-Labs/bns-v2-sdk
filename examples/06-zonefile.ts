/**
 * Example 06: Zonefile Operations
 *
 * Demonstrates zonefile read and write operations:
 * - Resolve a name's zonefile
 * - Get raw zonefile data
 * - Get profile zonefile data
 * - Build update zonefile transaction payloads
 *
 * Run: npx ts-node 06-zonefile.ts
 */

import {
  resolveNameZonefile,
  getZonefileRaw,
  getZonefileProfile,
  buildUpdateZonefileFlexibleTx,
  buildUpdateZonefileFormattedTx,
} from "bns-v2-sdk";

const NETWORK = "mainnet" as const;

async function main() {
  const fqn = "satoshi.btc";

  // 1. Resolve a name's zonefile
  console.log(`\nResolving zonefile for "${fqn}"...`);

  const zonefile = await resolveNameZonefile({
    fullyQualifiedName: fqn,
    network: NETWORK,
  });

  if (zonefile) {
    console.log("  Zonefile found:", JSON.stringify(zonefile, null, 2));
  } else {
    console.log("  No zonefile set");
  }

  // 2. Get raw zonefile data
  console.log(`\nGetting raw zonefile for "${fqn}"...`);

  const raw = await getZonefileRaw({
    fullyQualifiedName: fqn,
    network: NETWORK,
  });

  if (raw) {
    console.log("  Raw zonefile:", typeof raw === "string" ? raw : JSON.stringify(raw));
  } else {
    console.log("  No raw zonefile");
  }

  // 3. Get profile zonefile data
  console.log(`\nGetting profile zonefile for "${fqn}"...`);

  const profile = await getZonefileProfile({
    fullyQualifiedName: fqn,
    network: NETWORK,
  });

  if (profile) {
    console.log("  Profile:", JSON.stringify(profile, null, 2));
  } else {
    console.log("  No profile zonefile");
  }

  // 4. Build a flexible zonefile update (any JSON data)
  console.log("\nBuilding flexible zonefile update...");

  const senderAddress = "ST2QEZ06AGJ3RKJPBV14SY1V5BBFNAW33D9SZJQ0M";
  const testFqn = "myname.btc";

  const flexPayload = buildUpdateZonefileFlexibleTx({
    fullyQualifiedName: testFqn,
    zonefileData: {
      btc: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      twitter: "@satoshi",
      website: "https://example.com",
    },
    senderAddress,
    network: "testnet",
  });

  console.log("  Function:", flexPayload.functionName);

  // 5. Build a formatted zonefile update (structured data)
  console.log("\nBuilding formatted zonefile update...");

  const formattedPayload = buildUpdateZonefileFormattedTx({
    fullyQualifiedName: testFqn,
    zonefileData: {
      owner: senderAddress,
      addresses: [
        { network: "bitcoin", address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", type: "p2wpkh" },
        { network: "ethereum", address: "0x1234567890abcdef1234567890abcdef12345678", type: "eoa" },
      ],
      social: [
        { platform: "twitter", username: "@satoshi" },
      ],
    },
    senderAddress,
    network: "testnet",
  });

  console.log("  Function:", formattedPayload.functionName);

  console.log("\n--- Zonefile examples complete ---");
}

main().catch(console.error);
