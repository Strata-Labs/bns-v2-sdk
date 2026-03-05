# BNS V2 SDK

The official BNS V2 SDK for interacting with the Stacks Blockchain. This SDK provides a comprehensive set of tools for managing Bitcoin Name System (BNS) operations.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Installation](#installation)
3. [Important Note About Transactions](#important-note-about-transactions)
4. [Features](#features)
5. [Debug Mode](#debug-mode)
6. [Read-Only Functions](#read-only-functions)
7. [Contract Calls](#contract-calls)
8. [Subdomain Management](#subdomain-management)
9. [Transaction Tracking](#transaction-tracking)
10. [Retry Configuration](#retry-configuration)
11. [Network Configuration](#network-configuration)
12. [Error Handling](#error-handling)
13. [Examples](#examples)
14. [Support](#support)
15. [License](#license)

## Getting Started

New to the SDK? Check out the **[Getting Started Guide](docs/GETTING_STARTED.md)** for a complete walkthrough covering installation, core concepts, and all major operations.

## Installation

```bash
npm install bns-v2-sdk
```

## Important Note About Transactions

**This SDK only builds transaction payloads.** 

It does not:

- Sign transactions
- Broadcast transactions to the network
- Handle transaction lifecycle
- Manage wallet connections

To complete transactions, you'll need to:

1. Build the payload using this SDK
2. Sign the transaction using a wallet or the Stacks.js library
3. Broadcast the transaction to the network
4. Monitor the transaction status

## Features

- Complete TypeScript support
- Comprehensive API for BNS operations
- Supports both mainnet and testnet
- Built-in error handling and validation
- Automatic API-to-contract fallback mechanisms
- Automatic retry with exponential backoff
- Transaction status tracking and polling
- Extensive read-only functions

## Debug Mode

Enable verbose logging to see what the SDK is doing under the hood:

```typescript
import { debug } from "bns-v2-sdk";

debug.enable();
// ... SDK calls now log to console
debug.disable();
```

## Read-Only Functions

### Name Operations

```typescript
import {
  canRegisterName,
  getNameInfo,
  getOwner,
  getOwnerById,
  getRenewalHeight,
  canResolveName,
  getNamePrice,
  getLastTokenId,
  getBnsFromId,
  getIdFromBns,
  getPrimaryName,
  fetchUserOwnedNames,
  resolveNameZonefile,
  getZonefileRaw,
  getZonefileProfile,
} from "bns-v2-sdk";

// Check name availability
const available = await canRegisterName({
  fullyQualifiedName: "example.btc",
  network: "mainnet",
});

// Get full name information
const nameInfo = await getNameInfo({
  fullyQualifiedName: "example.btc",
  network: "mainnet",
});

// Get name owner
const owner = await getOwner({
  fullyQualifiedName: "example.btc",
  network: "mainnet",
});

// Get owner by NFT ID
const ownerById = await getOwnerById({
  id: 123,
  network: "mainnet",
});

// Get name renewal height
const renewalHeight = await getRenewalHeight({
  fullyQualifiedName: "example.btc",
  network: "mainnet",
});

// Check if name can resolve
const resolvable = await canResolveName({
  fullyQualifiedName: "example.btc",
  network: "mainnet",
});

// Get name price
const price = await getNamePrice({
  fullyQualifiedName: "example.btc",
  network: "mainnet",
});

// Get last token ID
const lastId = await getLastTokenId({
  network: "mainnet",
});

// Get BNS information from token ID
const bnsInfo = await getBnsFromId({
  id: 123n,
  network: "mainnet",
});

// Get token ID from BNS name
const id = await getIdFromBns({
  fullyQualifiedName: "example.btc",
  network: "mainnet",
});

// Get primary name for address
const primaryName = await getPrimaryName({
  address: "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9",
  network: "mainnet",
});

// Get all names owned by address
const ownedNames = await fetchUserOwnedNames({
  senderAddress: "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9",
  network: "mainnet",
});

// Get zonefile data (only for mainnet unless you have your own testnet node)
const zonefile = await resolveNameZonefile({
  fullyQualifiedName: "example.btc",
  network: "mainnet",
});

// Get raw zonefile data
const rawZonefile = await getZonefileRaw({
  fullyQualifiedName: "example.btc",
  network: "mainnet",
});

// Get structured profile zonefile data
const profile = await getZonefileProfile({
  fullyQualifiedName: "example.btc",
  network: "mainnet",
});
```

### Namespace Operations

```typescript
import {
  canNamespaceBeRegistered,
  getNamespaceProperties,
  getNamespacePrice,
} from "bns-v2-sdk";

// Check namespace availability
const available = await canNamespaceBeRegistered({
  namespace: "example",
  network: "mainnet",
});

// Get namespace properties
const properties = await getNamespaceProperties({
  namespace: "btc",
  network: "mainnet",
});

// Get namespace price
const price = await getNamespacePrice({
  namespace: "example",
  network: "mainnet",
});
```

## Contract Calls

### Name Registration and Management

```typescript
import {
  buildNameClaimFastTx,
  buildPreorderNameTx,
  buildRegisterNameTx,
  buildPreviousRegisterNameTx,
  buildClaimPreorderTx,
  buildRenewNameTx,
  buildTransferNameTx,
  buildSetPrimaryNameTx,
  buildUpdateZonefileTx,
  buildUpdateZonefileFlexibleTx,
  buildUpdateZonefileFormattedTx,
} from "bns-v2-sdk";

// Fast claim a name (warning: snipeable)
const fastClaimPayload = await buildNameClaimFastTx({
  fullyQualifiedName: "myname.btc",
  stxToBurn: 1000000n,
  sendTo: "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9",
  senderAddress: "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9",
  network: "mainnet",
});

// Safe two-step registration
const preorderPayload = await buildPreorderNameTx({
  fullyQualifiedName: "myname.btc",
  salt: "random-salt-string",
  stxToBurn: 1000000n,
  senderAddress: "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9",
  network: "mainnet",
});

const registerPayload = await buildRegisterNameTx({
  fullyQualifiedName: "myname.btc",
  salt: "random-salt-string",
  stxToBurn: 1000000n,
  senderAddress: "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9",
  network: "mainnet",
});

// Renew name
const renewPayload = await buildRenewNameTx({
  fullyQualifiedName: "myname.btc",
  stxToBurn: 1000000n,
  senderAddress: "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9",
  network: "mainnet",
});

// Transfer name
const transferPayload = await buildTransferNameTx({
  fullyQualifiedName: "myname.btc",
  newOwnerAddress: "SP1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE",
  senderAddress: "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9",
  network: "mainnet",
});

// Set primary name
const setPrimaryPayload = await buildSetPrimaryNameTx({
  fullyQualifiedName: "myname.btc",
  senderAddress: "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9",
  network: "mainnet",
});

// Update zonefile (structured format)
const updateZonefilePayload = await buildUpdateZonefileTx({
  fullyQualifiedName: "myname.btc",
  zonefileInputs: {
    owner: "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9",
    general: "",
    twitter: "@example",
    url: "https://example.com",
    nostr: "",
    lightning: "",
    btc: "",
    subdomains: [],
  },
  senderAddress: "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9",
  network: "mainnet",
});

// Update zonefile with flexible JSON data (any key-value pairs)
const flexPayload = await buildUpdateZonefileFlexibleTx({
  fullyQualifiedName: "myname.btc",
  zonefileData: {
    btc: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    twitter: "@satoshi",
    website: "https://example.com",
  },
  senderAddress: "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9",
  network: "mainnet",
});

// Update zonefile with formatted data (structured addresses, social, etc.)
const formattedPayload = await buildUpdateZonefileFormattedTx({
  fullyQualifiedName: "myname.btc",
  zonefileData: {
    owner: "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9",
    addresses: [
      { network: "bitcoin", address: "bc1q...", type: "p2wpkh" },
    ],
    social: [
      { platform: "twitter", username: "@example" },
    ],
  },
  senderAddress: "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9",
  network: "mainnet",
});

// Re-register a previously owned name (includes NFT transfer post conditions)
const prevRegisterPayload = await buildPreviousRegisterNameTx({
  fullyQualifiedName: "myname.btc",
  salt: "random-salt-string",
  stxToBurn: 1000000n,
  senderAddress: "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9",
  network: "mainnet",
});

// Claim STX back from a preorder
const claimPayload = await buildClaimPreorderTx({
  fullyQualifiedName: "myname.btc",
  salt: "random-salt-string",
  stxToClaim: "1000000",
  senderAddress: "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9",
  network: "mainnet",
});
```

### Marketplace Operations

```typescript
import {
  buildListInUstxTx,
  buildUnlistInUstxTx,
  buildBuyInUstxTx,
} from "bns-v2-sdk";

// List name for sale
const listPayload = await buildListInUstxTx({
  id: 123n,
  price: 1000000n,
  commissionTraitAddress: "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9",
  commissionTraitName: "commission-trait",
  senderAddress: "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9",
  network: "mainnet",
});

// Unlist name
const unlistPayload = await buildUnlistInUstxTx({
  id: 123n,
  senderAddress: "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9",
  network: "mainnet",
});

// Buy listed name
const buyPayload = await buildBuyInUstxTx({
  id: 123,
  expectedPrice: 1000000n,
  commissionTraitAddress: "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9",
  commissionTraitName: "commission-trait",
  senderAddress: "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9",
  network: "mainnet",
});
```

### Namespace Management

```typescript
import {
  buildPreorderNamespaceTx,
  buildRevealNamespaceTx,
  buildLaunchNamespaceTx,
  buildNamespaceUpdatePriceTx,
  buildNamespaceFreezePriceTx,
  buildTurnOffManagerTransfersTx,
  buildFreezeManagerTx,
  buildImportNameTx,
} from "bns-v2-sdk";

// Preorder namespace
const preorderNamespacePayload = await buildPreorderNamespaceTx({
  namespace: "example",
  salt: "random-salt-string",
  stxToBurn: 1000000n,
  senderAddress: "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9",
  network: "mainnet",
});

// Reveal namespace
const revealNamespacePayload = await buildRevealNamespaceTx({
  namespace: "example",
  salt: "random-salt-string",
  priceFunction: {
    base: 1000n,
    coefficient: 100n,
    b1: 1n,
    b2: 1n,
    b3: 1n,
    b4: 1n,
    b5: 1n,
    b6: 1n,
    b7: 1n,
    b8: 1n,
    b9: 1n,
    b10: 1n,
    b11: 1n,
    b12: 1n,
    b13: 1n,
    b14: 1n,
    b15: 1n,
    b16: 1n,
    nonAlphaDiscount: 10n,
    noVowelDiscount: 10n,
  },
  lifetime: 52595n,
  namespaceImportAddress: "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9",
  namespaceManagerAddress: "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9",
  canUpdatePrice: true,
  managerTransfer: true,
  managerFrozen: false,
  senderAddress: "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9",
  network: "mainnet",
});

// Launch namespace
const launchNamespacePayload = await buildLaunchNamespaceTx({
  namespace: "example",
  senderAddress: "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9",
  network: "mainnet",
});

// Update namespace price function
const updatePricePayload = await buildNamespaceUpdatePriceTx({
  namespace: "example",
  priceFunction: {
    base: 1000n,
    coefficient: 100n,
    b1: 1n,
    b2: 1n,
    b3: 1n,
    b4: 1n,
    b5: 1n,
    b6: 1n,
    b7: 1n,
    b8: 1n,
    b9: 1n,
    b10: 1n,
    b11: 1n,
    b12: 1n,
    b13: 1n,
    b14: 1n,
    b15: 1n,
    b16: 1n,
    nonAlphaDiscount: 1n,
    noVowelDiscount: 1n,
  },
  senderAddress: "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9",
  network: "mainnet",
});

// Freeze namespace price function
const freezePricePayload = await buildNamespaceFreezePriceTx({
  namespace: "example",
  senderAddress: "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9",
  network: "mainnet",
});

// Turn off manager transfers
const turnOffManagerPayload = await buildTurnOffManagerTransfersTx({
  namespace: "example",
  senderAddress: "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9",
  network: "mainnet",
});

// Freeze manager
const freezeManagerPayload = await buildFreezeManagerTx({
  namespace: "example",
  senderAddress: "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9",
  network: "mainnet",
});

// Import name
const importNamePayload = await buildImportNameTx({
  namespace: "example",
  name: "myname",
  beneficiary: "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9",
  senderAddress: "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9",
  network: "mainnet",
});
```

## Subdomain Management

The BNS SDK provides functionality to manage subdomains through zonefile manipulation. Subdomains can be stored either directly in the parent domain's zonefile (on-chain) or in an external S3 bucket.

### Zonefile Structure

The SDK provides two zonefile types:

- **`ZonefileData`** — Legacy format used by `buildUpdateZonefileTx`. Has required fields: `owner`, `general`, `twitter`, `url`, `nostr`, `lightning`, `btc`.
- **`NewZonefileData`** — Recommended format used by `buildUpdateZonefileFormattedTx`. Uses structured `social`, `addresses`, and `meta` arrays.

```typescript
// Recommended format (used with buildUpdateZonefileFormattedTx)
interface NewZonefileData {
  owner: string;              // Parent domain owner address
  btc?: string;               // Bitcoin address
  bio?: string;               // Short biography
  website?: string;           // Website URL
  pfp?: string;               // Profile picture URL
  name?: string;              // Display name
  location?: string;          // Location
  social?: SocialEntry[];     // Social media accounts
  addresses?: AddressEntry[]; // Multi-chain addresses
  meta?: MetaEntry[];         // Custom key-value pairs
  // Either subdomains OR externalSubdomainsFile can be present
  subdomains?: SubdomainMap[];
  externalSubdomainsFile?: string;
}

// Each SubdomainMap is an object with a single key (the subdomain label)
// mapping to the subdomain's properties
type SubdomainMap = Record<string, SubdomainProperties>;

interface SubdomainProperties {
  owner: string;
  general?: string;
  twitter?: string;
  url?: string;
  nostr?: string;
  lightning?: string;
  btc?: string;
  bio?: string;
  website?: string;
  pfp?: string;
  name?: string;
  location?: string;
  social?: SocialEntry[];
  addresses?: AddressEntry[];
}

interface SocialEntry {
  platform: string;   // e.g. "twitter", "github", "discord", "telegram"
  username: string;
}

interface AddressEntry {
  network: string;    // e.g. "bitcoin", "ethereum", "solana", "stacks"
  address: string;
  type: string;       // e.g. "p2wpkh", "p2tr", "wallet"
}

interface MetaEntry {
  name: string;       // Custom key name
  value: string;      // Custom value
}
```

### Direct Zonefile Storage (On-chain)

```typescript
import { buildUpdateZonefileFormattedTx } from 'bns-v2-sdk';
import type { NewZonefileData, SubdomainMap } from 'bns-v2-sdk';

async function updateDirectSubdomains() {
  const subdomains: SubdomainMap[] = [
    {
      "sub1": {
        owner: "SP2ZNGJ85ENDY6QRHQ5P2D4FXQJ6INMT00GBGJ2QX",
        bio: "Profile information",
        website: "https://example.com",
        btc: "bc1...",
        social: [
          { platform: "twitter", username: "example" }
        ]
      }
    }
  ];

  const zonefileData: NewZonefileData = {
    owner: "SP3FGQ8Z7JY9BWYZ5WM53E0M9NK7WHJF0691NZ159",
    bio: "Parent domain info",
    website: "https://parent.com",
    btc: "bc1_parent",
    social: [
      { platform: "twitter", username: "parent" }
    ],
    subdomains: subdomains
  };

  const tx = await buildUpdateZonefileFormattedTx({
    fullyQualifiedName: "mydomain.btc",
    zonefileData: zonefileData,
    senderAddress: "SP3FGQ8Z7JY9BWYZ5WM53E0M9NK7WHJF0691NZ159",
    network: "mainnet"
  });
}
```

### External Storage (S3 Bucket)

For managing large numbers of subdomains (>100), use external storage:

```typescript
async function updateExternalSubdomains() {
  const zonefileData: NewZonefileData = {
    owner: "SP3FGQ8Z7JY9BWYZ5WM53E0M9NK7WHJF0691NZ159",
    bio: "Parent domain info",
    website: "https://parent.com",
    btc: "bc1_parent",
    social: [
      { platform: "twitter", username: "parent" }
    ],
    externalSubdomainsFile: "https://your-bucket.s3.amazonaws.com/subdomains.json"
  };

  const tx = await buildUpdateZonefileFormattedTx({
    fullyQualifiedName: "mydomain.btc",
    zonefileData: zonefileData,
    senderAddress: "SP3FGQ8Z7JY9BWYZ5WM53E0M9NK7WHJF0691NZ159",
    network: "mainnet"
  });
}
```

### Requirements and Limitations

1. Only the parent domain owner can update the zonefile
2. The sender address must match the owner address
3. Choose either direct subdomains or external file storage
4. External S3 files must:
   - Use HTTPS protocol
   - End with .json extension
   - Be hosted on allowed S3 domains
   - Not contain query parameters or credentials
   - Contain valid JSON with a "subdomains" property
5. Size limits:
   - On-chain storage: Limited by BNS contract
   - External S3 file: Maximum 50MB
   - Recommended external storage for >100 subdomains

## Transaction Tracking

After broadcasting a transaction, track its status until confirmation:

```typescript
import { getTransactionStatus, waitForTransaction } from "bns-v2-sdk";

// One-shot status check
const status = await getTransactionStatus("0xabc123...", "mainnet");
console.log(status.status); // "pending" | "success" | "abort_by_response" | ...

// Poll until confirmed
const result = await waitForTransaction({
  txId: "0xabc123...",
  network: "mainnet",
  pollingIntervalMs: 10_000,  // every 10s (default)
  timeoutMs: 600_000,         // 10min timeout (default)
  onStatusChange: (update) => console.log("Status:", update.status),
});

console.log(result.status);      // "success"
console.log(result.blockHeight); // confirmed block number
```

## Retry Configuration

API calls automatically retry on transient failures (429, 500, 502, 503, 504) with exponential backoff. Default: 3 retries.

```typescript
import { configureRetry } from "bns-v2-sdk";

// Customize
configureRetry({
  maxRetries: 5,
  initialDelayMs: 2000,
  maxDelayMs: 30000,
});

// Disable retries
configureRetry({ maxRetries: 0 });
```

## Network Configuration

```typescript
import { configureNetwork } from "bns-v2-sdk";

configureNetwork({
  testnetFallbackUrl: "https://your-testnet-node.com",
});
```

## Error Handling

```typescript
try {
  const nameInfo = await getNameInfo({
    fullyQualifiedName: "example.btc",
    network: "mainnet",
  });
} catch (error) {
  if (error.message === "Name not found") {
    // Handle non-existent name
  } else {
    // Handle other errors
  }
}
```

## Examples

See the [`examples/`](examples/) directory for complete, runnable scripts:

- `01-check-name.ts` — Name availability and info lookups
- `02-lookup-address.ts` — Fetch names by address, primary name
- `03-register-name.ts` — Two-step preorder + register flow
- `04-marketplace.ts` — List, buy, and unlist operations
- `05-track-transaction.ts` — Transaction status tracking
- `06-zonefile.ts` — Zonefile read and update operations

```bash
cd examples
npm install
npx ts-node 01-check-name.ts
```

## Support

For issues and feature requests, please use the [GitHub issues page](https://github.com/Strata-Labs/bns-v2-sdk/issues).

## License

MIT License
