/**
 * Example 02: Lookup Names by Address
 *
 * Demonstrates address-based lookups:
 * - Fetch all names owned by an address
 * - Get the primary name for an address
 *
 * Run: npx ts-node 02-lookup-address.ts
 */

import { fetchUserOwnedNames, getPrimaryName } from "bns-v2-sdk";

const NETWORK = "mainnet" as const;

async function main() {
  const address = "SP2QEZ06AGJ3RKJPBV14SY1V5BBFNAW33D96YPGZF";

  // 1. Fetch all names owned by an address
  console.log(`\nFetching names owned by ${address}...`);

  const names = await fetchUserOwnedNames({
    senderAddress: address,
    network: NETWORK,
  });

  console.log(`  Found ${names.length} name(s):`);
  for (const n of names) {
    console.log(`    - ${n.name}.${n.namespace}`);
  }

  // 2. Get the primary name for an address
  console.log(`\nGetting primary name for ${address}...`);

  const primary = await getPrimaryName({
    address,
    network: NETWORK,
  });

  if (primary) {
    console.log(`  Primary name: ${primary.name}.${primary.namespace}`);
  } else {
    console.log("  No primary name set");
  }
}

main().catch(console.error);
