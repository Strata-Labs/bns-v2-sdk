import { NetworkType } from "./config";
import { StacksMainnet, StacksTestnet } from "@stacks/network";
interface NetworkConfig {
    testnetFallbackUrl?: string;
}
export declare function configureNetwork(config: NetworkConfig): void;
export declare function getNetwork(networkType: NetworkType): StacksMainnet | StacksTestnet;
export declare function getFallbackUrl(networkType?: NetworkType): string;
export {};
