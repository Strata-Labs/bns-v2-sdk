import { StacksNetwork } from "@stacks/network";
export declare const BnsContractName = "BNS-V2";
export declare enum BnsContractAddress {
    Mainnet = "SP2QEZ06AGJ3RKJPBV14SY1V5BBFNAW33D96YPGZF",
    Testnet = "ST2QEZ06AGJ3RKJPBV14SY1V5BBFNAW33D9SZJQ0M"
}
export interface BnsConfig {
    network: StacksNetwork;
    senderAddress: string;
}
export declare function getBnsContractAddress(network: NetworkType): string;
export declare const ZonefileContractName = "zonefile-resolver";
export declare const enum ZonefileContractAddress {
    mainnet = "SP2QEZ06AGJ3RKJPBV14SY1V5BBFNAW33D96YPGZF",
    testnet = "ST2QEZ06AGJ3RKJPBV14SY1V5BBFNAW33D9SZJQ0M"
}
export declare function getZonefileContractAddress(network: NetworkType): string;
export type NetworkType = "mainnet" | "testnet";
export type CallbackFunction = (data: any) => void;
