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
} from "./interfaces";
import { bnsV2ReadOnlyCall, zonefileReadOnlyCall } from "./callersHelper";

export async function canRegisterName({
  fullyQualifiedName,
  network,
}: CanRegisterNameOptions): Promise<boolean> {
  const bnsFunctionName = "get-bns-info";
  const { subdomain, namespace, name } = decodeFQN(fullyQualifiedName);
  if (subdomain) {
    throw new Error("Cannot register a subdomain using registerName");
  }
  const randomAddress = generateRandomAddress();
  return bnsV2ReadOnlyCall({
    functionName: bnsFunctionName,
    senderAddress: randomAddress,
    functionArgs: [bufferCVFromString(name), bufferCVFromString(namespace)],
    network,
  }).then((responseCV: ClarityValue) => {
    if (responseCV.type === ClarityType.OptionalSome) {
      return false;
    } else if (responseCV.type === ClarityType.OptionalNone) {
      return true;
    } else {
      throw new Error(`Unexpected response type: ${responseCV.type}`);
    }
  });
}

export async function getLastTokenId({
  network,
}: GetLastTokenIdOptions): Promise<bigint> {
  const bnsFunctionName = "get-last-token-id";
  const randomAddress = generateRandomAddress();
  return bnsV2ReadOnlyCall({
    functionName: bnsFunctionName,
    senderAddress: randomAddress,
    functionArgs: [],
    network,
  }).then((responseCV: ClarityValue) => {
    if (responseCV.type === ClarityType.ResponseOk) {
      if (responseCV.value.type === ClarityType.UInt) {
        return responseCV.value.value;
      } else {
        throw new Error("Response did not contain a UInt");
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

export async function getRenewalHeight({
  fullyQualifiedName,
  network,
}: GetRenewalHeightOptions): Promise<bigint> {
  const bnsFunctionName = "get-renewal-height";
  const { subdomain, namespace, name } = decodeFQN(fullyQualifiedName);
  if (subdomain) {
    throw new Error("Cannot get renewal height for a subdomain");
  }
  const randomAddress = generateRandomAddress();
  const nameId = await getIdFromBns({
    fullyQualifiedName,
    network,
  });
  return bnsV2ReadOnlyCall({
    functionName: bnsFunctionName,
    senderAddress: randomAddress,
    functionArgs: [uintCV(nameId)],
    network,
  }).then((responseCV: ClarityValue) => {
    if (responseCV.type === ClarityType.ResponseOk) {
      if (responseCV.value.type === ClarityType.UInt) {
        return responseCV.value.value;
      } else {
        throw new Error("Response did not contain a UInt");
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

export async function canResolveName({
  fullyQualifiedName,
  network,
}: CanResolveNameOptions): Promise<{ renewal: bigint; owner: string }> {
  const bnsFunctionName = "can-resolve-name";
  const { subdomain, namespace, name } = decodeFQN(fullyQualifiedName);
  if (subdomain) {
    throw new Error("Cannot check resolution for a subdomain");
  }
  const randomAddress = generateRandomAddress();

  return bnsV2ReadOnlyCall({
    functionName: bnsFunctionName,
    senderAddress: randomAddress,
    functionArgs: [bufferCVFromString(namespace), bufferCVFromString(name)],
    network,
  }).then((responseCV: ClarityValue) => {
    if (responseCV.type === ClarityType.ResponseOk) {
      if (responseCV.value.type === ClarityType.Tuple) {
        const renewalCV = responseCV.value.data["renewal"];
        const ownerCV = responseCV.value.data["owner"];
        if (
          renewalCV.type === ClarityType.UInt &&
          (ownerCV.type === ClarityType.PrincipalStandard ||
            ownerCV.type === ClarityType.PrincipalContract)
        ) {
          return {
            renewal: renewalCV.value,
            owner: cvToString(ownerCV),
          };
        } else {
          throw new Error("Unexpected data types in response tuple");
        }
      } else {
        throw new Error("Response did not contain a Tuple");
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

export async function getOwner({
  fullyQualifiedName,
  network,
}: GetOwnerOptions): Promise<string | null> {
  const bnsFunctionName = "get-owner-name";
  const { subdomain, namespace, name } = decodeFQN(fullyQualifiedName);
  if (subdomain) {
    throw new Error("Cannot check resolution for a subdomain");
  }
  const randomAddress = generateRandomAddress();
  return bnsV2ReadOnlyCall({
    functionName: bnsFunctionName,
    senderAddress: randomAddress,
    functionArgs: [bufferCVFromString(name), bufferCVFromString(namespace)],
    network,
  }).then((responseCV: ClarityValue) => {
    if (responseCV.type === ClarityType.ResponseOk) {
      if (responseCV.value.type === ClarityType.OptionalSome) {
        if (
          responseCV.value.value.type === ClarityType.PrincipalStandard ||
          responseCV.value.value.type === ClarityType.PrincipalContract
        ) {
          return cvToString(responseCV.value.value);
        } else {
          throw new Error("Owner is not a principal");
        }
      } else if (responseCV.value.type === ClarityType.OptionalNone) {
        return null;
      } else {
        throw new Error("Unexpected Optional type in response");
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

export async function getOwnerById({
  id,
  network,
}: GetOwnerByIdOptions): Promise<string | null> {
  const bnsFunctionName = "get-owner";
  const randomAddress = generateRandomAddress();
  return bnsV2ReadOnlyCall({
    functionName: bnsFunctionName,
    senderAddress: randomAddress,
    functionArgs: [uintCV(id)],
    network,
  }).then((responseCV: ClarityValue) => {
    if (responseCV.type === ClarityType.ResponseOk) {
      if (responseCV.value.type === ClarityType.OptionalSome) {
        if (
          responseCV.value.value.type === ClarityType.PrincipalStandard ||
          responseCV.value.value.type === ClarityType.PrincipalContract
        ) {
          return cvToString(responseCV.value.value);
        } else {
          throw new Error("Owner is not a principal");
        }
      } else if (responseCV.value.type === ClarityType.OptionalNone) {
        return null;
      } else {
        throw new Error("Unexpected Optional type in response");
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

export async function getNamespacePrice({
  namespace,
  network,
}: GetNamespacePriceOptions): Promise<bigint> {
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
}: GetNamePriceOptions): Promise<bigint> {
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
      console.error("Error processing the response:", error);
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
  const bnsFunctionName = "get-namespace-properties";
  const randomAddress = generateRandomAddress();
  return bnsV2ReadOnlyCall({
    functionName: bnsFunctionName,
    senderAddress: randomAddress,
    functionArgs: [bufferCVFromString(namespace)],
    network,
  }).then((responseCV: ClarityValue) => {
    if (responseCV.type === ClarityType.ResponseOk) {
      if (responseCV.value.type === ClarityType.Tuple) {
        const namespaceCV = responseCV.value.data["namespace"] as BufferCV;
        const propertiesCV = responseCV.value.data["properties"] as TupleCV;
        const properties = propertiesCV.data;
        return {
          namespace: bufferCV(namespaceCV.buffer).buffer.toString(),
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
              (properties["price-function"] as TupleCV).data
            ),
          },
        };
      } else {
        throw new Error("Response did not contain a Tuple");
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

export async function getNameInfo({
  fullyQualifiedName,
  network,
}: CanRegisterNameOptions): Promise<NameInfo> {
  const bnsFunctionName = "get-bns-info";
  const { subdomain, namespace, name } = decodeFQN(fullyQualifiedName);
  if (subdomain) {
    throw new Error("Cannot get info for a subdomain");
  }
  const randomAddress = generateRandomAddress();
  return bnsV2ReadOnlyCall({
    functionName: bnsFunctionName,
    senderAddress: randomAddress,
    functionArgs: [bufferCVFromString(name), bufferCVFromString(namespace)],
    network,
  }).then((responseCV: ClarityValue) => {
    if (responseCV.type === ClarityType.OptionalSome) {
      if (responseCV.value.type === ClarityType.Tuple) {
        const tupleCV = responseCV.value as TupleCV;
        const properties = tupleCV.data;
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
                ).value.buffer.toString(),
        };
      } else {
        throw new Error("Response did not contain a Tuple");
      }
    } else if (responseCV.type === ClarityType.OptionalNone) {
      throw new Error("Name not found");
    } else {
      throw new Error(
        `Unexpected Clarity Value type: ${getCVTypeString(responseCV)}`
      );
    }
  });
}

export async function getIdFromBns({
  fullyQualifiedName,
  network,
}: GetIdFromBnsOptions): Promise<bigint> {
  const bnsFunctionName = "get-id-from-bns";
  const { subdomain, namespace, name } = decodeFQN(fullyQualifiedName);
  if (subdomain) {
    throw new Error("Cannot get info for a subdomain");
  }
  const randomAddress = generateRandomAddress();
  return bnsV2ReadOnlyCall({
    functionName: bnsFunctionName,
    senderAddress: randomAddress,
    functionArgs: [bufferCVFromString(name), bufferCVFromString(namespace)],
    network,
  }).then((responseCV: ClarityValue) => {
    if (responseCV.type === ClarityType.OptionalSome) {
      if (responseCV.value.type === ClarityType.UInt) {
        return responseCV.value.value;
      } else {
        throw new Error("Response did not contain a UInt");
      }
    } else if (responseCV.type === ClarityType.OptionalNone) {
      throw new Error("Name not found");
    } else {
      throw new Error(
        `Unexpected Clarity Value type: ${getCVTypeString(responseCV)}`
      );
    }
  });
}

export async function getBnsFromId({
  id,
  network,
}: GetBnsFromIdOptions): Promise<{ name: string; namespace: string } | null> {
  const bnsFunctionName = "get-bns-from-id";

  const randomAddress = generateRandomAddress();

  return bnsV2ReadOnlyCall({
    functionName: bnsFunctionName,
    senderAddress: randomAddress,
    functionArgs: [uintCV(id)],
    network,
  }).then((responseCV: ClarityValue) => {
    if (responseCV.type === ClarityType.OptionalSome) {
      if (responseCV.value.type === ClarityType.Tuple) {
        const nameCV = responseCV.value.data["name"] as BufferCV;
        const namespaceCV = responseCV.value.data["namespace"] as BufferCV;
        return {
          name: bufferCV(nameCV.buffer).buffer.toString(),
          namespace: bufferCV(namespaceCV.buffer).buffer.toString(),
        };
      } else {
        throw new Error("Response did not contain a Tuple");
      }
    } else if (responseCV.type === ClarityType.OptionalNone) {
      return null;
    } else {
      throw new Error(
        `Unexpected Clarity Value type: ${getCVTypeString(responseCV)}`
      );
    }
  });
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
        const nameCV = responseCV.value.data["name"] as BufferCV;
        const namespaceCV = responseCV.value.data["namespace"] as BufferCV;
        return {
          name: Buffer.from(nameCV.buffer).toString(),
          namespace: Buffer.from(namespaceCV.buffer).toString(),
        };
      } else if (responseCV.value.type === ClarityType.OptionalSome) {
        const innerValue = responseCV.value.value;
        if (innerValue.type === ClarityType.Tuple) {
          const nameCV = innerValue.data["name"] as BufferCV;
          const namespaceCV = innerValue.data["namespace"] as BufferCV;
          return {
            name: Buffer.from(nameCV.buffer).toString(),
            namespace: Buffer.from(namespaceCV.buffer).toString(),
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

export async function resolveName({
  fullyQualifiedName,
  network,
}: ResolveNameOptions): Promise<string | null> {
  const zonefileFunctionName = "resolve-name";
  const { subdomain, namespace, name } = decodeFQN(fullyQualifiedName);
  if (subdomain) {
    throw new Error("Cannot resolve a subdomain");
  }
  const randomAddress = generateRandomAddress();
  return zonefileReadOnlyCall({
    functionName: zonefileFunctionName,
    senderAddress: randomAddress,
    functionArgs: [bufferCVFromString(name), bufferCVFromString(namespace)],
    network,
  }).then((responseCV: ClarityValue) => {
    if (responseCV.type === ClarityType.ResponseOk) {
      if (responseCV.value.type === ClarityType.OptionalSome) {
        if (responseCV.value.value.type === ClarityType.Buffer) {
          return responseCV.value.value.buffer.toString();
        } else {
          throw new Error("Unexpected type in response, expected Buffer");
        }
      } else if (responseCV.value.type === ClarityType.OptionalNone) {
        return null;
      } else {
        throw new Error("Unexpected Optional type in response");
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

export async function fetchUserOwnedNames({
  senderAddress,
  network,
}: FetchUserOwnedNamesOptions): Promise<
  Array<{ name: string; namespace: string }>
> {
  const apiUrl =
    network === "mainnet"
      ? "https://leather.granite.world"
      : "https://api.testnet.hiro.so";

  const contractAddress = getBnsContractAddress(network);
  const contractName = BnsContractName;
  const assetIdentifier = `${contractAddress}.${contractName}::BNS-V2`;
  const limit = 50;
  let offset = 0;
  let allAssets: number[] = [];

  while (true) {
    try {
      const response = await axios.get(
        `${apiUrl}/extended/v1/tokens/nft/holdings?principal=${senderAddress}&asset_identifiers=${assetIdentifier}&limit=${limit}&offset=${offset}`
      );

      const assets = response.data.results.map(
        (asset: { value: { repr: string } }) =>
          parseInt(asset.value.repr.slice(1))
      );

      allAssets = allAssets.concat(assets);

      if (response.data.total > offset + limit) {
        offset += limit;
      } else {
        break;
      }
    } catch (error) {
      console.error("Error fetching user assets:", error);
      throw error;
    }
  }
  const bnsPromises = allAssets.map((id) =>
    getBnsFromId({ id: BigInt(id), network })
  );
  const bnsResults = await Promise.all(bnsPromises);
  const sortedNames = bnsResults
    .filter(
      (result): result is { name: string; namespace: string } => result !== null
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
  return sortedNames;
}

export async function resolveNameZonefile({
  fullyQualifiedName,
  network,
}: ResolveNameOptions): Promise<ZonefileData | null> {
  const zonefileFunctionName = "resolve-name";

  const { subdomain, namespace, name } = decodeFQN(fullyQualifiedName);
  if (subdomain) {
    throw new Error("Cannot resolve a subdomain");
  }
  const randomAddress = generateRandomAddress();
  try {
    const responseCV = await zonefileReadOnlyCall({
      functionName: zonefileFunctionName,
      senderAddress: randomAddress,
      functionArgs: [bufferCVFromString(name), bufferCVFromString(namespace)],
      network,
    });

    if (
      responseCV.type === ClarityType.ResponseOk &&
      responseCV.value.type === ClarityType.OptionalSome &&
      responseCV.value.value.type === ClarityType.Buffer
    ) {
      const zonefileString = Buffer.from(
        responseCV.value.value.buffer
      ).toString("utf8");
      return parseZonefile(zonefileString);
    } else if (
      responseCV.type === ClarityType.ResponseOk &&
      responseCV.value.type === ClarityType.OptionalNone
    ) {
      return null;
    }

    throw new Error("No Zonefile Found");
  } catch (error) {
    console.error("Error resolving name zonefile:", error);
    throw error;
  }
}
