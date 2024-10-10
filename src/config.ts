import { StacksNetwork } from "@stacks/network";

export const BnsContractName = "BNS-V2";

export enum BnsContractAddress {
  Mainnet = "SP2QEZ06AGJ3RKJPBV14SY1V5BBFNAW33D96YPGZF",
  Testnet = "ST2QEZ06AGJ3RKJPBV14SY1V5BBFNAW33D9SZJQ0M",
}

export interface BnsConfig {
  network: StacksNetwork;
  senderAddress: string;
}

export function getBnsContractAddress(network: NetworkType): string {
  return network === "mainnet"
    ? BnsContractAddress.Mainnet
    : BnsContractAddress.Testnet;
}

export const ZonefileContractName = "zonefile-resolver";

export const enum ZonefileContractAddress {
  mainnet = "SP2QEZ06AGJ3RKJPBV14SY1V5BBFNAW33D96YPGZF",
  testnet = "ST2QEZ06AGJ3RKJPBV14SY1V5BBFNAW33D9SZJQ0M",
}

export function getZonefileContractAddress(network: NetworkType): string {
  return network === "mainnet"
    ? ZonefileContractAddress.mainnet
    : ZonefileContractAddress.testnet;
}

export type NetworkType = "mainnet" | "testnet";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CallbackFunction = (data: any) => void;
