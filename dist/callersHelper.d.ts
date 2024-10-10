import { ClarityValue } from "@stacks/transactions";
import { NetworkType } from "./config";
import { BnsContractCallOptionsExecution, BnsReadOnlyOptions } from "./interfaces";
export declare function bnsV2ReadOnlyCall(options: Omit<BnsReadOnlyOptions, "network"> & {
    network: NetworkType;
}): Promise<ClarityValue>;
export declare function zonefileReadOnlyCall(options: Omit<BnsReadOnlyOptions, "network"> & {
    network: NetworkType;
}): Promise<ClarityValue>;
export declare function bnsV2ContractCall(options: Omit<BnsContractCallOptionsExecution, "network"> & {
    network: NetworkType;
}): Promise<void>;
export declare function zonefileContractCall(options: Omit<BnsContractCallOptionsExecution, "network"> & {
    network: NetworkType;
}): Promise<void>;
