import { ClarityValue, fetchCallReadOnlyFunction } from "@stacks/transactions";
import {
  BnsContractName,
  getBnsContractAddress,
  getZonefileContractAddress,
  ZonefileContractName,
  getSDKConfig,
} from "./config";
import { BnsReadOnlyOptions } from "./interfaces";
import { StacksMainnet, StacksTestnet } from "@stacks/network";
import { getFallbackUrl, getNetwork } from "./network";
import { debug } from "./debug";
import {
  BnsError,
  createNetworkError,
  createContractError,
  createCircuitBreakerError,
} from "./errors";

// Circuit breaker state for API health
interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}

const circuitBreakers: Record<string, CircuitBreakerState> = {
  mainnet: { failures: 0, lastFailure: 0, isOpen: false },
  testnet: { failures: 0, lastFailure: 0, isOpen: false },
};

const CIRCUIT_THRESHOLD = 3; // Number of failures before opening circuit
const CIRCUIT_RESET_TIMEOUT = 30000; // 30 seconds before trying API again

function getCacheKey(
  options: BnsReadOnlyOptions,
  contractAddress: string,
  contractName: string
): string {
  return `${contractAddress}.${contractName}.${
    options.functionName
  }.${JSON.stringify(options.functionArgs)}`;
}

async function executeReadOnlyCall(
  options: BnsReadOnlyOptions,
  contractAddress: string,
  contractName: string,
  network: StacksMainnet | StacksTestnet,
  isZonefile: boolean = false
): Promise<ClarityValue> {
  const { disableCache, cache } = getSDKConfig();
  const networkType = network instanceof StacksMainnet ? "mainnet" : "testnet";
  const fallbackUrl = getFallbackUrl(networkType);

  const endTimer = debug.startTimer("executeReadOnlyCall");

  debug.log("executeReadOnlyCall initiated:", {
    networkType,
    contractAddress,
    contractName,
    functionName: options.functionName,
    coreApiUrl: network.coreApiUrl,
    fallbackUrl,
    isZonefile,
  });

  // Check cache first if not disabled
  if (!disableCache && cache) {
    const cacheKey = getCacheKey(options, contractAddress, contractName);
    const cachedValue = cache.get<ClarityValue>(cacheKey);
    if (cachedValue) {
      debug.log("Cache hit for:", cacheKey);
      endTimer();
      return cachedValue;
    }
  }

  async function attemptCall(url: string): Promise<ClarityValue> {
    const callTimer = debug.startTimer(`contract_call_${options.functionName}`);

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

      callTimer();
      debug.log(`Call successful to ${url}`, {
        functionName: options.functionName,
      });

      // Reset circuit breaker on success
      if (url === network.coreApiUrl) {
        circuitBreakers[networkType].failures = 0;
        circuitBreakers[networkType].isOpen = false;
      }

      // Cache the result if caching is enabled
      if (!disableCache && cache) {
        const cacheKey = getCacheKey(options, contractAddress, contractName);
        cache.set(cacheKey, response);
      }

      return response;
    } catch (error: any) {
      callTimer();
      debug.error(`Call failed to ${url}:`, {
        error: error.message,
        functionName: options.functionName,
      });

      // Update circuit breaker if primary API call
      if (url === network.coreApiUrl) {
        circuitBreakers[networkType].failures += 1;
        circuitBreakers[networkType].lastFailure = Date.now();

        if (circuitBreakers[networkType].failures >= CIRCUIT_THRESHOLD) {
          circuitBreakers[networkType].isOpen = true;
          debug.log(`Circuit breaker opened for ${networkType}`);
        }
      }

      throw createContractError(
        `Contract call failed: ${error.message}`,
        {
          contractAddress,
          contractName,
          functionName: options.functionName,
          url,
        },
        error
      );
    }
  }

  // Check circuit breaker state
  const circuitState = circuitBreakers[networkType];
  const circuitReset =
    circuitState.isOpen &&
    Date.now() - circuitState.lastFailure > CIRCUIT_RESET_TIMEOUT;

  try {
    // If circuit is open and not ready to reset, go directly to fallback
    if (circuitState.isOpen && !circuitReset) {
      if (fallbackUrl && fallbackUrl !== network.coreApiUrl) {
        debug.log("Circuit open, trying fallback immediately");
        const result = await attemptCall(fallbackUrl);
        endTimer();
        return result;
      } else {
        throw createCircuitBreakerError(
          `Circuit breaker open for ${networkType} and no fallback URL available`,
          { networkType }
        );
      }
    }

    // Normal flow - try primary first
    try {
      const result = await attemptCall(network.coreApiUrl);
      endTimer();
      return result;
    } catch (error) {
      if (fallbackUrl && fallbackUrl !== network.coreApiUrl) {
        debug.log("Primary endpoint failed, trying fallback");
        const result = await attemptCall(fallbackUrl);
        endTimer();
        return result;
      }
      throw error;
    }
  } catch (error) {
    endTimer();

    if (error instanceof BnsError) {
      throw error;
    }

    throw createNetworkError(
      "All endpoints failed for contract call",
      {
        contractAddress,
        contractName,
        functionName: options.functionName,
        networkType,
      },
      error instanceof Error ? error : undefined
    );
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

// Reset circuit breakers - useful for testing and recovering from temporary issues
export function resetCircuitBreakers(): void {
  Object.keys(circuitBreakers).forEach((key) => {
    circuitBreakers[key] = { failures: 0, lastFailure: 0, isOpen: false };
  });
  debug.log("Circuit breakers reset");
}

// Get circuit breaker status - useful for diagnostics
export function getCircuitBreakerStatus(): Record<string, CircuitBreakerState> {
  return { ...circuitBreakers };
}
