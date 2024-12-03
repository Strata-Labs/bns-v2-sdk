import { ClarityValue, fetchCallReadOnlyFunction } from "@stacks/transactions";
import {
  BnsContractName,
  getBnsContractAddress,
  getZonefileContractAddress,
  ZonefileContractName,
} from "./config";
import { BnsReadOnlyOptions } from "./interfaces";
import { StacksMainnet, StacksTestnet } from "@stacks/network";
import { getFallbackUrl, getNetwork } from "./network";
import { debug } from "./debug";

async function executeReadOnlyCall(
  options: BnsReadOnlyOptions,
  contractAddress: string,
  contractName: string,
  network: StacksMainnet | StacksTestnet,
  isZonefile: boolean = false
): Promise<ClarityValue> {
  const networkType = network instanceof StacksMainnet ? "mainnet" : "testnet";
  const fallbackUrl = getFallbackUrl(networkType);

  debug.log("executeReadOnlyCall initiated:", {
    networkType,
    contractAddress,
    contractName,
    functionName: options.functionName,
    coreApiUrl: network.coreApiUrl,
    fallbackUrl,
    isZonefile,
  });

  async function attemptCall(url: string): Promise<ClarityValue> {
    const currentNetwork =
      networkType === "mainnet"
        ? new StacksMainnet({ url })
        : new StacksTestnet({ url });

    try {
      const response = await fetchCallReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: options.functionName,
        functionArgs: options.functionArgs,
        senderAddress: options.senderAddress,
        network: networkType,
      });

      if ((response as any).error) {
        throw new Error((response as any).error);
      }

      return response;
    } catch (error: any) {
      debug.error("Call failed:", { error: error.message, url, networkType });
      throw error;
    }
  }

  try {
    return await attemptCall(network.coreApiUrl);
  } catch (error) {
    if (fallbackUrl && fallbackUrl !== network.coreApiUrl) {
      return await attemptCall(fallbackUrl);
    }
    throw error;
  }
}

export async function bnsV2ReadOnlyCall(
  options: BnsReadOnlyOptions
): Promise<ClarityValue> {
  const network = getNetwork(options.network);
  const contractAddress = getBnsContractAddress(options.network);

  return executeReadOnlyCall(
    options,
    contractAddress,
    BnsContractName,
    network,
    false
  );
}

export async function zonefileReadOnlyCall(
  options: BnsReadOnlyOptions
): Promise<ClarityValue> {
  const network = getNetwork(options.network);
  const contractAddress = getZonefileContractAddress(options.network);

  return executeReadOnlyCall(
    options,
    contractAddress,
    ZonefileContractName,
    network,
    true
  );
}
