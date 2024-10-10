import { IntegerType } from "@stacks/common";
import { ClarityValue, PostCondition } from "@stacks/transactions";
import { StacksProvider } from "@stacks/connect";
import { NetworkType } from "./config";
export interface PriceFunction {
    base: IntegerType;
    coefficient: IntegerType;
    b1: IntegerType;
    b2: IntegerType;
    b3: IntegerType;
    b4: IntegerType;
    b5: IntegerType;
    b6: IntegerType;
    b7: IntegerType;
    b8: IntegerType;
    b9: IntegerType;
    b10: IntegerType;
    b11: IntegerType;
    b12: IntegerType;
    b13: IntegerType;
    b14: IntegerType;
    b15: IntegerType;
    b16: IntegerType;
    nonAlphaDiscount: IntegerType;
    noVowelDiscount: IntegerType;
}
export interface BnsContractCallOptions {
    functionName: string;
    functionArgs: ClarityValue[];
    senderAddress: string;
    network: NetworkType;
    postConditions?: PostCondition[];
}
export interface BnsContractCallOptionsExecution {
    functionName: string;
    functionArgs: ClarityValue[];
    address: string;
    network: NetworkType;
    postConditions?: PostCondition[];
    stacksProvider?: StacksProvider;
    onFinish?: (data: any) => void;
    onCancel?: () => void;
}
export interface BnsReadOnlyOptions {
    functionName: string;
    functionArgs: ClarityValue[];
    senderAddress: string;
    network: NetworkType;
}
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
export interface TransferNameOptions {
    fullyQualifiedName: string;
    newOwnerAddress: string;
    senderAddress: string;
    network: NetworkType;
    onFinish?: (data: any) => void;
    onCancel?: () => void;
}
export interface ListInUstxOptions {
    id: bigint;
    price: bigint;
    commissionTraitAddress: string;
    commissionTraitName: string;
    senderAddress: string;
    network: NetworkType;
    onFinish?: (data: any) => void;
    onCancel?: () => void;
}
export interface UnlistInUstxOptions {
    id: bigint;
    senderAddress: string;
    network: NetworkType;
    onFinish?: (data: any) => void;
    onCancel?: () => void;
}
export interface BuyInUstxOptions {
    id: number;
    expectedPrice: bigint;
    commissionTraitAddress: string;
    commissionTraitName: string;
    senderAddress: string;
    network: NetworkType;
    onFinish?: (data: any) => void;
    onCancel?: () => void;
}
export interface SetPrimaryNameOptions {
    fullyQualifiedName: string;
    senderAddress: string;
    network: NetworkType;
    onFinish?: (data: any) => void;
    onCancel?: () => void;
}
export interface FreezeManagerOptions {
    namespace: string;
    senderAddress: string;
    network: NetworkType;
    onFinish?: (data: any) => void;
    onCancel?: () => void;
}
export interface PreorderNamespaceOptions {
    namespace: string;
    salt: string;
    stxToBurn: IntegerType;
    senderAddress: string;
    network: NetworkType;
    onFinish?: (data: any) => void;
    onCancel?: () => void;
}
export interface RevealNamespaceOptions {
    namespace: string;
    salt: string;
    priceFunction?: PriceFunction;
    lifetime?: IntegerType;
    namespaceImportAddress: string;
    namespaceManagerAddress?: string;
    canUpdatePrice: boolean;
    managerTransfer?: boolean;
    managerFrozen?: boolean;
    senderAddress: string;
    network: NetworkType;
    onFinish?: (data: any) => void;
    onCancel?: () => void;
}
export interface LaunchNamespaceOptions {
    namespace: string;
    senderAddress: string;
    network: NetworkType;
    onFinish?: (data: any) => void;
    onCancel?: () => void;
}
export interface TurnOffManagerTransfersOptions {
    namespace: string;
    senderAddress: string;
    network: NetworkType;
    onFinish?: (data: any) => void;
    onCancel?: () => void;
}
export interface ImportNameOptions {
    namespace: string;
    name: string;
    beneficiary: string;
    senderAddress: string;
    network: NetworkType;
    onFinish?: (data: any) => void;
    onCancel?: () => void;
}
export interface NamespaceUpdatePriceOptions {
    namespace: string;
    priceFunction: PriceFunction;
    senderAddress: string;
    network: NetworkType;
    onFinish?: (data: any) => void;
    onCancel?: () => void;
}
export interface NamespaceFreezePriceOptions {
    namespace: string;
    senderAddress: string;
    network: NetworkType;
    onFinish?: (data: any) => void;
    onCancel?: () => void;
}
export interface NameFastClaimOptions {
    fullyQualifiedName: string;
    stxToBurn: number;
    sendTo: string;
    senderAddress: string;
    network: NetworkType;
    onFinish?: (data: any) => void;
    onCancel?: () => void;
}
export interface PreorderNameOptions {
    fullyQualifiedName: string;
    salt: string;
    stxToBurn: IntegerType;
    senderAddress: string;
    network: NetworkType;
    onFinish?: (data: any) => void;
    onCancel?: () => void;
}
export interface RegisterNameOptions {
    fullyQualifiedName: string;
    salt: string;
    stxToBurn: IntegerType;
    senderAddress: string;
    network: NetworkType;
    onFinish?: (data: any) => void;
    onCancel?: () => void;
}
export interface ClaimPreorderOptions {
    fullyQualifiedName: string;
    salt: string;
    stxToClaim: string;
    senderAddress: string;
    network: NetworkType;
    onFinish?: (data: any) => void;
    onCancel?: () => void;
}
export interface RenewNameOptions {
    fullyQualifiedName: string;
    stxToBurn: IntegerType;
    senderAddress: string;
    network: NetworkType;
    onFinish?: (data: any) => void;
    onCancel?: () => void;
}
export interface ResolveNameOptions {
    fullyQualifiedName: string;
    network: NetworkType;
}
export interface FetchUserOwnedNamesOptions {
    senderAddress: string;
    network: NetworkType;
}
export interface UpdateZonefileOptions {
    fullyQualifiedName: string;
    zonefileInputs: ZonefileData | undefined;
    senderAddress: string;
    network: NetworkType;
    onFinish?: (data: any) => void;
    onCancel?: () => void;
}
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
export interface ResolveNameOptions {
    fullyQualifiedName: string;
    network: NetworkType;
}
