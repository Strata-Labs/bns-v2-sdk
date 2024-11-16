import { ClarityValue, PostCondition } from "@stacks/transactions";
import { NetworkType } from "./config";

export interface ContractCallPayload {
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: ClarityValue[];
  postConditions: PostCondition[];
  network: NetworkType;
}

export interface PriceFunction {
  base: bigint;
  coefficient: bigint;
  b1: bigint;
  b2: bigint;
  b3: bigint;
  b4: bigint;
  b5: bigint;
  b6: bigint;
  b7: bigint;
  b8: bigint;
  b9: bigint;
  b10: bigint;
  b11: bigint;
  b12: bigint;
  b13: bigint;
  b14: bigint;
  b15: bigint;
  b16: bigint;
  nonAlphaDiscount: bigint;
  noVowelDiscount: bigint;
}

export interface BaseTransactionOptions {
  network: NetworkType;
  senderAddress: string;
}

// Read-only operation options
export interface BnsReadOnlyOptions {
  functionName: string;
  functionArgs: ClarityValue[];
  senderAddress: string;
  network: NetworkType;
}

// Individual transaction options
export interface TransferNameOptions extends BaseTransactionOptions {
  fullyQualifiedName: string;
  newOwnerAddress: string;
}

export interface ListInUstxOptions extends BaseTransactionOptions {
  id: bigint;
  price: bigint;
  commissionTraitAddress: string;
  commissionTraitName: string;
}

export interface UnlistInUstxOptions extends BaseTransactionOptions {
  id: bigint;
}

export interface BuyInUstxOptions extends BaseTransactionOptions {
  id: number;
  expectedPrice: bigint;
  commissionTraitAddress: string;
  commissionTraitName: string;
}

export interface SetPrimaryNameOptions extends BaseTransactionOptions {
  fullyQualifiedName: string;
}

export interface FreezeManagerOptions extends BaseTransactionOptions {
  namespace: string;
}

export interface PreorderNamespaceOptions extends BaseTransactionOptions {
  namespace: string;
  salt: string;
  stxToBurn: bigint;
}

export interface RevealNamespaceOptions extends BaseTransactionOptions {
  namespace: string;
  salt: string;
  priceFunction?: PriceFunction;
  lifetime?: bigint;
  namespaceImportAddress: string;
  namespaceManagerAddress?: string;
  canUpdatePrice: boolean;
  managerTransfer?: boolean;
  managerFrozen?: boolean;
}

export interface LaunchNamespaceOptions extends BaseTransactionOptions {
  namespace: string;
}

export interface TurnOffManagerTransfersOptions extends BaseTransactionOptions {
  namespace: string;
}

export interface ImportNameOptions extends BaseTransactionOptions {
  namespace: string;
  name: string;
  beneficiary: string;
}

export interface NamespaceUpdatePriceOptions extends BaseTransactionOptions {
  namespace: string;
  priceFunction: PriceFunction;
}

export interface NamespaceFreezePriceOptions extends BaseTransactionOptions {
  namespace: string;
}

export interface NameFastClaimOptions extends BaseTransactionOptions {
  fullyQualifiedName: string;
  stxToBurn: number | bigint;
  sendTo: string;
}

export interface PreorderNameOptions extends BaseTransactionOptions {
  fullyQualifiedName: string;
  salt: string;
  stxToBurn: number | bigint;
}

export interface RegisterNameOptions extends BaseTransactionOptions {
  fullyQualifiedName: string;
  salt: string;
  stxToBurn: number | bigint;
}

export interface ClaimPreorderOptions extends BaseTransactionOptions {
  fullyQualifiedName: string;
  salt: string;
  stxToClaim: string;
}

export interface RenewNameOptions extends BaseTransactionOptions {
  fullyQualifiedName: string;
  stxToBurn: bigint;
}

export interface UpdateZonefileOptions extends BaseTransactionOptions {
  fullyQualifiedName: string;
  zonefileInputs: ZonefileData | undefined;
}

// Data interfaces
export interface Subdomain {
  name: string;
  sequence: number;
  owner: string;
  signature: string;
  text: string;
}

export interface ZonefileData {
  owner: string;
  general: string;
  twitter: string;
  url: string;
  nostr: string;
  lightning: string;
  btc: string;
  subdomains: Subdomain[];
}

// Read-only operation interfaces
export interface CanRegisterNameOptions {
  fullyQualifiedName: string;
  network: NetworkType;
}

export interface GetLastTokenIdOptions {
  network: NetworkType;
}

export interface GetRenewalHeightOptions {
  fullyQualifiedName: string;
  network: NetworkType;
}

export interface CanResolveNameOptions {
  fullyQualifiedName: string;
  network: NetworkType;
}

export interface GetOwnerOptions {
  fullyQualifiedName: string;
  network: NetworkType;
}

export interface GetOwnerByIdOptions {
  id: number;
  network: NetworkType;
}

export interface GetNamespacePriceOptions {
  namespace: string;
  network: NetworkType;
}

export interface GetNamePriceOptions {
  fullyQualifiedName: string;
  network: NetworkType;
}

export interface CanNamespaceBeRegisteredOptions {
  namespace: string;
  network: NetworkType;
}

export interface GetNamespacePropertiesOptions {
  namespace: string;
  network: NetworkType;
}

export interface GetIdFromBnsOptions {
  fullyQualifiedName: string;
  network: NetworkType;
}

export interface GetBnsFromIdOptions {
  id: bigint;
  network: NetworkType;
}

export interface GetPrimaryNameOptions {
  address: string;
  network: NetworkType;
}

export interface ResolveNameOptions {
  fullyQualifiedName: string;
  network: NetworkType;
}

export interface FetchUserOwnedNamesOptions {
  senderAddress: string;
  network: NetworkType;
}

export interface NamespaceProperties {
  namespace: string;
  properties: {
    "namespace-manager": string | null;
    "manager-transferable": boolean;
    "manager-frozen": boolean;
    "namespace-import": string;
    "revealed-at": bigint;
    "launched-at": bigint | null;
    lifetime: bigint;
    "can-update-price-function": boolean;
    "price-function": PriceFunction;
  };
}

export interface NameInfo {
  owner: string;
  registeredAt: bigint | null;
  renewalHeight: bigint;
  stxBurn: bigint;
  importedAt: bigint | null;
  preorderedBy: string | null;
  hashedSaltedFqnPreorder: string | null;
}
