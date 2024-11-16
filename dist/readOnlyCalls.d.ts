import { CanNamespaceBeRegisteredOptions, CanRegisterNameOptions, CanResolveNameOptions, FetchUserOwnedNamesOptions, GetBnsFromIdOptions, GetIdFromBnsOptions, GetLastTokenIdOptions, GetNamePriceOptions, GetNamespacePriceOptions, GetNamespacePropertiesOptions, GetOwnerOptions, GetPrimaryNameOptions, GetRenewalHeightOptions, NamespaceProperties, NameInfo, ResolveNameOptions, ZonefileData, GetOwnerByIdOptions } from "./interfaces";
export declare function getLastTokenId({ network, }: GetLastTokenIdOptions): Promise<bigint>;
export declare function getRenewalHeight({ fullyQualifiedName, network, }: GetRenewalHeightOptions): Promise<bigint>;
export declare function canResolveName({ fullyQualifiedName, network, }: CanResolveNameOptions): Promise<{
    renewal: bigint;
    owner: string;
}>;
export declare function getOwner({ fullyQualifiedName, network, }: GetOwnerOptions): Promise<string | null>;
export declare function getOwnerById({ id, network, }: GetOwnerByIdOptions): Promise<string | null>;
export declare function getIdFromBns({ fullyQualifiedName, network, }: GetIdFromBnsOptions): Promise<bigint>;
export declare function getBnsFromId({ id, network, }: GetBnsFromIdOptions): Promise<{
    name: string;
    namespace: string;
} | null>;
export declare function canRegisterName({ fullyQualifiedName, network, }: CanRegisterNameOptions): Promise<boolean>;
export declare function getNamespacePrice({ namespace, network, }: GetNamespacePriceOptions): Promise<bigint>;
export declare function getNamePrice({ fullyQualifiedName, network, }: GetNamePriceOptions): Promise<bigint>;
export declare function canNamespaceBeRegistered({ namespace, network, }: CanNamespaceBeRegisteredOptions): Promise<boolean>;
export declare function getNamespaceProperties({ namespace, network, }: GetNamespacePropertiesOptions): Promise<NamespaceProperties>;
export declare function getNameInfo({ fullyQualifiedName, network, }: CanRegisterNameOptions): Promise<NameInfo>;
export declare function getPrimaryName({ address, network, }: GetPrimaryNameOptions): Promise<{
    name: string;
    namespace: string;
} | null>;
export declare function fetchUserOwnedNames({ senderAddress, network, }: FetchUserOwnedNamesOptions): Promise<Array<{
    name: string;
    namespace: string;
}>>;
export declare function resolveNameZonefile({ fullyQualifiedName, network, }: ResolveNameOptions): Promise<ZonefileData | null>;
