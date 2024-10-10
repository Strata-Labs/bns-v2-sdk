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
) {
  const fallbackUrl = getFallbackUrl();

  async function attemptCall(url: string) {
    const currentNetwork = new StacksMainnet({ url });
    try {
      return await callReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: options.functionName,
        functionArgs: options.functionArgs,
        senderAddress: options.senderAddress,
        network: currentNetwork,
      });
    } catch (error) {
      throw error;
    }
  }

  try {
    return await attemptCall(network.coreApiUrl);
  } catch (error) {
    if (fallbackUrl && fallbackUrl !== network.coreApiUrl) {
      return await attemptCall(fallbackUrl);
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
