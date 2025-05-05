import {
  bufferCV,
  ClarityType,
  ClarityValue,
  cvToString,
  getCVTypeString,
  ResponseErrorCV,
  standardPrincipalCV,
  uintCV,
  bufferCVFromString,
  BufferCV,
  TupleCV,
  UIntCV,
  BooleanCV,
  PrincipalCV,
  SomeCV,
} from "@stacks/transactions";
import axios from "axios";
import {
  asciiToUtf8,
  decodeFQN,
  generateRandomAddress,
  parsePriceFunction,
  parseZonefile,
} from "./utils";
import { BnsContractName, getBnsContractAddress, getSDKConfig } from "./config";
import {
  CanNamespaceBeRegisteredOptions,
  CanRegisterNameOptions,
  CanResolveNameOptions,
  FetchUserOwnedNamesOptions,
  GetBnsFromIdOptions,
  GetIdFromBnsOptions,
  GetLastTokenIdOptions,
  GetNamePriceOptions,
  GetNamespacePriceOptions,
  GetNamespacePropertiesOptions,
  GetOwnerOptions,
  GetPrimaryNameOptions,
  GetRenewalHeightOptions,
  NamespaceProperties,
  NameInfo,
  ResolveNameOptions,
  ZonefileData,
  GetOwnerByIdOptions,
} from "./interfaces";
import { bnsV2ReadOnlyCall, zonefileReadOnlyCall } from "./callersHelper";
import { debug } from "./debug";
import {
  createApiError,
  createNotFoundError,
  createContractError,
  createUnexpectedResponseError,
} from "./errors";

const API_BASE_URL = "https://api.bnsv2.com";

// Helper function for API calls with network support and caching
const callApi = async (endpoint: string, network: string) => {
  const cacheKey = `api:${network}:${endpoint}`;
  const { disableCache, cache } = getSDKConfig();

  // Check cache first if not disabled
  if (!disableCache && cache) {
    const cachedValue = cache.get(cacheKey);
    if (cachedValue) {
      debug.log("API cache hit for:", cacheKey);
      return cachedValue;
    }
  }

  const endTimer = debug.startTimer(`api_call:${endpoint}`);

  try {
    const networkPrefix = network === "testnet" ? "/testnet" : "";
    const url = `${API_BASE_URL}${networkPrefix}${endpoint}`;
    debug.log("Making API call to:", url);

    const response = await axios.get(url);

    // Cache the result if caching is enabled
    if (!disableCache && cache) {
      cache.set(cacheKey, response.data);
    }

    endTimer();
    return response.data;
  } catch (error: any) {
    endTimer();

    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw createNotFoundError(
        `Resource not found: ${endpoint}`,
        {
          endpoint,
          network,
          statusCode: error.response.status,
        },
        error
      );
    }

    debug.error("API call failed:", error);
    throw createApiError(
      `API call failed for endpoint ${endpoint}`,
      {
        endpoint,
        network,
        errorMessage: error.message,
      },
      error
    );
  }
};

export async function getLastTokenId({
  network,
}: GetLastTokenIdOptions): Promise<bigint | string | number> {
  const endTimer = debug.startTimer("getLastTokenId");

  try {
    const response = await callApi("/token/last-id", network);
    endTimer();
    return response.last_token_id;
  } catch (error) {
    debug.error("API call failed, falling back to contract call:", error);

    try {
      const randomAddress = generateRandomAddress();
      const responseCV = await bnsV2ReadOnlyCall({
        functionName: "get-last-token-id",
        senderAddress: randomAddress,
        functionArgs: [],
        network,
      });

      if (responseCV.type === ClarityType.ResponseOk) {
        if (responseCV.value.type === ClarityType.UInt) {
          endTimer();
          return responseCV.value.value;
        }
        throw createUnexpectedResponseError("Response did not contain a UInt", {
          network,
          responseType: getCVTypeString(responseCV.value),
        });
      }

      if (responseCV.type === ClarityType.ResponseErr) {
        throw createContractError(cvToString(responseCV.value), {
          network,
          functionName: "get-last-token-id",
        });
      }

      throw createUnexpectedResponseError(
        `Unexpected Clarity Value type: ${getCVTypeString(responseCV)}`,
        { network, responseType: getCVTypeString(responseCV) }
      );
    } catch (fallbackError) {
      endTimer();
      throw fallbackError;
    }
  }
}

export async function getRenewalHeight({
  fullyQualifiedName,
  network,
}: GetRenewalHeightOptions): Promise<bigint | string | number> {
  const endTimer = debug.startTimer("getRenewalHeight");

  try {
    const response = await callApi(
      `/names/${fullyQualifiedName}/renewal`,
      network
    );
    endTimer();
    return BigInt(response.renewal_height);
  } catch (error) {
    debug.error("API call failed, falling back to contract call:", error);

    try {
      const { subdomain } = decodeFQN(fullyQualifiedName);
      if (subdomain) {
        throw createContractError("Cannot get renewal height for a subdomain", {
          fullyQualifiedName,
        });
      }

      const randomAddress = generateRandomAddress();
      const nameId = await getIdFromBns({ fullyQualifiedName, network });
      const responseCV = await bnsV2ReadOnlyCall({
        functionName: "get-renewal-height",
        senderAddress: randomAddress,
        functionArgs: [uintCV(nameId)],
        network,
      });

      if (responseCV.type === ClarityType.ResponseOk) {
        if (responseCV.value.type === ClarityType.UInt) {
          endTimer();
          return responseCV.value.value;
        }
        throw createUnexpectedResponseError("Response did not contain a UInt", {
          fullyQualifiedName,
          network,
        });
      }

      if (responseCV.type === ClarityType.ResponseErr) {
        throw createContractError(cvToString(responseCV.value), {
          fullyQualifiedName,
          network,
          functionName: "get-renewal-height",
        });
      }

      throw createUnexpectedResponseError(
        `Unexpected Clarity Value type: ${getCVTypeString(responseCV)}`,
        {
          fullyQualifiedName,
          network,
          responseType: getCVTypeString(responseCV),
        }
      );
    } catch (fallbackError) {
      endTimer();
      throw fallbackError;
    }
  }
}

export async function canResolveName({
  fullyQualifiedName,
  network,
}: CanResolveNameOptions): Promise<{
  renewal: bigint | string | number;
  owner: string;
}> {
  const endTimer = debug.startTimer("canResolveName");

  try {
    const response = await callApi(
      `/names/${fullyQualifiedName}/can-resolve`,
      network
    );
    endTimer();
    return {
      renewal: BigInt(response.renewal_height),
      owner: response.owner,
    };
  } catch (error) {
    debug.error("API call failed, falling back to contract call:", error);

    try {
      const { subdomain, namespace, name } = decodeFQN(fullyQualifiedName);
      if (subdomain) {
        throw createContractError("Cannot check resolution for a subdomain", {
          fullyQualifiedName,
        });
      }

      const randomAddress = generateRandomAddress();
      const responseCV = await bnsV2ReadOnlyCall({
        functionName: "can-resolve-name",
        senderAddress: randomAddress,
        functionArgs: [bufferCVFromString(namespace), bufferCVFromString(name)],
        network,
      });

      if (
        responseCV.type === ClarityType.ResponseOk &&
        responseCV.value.type === ClarityType.Tuple
      ) {
        const renewalCV = responseCV.value.value["renewal"];
        const ownerCV = responseCV.value.value["owner"];

        if (
          renewalCV.type === ClarityType.UInt &&
          (ownerCV.type === ClarityType.PrincipalStandard ||
            ownerCV.type === ClarityType.PrincipalContract)
        ) {
          endTimer();
          return {
            renewal: renewalCV.value,
            owner: cvToString(ownerCV),
          };
        }
        throw createUnexpectedResponseError(
          "Unexpected data types in response tuple",
          {
            fullyQualifiedName,
            network,
          }
        );
      }

      throw createUnexpectedResponseError("Invalid response from contract", {
        fullyQualifiedName,
        network,
        responseType: getCVTypeString(responseCV),
      });
    } catch (fallbackError) {
      endTimer();
      throw fallbackError;
    }
  }
}

export async function getOwner({
  fullyQualifiedName,
  network,
}: GetOwnerOptions): Promise<string | null> {
  const endTimer = debug.startTimer("getOwner");

  try {
    const response = await callApi(
      `/names/${fullyQualifiedName}/owner`,
      network
    );
    endTimer();
    return response.owner;
  } catch (error) {
    debug.error("API call failed, falling back to contract call:", error);

    try {
      const { subdomain, namespace, name } = decodeFQN(fullyQualifiedName);
      if (subdomain) {
        throw createContractError("Cannot check resolution for a subdomain", {
          fullyQualifiedName,
        });
      }

      const randomAddress = generateRandomAddress();
      const responseCV = await bnsV2ReadOnlyCall({
        functionName: "get-owner-name",
        senderAddress: randomAddress,
        functionArgs: [bufferCVFromString(name), bufferCVFromString(namespace)],
        network,
      });

      if (responseCV.type === ClarityType.ResponseOk) {
        if (responseCV.value.type === ClarityType.OptionalSome) {
          if (
            responseCV.value.value.type === ClarityType.PrincipalStandard ||
            responseCV.value.value.type === ClarityType.PrincipalContract
          ) {
            endTimer();
            return cvToString(responseCV.value.value);
          }
          throw createUnexpectedResponseError("Owner is not a principal", {
            fullyQualifiedName,
            network,
          });
        }
        if (responseCV.value.type === ClarityType.OptionalNone) {
          endTimer();
          return null;
        }
      }

      throw createUnexpectedResponseError("Invalid response from contract", {
        fullyQualifiedName,
        network,
        responseType: getCVTypeString(responseCV),
      });
    } catch (fallbackError) {
      endTimer();
      throw fallbackError;
    }
  }
}

export async function getOwnerById({
  id,
  network,
}: GetOwnerByIdOptions): Promise<string | null> {
  const endTimer = debug.startTimer("getOwnerById");

  try {
    const response = await callApi(`/tokens/${id}/owner`, network);
    endTimer();
    return response.owner;
  } catch (error) {
    debug.error("API call failed, falling back to contract call:", error);

    try {
      const randomAddress = generateRandomAddress();
      const responseCV = await bnsV2ReadOnlyCall({
        functionName: "get-owner",
        senderAddress: randomAddress,
        functionArgs: [uintCV(id)],
        network,
      });

      if (responseCV.type === ClarityType.ResponseOk) {
        if (responseCV.value.type === ClarityType.OptionalSome) {
          if (
            responseCV.value.value.type === ClarityType.PrincipalStandard ||
            responseCV.value.value.type === ClarityType.PrincipalContract
          ) {
            endTimer();
            return cvToString(responseCV.value.value);
          }
          throw createUnexpectedResponseError("Owner is not a principal", {
            id,
            network,
          });
        }
        if (responseCV.value.type === ClarityType.OptionalNone) {
          endTimer();
          return null;
        }
      }

      throw createUnexpectedResponseError("Invalid response from contract", {
        id,
        network,
        responseType: getCVTypeString(responseCV),
      });
    } catch (fallbackError) {
      endTimer();
      throw fallbackError;
    }
  }
}

export async function getIdFromBns({
  fullyQualifiedName,
  network,
}: GetIdFromBnsOptions): Promise<bigint | string | number> {
  const endTimer = debug.startTimer("getIdFromBns");

  try {
    const response = await callApi(`/names/${fullyQualifiedName}/id`, network);
    endTimer();
    return BigInt(response.id);
  } catch (error) {
    debug.error("API call failed, falling back to contract call:", error);

    try {
      const { subdomain, namespace, name } = decodeFQN(fullyQualifiedName);
      if (subdomain) {
        throw createContractError("Cannot get info for a subdomain", {
          fullyQualifiedName,
        });
      }

      const randomAddress = generateRandomAddress();
      const responseCV = await bnsV2ReadOnlyCall({
        functionName: "get-id-from-bns",
        senderAddress: randomAddress,
        functionArgs: [bufferCVFromString(name), bufferCVFromString(namespace)],
        network,
      });

      if (responseCV.type === ClarityType.OptionalSome) {
        if (responseCV.value.type === ClarityType.UInt) {
          endTimer();
          return responseCV.value.value;
        }
        throw createUnexpectedResponseError("Response did not contain a UInt", {
          fullyQualifiedName,
          network,
        });
      }

      if (responseCV.type === ClarityType.OptionalNone) {
        throw createNotFoundError("Name not found", {
          fullyQualifiedName,
          network,
        });
      }

      throw createUnexpectedResponseError(
        `Unexpected Clarity Value type: ${getCVTypeString(responseCV)}`,
        {
          fullyQualifiedName,
          network,
          responseType: getCVTypeString(responseCV),
        }
      );
    } catch (fallbackError) {
      endTimer();
      throw fallbackError;
    }
  }
}

export async function getBnsFromId({
  id,
  network,
}: GetBnsFromIdOptions): Promise<{ name: string; namespace: string } | null> {
  const endTimer = debug.startTimer("getBnsFromId");

  try {
    const response = await callApi(`/tokens/${id}/name`, network);
    endTimer();
    return {
      name: response.name,
      namespace: response.namespace,
    };
  } catch (error) {
    debug.error("API call failed, falling back to contract call:", error);

    try {
      const randomAddress = generateRandomAddress();
      const responseCV = await bnsV2ReadOnlyCall({
        functionName: "get-bns-from-id",
        senderAddress: randomAddress,
        functionArgs: [uintCV(id)],
        network,
      });

      if (responseCV.type === ClarityType.OptionalSome) {
        if (responseCV.value.type === ClarityType.Tuple) {
          const nameCV = responseCV.value.value["name"] as BufferCV;
          const namespaceCV = responseCV.value.value["namespace"] as BufferCV;
          endTimer();
          return {
            name: nameCV.value.toString(),
            namespace: namespaceCV.value.toString(),
          };
        }
        throw createUnexpectedResponseError(
          "Response did not contain a Tuple",
          {
            id,
            network,
          }
        );
      }

      if (responseCV.type === ClarityType.OptionalNone) {
        endTimer();
        return null;
      }

      throw createUnexpectedResponseError(
        `Unexpected Clarity Value type: ${getCVTypeString(responseCV)}`,
        { id, network, responseType: getCVTypeString(responseCV) }
      );
    } catch (fallbackError) {
      endTimer();
      throw fallbackError;
    }
  }
}

export async function canRegisterName({
  fullyQualifiedName,
  network,
}: CanRegisterNameOptions): Promise<boolean> {
  const endTimer = debug.startTimer("canRegisterName");
  const { subdomain, namespace, name } = decodeFQN(fullyQualifiedName);

  if (subdomain) {
    endTimer();
    throw createContractError(
      "Cannot register a subdomain using registerName",
      {
        fullyQualifiedName,
      }
    );
  }

  try {
    const response = await callApi(
      `/names/${namespace}/${name}/can-register`,
      network
    );
    endTimer();
    return response.can_register;
  } catch (error) {
    debug.error("API call failed, falling back to contract call:", error);
    try {
      const result = await fallbackContractCall(name, namespace, network);
      endTimer();
      return result;
    } catch (fallbackError) {
      endTimer();
      throw fallbackError;
    }
  }
}

async function fallbackContractCall(
  name: string,
  namespace: string,
  network: "mainnet" | "testnet"
): Promise<boolean> {
  const randomAddress = generateRandomAddress();

  debug.log("Falling back to contract call:", { name, namespace, network });

  return bnsV2ReadOnlyCall({
    functionName: "get-bns-info",
    senderAddress: randomAddress,
    functionArgs: [bufferCVFromString(name), bufferCVFromString(namespace)],
    network,
  }).then((responseCV: ClarityValue) => {
    if (responseCV.type === ClarityType.OptionalSome) {
      debug.log("Name exists in contract");
      return false;
    } else if (responseCV.type === ClarityType.OptionalNone) {
      debug.log("Name available in contract");
      return true;
    } else {
      throw createUnexpectedResponseError(
        `Unexpected response type: ${responseCV.type}`,
        {
          name,
          namespace,
          network,
          responseType: getCVTypeString(responseCV),
        }
      );
    }
  });
}

export async function getNamespacePrice({
  namespace,
  network,
}: GetNamespacePriceOptions): Promise<bigint | string | number> {
  const endTimer = debug.startTimer("getNamespacePrice");
  const bnsFunctionName = "get-namespace-price";
  const randomAddress = generateRandomAddress();

  try {
    const responseCV = await bnsV2ReadOnlyCall({
      functionName: bnsFunctionName,
      senderAddress: randomAddress,
      functionArgs: [bufferCVFromString(namespace)],
      network,
    });

    if (responseCV.type === ClarityType.ResponseOk) {
      if (
        responseCV.value.type === ClarityType.Int ||
        responseCV.value.type === ClarityType.UInt
      ) {
        endTimer();
        return responseCV.value.value;
      } else {
        throw createUnexpectedResponseError(
          "Response did not contain a number",
          {
            namespace,
            network,
          }
        );
      }
    } else if (responseCV.type === ClarityType.ResponseErr) {
      throw createContractError(cvToString(responseCV.value), {
        namespace,
        network,
        functionName: bnsFunctionName,
      });
    } else {
      throw createUnexpectedResponseError(
        `Unexpected Clarity Value type: ${getCVTypeString(responseCV)}`,
        { namespace, network, responseType: getCVTypeString(responseCV) }
      );
    }
  } catch (error) {
    endTimer();
    throw error;
  }
}

export async function getNamePrice({
  fullyQualifiedName,
  network,
}: GetNamePriceOptions): Promise<bigint | string | number> {
  const endTimer = debug.startTimer("getNamePrice");
  const bnsFunctionName = "get-name-price";
  const { subdomain, namespace, name } = decodeFQN(fullyQualifiedName);

  if (subdomain) {
    endTimer();
    throw createContractError("Cannot get subdomain price", {
      fullyQualifiedName,
    });
  }

  const randomAddress = generateRandomAddress();

  try {
    const responseCV = await bnsV2ReadOnlyCall({
      functionName: bnsFunctionName,
      senderAddress: randomAddress,
      functionArgs: [bufferCVFromString(namespace), bufferCVFromString(name)],
      network,
    });

    if (responseCV.type === ClarityType.ResponseOk) {
      const responseOkValue = responseCV.value;
      if (responseOkValue.type === ClarityType.ResponseOk) {
        const nestedResponseOkValue = responseOkValue.value;
        if (
          nestedResponseOkValue.type === ClarityType.Int ||
          nestedResponseOkValue.type === ClarityType.UInt
        ) {
          endTimer();
          return nestedResponseOkValue.value;
        } else {
          throw createUnexpectedResponseError(
            "Nested response did not contain a number",
            {
              fullyQualifiedName,
              network,
            }
          );
        }
      } else if (
        responseOkValue.type === ClarityType.Int ||
        responseOkValue.type === ClarityType.UInt
      ) {
        endTimer();
        return responseOkValue.value;
      } else {
        throw createUnexpectedResponseError(
          "Response did not contain a number",
          {
            fullyQualifiedName,
            network,
          }
        );
      }
    } else {
      const errorResponse = responseCV as ResponseErrorCV;
      throw createContractError(cvToString(errorResponse.value), {
        fullyQualifiedName,
        network,
        functionName: bnsFunctionName,
      });
    }
  } catch (error) {
    endTimer();
    throw error;
  }
}

export async function canNamespaceBeRegistered({
  namespace,
  network,
}: CanNamespaceBeRegisteredOptions): Promise<boolean> {
  const endTimer = debug.startTimer("canNamespaceBeRegistered");
  const bnsFunctionName = "can-namespace-be-registered";
  const randomAddress = generateRandomAddress();

  try {
    const responseCV = await bnsV2ReadOnlyCall({
      functionName: bnsFunctionName,
      senderAddress: randomAddress,
      functionArgs: [bufferCVFromString(namespace)],
      network,
    });

    if (responseCV.type === ClarityType.ResponseOk) {
      if (responseCV.value.type === ClarityType.BoolTrue) {
        endTimer();
        return true;
      } else if (responseCV.value.type === ClarityType.BoolFalse) {
        endTimer();
        return false;
      } else {
        throw createUnexpectedResponseError(
          "Response did not contain a boolean",
          {
            namespace,
            network,
          }
        );
      }
    } else if (responseCV.type === ClarityType.ResponseErr) {
      throw createContractError(cvToString(responseCV.value), {
        namespace,
        network,
        functionName: bnsFunctionName,
      });
    } else {
      throw createUnexpectedResponseError(
        `Unexpected Clarity Value type: ${getCVTypeString(responseCV)}`,
        { namespace, network, responseType: getCVTypeString(responseCV) }
      );
    }
  } catch (error) {
    endTimer();
    throw error;
  }
}

export async function getNamespaceProperties({
  namespace,
  network,
}: GetNamespacePropertiesOptions): Promise<NamespaceProperties> {
  const endTimer = debug.startTimer("getNamespaceProperties");

  try {
    const response = await callApi(`/namespaces/${namespace}`, network);
    const namespaceData = response.namespace;

    const result = {
      namespace: namespace,
      properties: {
        "namespace-manager": namespaceData.namespace_manager || null,
        "manager-transferable": namespaceData.manager_transferable,
        "manager-frozen": namespaceData.manager_frozen || false,
        "namespace-import": namespaceData.namespace_import,
        "revealed-at": BigInt(namespaceData.revealed_at || 0),
        "launched-at": namespaceData.launched_at
          ? BigInt(namespaceData.launched_at)
          : null,
        lifetime: BigInt(namespaceData.lifetime || 0),
        "can-update-price-function": namespaceData.can_update_price_function,
        "price-function": {
          base: BigInt(namespaceData.price_function_base),
          coefficient: BigInt(namespaceData.price_function_coeff),
          b1: BigInt(namespaceData.price_function_buckets[0] || 0),
          b2: BigInt(namespaceData.price_function_buckets[1] || 0),
          b3: BigInt(namespaceData.price_function_buckets[2] || 0),
          b4: BigInt(namespaceData.price_function_buckets[3] || 0),
          b5: BigInt(namespaceData.price_function_buckets[4] || 0),
          b6: BigInt(namespaceData.price_function_buckets[5] || 0),
          b7: BigInt(namespaceData.price_function_buckets[6] || 0),
          b8: BigInt(namespaceData.price_function_buckets[7] || 0),
          b9: BigInt(namespaceData.price_function_buckets[8] || 0),
          b10: BigInt(namespaceData.price_function_buckets[9] || 0),
          b11: BigInt(namespaceData.price_function_buckets[10] || 0),
          b12: BigInt(namespaceData.price_function_buckets[11] || 0),
          b13: BigInt(namespaceData.price_function_buckets[12] || 0),
          b14: BigInt(namespaceData.price_function_buckets[13] || 0),
          b15: BigInt(namespaceData.price_function_buckets[14] || 0),
          b16: BigInt(namespaceData.price_function_buckets[15] || 0),
          nonAlphaDiscount: BigInt(
            namespaceData.price_function_nonalpha_discount
          ),
          noVowelDiscount: BigInt(
            namespaceData.price_function_no_vowel_discount
          ),
        },
      },
    };

    endTimer();
    return result;
  } catch (error) {
    debug.error("API call failed, falling back to contract call:", error);

    try {
      const randomAddress = generateRandomAddress();
      const responseCV = await bnsV2ReadOnlyCall({
        functionName: "get-namespace-properties",
        senderAddress: randomAddress,
        functionArgs: [bufferCVFromString(namespace)],
        network,
      });

      if (
        responseCV.type === ClarityType.ResponseOk &&
        responseCV.value.type === ClarityType.Tuple
      ) {
        const namespaceCV = responseCV.value.value["namespace"] as BufferCV;
        const propertiesCV = responseCV.value.value["properties"] as TupleCV;
        const properties = propertiesCV.value;

        const result = {
          namespace: namespaceCV.value.toString(),
          properties: {
            "namespace-manager":
              properties["namespace-manager"].type === ClarityType.OptionalNone
                ? null
                : cvToString(
                    (properties["namespace-manager"] as SomeCV<PrincipalCV>)
                      .value
                  ),
            "manager-transferable":
              (properties["manager-transferable"] as BooleanCV).type ===
              ClarityType.BoolTrue,
            "manager-frozen":
              (properties["manager-frozen"] as BooleanCV).type ===
              ClarityType.BoolTrue,
            "namespace-import": cvToString(
              properties["namespace-import"] as PrincipalCV
            ),
            "revealed-at": (properties["revealed-at"] as UIntCV).value,
            "launched-at":
              properties["launched-at"].type === ClarityType.OptionalNone
                ? null
                : (properties["launched-at"] as SomeCV<UIntCV>).value.value,
            lifetime: (properties["lifetime"] as UIntCV).value,
            "can-update-price-function":
              (properties["can-update-price-function"] as BooleanCV).type ===
              ClarityType.BoolTrue,
            "price-function": parsePriceFunction(
              (properties["price-function"] as TupleCV).value
            ),
          },
        };

        endTimer();
        return result;
      }

      throw createUnexpectedResponseError("Invalid response from contract", {
        namespace,
        network,
        responseType: getCVTypeString(responseCV),
      });
    } catch (fallbackError) {
      endTimer();
      throw fallbackError;
    }
  }
}

export async function getNameInfo({
  fullyQualifiedName,
  network,
}: CanRegisterNameOptions): Promise<NameInfo> {
  const endTimer = debug.startTimer("getNameInfo");

  try {
    const response = await callApi(`/names/${fullyQualifiedName}`, network);
    const data = response.data;

    const result = {
      owner: data.owner,
      registeredAt: data.registered_at ? BigInt(data.registered_at) : null,
      renewalHeight: BigInt(data.renewal_height || 0),
      stxBurn: BigInt(data.stx_burn || 0),
      importedAt: data.imported_at ? BigInt(data.imported_at) : null,
      preorderedBy: data.preordered_by,
      hashedSaltedFqnPreorder: data.hashedSaltedFqnPreorder,
    };

    endTimer();
    return result;
  } catch (error) {
    debug.error("API call failed, falling back to contract call:", error);

    try {
      const { subdomain, namespace, name } = decodeFQN(fullyQualifiedName);
      if (subdomain) {
        throw createContractError("Cannot get info for a subdomain", {
          fullyQualifiedName,
        });
      }

      const randomAddress = generateRandomAddress();
      const responseCV = await bnsV2ReadOnlyCall({
        functionName: "get-bns-info",
        senderAddress: randomAddress,
        functionArgs: [bufferCVFromString(name), bufferCVFromString(namespace)],
        network,
      });

      if (
        responseCV.type === ClarityType.OptionalSome &&
        responseCV.value.type === ClarityType.Tuple
      ) {
        const tupleCV = responseCV.value as TupleCV;
        const properties = tupleCV.value;

        const result = {
          owner: cvToString(properties.owner as PrincipalCV),
          registeredAt:
            properties["registered-at"].type === ClarityType.OptionalNone
              ? null
              : (properties["registered-at"] as SomeCV<UIntCV>).value.value,
          renewalHeight: (properties["renewal-height"] as UIntCV).value,
          stxBurn: (properties["stx-burn"] as UIntCV).value,
          importedAt:
            properties["imported-at"].type === ClarityType.OptionalNone
              ? null
              : (properties["imported-at"] as SomeCV<UIntCV>).value.value,
          preorderedBy:
            properties["preordered-by"].type === ClarityType.OptionalNone
              ? null
              : cvToString(
                  (properties["preordered-by"] as SomeCV<PrincipalCV>).value
                ),
          hashedSaltedFqnPreorder:
            properties["hashed-salted-fqn-preorder"].type ===
            ClarityType.OptionalNone
              ? null
              : (
                  properties["hashed-salted-fqn-preorder"] as SomeCV<BufferCV>
                ).value.toString(),
        };

        endTimer();
        return result;
      }

      throw createUnexpectedResponseError("Invalid response from contract", {
        fullyQualifiedName,
        network,
        responseType: getCVTypeString(responseCV),
      });
    } catch (fallbackError) {
      endTimer();
      throw fallbackError;
    }
  }
}

export async function getPrimaryName({
  address,
  network,
}: GetPrimaryNameOptions): Promise<{ name: string; namespace: string } | null> {
  const endTimer = debug.startTimer("getPrimaryName");
  const bnsFunctionName = "get-primary";
  const randomAddress = generateRandomAddress();

  try {
    const responseCV = await bnsV2ReadOnlyCall({
      functionName: bnsFunctionName,
      senderAddress: randomAddress,
      functionArgs: [standardPrincipalCV(address)],
      network,
    });

    if (responseCV.type === ClarityType.ResponseOk) {
      if (responseCV.value.type === ClarityType.Tuple) {
        const nameCV = responseCV.value.value["name"] as BufferCV;
        const namespaceCV = responseCV.value.value["namespace"] as BufferCV;
        endTimer();
        return {
          name: Buffer.from(nameCV.value).toString("utf8"),
          namespace: Buffer.from(namespaceCV.value).toString("utf8"),
        };
      } else if (responseCV.value.type === ClarityType.OptionalSome) {
        const innerValue = responseCV.value.value;
        if (innerValue.type === ClarityType.Tuple) {
          const nameCV = innerValue.value["name"] as BufferCV;
          const namespaceCV = innerValue.value["namespace"] as BufferCV;
          endTimer();
          return {
            name: Buffer.from(nameCV.value).toString("utf8"),
            namespace: Buffer.from(namespaceCV.value).toString("utf8"),
          };
        }
      }
      throw createUnexpectedResponseError("Unexpected response structure", {
        address,
        network,
      });
    } else if (responseCV.type === ClarityType.ResponseErr) {
      if (cvToString(responseCV.value) === "u131") {
        endTimer();
        return null;
      }
      throw createContractError(cvToString(responseCV.value), {
        address,
        network,
        functionName: bnsFunctionName,
      });
    } else {
      throw createUnexpectedResponseError(
        `Unexpected Clarity Value type: ${getCVTypeString(responseCV)}`,
        { address, network, responseType: getCVTypeString(responseCV) }
      );
    }
  } catch (error) {
    endTimer();
    throw error;
  }
}

export async function resolveNameZonefile({
  fullyQualifiedName,
  network,
}: ResolveNameOptions): Promise<ZonefileData | null> {
  const endTimer = debug.startTimer("resolveNameZonefile");

  try {
    const response = await callApi(
      `/resolve-name/${fullyQualifiedName}`,
      network
    );
    endTimer();
    return response.zonefile || null;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      endTimer();
      return null;
    }

    debug.error("API call failed, falling back to contract call:", error);

    try {
      const { subdomain, namespace, name } = decodeFQN(fullyQualifiedName);
      if (subdomain) {
        throw createContractError("Cannot resolve a subdomain", {
          fullyQualifiedName,
        });
      }

      const randomAddress = generateRandomAddress();
      const responseCV = await zonefileReadOnlyCall({
        functionName: "resolve-name",
        senderAddress: randomAddress,
        functionArgs: [bufferCVFromString(name), bufferCVFromString(namespace)],
        network,
      });

      if (responseCV.type === ClarityType.ResponseOk) {
        if (
          responseCV.value.type === ClarityType.OptionalSome &&
          responseCV.value.value.type === ClarityType.Buffer
        ) {
          const zonefileString = Buffer.from(
            responseCV.value.value.value
          ).toString("utf8");
          endTimer();
          return parseZonefile(zonefileString);
        }
        if (responseCV.value.type === ClarityType.OptionalNone) {
          endTimer();
          return null;
        }
      }

      throw createUnexpectedResponseError("Invalid response from contract", {
        fullyQualifiedName,
        network,
        responseType: getCVTypeString(responseCV),
      });
    } catch (fallbackError) {
      endTimer();
      throw fallbackError;
    }
  }
}

export async function fetchUserOwnedNames({
  senderAddress,
  network,
}: FetchUserOwnedNamesOptions): Promise<
  Array<{ name: string; namespace: string }>
> {
  const endTimer = debug.startTimer("fetchUserOwnedNames");

  try {
    // First, get the total count to optimize paging
    const initialResponse = await callApi(
      `/names/address/${senderAddress}/valid?limit=1&offset=0`,
      network
    );

    const total = initialResponse.total;
    const limit = 50;
    const pageCount = Math.ceil(total / limit);

    // Create an array of promises for each page
    const pagePromises = [];
    for (let page = 0; page < pageCount; page++) {
      const offset = page * limit;
      pagePromises.push(
        callApi(
          `/names/address/${senderAddress}/valid?limit=${limit}&offset=${offset}`,
          network
        )
      );
    }

    // Execute all promises in parallel
    const results = await Promise.all(pagePromises);

    // Combine all results
    let allNames: Array<{ name_string: string; namespace_string: string }> = [];
    for (const result of results) {
      allNames = allNames.concat(result.names);
    }

    const resultNames = allNames.map((name) => ({
      name: name.name_string,
      namespace: name.namespace_string,
    }));

    endTimer();
    return resultNames;
  } catch (error) {
    debug.error("API call failed, falling back to contract call:", error);

    try {
      const contractAddress = getBnsContractAddress(network);
      const assetIdentifier = `${contractAddress}.${BnsContractName}::BNS-V2`;
      const apiUrl =
        network === "mainnet"
          ? "https://api.hiro.so"
          : "https://api.testnet.hiro.so";

      // First request to get total count
      const initialResponse = await axios.get(
        `${apiUrl}/extended/v1/tokens/nft/holdings?principal=${senderAddress}&asset_identifiers=${assetIdentifier}&limit=1&offset=0`
      );

      const total = initialResponse.data.total;
      const limit = 50;
      const pageCount = Math.ceil(total / limit);

      // Create pagination requests
      const pagePromises = [];
      for (let page = 0; page < pageCount; page++) {
        const offset = page * limit;
        pagePromises.push(
          axios.get(
            `${apiUrl}/extended/v1/tokens/nft/holdings?principal=${senderAddress}&asset_identifiers=${assetIdentifier}&limit=${limit}&offset=${offset}`
          )
        );
      }

      // Execute all asset requests in parallel
      const assetResponses = await Promise.all(pagePromises);

      // Collect all assets
      let allAssets: number[] = [];
      for (const response of assetResponses) {
        const assets = response.data.results.map(
          (asset: { value: { repr: string } }) =>
            parseInt(asset.value.repr.slice(1))
        );
        allAssets = allAssets.concat(assets);
      }

      // Batch BNS resolutions in groups of 10 to avoid too many parallel requests
      const batchSize = 10;
      const batches = [];
      for (let i = 0; i < allAssets.length; i += batchSize) {
        batches.push(allAssets.slice(i, i + batchSize));
      }

      let bnsResults: Array<{ name: string; namespace: string } | null> = [];
      for (const batch of batches) {
        const bnsPromises = batch.map((id) =>
          getBnsFromId({ id: BigInt(id), network })
        );
        const batchResults = await Promise.all(bnsPromises);
        bnsResults = bnsResults.concat(batchResults);
      }

      const filteredResults = bnsResults
        .filter(
          (result): result is { name: string; namespace: string } =>
            result !== null
        )
        .map((result) => ({
          name: asciiToUtf8(result.name),
          namespace: asciiToUtf8(result.namespace),
        }))
        .sort((a, b) => {
          if (a.namespace !== b.namespace) {
            return a.namespace.localeCompare(b.namespace);
          }
          return a.name.localeCompare(b.name);
        });

      endTimer();
      return filteredResults;
    } catch (fallbackError) {
      endTimer();
      throw fallbackError;
    }
  }
}
