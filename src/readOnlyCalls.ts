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
  createFormattedZonefileData,
  decodeFQN,
  generateRandomAddress,
  parsePriceFunction,
  parseZonefile,
} from "./utils";
import { BnsContractName, getBnsContractAddress } from "./config";
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
  NewZonefileData,
} from "./interfaces";
import { bnsV2ReadOnlyCall, zonefileReadOnlyCall } from "./callersHelper";
import { debug } from "./debug";

const API_BASE_URL = "https://api.bnsv2.com";

const callApi = async (endpoint: string, network: string) => {
  try {
    const networkPrefix = network === "testnet" ? "/testnet" : "";
    const url = `${API_BASE_URL}${networkPrefix}${endpoint}`;
    debug.log("Making API call to:", url);

    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    debug.error("API call failed:", error);
    throw error;
  }
};

export async function getLastTokenId({
  network,
}: GetLastTokenIdOptions): Promise<bigint | string | number> {
  try {
    const response = await callApi("/token/last-id", network);
    return response.last_token_id;
  } catch (error) {
    debug.error("API call failed, falling back to contract call:", error);

    const randomAddress = generateRandomAddress();
    const responseCV = await bnsV2ReadOnlyCall({
      functionName: "get-last-token-id",
      senderAddress: randomAddress,
      functionArgs: [],
      network,
    });

    if (responseCV.type === ClarityType.ResponseOk) {
      if (responseCV.value.type === ClarityType.UInt) {
        return responseCV.value.value;
      }
      throw new Error("Response did not contain a UInt");
    }

    if (responseCV.type === ClarityType.ResponseErr) {
      throw new Error(cvToString(responseCV.value));
    }

    throw new Error(
      `Unexpected Clarity Value type: ${getCVTypeString(responseCV)}`
    );
  }
}

export async function getRenewalHeight({
  fullyQualifiedName,
  network,
}: GetRenewalHeightOptions): Promise<bigint | string | number> {
  try {
    const response = await callApi(
      `/names/${fullyQualifiedName}/renewal`,
      network
    );
    return BigInt(response.renewal_height);
  } catch (error) {
    debug.error("API call failed, falling back to contract call:", error);

    const { subdomain } = decodeFQN(fullyQualifiedName);
    if (subdomain) {
      throw new Error("Cannot get renewal height for a subdomain");
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
        return responseCV.value.value;
      }
      throw new Error("Response did not contain a UInt");
    }

    if (responseCV.type === ClarityType.ResponseErr) {
      throw new Error(cvToString(responseCV.value));
    }

    throw new Error(
      `Unexpected Clarity Value type: ${getCVTypeString(responseCV)}`
    );
  }
}

export async function canResolveName({
  fullyQualifiedName,
  network,
}: CanResolveNameOptions): Promise<{
  renewal: bigint | string | number;
  owner: string;
}> {
  try {
    const response = await callApi(
      `/names/${fullyQualifiedName}/can-resolve`,
      network
    );
    return {
      renewal: BigInt(response.renewal_height),
      owner: response.owner,
    };
  } catch (error) {
    debug.error("API call failed, falling back to contract call:", error);

    const { subdomain, namespace, name } = decodeFQN(fullyQualifiedName);
    if (subdomain) {
      throw new Error("Cannot check resolution for a subdomain");
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
        return {
          renewal: renewalCV.value,
          owner: cvToString(ownerCV),
        };
      }
      throw new Error("Unexpected data types in response tuple");
    }

    throw new Error("Invalid response from contract");
  }
}

export async function getOwner({
  fullyQualifiedName,
  network,
}: GetOwnerOptions): Promise<string | null> {
  try {
    const response = await callApi(
      `/names/${fullyQualifiedName}/owner`,
      network
    );
    return response.owner;
  } catch (error) {
    debug.error("API call failed, falling back to contract call:", error);

    const { subdomain, namespace, name } = decodeFQN(fullyQualifiedName);
    if (subdomain) {
      throw new Error("Cannot check resolution for a subdomain");
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
          return cvToString(responseCV.value.value);
        }
        throw new Error("Owner is not a principal");
      }
      if (responseCV.value.type === ClarityType.OptionalNone) {
        return null;
      }
    }

    throw new Error("Invalid response from contract");
  }
}

export async function getOwnerById({
  id,
  network,
}: GetOwnerByIdOptions): Promise<string | null> {
  try {
    const response = await callApi(`/tokens/${id}/owner`, network);
    return response.owner;
  } catch (error) {
    debug.error("API call failed, falling back to contract call:", error);

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
          return cvToString(responseCV.value.value);
        }
        throw new Error("Owner is not a principal");
      }
      if (responseCV.value.type === ClarityType.OptionalNone) {
        return null;
      }
    }

    throw new Error("Invalid response from contract");
  }
}

export async function getIdFromBns({
  fullyQualifiedName,
  network,
}: GetIdFromBnsOptions): Promise<bigint | string | number> {
  try {
    const response = await callApi(`/names/${fullyQualifiedName}/id`, network);
    return BigInt(response.id);
  } catch (error) {
    debug.error("API call failed, falling back to contract call:", error);

    const { subdomain, namespace, name } = decodeFQN(fullyQualifiedName);
    if (subdomain) {
      throw new Error("Cannot get info for a subdomain");
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
        return responseCV.value.value;
      }
      throw new Error("Response did not contain a UInt");
    }

    if (responseCV.type === ClarityType.OptionalNone) {
      throw new Error("Name not found");
    }

    throw new Error(
      `Unexpected Clarity Value type: ${getCVTypeString(responseCV)}`
    );
  }
}

export async function getBnsFromId({
  id,
  network,
}: GetBnsFromIdOptions): Promise<{ name: string; namespace: string } | null> {
  try {
    const response = await callApi(`/tokens/${id}/name`, network);
    return {
      name: response.name,
      namespace: response.namespace,
    };
  } catch (error) {
    debug.error("API call failed, falling back to contract call:", error);

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
        return {
          name: nameCV.value.toString(),
          namespace: nameCV.value.toString(),
        };
      }
      throw new Error("Response did not contain a Tuple");
    }

    if (responseCV.type === ClarityType.OptionalNone) {
      return null;
    }

    throw new Error(
      `Unexpected Clarity Value type: ${getCVTypeString(responseCV)}`
    );
  }
}

export async function canRegisterName({
  fullyQualifiedName,
  network,
}: CanRegisterNameOptions): Promise<boolean> {
  const { subdomain, namespace, name } = decodeFQN(fullyQualifiedName);

  if (subdomain) {
    throw new Error("Cannot register a subdomain using registerName");
  }

  try {
    const response = await callApi(
      `/names/${namespace}/${name}/can-register`,
      network
    );
    return response.can_register;
  } catch (error) {
    debug.error("API call failed, falling back to contract call:", error);
    return fallbackContractCall(name, namespace, network);
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
      throw new Error(`Unexpected response type: ${responseCV.type}`);
    }
  });
}

export async function getNamespacePrice({
  namespace,
  network,
}: GetNamespacePriceOptions): Promise<bigint | string | number> {
  const bnsFunctionName = "get-namespace-price";
  const randomAddress = generateRandomAddress();

  return bnsV2ReadOnlyCall({
    functionName: bnsFunctionName,
    senderAddress: randomAddress,
    functionArgs: [bufferCVFromString(namespace)],
    network,
  }).then((responseCV: ClarityValue) => {
    if (responseCV.type === ClarityType.ResponseOk) {
      if (
        responseCV.value.type === ClarityType.Int ||
        responseCV.value.type === ClarityType.UInt
      ) {
        return responseCV.value.value;
      } else {
        throw new Error("Response did not contain a number");
      }
    } else if (responseCV.type === ClarityType.ResponseErr) {
      throw new Error(cvToString(responseCV.value));
    } else {
      throw new Error(
        `Unexpected Clarity Value type: ${getCVTypeString(responseCV)}`
      );
    }
  });
}

export async function getNamePrice({
  fullyQualifiedName,
  network,
}: GetNamePriceOptions): Promise<bigint | string | number> {
  const bnsFunctionName = "get-name-price";
  const { subdomain, namespace, name } = decodeFQN(fullyQualifiedName);
  if (subdomain) {
    throw new Error("Cannot get subdomain price");
  }
  const randomAddress = generateRandomAddress();
  return bnsV2ReadOnlyCall({
    functionName: bnsFunctionName,
    senderAddress: randomAddress,
    functionArgs: [bufferCVFromString(namespace), bufferCVFromString(name)],
    network,
  })
    .then((responseCV: ClarityValue) => {
      if (responseCV.type === ClarityType.ResponseOk) {
        const responseOkValue = responseCV.value;
        if (responseOkValue.type === ClarityType.ResponseOk) {
          const nestedResponseOkValue = responseOkValue.value;
          if (
            nestedResponseOkValue.type === ClarityType.Int ||
            nestedResponseOkValue.type === ClarityType.UInt
          ) {
            return nestedResponseOkValue.value;
          } else {
            throw new Error("Nested response did not contain a number");
          }
        } else if (
          responseOkValue.type === ClarityType.Int ||
          responseOkValue.type === ClarityType.UInt
        ) {
          return responseOkValue.value;
        } else {
          throw new Error("Response did not contain a number");
        }
      } else {
        const errorResponse = responseCV as ResponseErrorCV;
        throw new Error(cvToString(errorResponse.value));
      }
    })
    .catch((error) => {
      throw error;
    });
}

export async function canNamespaceBeRegistered({
  namespace,
  network,
}: CanNamespaceBeRegisteredOptions): Promise<boolean> {
  const bnsFunctionName = "can-namespace-be-registered";
  const randomAddress = generateRandomAddress();
  return bnsV2ReadOnlyCall({
    functionName: bnsFunctionName,
    senderAddress: randomAddress,
    functionArgs: [bufferCVFromString(namespace)],
    network,
  }).then((responseCV: ClarityValue) => {
    if (responseCV.type === ClarityType.ResponseOk) {
      if (responseCV.value.type === ClarityType.BoolTrue) {
        return true;
      } else if (responseCV.value.type === ClarityType.BoolFalse) {
        return false;
      } else {
        throw new Error("Response did not contain a boolean");
      }
    } else if (responseCV.type === ClarityType.ResponseErr) {
      throw new Error(cvToString(responseCV.value));
    } else {
      throw new Error(
        `Unexpected Clarity Value type: ${getCVTypeString(responseCV)}`
      );
    }
  });
}

export async function getNamespaceProperties({
  namespace,
  network,
}: GetNamespacePropertiesOptions): Promise<NamespaceProperties> {
  try {
    const response = await callApi(`/namespaces/${namespace}`, network);
    const namespaceData = response.namespace;

    return {
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
  } catch (error) {
    debug.error("API call failed, falling back to contract call:", error);

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

      return {
        namespace: namespaceCV.value.toString(),
        properties: {
          "namespace-manager":
            properties["namespace-manager"].type === ClarityType.OptionalNone
              ? null
              : cvToString(
                  (properties["namespace-manager"] as SomeCV<PrincipalCV>).value
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
    }

    throw new Error("Invalid response from contract");
  }
}

export async function getNameInfo({
  fullyQualifiedName,
  network,
}: CanRegisterNameOptions): Promise<NameInfo> {
  try {
    const response = await callApi(`/names/${fullyQualifiedName}`, network);
    const data = response.data;

    return {
      owner: data.owner,
      registeredAt: data.registered_at ? BigInt(data.registered_at) : null,
      renewalHeight: BigInt(data.renewal_height || 0),
      stxBurn: BigInt(data.stx_burn || 0),
      importedAt: data.imported_at ? BigInt(data.imported_at) : null,
      preorderedBy: data.preordered_by,
      hashedSaltedFqnPreorder: data.hashedSaltedFqnPreorder,
    };
  } catch (error) {
    debug.error("API call failed, falling back to contract call:", error);

    const { subdomain, namespace, name } = decodeFQN(fullyQualifiedName);
    if (subdomain) {
      throw new Error("Cannot get info for a subdomain");
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

      return {
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
    }

    throw new Error("Invalid response from contract");
  }
}

export async function getPrimaryName({
  address,
  network,
}: GetPrimaryNameOptions): Promise<{ name: string; namespace: string } | null> {
  const bnsFunctionName = "get-primary";
  const randomAddress = generateRandomAddress();
  return bnsV2ReadOnlyCall({
    functionName: bnsFunctionName,
    senderAddress: randomAddress,
    functionArgs: [standardPrincipalCV(address)],
    network,
  }).then((responseCV: ClarityValue) => {
    if (responseCV.type === ClarityType.ResponseOk) {
      if (responseCV.value.type === ClarityType.Tuple) {
        const nameCV = responseCV.value.value["name"] as BufferCV;
        const namespaceCV = responseCV.value.value["namespace"] as BufferCV;
        return {
          name: Buffer.from(nameCV.value, "hex").toString(),
          namespace: Buffer.from(namespaceCV.value, "hex").toString(),
        };
      } else if (responseCV.value.type === ClarityType.OptionalSome) {
        const innerValue = responseCV.value.value;
        if (innerValue.type === ClarityType.Tuple) {
          const nameCV = innerValue.value["name"] as BufferCV;
          const namespaceCV = innerValue.value["namespace"] as BufferCV;
          return {
            name: Buffer.from(nameCV.value, "hex").toString(),
            namespace: Buffer.from(namespaceCV.value, "hex").toString(),
          };
        }
      }
      throw new Error("Unexpected response structure");
    } else if (responseCV.type === ClarityType.ResponseErr) {
      if (cvToString(responseCV.value) === "u131") {
        return null;
      }
      throw new Error(cvToString(responseCV.value));
    } else {
      throw new Error(
        `Unexpected Clarity Value type: ${getCVTypeString(responseCV)}`
      );
    }
  });
}

export async function fetchUserOwnedNames({
  senderAddress,
  network,
}: FetchUserOwnedNamesOptions): Promise<
  Array<{ name: string; namespace: string }>
> {
  try {
    let allNames: Array<{ name_string: string; namespace_string: string }> = [];
    let offset = 0;
    const limit = 50;

    while (true) {
      const response = await callApi(
        `/names/address/${senderAddress}/valid?limit=${limit}&offset=${offset}`,
        network
      );

      allNames = allNames.concat(response.names);

      if (response.names.length < limit || allNames.length >= response.total) {
        break;
      }

      offset += limit;
    }

    return allNames.map((name) => ({
      name: name.name_string,
      namespace: name.namespace_string,
    }));
  } catch (error) {
    debug.error("API call failed, falling back to contract call:", error);

    const contractAddress = getBnsContractAddress(network);
    const assetIdentifier = `${contractAddress}.${BnsContractName}::BNS-V2`;
    const apiUrl =
      network === "mainnet"
        ? "https://api.hiro.so"
        : "https://api.testnet.hiro.so";

    let allAssets: number[] = [];
    let offset = 0;
    const limit = 50;

    while (true) {
      const response = await axios.get(
        `${apiUrl}/extended/v1/tokens/nft/holdings?principal=${senderAddress}&asset_identifiers=${assetIdentifier}&limit=${limit}&offset=${offset}`
      );

      const assets = response.data.results.map(
        (asset: { value: { repr: string } }) =>
          parseInt(asset.value.repr.slice(1))
      );

      allAssets = allAssets.concat(assets);

      if (response.data.total <= offset + limit) {
        break;
      }

      offset += limit;
    }

    const bnsPromises = allAssets.map((id) =>
      getBnsFromId({ id: BigInt(id), network })
    );

    const bnsResults = await Promise.all(bnsPromises);

    return bnsResults
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
  }
}

export async function resolveNameZonefile({
  fullyQualifiedName,
  network,
}: ResolveNameOptions): Promise<ZonefileData | null> {
  try {
    const response = await callApi(
      `/resolve-name/${fullyQualifiedName}`,
      network
    );
    return response.zonefile || null;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }

    debug.error("API call failed, falling back to contract call:", error);

    const { subdomain, namespace, name } = decodeFQN(fullyQualifiedName);
    if (subdomain) {
      throw new Error("Cannot resolve a subdomain");
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
        return parseZonefile(zonefileString);
      }
      if (responseCV.value.type === ClarityType.OptionalNone) {
        return null;
      }
    }

    throw new Error("Invalid response from contract");
  }
}

export async function getZonefileRaw({
  fullyQualifiedName,
  network,
}: ResolveNameOptions): Promise<any | null> {
  try {
    const response = await callApi(
      `/zonefile/${fullyQualifiedName}/raw`,
      network
    );
    return response.zonefile || null;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }

    debug.error("API call failed, falling back to contract call:", error);

    const { subdomain, namespace, name } = decodeFQN(fullyQualifiedName);
    if (subdomain) {
      throw new Error("Cannot get raw zonefile for a subdomain");
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
        try {
          return JSON.parse(zonefileString);
        } catch {
          return zonefileString;
        }
      }
      if (responseCV.value.type === ClarityType.OptionalNone) {
        return null;
      }
    }

    throw new Error("Invalid response from contract");
  }
}

export async function getZonefileProfile({
  fullyQualifiedName,
  network,
}: ResolveNameOptions): Promise<NewZonefileData | null> {
  try {
    const response = await callApi(
      `/zonefile/${fullyQualifiedName}/profile`,
      network
    );
    return response.profile || null;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }

    debug.error("API call failed, falling back to contract call:", error);

    const { subdomain, namespace, name } = decodeFQN(fullyQualifiedName);
    if (subdomain) {
      throw new Error("Cannot get profile zonefile for a subdomain");
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
        try {
          const parsed = JSON.parse(zonefileString);
          return createFormattedZonefileData(parsed);
        } catch (error) {
          debug.error("Failed to parse zonefile as profile format:", error);
          return null;
        }
      }
      if (responseCV.value.type === ClarityType.OptionalNone) {
        return null;
      }
    }

    throw new Error("Invalid response from contract");
  }
}
