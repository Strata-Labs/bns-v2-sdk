/**
 * Example 01: Check Name Availability & Info
 *
 * Demonstrates the simplest read-only SDK operations:
 * - Check if a name can be registered
 * - Get detailed info about an existing name
 * - Get the current owner of a name
 *
 * Run: npx ts-node 01-check-name.ts
 */

import {
  canRegisterName,
  getNameInfo,
  getOwner,
  canResolveName,
} from "bns-v2-sdk";

const NETWORK = "mainnet" as const;

async function main() {
  // 1. Check if a name is available for registration
  const nameToCheck = "satoshi.btc";
  console.log(`\nChecking availability of "${nameToCheck}"...`);

  const available = await canRegisterName({
    fullyQualifiedName: nameToCheck,
    network: NETWORK,
  });
  console.log(`  Can register: ${available}`);

  // 2. Get detailed info about an existing name
  console.log(`\nGetting info for "${nameToCheck}"...`);

  const info = await getNameInfo({
    fullyQualifiedName: nameToCheck,
    network: NETWORK,
  });
  console.log("  Owner:", info.owner);
  console.log("  Registered at block:", info.registeredAt?.toString());
  console.log("  Renewal height:", info.renewalHeight.toString());
  console.log("  STX burn:", info.stxBurn.toString());

  // 3. Get just the owner
  console.log(`\nGetting owner of "${nameToCheck}"...`);

  const owner = await getOwner({
    fullyQualifiedName: nameToCheck,
    network: NETWORK,
  });
  console.log("  Owner:", owner);

  // 4. Check if a name can be resolved (has zonefile)
  console.log(`\nChecking if "${nameToCheck}" can resolve...`);

  try {
    const resolution = await canResolveName({
      fullyQualifiedName: nameToCheck,
      network: NETWORK,
    });
    console.log("  Can resolve: yes");
    console.log("  Owner:", resolution.owner);
    console.log("  Renewal:", resolution.renewal.toString());
  } catch {
    console.log("  Can resolve: no");
  }
}

main().catch(console.error);
