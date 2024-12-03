import { utf8ToBytes } from "@stacks/common";
import {
  bufferCV,
  hash160,
  standardPrincipalCV,
  uintCV,
  someCV,
  noneCV,
  // createSTXPostCondition,
  FungibleConditionCode,
  // createNonFungiblePostCondition,
  NonFungibleConditionCode,
  bufferCVFromString,
  boolCV,
  contractPrincipalCV,
  // makeContractSTXPostCondition,
  // makeStandardSTXPostCondition,
  // makeStandardNonFungiblePostCondition,
  // createAssetInfo,
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
import { decodeFQN, createZonefileData, stringifyZonefile } from "./utils";
import {
  getIdFromBns,
  getNamespaceProperties,
  getOwner,
  getOwnerById,
} from "./readOnlyCalls";

export async function buildTransferNameTx({
  fullyQualifiedName,
  newOwnerAddress,
  senderAddress,
  network,
}: Types.TransferNameOptions): Promise<ContractCallPayload> {
  const bnsFunctionName = "transfer";
  const { subdomain, namespace, name } = decodeFQN(fullyQualifiedName);

  if (subdomain) {
    throw new Error("Cannot transfer a subdomain using transferName()");
  }

  const id = await getIdFromBns({
    fullyQualifiedName,
    network,
  });

  const functionArgs = [
    uintCV(id),
    standardPrincipalCV(senderAddress),
    standardPrincipalCV(newOwnerAddress),
  ];

  const assetInfo = (getBnsContractAddress(network), BnsContractName, "BNS-V2");

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

  return {
    contractAddress: getBnsContractAddress(network),
    contractName: BnsContractName,
    functionName: bnsFunctionName,
    functionArgs,
    postConditions: [postConditionSender, postConditionReceiver],
    network,
  };
}

export async function buildListInUstxTx({
  id,
  price,
  commissionTraitAddress,
  commissionTraitName,
  senderAddress,
  network,
}: Types.ListInUstxOptions): Promise<ContractCallPayload> {
  const bnsFunctionName = "list-in-ustx";

  return {
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
}

export async function buildUnlistInUstxTx({
  id,
  senderAddress,
  network,
}: Types.UnlistInUstxOptions): Promise<ContractCallPayload> {
  const bnsFunctionName = "unlist-in-ustx";

  return {
    contractAddress: getBnsContractAddress(network),
    contractName: BnsContractName,
    functionName: bnsFunctionName,
    functionArgs: [uintCV(id)],
    postConditions: [],
    network,
  };
}

export async function buildBuyInUstxTx({
  id,
  expectedPrice,
  commissionTraitAddress,
  commissionTraitName,
  senderAddress,
  network,
}: Types.BuyInUstxOptions): Promise<ContractCallPayload> {
  const bnsFunctionName = "buy-in-ustx";
  const currentOwner = await getOwnerById({ id, network });

  if (!currentOwner) {
    throw new Error("Failed to fetch current owner of the name");
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

  return {
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
}

export async function buildSetPrimaryNameTx({
  fullyQualifiedName,
  senderAddress,
  network,
}: Types.SetPrimaryNameOptions): Promise<ContractCallPayload> {
  const bnsFunctionName = "set-primary-name";
  const { subdomain } = decodeFQN(fullyQualifiedName);

  if (subdomain) {
    throw new Error("Cannot set a subdomain as primary name");
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
    throw new Error("Failed to fetch current owner of the name");
  }

  const postConditions = [
    Pc.principal(currentOwner)
      .willNotSendAsset()
      .nft(
        `${getBnsContractAddress(network)}.${BnsContractName}::BNS-V2`,
        uintCV(id)
      ),
  ];

  return {
    contractAddress: getBnsContractAddress(network),
    contractName: BnsContractName,
    functionName: bnsFunctionName,
    functionArgs: [uintCV(id)],
    postConditions,
    network,
  };
}

export async function buildFreezeManagerTx({
  namespace,
  senderAddress,
  network,
}: Types.FreezeManagerOptions): Promise<ContractCallPayload> {
  const bnsFunctionName = "freeze-manager";
  const namespaceProperties = await getNamespaceProperties({
    namespace,
    network,
  });

  if (!namespaceProperties) {
    throw new Error("Failed to fetch namespace properties");
  }

  if (!namespaceProperties.properties["namespace-manager"]) {
    throw new Error("This namespace does not have a manager");
  }

  if (namespaceProperties.properties["manager-frozen"]) {
    throw new Error("Manager is already frozen for this namespace");
  }

  return {
    contractAddress: getBnsContractAddress(network),
    contractName: BnsContractName,
    functionName: bnsFunctionName,
    functionArgs: [bufferCVFromString(namespace)],
    postConditions: [],
    network,
  };
}

export async function buildPreorderNamespaceTx({
  namespace,
  salt,
  stxToBurn,
  senderAddress,
  network,
}: Types.PreorderNamespaceOptions): Promise<ContractCallPayload> {
  const bnsFunctionName = "namespace-preorder";
  const saltedNamespaceBytes = utf8ToBytes(`${namespace}.${salt}`);
  const hashedSaltedNamespace = hash160(saltedNamespaceBytes);

  const burnSTXPostCondition = Pc.principal(senderAddress)
    .willSendEq(stxToBurn)
    .ustx();

  return {
    contractAddress: getBnsContractAddress(network),
    contractName: BnsContractName,
    functionName: bnsFunctionName,
    functionArgs: [bufferCV(hashedSaltedNamespace), uintCV(stxToBurn)],
    postConditions: [burnSTXPostCondition],
    network,
  };
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
  const bnsFunctionName = "namespace-reveal";

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

  return {
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
}

export async function buildLaunchNamespaceTx({
  namespace,
  senderAddress,
  network,
}: Types.LaunchNamespaceOptions): Promise<ContractCallPayload> {
  const bnsFunctionName = "namespace-launch";

  return {
    contractAddress: getBnsContractAddress(network),
    contractName: BnsContractName,
    functionName: bnsFunctionName,
    functionArgs: [bufferCVFromString(namespace)],
    postConditions: [],
    network,
  };
}

export async function buildTurnOffManagerTransfersTx({
  namespace,
  senderAddress,
  network,
}: Types.TurnOffManagerTransfersOptions): Promise<ContractCallPayload> {
  const bnsFunctionName = "turn-off-manager-transfers";

  return {
    contractAddress: getBnsContractAddress(network),
    contractName: BnsContractName,
    functionName: bnsFunctionName,
    functionArgs: [bufferCVFromString(namespace)],
    postConditions: [],
    network,
  };
}

export async function buildImportNameTx({
  namespace,
  name,
  beneficiary,
  senderAddress,
  network,
}: Types.ImportNameOptions): Promise<ContractCallPayload> {
  const bnsFunctionName = "name-import";

  return {
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
}

export async function buildNamespaceUpdatePriceTx({
  namespace,
  priceFunction,
  senderAddress,
  network,
}: Types.NamespaceUpdatePriceOptions): Promise<ContractCallPayload> {
  const bnsFunctionName = "namespace-update-price";

  return {
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
}

export async function buildNamespaceFreezePriceTx({
  namespace,
  senderAddress,
  network,
}: Types.NamespaceFreezePriceOptions): Promise<ContractCallPayload> {
  const bnsFunctionName = "namespace-freeze-price";

  return {
    contractAddress: getBnsContractAddress(network),
    contractName: BnsContractName,
    functionName: bnsFunctionName,
    functionArgs: [bufferCVFromString(namespace)],
    postConditions: [],
    network,
  };
}

export async function buildNameClaimFastTx({
  fullyQualifiedName,
  stxToBurn,
  sendTo,
  senderAddress,
  network,
}: Types.NameFastClaimOptions): Promise<ContractCallPayload> {
  const bnsFunctionName = "name-claim-fast";
  const { namespace, name, subdomain } = decodeFQN(fullyQualifiedName);

  if (subdomain) {
    throw new Error("Cannot register a subdomain using registerName()");
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

  return {
    contractAddress: getBnsContractAddress(network),
    contractName: BnsContractName,
    functionName: bnsFunctionName,
    functionArgs: [
      bufferCV(Buffer.from(name)),
      bufferCV(Buffer.from(namespace)),
      principalCV,
    ],
    postConditions,
    network,
  };
}

export async function buildPreorderNameTx({
  fullyQualifiedName,
  salt,
  stxToBurn,
  senderAddress,
  network,
}: Types.PreorderNameOptions): Promise<ContractCallPayload> {
  const bnsFunctionName = "name-preorder";
  const { subdomain } = decodeFQN(fullyQualifiedName);

  if (subdomain) {
    throw new Error("Cannot preorder a subdomain using preorderName()");
  }

  const saltedNamesBytes = Buffer.from(`${fullyQualifiedName}${salt}`);
  const hashedSaltedName = hash160(saltedNamesBytes);

  let postConditions = [];
  if (stxToBurn > 0) {
    const burnSTXPostCondition = Pc.principal(senderAddress)
      .willSendEq(stxToBurn)
      .ustx();
    postConditions.push(burnSTXPostCondition);
  }

  return {
    contractAddress: getBnsContractAddress(network),
    contractName: BnsContractName,
    functionName: bnsFunctionName,
    functionArgs: [bufferCV(hashedSaltedName), uintCV(stxToBurn)],
    postConditions,
    network,
  };
}

export async function buildRegisterNameTx({
  fullyQualifiedName,
  salt,
  stxToBurn,
  senderAddress,
  network,
}: Types.RegisterNameOptions): Promise<ContractCallPayload> {
  const bnsFunctionName = "name-register";
  const { subdomain, namespace, name } = decodeFQN(fullyQualifiedName);

  if (subdomain) {
    throw new Error("Cannot register a subdomain using registerName()");
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

  return {
    contractAddress: getBnsContractAddress(network),
    contractName: BnsContractName,
    functionName: bnsFunctionName,
    functionArgs: [
      bufferCV(Buffer.from(namespace)),
      bufferCV(Buffer.from(name)),
      bufferCV(Buffer.from(salt)),
    ],
    postConditions,
    network,
  };
}

export async function buildPreviousRegisterNameTx({
  fullyQualifiedName,
  salt,
  stxToBurn,
  senderAddress,
  network,
}: Types.RegisterNameOptions): Promise<ContractCallPayload> {
  const bnsFunctionName = "name-register";
  const { subdomain, namespace, name } = decodeFQN(fullyQualifiedName);

  if (subdomain) {
    throw new Error("Cannot register a subdomain using registerName()");
  }

  // Get the ID for the name
  const nameId = await getIdFromBns({
    fullyQualifiedName,
    network,
  });

  // Get the current owner of the name
  const currentOwner = await getOwner({ fullyQualifiedName, network });

  if (!currentOwner) {
    throw new Error("Failed to fetch current owner of the name");
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

  return {
    contractAddress: getBnsContractAddress(network),
    contractName: BnsContractName,
    functionName: bnsFunctionName,
    functionArgs: [
      bufferCV(Buffer.from(namespace)),
      bufferCV(Buffer.from(name)),
      bufferCV(Buffer.from(salt)),
    ],
    postConditions,
    network,
  };
}

export async function buildClaimPreorderTx({
  fullyQualifiedName,
  salt,
  stxToClaim,
  senderAddress,
  network,
}: Types.ClaimPreorderOptions): Promise<ContractCallPayload> {
  const bnsFunctionName = "claim-preorder";
  const { subdomain } = decodeFQN(fullyQualifiedName);

  if (subdomain) {
    throw new Error("Cannot claim a subdomain using claim-preorder()");
  }

  const saltedNamesBytes = utf8ToBytes(`${fullyQualifiedName}${salt}`);
  const hashedSaltedName = hash160(saltedNamesBytes);

  const returnSTXPostCondition = Pc.principal(
    `${getBnsContractAddress(network)}.${BnsContractName}`
  )
    .willSendEq(stxToClaim)
    .ustx();

  return {
    contractAddress: getBnsContractAddress(network),
    contractName: BnsContractName,
    functionName: bnsFunctionName,
    functionArgs: [bufferCV(hashedSaltedName)],
    postConditions: [returnSTXPostCondition],
    network,
  };
}

export async function buildRenewNameTx({
  fullyQualifiedName,
  stxToBurn,
  senderAddress,
  network,
}: Types.RenewNameOptions): Promise<ContractCallPayload> {
  const bnsFunctionName = "name-renewal";
  const { subdomain, namespace, name } = decodeFQN(fullyQualifiedName);

  if (subdomain) {
    throw new Error("Cannot renew a subdomain using renewName()");
  }

  const burnSTXPostCondition = Pc.principal(senderAddress)
    .willSendEq(stxToBurn)
    .ustx();

  return {
    contractAddress: getBnsContractAddress(network),
    contractName: BnsContractName,
    functionName: bnsFunctionName,
    functionArgs: [bufferCVFromString(namespace), bufferCVFromString(name)],
    postConditions: [burnSTXPostCondition],
    network,
  };
}

export async function buildUpdateZonefileTx({
  fullyQualifiedName,
  zonefileInputs,
  senderAddress,
  network,
}: Types.UpdateZonefileOptions): Promise<ContractCallPayload> {
  const bnsFunctionName = "update-zonefile";
  const { name, namespace } = decodeFQN(fullyQualifiedName);

  let zonefileCV;
  if (zonefileInputs) {
    const zonefileData = createZonefileData(zonefileInputs);
    const zonefileString = stringifyZonefile(zonefileData);
    zonefileCV = someCV(bufferCVFromString(zonefileString));
  } else {
    zonefileCV = noneCV();
  }

  return {
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
}

// Import defaultPriceFunction from the existing code
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
