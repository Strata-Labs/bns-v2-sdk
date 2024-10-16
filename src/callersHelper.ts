import {
  AnchorMode,
  ClarityValue,
  callReadOnlyFunction,
} from "@stacks/transactions";
import { openContractCall } from "@stacks/connect";
import {
  BnsContractName,
  getBnsContractAddress,
  getZonefileContractAddress,
  NetworkType,
  ZonefileContractName,
} from "./config";
import {
  BnsContractCallOptionsExecution,
  BnsReadOnlyOptions,
} from "./interfaces";
import { getFallbackUrl, getNetwork } from "./utils";
import { StacksMainnet } from "@stacks/network";

async function executeReadOnlyCall(
  options: BnsReadOnlyOptions,
  contractAddress: string,
  contractName: string,
  network: StacksMainnet
): Promise<ClarityValue> {
  const fallbackUrl = getFallbackUrl();

  async function attemptCall(url: string): Promise<ClarityValue> {
    const currentNetwork = new StacksMainnet({ url });
    try {
      const response = await callReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: options.functionName,
        functionArgs: options.functionArgs,
        senderAddress: options.senderAddress,
        network: currentNetwork,
      });

      // If the response contains an error, throw it
      if ((response as any).error) {
        throw new Error((response as any).error);
      }

      return response;
    } catch (error: any) {
      // Optionally, log the error details
      console.error(`Error during attemptCall with url ${url}:`, error);

      // Re-throw the error to be caught by the outer try...catch
      throw error;
    }
  }

  try {
    return await attemptCall(network.coreApiUrl);
  } catch (error) {
    console.warn(
      `Error with primary URL (${network.coreApiUrl}), attempting fallback URL...`
    );

    if (fallbackUrl && fallbackUrl !== network.coreApiUrl) {
      try {
        return await attemptCall(fallbackUrl);
      } catch (fallbackError) {
        console.error(
          `Error with fallback URL (${fallbackUrl}):`,
          fallbackError
        );
        throw fallbackError;
      }
    } else {
      throw error;
    }
  }
}

export async function bnsV2ReadOnlyCall(
  options: Omit<BnsReadOnlyOptions, "network"> & { network: NetworkType }
): Promise<ClarityValue> {
  const network = getNetwork(options.network);
  const contractAddress = getBnsContractAddress(options.network);

  if (options.network === "mainnet" && network instanceof StacksMainnet) {
    return executeReadOnlyCall(
      options,
      contractAddress,
      BnsContractName,
      network
    );
  }

  return callReadOnlyFunction({
    contractAddress,
    contractName: BnsContractName,
    functionName: options.functionName,
    functionArgs: options.functionArgs,
    senderAddress: options.senderAddress,
    network,
  });
}

export async function zonefileReadOnlyCall(
  options: Omit<BnsReadOnlyOptions, "network"> & { network: NetworkType }
): Promise<ClarityValue> {
  const network = getNetwork(options.network);
  const contractAddress = getZonefileContractAddress(options.network);

  if (options.network === "mainnet" && network instanceof StacksMainnet) {
    return executeReadOnlyCall(
      options,
      contractAddress,
      ZonefileContractName,
      network
    );
  }

  return callReadOnlyFunction({
    contractAddress,
    contractName: ZonefileContractName,
    functionName: options.functionName,
    functionArgs: options.functionArgs,
    senderAddress: options.senderAddress,
    network,
  });
}

export async function bnsV2ContractCall(
  options: Omit<BnsContractCallOptionsExecution, "network"> & {
    network: NetworkType;
  }
): Promise<void> {
  const network = getNetwork(options.network);
  const txOptions = {
    contractAddress: getBnsContractAddress(options.network),
    contractName: BnsContractName,
    functionName: options.functionName,
    functionArgs: options.functionArgs,
    address: options.address,
    validateWithAbi: true,
    network: network,
    anchorMode: AnchorMode.Any,
    postConditions: options.postConditions,
    onFinish: options.onFinish,
    onCancel: options.onCancel,
  };

  return openContractCall(txOptions);
}

export async function zonefileContractCall(
  options: Omit<BnsContractCallOptionsExecution, "network"> & {
    network: NetworkType;
  }
): Promise<void> {
  const network = getNetwork(options.network);
  const txOptions = {
    contractAddress: getZonefileContractAddress(options.network),
    contractName: ZonefileContractName,
    functionName: options.functionName,
    functionArgs: options.functionArgs,
    address: options.address,
    validateWithAbi: true,
    network,
    anchorMode: AnchorMode.Any,
    postConditions: options.postConditions,
    onFinish: options.onFinish,
    onCancel: options.onCancel,
  };

  return openContractCall(txOptions);
}
