# BNS V2 SDK

The official BNS V2 SDK for interacting with Stacks Blockchain.

## Table of Contents

- [Installation](#installation)
- [Setup](#setup)
- [Environment Configuration](#environment-configuration)
- [Functions](#functions)
  - [Read-only Functions](#read-only-functions)
  - [Contract-calls](#contract-calls)
- [Usage Examples](#usage-examples)

## Installation

Install the SDK using npm:

```bash
npm install bns-v2-sdk
```

## Setup

Import the necessary functions in your JavaScript/TypeScript file:

```javascript
import { 
  canRegisterName, 
  getLastTokenId,
  // ... other functions you need
} from 'bns-v2-sdk';
```

## Environment Configuration

Create a `.env` file in your project root and add the following variable:

```
NEXT_PUBLIC_BNS_FALLBACK_URL=https://your-fallback-url.com
```

This fallback URL is used when the primary Stacks API is unavailable. Replace `https://your-fallback-url.com` with an actual fallback URL.
## Functions

### Read-only Functions

1. **canRegisterName**
   ```typescript
   async function canRegisterName(options: CanRegisterNameOptions): Promise<boolean>
   ```
   Checks if a name can be registered.

2. **getLastTokenId**
   ```typescript
   async function getLastTokenId(options: GetLastTokenIdOptions): Promise<bigint>
   ```
   Retrieves the ID of the last minted BNS token.

3. **getRenewalHeight**
   ```typescript
   async function getRenewalHeight(options: GetRenewalHeightOptions): Promise<bigint>
   ```
   Gets the block height at which a name needs to be renewed.

4. **canResolveName**
   ```typescript
   async function canResolveName(options: CanResolveNameOptions): Promise<{ renewal: bigint; owner: string }>
   ```
   Checks if a name can be resolved and returns its renewal height and owner.

5. **getOwner**
   ```typescript
   async function getOwner(options: GetOwnerOptions): Promise<string | null>
   ```
   Retrieves the owner of a name.

6. **getOwnerById**
   ```typescript
   async function getOwnerById(options: GetOwnerByIdOptions): Promise<string | null>
   ```
   Retrieves the owner of a name by its ID.

7. **getNamespacePrice**
   ```typescript
   async function getNamespacePrice(options: GetNamespacePriceOptions): Promise<bigint>
   ```
   Gets the price to register a namespace.

8. **getNamePrice**
   ```typescript
   async function getNamePrice(options: GetNamePriceOptions): Promise<bigint>
   ```
   Gets the price to register a name.

9. **canNamespaceBeRegistered**
   ```typescript
   async function canNamespaceBeRegistered(options: CanNamespaceBeRegisteredOptions): Promise<boolean>
   ```
   Checks if a namespace can be registered.

10. **getNamespaceProperties**
    ```typescript
    async function getNamespaceProperties(options: GetNamespacePropertiesOptions): Promise<NamespaceProperties>
    ```
    Retrieves the properties of a namespace.

11. **getNameInfo**
    ```typescript
    async function getNameInfo(options: CanRegisterNameOptions): Promise<NameInfo>
    ```
    Retrieves information about a name.

12. **getIdFromBns**
    ```typescript
    async function getIdFromBns(options: GetIdFromBnsOptions): Promise<bigint>
    ```
    Gets the ID of a BNS name.

13. **getBnsFromId**
    ```typescript
    async function getBnsFromId(options: GetBnsFromIdOptions): Promise<{ name: string; namespace: string } | null>
    ```
    Retrieves the name and namespace for a given BNS ID.

14. **getPrimaryName**
    ```typescript
    async function getPrimaryName(options: GetPrimaryNameOptions): Promise<{ name: string; namespace: string } | null>
    ```
    Gets the primary name for an address.

15. **fetchUserOwnedNames**
    ```typescript
    async function fetchUserOwnedNames(options: FetchUserOwnedNamesOptions): Promise<Array<{ name: string; namespace: string }>>
    ```
    Retrieves all names owned by a user.

16. **resolveNameZonefile**
    ```typescript
    async function resolveNameZonefile(options: ResolveNameOptions): Promise<ZonefileData | null>
    ```
    Resolves a BNS name to its parsed zonefile data.

### Contract Calls

1. **buildTransferNameTx**
   ```typescript
   async function buildTransferNameTx(options: TransferNameOptions): Promise<void>
   ```
   Builds a transaction to transfer a name to a new owner.

2. **buildListInUstxTx**
   ```typescript
   async function buildListInUstxTx(options: ListInUstxOptions): Promise<void>
   ```
   Builds a transaction to list a name for sale.

3. **buildUnlistInUstxTx**
   ```typescript
   async function buildUnlistInUstxTx(options: UnlistInUstxOptions): Promise<void>
   ```
   Builds a transaction to unlist a name from sale.

4. **buildBuyInUstxTx**
   ```typescript
   async function buildBuyInUstxTx(options: BuyInUstxOptions): Promise<void>
   ```
   Builds a transaction to buy a listed name.

5. **buildSetPrimaryNameTx**
   ```typescript
   async function buildSetPrimaryNameTx(options: SetPrimaryNameOptions): Promise<void>
   ```
   Builds a transaction to set a name as the primary name for an address.

6. **buildFreezeManagerTx**
   ```typescript
   async function buildFreezeManagerTx(options: FreezeManagerOptions): Promise<void>
   ```
   Builds a transaction to freeze the namespace manager.

7. **buildPreorderNamespaceTx**
   ```typescript
   async function buildPreorderNamespaceTx(options: PreorderNamespaceOptions): Promise<void>
   ```
   Builds a transaction to preorder a namespace.

8. **buildRevealNamespaceTx**
   ```typescript
   async function buildRevealNamespaceTx(options: RevealNamespaceOptions): Promise<void>
   ```
   Builds a transaction to reveal a preordered namespace.

9. **buildLaunchNamespaceTx**
   ```typescript
   async function buildLaunchNamespaceTx(options: LaunchNamespaceOptions): Promise<void>
   ```
   Builds a transaction to launch a namespace.

10. **buildTurnOffManagerTransfersTx**
    ```typescript
    async function buildTurnOffManagerTransfersTx(options: TurnOffManagerTransfersOptions): Promise<void>
    ```
    Builds a transaction to turn off manager transfers for a namespace.

11. **buildImportNameTx**
    ```typescript
    async function buildImportNameTx(options: ImportNameOptions): Promise<void>
    ```
    Builds a transaction to import a name into a namespace.

12. **buildNamespaceUpdatePriceTx**
    ```typescript
    async function buildNamespaceUpdatePriceTx(options: NamespaceUpdatePriceOptions): Promise<void>
    ```
    Builds a transaction to update the price function for a namespace.

13. **buildNamespaceFreezePriceTx**
    ```typescript
    async function buildNamespaceFreezePriceTx(options: NamespaceFreezePriceOptions): Promise<void>
    ```
    Builds a transaction to freeze the price function for a namespace.

14. **buildNameClaimFastTx**
    ```typescript
    async function buildNameClaimFastTx(options: NameFastClaimOptions): Promise<void>
    ```
    Builds a transaction to quickly claim a name in a namespace.

15. **buildPreorderNameTx**
    ```typescript
    async function buildPreorderNameTx(options: PreorderNameOptions): Promise<void>
    ```
    Builds a transaction to preorder a name.

16. **buildRegisterNameTx**
    ```typescript
    async function buildRegisterNameTx(options: RegisterNameOptions): Promise<void>
    ```
    Builds a transaction to register a preordered name.

17. **buildPreviousRegisterNameTx**
    ```typescript
    async function buildPreviousRegisterNameTx(options: RegisterNameOptions): Promise<void>
    ```
    Builds a transaction to try and register a name that was previously registered.

18. **buildClaimPreorderTx**
    ```typescript
    async function buildClaimPreorderTx(options: ClaimPreorderOptions): Promise<void>
    ```
    Builds a transaction to claim STX from a preorder that didn't result in a successful registration.

19. **buildRenewNameTx**
    ```typescript
    async function buildRenewNameTx(options: RenewNameOptions): Promise<void>
    ```
    Builds a transaction to renew a name.

20. **buildUpdateZonefileTx**
    ```typescript
    async function buildUpdateZonefileTx(options: UpdateZonefileOptions): Promise<void>
    ```
    Builds a transaction to update the zonefile for a name.

## Usage Examples

Here are a few examples of how to use some of the functions:

1. Check if a name can be registered:
   ```javascript
   const canRegister = await canRegisterName({
     fullyQualifiedName: "myname.btc",
     network: "mainnet"
   });
   console.log(canRegister ? "Name is available" : "Name is taken");
   ```

2. Get the price of a name:
   ```javascript
   const price = await getNamePrice({
     fullyQualifiedName: "myname.btc",
     network: "mainnet"
   });
   console.log(`The price to register this name is ${price} microSTX`);
   ```

3. Build a transaction to register a name:
   ```javascript
   await buildRegisterNameTx({
     fullyQualifiedName: "myname.btc",
     salt: "randomsalt123",
     stxToBurn: 1000000n, // 1 STX
     senderAddress: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
     network: "mainnet",
     onFinish: (data) => console.log("Transaction sent:", data),
     onCancel: () => console.log("Transaction cancelled")
   });
   ```
