import { NetworkType } from "./config";
import { StacksMainnet, StacksTestnet } from "@stacks/network";
import { debug } from "./debug";
import { getSDKConfig } from "./config";

// Network pool for reusing network connections
class NetworkPool {
  private mainnetPool: StacksMainnet[] = [];
  private testnetPool: StacksTestnet[] = [];
  private mainnetFallbackUrl: string = "";
  private testnetFallbackUrl: string = "";

  constructor() {
    this.initializePools();
  }

  private initializePools(): void {
    const config = getSDKConfig();
    const poolSize = config.networkPoolSize || 5; // Use default if undefined

    // Initialize mainnet pool
    for (let i = 0; i < poolSize; i++) {
      this.mainnetPool.push(new StacksMainnet());
    }

    // Initialize testnet pool
    for (let i = 0; i < poolSize; i++) {
      this.testnetPool.push(new StacksTestnet());
    }

    debug.log("Network pools initialized with size:", poolSize);
  }

  public getNetwork(networkType: NetworkType) {
    debug.log("Getting network for type:", networkType);

    if (networkType === "mainnet") {
      // Return the least recently used network instance
      const network = this.mainnetPool.shift();
      if (network) {
        this.mainnetPool.push(network);
        return network;
      }
      // Fallback if pool is empty
      const newNetwork = new StacksMainnet();
      debug.log("Created new mainnet network (pool empty):", {
        apiUrl: newNetwork.coreApiUrl,
      });
      return newNetwork;
    } else {
      // Return the least recently used network instance
      const network = this.testnetPool.shift();
      if (network) {
        this.testnetPool.push(network);
        return network;
      }
      // Fallback if pool is empty
      const newNetwork = new StacksTestnet();
      debug.log("Created new testnet network (pool empty):", {
        apiUrl: newNetwork.coreApiUrl,
      });
      return newNetwork;
    }
  }

  public setFallbackUrl(networkType: NetworkType, url: string): void {
    if (networkType === "mainnet") {
      this.mainnetFallbackUrl = url;
    } else {
      this.testnetFallbackUrl = url;
    }
    debug.log(`Set ${networkType} fallback URL to:`, url);
  }

  public getFallbackUrl(networkType: NetworkType): string {
    return networkType === "mainnet"
      ? this.mainnetFallbackUrl
      : this.testnetFallbackUrl;
  }

  // Reinitialize pools when configuration changes
  public refreshPools(): void {
    // Clear existing pools
    this.mainnetPool = [];
    this.testnetPool = [];

    // Reinitialize with current configuration
    this.initializePools();
    debug.log("Network pools refreshed with new configuration");
  }
}

// Create a singleton instance
const networkPool = new NetworkPool();

// Update interface to include both testnet and mainnet fallback URLs
export interface NetworkConfig {
  testnetFallbackUrl?: string;
  mainnetFallbackUrl?: string;
}

export function configureNetwork(config: NetworkConfig) {
  if (config.testnetFallbackUrl) {
    networkPool.setFallbackUrl("testnet", config.testnetFallbackUrl);
  }

  if (config.mainnetFallbackUrl) {
    networkPool.setFallbackUrl("mainnet", config.mainnetFallbackUrl);
  }

  // Refresh pool in case configuration has changed
  networkPool.refreshPools();

  debug.log("Network configuration updated", config);
}

export function getNetwork(networkType: NetworkType) {
  const network = networkPool.getNetwork(networkType);
  debug.log("Retrieved network for type:", {
    networkType,
    apiUrl: network.coreApiUrl,
  });
  return network;
}

export function getFallbackUrl(networkType: NetworkType): string {
  const fallbackUrl = networkPool.getFallbackUrl(networkType);
  debug.log("Getting fallback URL for network type:", {
    networkType,
    fallbackUrl: fallbackUrl || "(none)",
  });
  return fallbackUrl;
}
