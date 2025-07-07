import { NetworkType } from "./config";
import { StacksMainnet, StacksTestnet } from "@stacks/network";
import { debug } from "./debug";

interface NetworkConfig {
  testnetFallbackUrl?: string;
}

let testnetFallbackUrl: string | undefined;

export function configureNetwork(config: NetworkConfig) {
  testnetFallbackUrl = config.testnetFallbackUrl;
  debug.log(
    "Network configuration updated - testnet fallback URL:",
    testnetFallbackUrl
  );
}

export function getNetwork(networkType: NetworkType) {
  debug.log("Getting network for type:", networkType);

  if (networkType === "mainnet") {
    const network = new StacksMainnet();
    debug.log("Created mainnet network:", {
      apiUrl: network.coreApiUrl,
    });
    return network;
  } else {
    const network = new StacksTestnet();
    debug.log("Created testnet network:", {
      apiUrl: network.coreApiUrl,
    });
    return network;
  }
}

export function getFallbackUrl(networkType?: NetworkType): string {
  debug.log("Getting fallback URL for network type:", networkType);

  if (networkType === "testnet" && testnetFallbackUrl) {
    debug.log("Using testnet fallback URL:", testnetFallbackUrl);
    return testnetFallbackUrl;
  }

  debug.log("No fallback URL available");
  return "";
}
