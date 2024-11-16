import { ClarityValue } from "@stacks/transactions";
import { BnsReadOnlyOptions } from "./interfaces";
export declare function bnsV2ReadOnlyCall(options: BnsReadOnlyOptions): Promise<ClarityValue>;
export declare function zonefileReadOnlyCall(options: BnsReadOnlyOptions): Promise<ClarityValue>;
