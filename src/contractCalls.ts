import { utf8ToBytes } from "@stacks/common";
import {
  bufferCV,
  hash160,
  standardPrincipalCV,
  uintCV,
  someCV,
  noneCV,
  bufferCVFromString,
  boolCV,
  contractPrincipalCV,
  Pc,
} from "@stacks/transactions";
import {
  BnsContractName,
  getBnsContractAddress,
  ZonefileContractName,
  getZonefileContractAddress,
} from "./config";
import { ContractCallPayload } from "./interfaces";
import * as Types from "./interfaces";
import {
  decodeFQN,
  createZonefileData,
  stringifyZonefile,
  stringToBuffer,
} from "./utils";
import {
  getIdFromBns,
  getNamespaceProperties,
  getOwner,
  getOwnerById,
} from "./readOnlyCalls";
import { debug } from "./debug";
import { createValidationError } from "./errors";

// Memoize buffer conversion results for common operations
const hashCache = new Map<string, Uint8Array>();

function getHashedBuffer(input: string, salt: string): Uint8Array {
  const cacheKey = `${input}:${salt}`;
  if (hashCache.has(cacheKey)) {
    return hashCache.get(cacheKey)!;
  }

  const saltedBytes = utf8ToBytes(`${input}.${salt}`);
  const hashedResult = hash160(saltedBytes);
  hashCache.set(cacheKey, hashedResult);

  return hashedResult;
}

export async function buildTransferNameTx({
  fullyQualifiedName,
  newOwnerAddress,
  senderAddress,
  network,
}: Types.TransferNameOptions): Promise<ContractCallPayload> {
  const endTimer = debug.startTimer("buildTransferNameTx");
  const bnsFunctionName = "transfer";
  const { subdomain, namespace, name } = decodeFQN(fullyQualifiedName);

  if (subdomain) {
    endTimer();
    throw createValidationError(
      "Cannot transfer a subdomain using transferName()",
      {
        fullyQualifiedName,
      }
    );
  }

  try {
    const id = await getIdFromBns({
      fullyQualifiedName,
      network,
    });

    const functionArgs = [
      uintCV(id),
      standardPrincipalCV(senderAddress),
      standardPrincipalCV(newOwnerAddress),
    ];

    const postConditionSender = Pc.principal(senderAddress)
      .willSendAsset()
      .nft(
        `${getBnsContractAddress(network)}.${BnsContractName}::BNS-V2`,
        uintCV(id)
      );

    const postConditionReceiver = Pc.principal(newOwnerAddress)
      .willNotSendAsset()
      .nft(
        `${getBnsContractAddress(network)}.${BnsContractName}::BNS-V2`,
        uintCV(id)
      );

    const result = {
      contractAddress: getBnsContractAddress(network),
      contractName: BnsContractName,
      functionName: bnsFunctionName,
      functionArgs,
      postConditions: [postConditionSender, postConditionReceiver],
      network,
    };

    endTimer();
    return result;
  } catch (error) {
    endTimer();
    throw error;
  }
}

export async function buildListInUstxTx({
  id,
  price,
  commissionTraitAddress,
  commissionTraitName,
  senderAddress,
  network,
}: Types.ListInUstxOptions): Promise<ContractCallPayload> {
  const endTimer = debug.startTimer("buildListInUstxTx");
  const bnsFunctionName = "list-in-ustx";

  try {
    const result = {
      contractAddress: getBnsContractAddress(network),
      contractName: BnsContractName,
      functionName: bnsFunctionName,
      functionArgs: [
        uintCV(id),
        uintCV(price),
        contractPrincipalCV(commissionTraitAddress, commissionTraitName),
      ],
      postConditions: [],
      network,
    };

    endTimer();
    return result;
  } catch (error) {
    endTimer();
    throw error;
  }
}

export async function buildUnlistInUstxTx({
  id,
  senderAddress,
  network,
}: Types.UnlistInUstxOptions): Promise<ContractCallPayload> {
  const endTimer = debug.startTimer("buildUnlistInUstxTx");
  const bnsFunctionName = "unlist-in-ustx";

  try {
    const result = {
      contractAddress: getBnsContractAddress(network),
      contractName: BnsContractName,
      functionName: bnsFunctionName,
      functionArgs: [uintCV(id)],
      postConditions: [],
      network,
    };

    endTimer();
    return result;
  } catch (error) {
    endTimer();
    throw error;
  }
}

export async function buildBuyInUstxTx({
  id,
  expectedPrice,
  commissionTraitAddress,
  commissionTraitName,
  senderAddress,
  network,
}: Types.BuyInUstxOptions): Promise<ContractCallPayload> {
  const endTimer = debug.startTimer("buildBuyInUstxTx");
  const bnsFunctionName = "buy-in-ustx";

  try {
    const currentOwner = await getOwnerById({ id, network });

    if (!currentOwner) {
      endTimer();
      throw createValidationError("Failed to fetch current owner of the name", {
        id,
      });
    }

    const senderPostCondition = Pc.principal(senderAddress)
      .willSendLte(expectedPrice)
      .ustx();

    const ownerPostCondition = Pc.principal(currentOwner)
      .willSendAsset()
      .nft(
        `${getBnsContractAddress(network)}.${BnsContractName}::BNS-V2`,
        uintCV(id)
      );

    const postConditions = [senderPostCondition, ownerPostCondition];

    const result = {
      contractAddress: getBnsContractAddress(network),
      contractName: BnsContractName,
      functionName: bnsFunctionName,
      functionArgs: [
        uintCV(id),
        contractPrincipalCV(commissionTraitAddress, commissionTraitName),
      ],
      postConditions,
      network,
    };

    endTimer();
    return result;
  } catch (error) {
    endTimer();
    throw error;
  }
}

export async function buildSetPrimaryNameTx({
  fullyQualifiedName,
  senderAddress,
  network,
}: Types.SetPrimaryNameOptions): Promise<ContractCallPayload> {
  const endTimer = debug.startTimer("buildSetPrimaryNameTx");
  const bnsFunctionName = "set-primary-name";

  try {
    const { subdomain } = decodeFQN(fullyQualifiedName);

    if (subdomain) {
      endTimer();
      throw createValidationError("Cannot set a subdomain as primary name", {
        fullyQualifiedName,
      });
    }

    const id = await getIdFromBns({
      fullyQualifiedName,
      network,
    });

    const currentOwner = await getOwner({
      fullyQualifiedName,
      network,
    });

    if (!currentOwner) {
      endTimer();
      throw createValidationError("Failed to fetch current owner of the name", {
        fullyQualifiedName,
      });
    }

    const postConditions = [
      Pc.principal(currentOwner)
        .willNotSendAsset()
        .nft(
          `${getBnsContractAddress(network)}.${BnsContractName}::BNS-V2`,
          uintCV(id)
        ),
    ];

    const result = {
      contractAddress: getBnsContractAddress(network),
      contractName: BnsContractName,
      functionName: bnsFunctionName,
      functionArgs: [uintCV(id)],
      postConditions,
      network,
    };

    endTimer();
    return result;
  } catch (error) {
    endTimer();
    throw error;
  }
}

export async function buildFreezeManagerTx({
  namespace,
  senderAddress,
  network,
}: Types.FreezeManagerOptions): Promise<ContractCallPayload> {
  const endTimer = debug.startTimer("buildFreezeManagerTx");
  const bnsFunctionName = "freeze-manager";

  try {
    const namespaceProperties = await getNamespaceProperties({
      namespace,
      network,
    });

    if (!namespaceProperties) {
      endTimer();
      throw createValidationError("Failed to fetch namespace properties", {
        namespace,
      });
    }

    if (!namespaceProperties.properties["namespace-manager"]) {
      endTimer();
      throw createValidationError("This namespace does not have a manager", {
        namespace,
      });
    }

    if (namespaceProperties.properties["manager-frozen"]) {
      endTimer();
      throw createValidationError(
        "Manager is already frozen for this namespace",
        { namespace }
      );
    }

    const result = {
      contractAddress: getBnsContractAddress(network),
      contractName: BnsContractName,
      functionName: bnsFunctionName,
      functionArgs: [bufferCVFromString(namespace)],
      postConditions: [],
      network,
    };

    endTimer();
    return result;
  } catch (error) {
    endTimer();
    throw error;
  }
}

export async function buildPreorderNamespaceTx({
  namespace,
  salt,
  stxToBurn,
  senderAddress,
  network,
}: Types.PreorderNamespaceOptions): Promise<ContractCallPayload> {
  const endTimer = debug.startTimer("buildPreorderNamespaceTx");
  const bnsFunctionName = "namespace-preorder";

  try {
    const hashedSaltedNamespace = getHashedBuffer(namespace, salt);

    const burnSTXPostCondition = Pc.principal(senderAddress)
      .willSendEq(stxToBurn)
      .ustx();

    const result = {
      contractAddress: getBnsContractAddress(network),
      contractName: BnsContractName,
      functionName: bnsFunctionName,
      functionArgs: [bufferCV(hashedSaltedNamespace), uintCV(stxToBurn)],
      postConditions: [burnSTXPostCondition],
      network,
    };

    endTimer();
    return result;
  } catch (error) {
    endTimer();
    throw error;
  }
}

export async function buildRevealNamespaceTx({
  namespace,
  salt,
  priceFunction,
  lifetime = 0n,
  namespaceImportAddress,
  namespaceManagerAddress,
  canUpdatePrice,
  managerTransfer = false,
  managerFrozen = true,
  senderAddress,
  network,
}: Types.RevealNamespaceOptions): Promise<ContractCallPayload> {
  const endTimer = debug.startTimer("buildRevealNamespaceTx");
  const bnsFunctionName = "namespace-reveal";

  try {
    let managerAddressCV;
    if (namespaceManagerAddress) {
      if (namespaceManagerAddress.includes(".")) {
        const [contractAddress, contractName] =
          namespaceManagerAddress.split(".");
        managerAddressCV = someCV(
          contractPrincipalCV(contractAddress, contractName)
        );
      } else {
        managerAddressCV = someCV(standardPrincipalCV(namespaceManagerAddress));
      }
    } else {
      managerAddressCV = noneCV();
    }

    const pf = priceFunction || defaultPriceFunction;

    const result = {
      contractAddress: getBnsContractAddress(network),
      contractName: BnsContractName,
      functionName: bnsFunctionName,
      functionArgs: [
        bufferCVFromString(namespace),
        bufferCVFromString(salt),
        uintCV(pf.base),
        uintCV(pf.coefficient),
        uintCV(pf.b1),
        uintCV(pf.b2),
        uintCV(pf.b3),
        uintCV(pf.b4),
        uintCV(pf.b5),
        uintCV(pf.b6),
        uintCV(pf.b7),
        uintCV(pf.b8),
        uintCV(pf.b9),
        uintCV(pf.b10),
        uintCV(pf.b11),
        uintCV(pf.b12),
        uintCV(pf.b13),
        uintCV(pf.b14),
        uintCV(pf.b15),
        uintCV(pf.b16),
        uintCV(pf.nonAlphaDiscount),
        uintCV(pf.noVowelDiscount),
        uintCV(lifetime),
        standardPrincipalCV(namespaceImportAddress),
        managerAddressCV,
        boolCV(canUpdatePrice),
        boolCV(managerTransfer),
        boolCV(managerFrozen),
      ],
      postConditions: [],
      network,
    };

    endTimer();
    return result;
  } catch (error) {
    endTimer();
    throw error;
  }
}

export async function buildLaunchNamespaceTx({
  namespace,
  senderAddress,
  network,
}: Types.LaunchNamespaceOptions): Promise<ContractCallPayload> {
  const endTimer = debug.startTimer("buildLaunchNamespaceTx");
  const bnsFunctionName = "namespace-launch";

  try {
    const result = {
      contractAddress: getBnsContractAddress(network),
      contractName: BnsContractName,
      functionName: bnsFunctionName,
      functionArgs: [bufferCVFromString(namespace)],
      postConditions: [],
      network,
    };

    endTimer();
    return result;
  } catch (error) {
    endTimer();
    throw error;
  }
}

export async function buildTurnOffManagerTransfersTx({
  namespace,
  senderAddress,
  network,
}: Types.TurnOffManagerTransfersOptions): Promise<ContractCallPayload> {
  const endTimer = debug.startTimer("buildTurnOffManagerTransfersTx");
  const bnsFunctionName = "turn-off-manager-transfers";

  try {
    const result = {
      contractAddress: getBnsContractAddress(network),
      contractName: BnsContractName,
      functionName: bnsFunctionName,
      functionArgs: [bufferCVFromString(namespace)],
      postConditions: [],
      network,
    };

    endTimer();
    return result;
  } catch (error) {
    endTimer();
    throw error;
  }
}

export async function buildImportNameTx({
  namespace,
  name,
  beneficiary,
  senderAddress,
  network,
}: Types.ImportNameOptions): Promise<ContractCallPayload> {
  const endTimer = debug.startTimer("buildImportNameTx");
  const bnsFunctionName = "name-import";

  try {
    const result = {
      contractAddress: getBnsContractAddress(network),
      contractName: BnsContractName,
      functionName: bnsFunctionName,
      functionArgs: [
        bufferCVFromString(namespace),
        bufferCVFromString(name),
        standardPrincipalCV(beneficiary),
      ],
      postConditions: [],
      network,
    };

    endTimer();
    return result;
  } catch (error) {
    endTimer();
    throw error;
  }
}

export async function buildNamespaceUpdatePriceTx({
  namespace,
  priceFunction,
  senderAddress,
  network,
}: Types.NamespaceUpdatePriceOptions): Promise<ContractCallPayload> {
  const endTimer = debug.startTimer("buildNamespaceUpdatePriceTx");
  const bnsFunctionName = "namespace-update-price";

  try {
    const result = {
      contractAddress: getBnsContractAddress(network),
      contractName: BnsContractName,
      functionName: bnsFunctionName,
      functionArgs: [
        bufferCVFromString(namespace),
        uintCV(priceFunction.base),
        uintCV(priceFunction.coefficient),
        uintCV(priceFunction.b1),
        uintCV(priceFunction.b2),
        uintCV(priceFunction.b3),
        uintCV(priceFunction.b4),
        uintCV(priceFunction.b5),
        uintCV(priceFunction.b6),
        uintCV(priceFunction.b7),
        uintCV(priceFunction.b8),
        uintCV(priceFunction.b9),
        uintCV(priceFunction.b10),
        uintCV(priceFunction.b11),
        uintCV(priceFunction.b12),
        uintCV(priceFunction.b13),
        uintCV(priceFunction.b14),
        uintCV(priceFunction.b15),
        uintCV(priceFunction.b16),
        uintCV(priceFunction.nonAlphaDiscount),
        uintCV(priceFunction.noVowelDiscount),
      ],
      postConditions: [],
      network,
    };

    endTimer();
    return result;
  } catch (error) {
    endTimer();
    throw error;
  }
}

export async function buildNamespaceFreezePriceTx({
  namespace,
  senderAddress,
  network,
}: Types.NamespaceFreezePriceOptions): Promise<ContractCallPayload> {
  const endTimer = debug.startTimer("buildNamespaceFreezePriceTx");
  const bnsFunctionName = "namespace-freeze-price";

  try {
    const result = {
      contractAddress: getBnsContractAddress(network),
      contractName: BnsContractName,
      functionName: bnsFunctionName,
      functionArgs: [bufferCVFromString(namespace)],
      postConditions: [],
      network,
    };

    endTimer();
    return result;
  } catch (error) {
    endTimer();
    throw error;
  }
}

export async function buildNameClaimFastTx({
  fullyQualifiedName,
  stxToBurn,
  sendTo,
  senderAddress,
  network,
}: Types.NameFastClaimOptions): Promise<ContractCallPayload> {
  const endTimer = debug.startTimer("buildNameClaimFastTx");
  const bnsFunctionName = "name-claim-fast";

  try {
    const { namespace, name, subdomain } = decodeFQN(fullyQualifiedName);

    if (subdomain) {
      endTimer();
      throw createValidationError(
        "Cannot register a subdomain using registerName()",
        { fullyQualifiedName }
      );
    }

    const principalCV = sendTo.includes(".")
      ? contractPrincipalCV(sendTo.split(".")[0], sendTo.split(".")[1])
      : standardPrincipalCV(sendTo);

    let postConditions = [];
    if (stxToBurn > 0) {
      const burnSTXPostCondition = Pc.principal(senderAddress)
        .willSendEq(stxToBurn)
        .ustx();
      postConditions.push(burnSTXPostCondition);
    }

    const result = {
      contractAddress: getBnsContractAddress(network),
      contractName: BnsContractName,
      functionName: bnsFunctionName,
      functionArgs: [
        bufferCV(stringToBuffer(name)),
        bufferCV(stringToBuffer(namespace)),
        principalCV,
      ],
      postConditions,
      network,
    };

    endTimer();
    return result;
  } catch (error) {
    endTimer();
    throw error;
  }
}

export async function buildPreorderNameTx({
  fullyQualifiedName,
  salt,
  stxToBurn,
  senderAddress,
  network,
}: Types.PreorderNameOptions): Promise<ContractCallPayload> {
  const endTimer = debug.startTimer("buildPreorderNameTx");
  const bnsFunctionName = "name-preorder";

  try {
    const { subdomain } = decodeFQN(fullyQualifiedName);

    if (subdomain) {
      endTimer();
      throw createValidationError(
        "Cannot preorder a subdomain using preorderName()",
        { fullyQualifiedName }
      );
    }

    // Use cached hash when possible
    const cacheKey = `${fullyQualifiedName}${salt}`;
    let hashedSaltedName: Uint8Array;

    if (hashCache.has(cacheKey)) {
      hashedSaltedName = hashCache.get(cacheKey)!;
    } else {
      const saltedNamesBytes = Buffer.from(`${fullyQualifiedName}${salt}`);
      hashedSaltedName = hash160(saltedNamesBytes);
      hashCache.set(cacheKey, hashedSaltedName);
    }

    let postConditions = [];
    if (stxToBurn > 0) {
      const burnSTXPostCondition = Pc.principal(senderAddress)
        .willSendEq(stxToBurn)
        .ustx();
      postConditions.push(burnSTXPostCondition);
    }

    const result = {
      contractAddress: getBnsContractAddress(network),
      contractName: BnsContractName,
      functionName: bnsFunctionName,
      functionArgs: [bufferCV(hashedSaltedName), uintCV(stxToBurn)],
      postConditions,
      network,
    };

    endTimer();
    return result;
  } catch (error) {
    endTimer();
    throw error;
  }
}

export async function buildRegisterNameTx({
  fullyQualifiedName,
  salt,
  stxToBurn,
  senderAddress,
  network,
}: Types.RegisterNameOptions): Promise<ContractCallPayload> {
  const endTimer = debug.startTimer("buildRegisterNameTx");
  const bnsFunctionName = "name-register";

  try {
    const { subdomain, namespace, name } = decodeFQN(fullyQualifiedName);

    if (subdomain) {
      endTimer();
      throw createValidationError(
        "Cannot register a subdomain using registerName()",
        { fullyQualifiedName }
      );
    }

    let postConditions = [];
    if (stxToBurn > 0) {
      const burnSTXPostCondition = Pc.principal(
        `${getBnsContractAddress(network)}.${BnsContractName}`
      )
        .willSendEq(stxToBurn)
        .ustx();
      postConditions.push(burnSTXPostCondition);
    }

    const result = {
      contractAddress: getBnsContractAddress(network),
      contractName: BnsContractName,
      functionName: bnsFunctionName,
      functionArgs: [
        bufferCV(stringToBuffer(namespace)),
        bufferCV(stringToBuffer(name)),
        bufferCV(stringToBuffer(salt)),
      ],
      postConditions,
      network,
    };

    endTimer();
    return result;
  } catch (error) {
    endTimer();
    throw error;
  }
}

export async function buildPreviousRegisterNameTx({
  fullyQualifiedName,
  salt,
  stxToBurn,
  senderAddress,
  network,
}: Types.RegisterNameOptions): Promise<ContractCallPayload> {
  const endTimer = debug.startTimer("buildPreviousRegisterNameTx");
  const bnsFunctionName = "name-register";

  try {
    const { subdomain, namespace, name } = decodeFQN(fullyQualifiedName);

    if (subdomain) {
      endTimer();
      throw createValidationError(
        "Cannot register a subdomain using registerName()",
        { fullyQualifiedName }
      );
    }

    // Get the ID for the name
    const nameId = await getIdFromBns({
      fullyQualifiedName,
      network,
    });

    // Get the current owner of the name
    const currentOwner = await getOwner({ fullyQualifiedName, network });

    if (!currentOwner) {
      endTimer();
      throw createValidationError("Failed to fetch current owner of the name", {
        fullyQualifiedName,
      });
    }

    let postConditions = [];

    if (stxToBurn > 0) {
      const burnSTXPostCondition = Pc.principal(
        `${getBnsContractAddress(network)}.${BnsContractName}`
      )
        .willSendEq(stxToBurn)
        .ustx();
      postConditions.push(burnSTXPostCondition);
    }

    const transferNFTPostCondition = Pc.principal(currentOwner)
      .willSendAsset()
      .nft(
        `${getBnsContractAddress(network)}.${BnsContractName}::BNS-V2`,
        uintCV(nameId)
      );
    postConditions.push(transferNFTPostCondition);

    const result = {
      contractAddress: getBnsContractAddress(network),
      contractName: BnsContractName,
      functionName: bnsFunctionName,
      functionArgs: [
        bufferCV(stringToBuffer(namespace)),
        bufferCV(stringToBuffer(name)),
        bufferCV(stringToBuffer(salt)),
      ],
      postConditions,
      network,
    };

    endTimer();
    return result;
  } catch (error) {
    endTimer();
    throw error;
  }
}

export async function buildClaimPreorderTx({
  fullyQualifiedName,
  salt,
  stxToClaim,
  senderAddress,
  network,
}: Types.ClaimPreorderOptions): Promise<ContractCallPayload> {
  const endTimer = debug.startTimer("buildClaimPreorderTx");
  const bnsFunctionName = "claim-preorder";

  try {
    const { subdomain } = decodeFQN(fullyQualifiedName);

    if (subdomain) {
      endTimer();
      throw createValidationError(
        "Cannot claim a subdomain using claim-preorder()",
        { fullyQualifiedName }
      );
    }

    const saltedNamesBytes = utf8ToBytes(`${fullyQualifiedName}${salt}`);
    const hashedSaltedName: Uint8Array = hash160(saltedNamesBytes);

    const returnSTXPostCondition = Pc.principal(
      `${getBnsContractAddress(network)}.${BnsContractName}`
    )
      .willSendEq(stxToClaim)
      .ustx();

    const result = {
      contractAddress: getBnsContractAddress(network),
      contractName: BnsContractName,
      functionName: bnsFunctionName,
      functionArgs: [bufferCV(hashedSaltedName)],
      postConditions: [returnSTXPostCondition],
      network,
    };

    endTimer();
    return result;
  } catch (error) {
    endTimer();
    throw error;
  }
}

export async function buildRenewNameTx({
  fullyQualifiedName,
  stxToBurn,
  senderAddress,
  network,
}: Types.RenewNameOptions): Promise<ContractCallPayload> {
  const endTimer = debug.startTimer("buildRenewNameTx");
  const bnsFunctionName = "name-renewal";

  try {
    const { subdomain, namespace, name } = decodeFQN(fullyQualifiedName);

    if (subdomain) {
      endTimer();
      throw createValidationError(
        "Cannot renew a subdomain using renewName()",
        { fullyQualifiedName }
      );
    }

    const burnSTXPostCondition = Pc.principal(senderAddress)
      .willSendEq(stxToBurn)
      .ustx();

    const result = {
      contractAddress: getBnsContractAddress(network),
      contractName: BnsContractName,
      functionName: bnsFunctionName,
      functionArgs: [bufferCVFromString(namespace), bufferCVFromString(name)],
      postConditions: [burnSTXPostCondition],
      network,
    };

    endTimer();
    return result;
  } catch (error) {
    endTimer();
    throw error;
  }
}

export async function buildUpdateZonefileTx({
  fullyQualifiedName,
  zonefileInputs,
  senderAddress,
  network,
}: Types.UpdateZonefileOptions): Promise<ContractCallPayload> {
  const endTimer = debug.startTimer("buildUpdateZonefileTx");
  const bnsFunctionName = "update-zonefile";

  try {
    const { name, namespace } = decodeFQN(fullyQualifiedName);

    let zonefileCV;
    if (zonefileInputs) {
      const zonefileData = createZonefileData(zonefileInputs);
      const zonefileString = stringifyZonefile(zonefileData);
      zonefileCV = someCV(bufferCVFromString(zonefileString));
    } else {
      zonefileCV = noneCV();
    }

    const result = {
      contractAddress: getZonefileContractAddress(network),
      contractName: ZonefileContractName,
      functionName: bnsFunctionName,
      functionArgs: [
        bufferCVFromString(name),
        bufferCVFromString(namespace),
        zonefileCV,
      ],
      postConditions: [],
      network,
    };

    endTimer();
    return result;
  } catch (error) {
    endTimer();
    throw error;
  }
}

const defaultPriceFunction: Types.PriceFunction = {
  base: 1n,
  coefficient: 1n,
  b1: 1n,
  b2: 1n,
  b3: 1n,
  b4: 1n,
  b5: 1n,
  b6: 1n,
  b7: 1n,
  b8: 1n,
  b9: 1n,
  b10: 1n,
  b11: 1n,
  b12: 1n,
  b13: 1n,
  b14: 1n,
  b15: 1n,
  b16: 1n,
  nonAlphaDiscount: 1n,
  noVowelDiscount: 1n,
};
