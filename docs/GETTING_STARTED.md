# Getting Started with BNS V2 SDK

## Prerequisites

- Node.js >= 16.0.0
- npm or yarn

## Installation

```bash
npm install bns-v2-sdk
```

## Quick Start

```typescript
import { canRegisterName } from "bns-v2-sdk";

const available = await canRegisterName({
  fullyQualifiedName: "myname.btc",
  network: "mainnet",
});
console.log("Available:", available);
```

## Core Concepts

### Network Selection

Every SDK function takes a `network` parameter — either `"mainnet"` or `"testnet"`:

```typescript
// Mainnet (production)
const mainnetInfo = await getNameInfo({ fullyQualifiedName: "satoshi.btc", network: "mainnet" });

// Testnet (for development)
const testnetInfo = await getNameInfo({ fullyQualifiedName: "test.btc", network: "testnet" });
```

### Payload-Only Design

The SDK **builds transaction payloads** but does **not** sign or broadcast them. This keeps the SDK lightweight and wallet-agnostic. You provide the signing and broadcasting using `@stacks/transactions` or a wallet adapter like Stacks Connect.

```typescript
import { buildTransferNameTx } from "bns-v2-sdk";

// SDK builds the payload
const payload = await buildTransferNameTx({ ... });

// You sign and broadcast it (not part of SDK)
const tx = await makeContractCall({ ...payload, senderKey: yourPrivateKey });
const result = await broadcastTransaction(tx);
```

### API-First with Contract Fallback

Read-only functions first try the BNS V2 REST API (`api.bnsv2.com`). If the API is unavailable, they automatically fall back to direct Stacks contract calls. This happens transparently.

### Debug Mode

Enable verbose logging to see what the SDK is doing:

```typescript
import { debug } from "bns-v2-sdk";

debug.enable();
// ... SDK calls now log to console
debug.disable();
```

## Read-Only Operations

### Check Name Availability

```typescript
import { canRegisterName } from "bns-v2-sdk";

const available = await canRegisterName({
  fullyQualifiedName: "myname.btc",
  network: "mainnet",
});
```

### Get Name Details

```typescript
import { getNameInfo } from "bns-v2-sdk";

const info = await getNameInfo({
  fullyQualifiedName: "satoshi.btc",
  network: "mainnet",
});

console.log(info.owner);         // STX address
console.log(info.renewalHeight); // bigint
console.log(info.stxBurn);       // bigint
```

### Fetch Names by Address

```typescript
import { fetchUserOwnedNames, getPrimaryName } from "bns-v2-sdk";

// All names owned by an address
const names = await fetchUserOwnedNames({
  senderAddress: "SP2QEZ06AGJ3RKJPBV14SY1V5BBFNAW33D96YPGZF",
  network: "mainnet",
});

// Primary name only
const primary = await getPrimaryName({
  address: "SP2QEZ06AGJ3RKJPBV14SY1V5BBFNAW33D96YPGZF",
  network: "mainnet",
});
```

### Resolve Zonefile

```typescript
import { resolveNameZonefile, getZonefileRaw, getZonefileProfile } from "bns-v2-sdk";

const zonefile = await resolveNameZonefile({
  fullyQualifiedName: "satoshi.btc",
  network: "mainnet",
});

const raw = await getZonefileRaw({ fullyQualifiedName: "satoshi.btc", network: "mainnet" });
const profile = await getZonefileProfile({ fullyQualifiedName: "satoshi.btc", network: "mainnet" });
```

## Building Transactions

### Register a Name (Two-Step Flow)

```typescript
import { buildPreorderNameTx, buildRegisterNameTx, getNamePrice } from "bns-v2-sdk";

const fqn = "myname.btc";
const price = await getNamePrice({ fullyQualifiedName: fqn, network: "mainnet" });

// Step 1: Preorder
const preorderPayload = await buildPreorderNameTx({
  fullyQualifiedName: fqn,
  salt: "your-random-salt",
  stxToBurn: price,
  senderAddress: "SP...",
  network: "mainnet",
});
// Sign and broadcast preorderPayload, then wait for confirmation...

// Step 2: Register
const registerPayload = await buildRegisterNameTx({
  fullyQualifiedName: fqn,
  salt: "your-random-salt",
  stxToBurn: price,
  senderAddress: "SP...",
  network: "mainnet",
});
// Sign and broadcast registerPayload
```

### Transfer a Name

```typescript
import { buildTransferNameTx } from "bns-v2-sdk";

const payload = await buildTransferNameTx({
  fullyQualifiedName: "myname.btc",
  newOwnerAddress: "SP1234...",
  senderAddress: "SP5678...",
  network: "mainnet",
});
```

### Marketplace Operations

```typescript
import { buildListInUstxTx, buildBuyInUstxTx, buildUnlistInUstxTx } from "bns-v2-sdk";

// List for sale
const listPayload = await buildListInUstxTx({
  id: tokenId,
  price: BigInt(1_000_000_000), // 1000 STX
  commissionTraitAddress: "SP...",
  commissionTraitName: "commission-trait",
  senderAddress: "SP...",
  network: "mainnet",
});

// Buy (owner is fetched automatically by the SDK)
const buyPayload = await buildBuyInUstxTx({
  id: tokenId,
  expectedPrice: BigInt(1_000_000_000),
  commissionTraitAddress: "SP...",
  commissionTraitName: "commission-trait",
  senderAddress: buyerAddress,
  network: "mainnet",
});
```

## Signing and Broadcasting

The SDK outputs `ContractCallPayload` objects. Use `@stacks/transactions` to sign and broadcast:

```typescript
import { makeContractCall, broadcastTransaction, AnchorMode } from "@stacks/transactions";

// payload comes from any SDK build*Tx function
const tx = await makeContractCall({
  ...payload,
  senderKey: "your-private-key",
  anchorMode: AnchorMode.Any,
});

const result = await broadcastTransaction(tx);
console.log("TX ID:", result.txid);
```

For browser wallets, use [Stacks Connect](https://github.com/hirosystems/connect):

```typescript
import { openContractCall } from "@stacks/connect";

openContractCall({
  ...payload,
  onFinish: (data) => console.log("TX ID:", data.txId),
});
```

## Transaction Tracking

After broadcasting a transaction, use the tracking helpers to monitor its status:

```typescript
import { getTransactionStatus, waitForTransaction } from "bns-v2-sdk";

// One-shot status check
const status = await getTransactionStatus("0xabc123...", "mainnet");
console.log(status.status); // "pending" | "success" | "abort_by_response" | ...

// Poll until confirmed (or aborted)
const result = await waitForTransaction({
  txId: "0xabc123...",
  network: "mainnet",
  pollingIntervalMs: 10_000,  // check every 10s (default)
  timeoutMs: 600_000,         // timeout after 10min (default)
  onStatusChange: (update) => {
    console.log("Status:", update.status);
  },
});

console.log("Final:", result.status);       // "success" or "abort_*"
console.log("Block:", result.blockHeight);   // confirmed block number
```

## Retry Configuration

API calls automatically retry on transient failures (429, 500, 502, 503, 504) with exponential backoff. The default is 3 retries.

```typescript
import { configureRetry } from "bns-v2-sdk";

// Customize retry behavior
configureRetry({
  maxRetries: 5,           // default: 3
  initialDelayMs: 2000,    // default: 1000
  maxDelayMs: 30000,       // default: 10000
  backoffMultiplier: 2,    // default: 2
});

// Disable retries entirely
configureRetry({ maxRetries: 0 });
```

## Error Handling

SDK functions throw errors for unrecoverable failures. Common patterns:

```typescript
try {
  const info = await getNameInfo({ fullyQualifiedName: "test.btc", network: "mainnet" });
} catch (error) {
  // API and contract fallback both failed
  console.error("Failed:", error.message);
}
```

For `canRegisterName`, errors are caught internally — it returns `true`/`false` without throwing for normal cases.

## Network Configuration

Configure a fallback URL for testnet:

```typescript
import { configureNetwork } from "bns-v2-sdk";

configureNetwork({
  testnetFallbackUrl: "https://your-stacks-node.example.com",
});
```

## Examples

See the [`examples/`](../examples/) directory for complete, runnable scripts covering all major operations.
