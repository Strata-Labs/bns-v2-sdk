import { StacksNetwork } from "@stacks/network";
// Add the cache imports
import { SDKCache, defaultCache } from "./cache";

// Central configuration object that can be expanded in the future
export const API_BASE_URL = "https://api.bnsv2.com";

// Export types and interfaces needed by other modules
export type NetworkType = "mainnet" | "testnet";

export interface BnsConfig {
  network: StacksNetwork;
  senderAddress: string;
}

// SDK Configuration interface
export interface SDKConfig {
  cache?: SDKCache;
  cacheTTL?: number;
  disableCache?: boolean;
  networkPoolSize?: number;
}

// Default configuration
export const defaultConfig: SDKConfig = {
  cache: defaultCache,
  cacheTTL: 60000, // 1 minute
  disableCache: false,
  networkPoolSize: 5,
};

// Create a global configuration object
let sdkConfig: SDKConfig = { ...defaultConfig };

// Configuration function
export function configureSDK(config: Partial<SDKConfig>): void {
  sdkConfig = { ...sdkConfig, ...config };
}

// Getter for the current configuration
export function getSDKConfig(): SDKConfig {
  return sdkConfig;
}

// Maintain backward compatibility with existing code
export const BnsContractName = "BNS-V2";
export const ZonefileContractName = "zonefile-resolver";

export enum BnsContractAddress {
  Mainnet = "SP2QEZ06AGJ3RKJPBV14SY1V5BBFNAW33D96YPGZF",
  Testnet = "ST2QEZ06AGJ3RKJPBV14SY1V5BBFNAW33D9SZJQ0M",
}

export enum ZonefileContractAddress {
  mainnet = "SP2QEZ06AGJ3RKJPBV14SY1V5BBFNAW33D96YPGZF",
  testnet = "ST2QEZ06AGJ3RKJPBV14SY1V5BBFNAW33D9SZJQ0M",
}

export function getBnsContractAddress(network: NetworkType): string {
  return network === "mainnet"
    ? BnsContractAddress.Mainnet
    : BnsContractAddress.Testnet;
}

export function getZonefileContractAddress(network: NetworkType): string {
  return network === "mainnet"
    ? ZonefileContractAddress.mainnet
    : ZonefileContractAddress.testnet;
}

// Helper function for API URL construction that can be used in readOnlyCalls.ts
export function getApiUrl(endpoint: string, network: NetworkType): string {
  const networkPrefix = network === "testnet" ? "/testnet" : "";
  return `${API_BASE_URL}${networkPrefix}${endpoint}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CallbackFunction = (data: any) => void;
