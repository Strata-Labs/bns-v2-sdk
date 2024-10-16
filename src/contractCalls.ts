import { utf8ToBytes } from "@stacks/common";
import {
  bufferCV,
  hash160,
  standardPrincipalCV,
  uintCV,
  someCV,
  noneCV,
  createSTXPostCondition,
  FungibleConditionCode,
  createNonFungiblePostCondition,
  NonFungibleConditionCode,
  parseAssetInfoString,
  tupleCV,
  bufferCVFromString,
  boolCV,
  contractPrincipalCV,
  makeContractSTXPostCondition,
  makeStandardSTXPostCondition,
  makeStandardNonFungiblePostCondition,
  createAssetInfo,
} from "@stacks/transactions";
import {
  createZonefileData,
  decodeFQN,
  defaultPriceFunction,
  stringifyZonefile,
} from "./utils";
import { BnsContractName, getBnsContractAddress } from "./config";
import {
  BuyInUstxOptions,
  ClaimPreorderOptions,
  FreezeManagerOptions,
  ImportNameOptions,
  LaunchNamespaceOptions,
  ListInUstxOptions,
  NameFastClaimOptions,
  NamespaceFreezePriceOptions,
  NamespaceUpdatePriceOptions,
  PreorderNameOptions,
  PreorderNamespaceOptions,
  RegisterNameOptions,
  RenewNameOptions,
  RevealNamespaceOptions,
  SetPrimaryNameOptions,
  TransferNameOptions,
  TurnOffManagerTransfersOptions,
  UnlistInUstxOptions,
  UpdateZonefileOptions,
} from "./interfaces";
import { bnsV2ContractCall, zonefileContractCall } from "./callersHelper";
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
  onFinish,
  onCancel,
}: TransferNameOptions): Promise<void> {
  const bnsFunctionName = "transfer";
  const { subdomain, namespace, name } = decodeFQN(fullyQualifiedName);
  if (subdomain) {
    throw new Error("Cannot transfer a subdomain using transferName()");
  }

  // Fetch the id from BNS
  const id = await getIdFromBns({
    fullyQualifiedName,
    network,
  });

  const functionArgs = [
    uintCV(id),
    standardPrincipalCV(senderAddress),
    standardPrincipalCV(newOwnerAddress),
  ];

  const assetInfo = parseAssetInfoString(
    `${getBnsContractAddress(network)}.${BnsContractName}::BNS-V2`
  );

  const postConditionSender = createNonFungiblePostCondition(
    senderAddress,
    NonFungibleConditionCode.Sends,
    assetInfo,
    uintCV(id)
  );

  const postConditionReceiver = createNonFungiblePostCondition(
    newOwnerAddress,
    NonFungibleConditionCode.DoesNotSend,
    assetInfo,
    uintCV(id)
  );

  return bnsV2ContractCall({
    functionName: bnsFunctionName,
    functionArgs,
    address: senderAddress,
    network,
    postConditions: [postConditionSender, postConditionReceiver],
    onFinish,
    onCancel,
  });
}

export async function buildListInUstxTx({
  id,
  price,
  commissionTraitAddress,
  commissionTraitName,
  senderAddress,
  network,
  onFinish,
  onCancel,
}: ListInUstxOptions): Promise<void> {
  const bnsFunctionName = "list-in-ustx";

  return bnsV2ContractCall({
    functionName: bnsFunctionName,
    functionArgs: [
      uintCV(id),
      uintCV(price),
      contractPrincipalCV(commissionTraitAddress, commissionTraitName),
    ],
    address: senderAddress,
    network,
    onFinish,
    onCancel,
  });
}

export async function buildUnlistInUstxTx({
  id,
  senderAddress,
  network,
  onFinish,
  onCancel,
}: UnlistInUstxOptions): Promise<void> {
  const bnsFunctionName = "unlist-in-ustx";

  return bnsV2ContractCall({
    functionName: bnsFunctionName,
    functionArgs: [uintCV(id)],
    address: senderAddress,
    network,
    onFinish,
    onCancel,
  });
}

export async function buildBuyInUstxTx({
  id,
  expectedPrice,
  commissionTraitAddress,
  commissionTraitName,
  senderAddress,
  network,
  onFinish,
  onCancel,
}: BuyInUstxOptions): Promise<void> {
  const bnsFunctionName = "buy-in-ustx";
  const currentOwner = await getOwnerById({ id, network });
  if (!currentOwner) {
    throw new Error("Failed to fetch current owner of the name");
  }
  const postConditions = [
    makeStandardSTXPostCondition(
      senderAddress,
      FungibleConditionCode.LessEqual,
      expectedPrice
    ),
    makeStandardNonFungiblePostCondition(
      currentOwner,
      NonFungibleConditionCode.Sends,
      createAssetInfo(
        getBnsContractAddress(network),
        BnsContractName,
        "BNS-V2"
      ),
      uintCV(id)
    ),
  ];
  return bnsV2ContractCall({
    functionName: bnsFunctionName,
    functionArgs: [
      uintCV(id),
      contractPrincipalCV(commissionTraitAddress, commissionTraitName),
    ],
    address: senderAddress,
    network,
    postConditions,
    onFinish,
    onCancel,
  });
}

export async function buildSetPrimaryNameTx({
  fullyQualifiedName,
  senderAddress,
  network,
  onFinish,
  onCancel,
}: SetPrimaryNameOptions): Promise<void> {
  const bnsFunctionName = "set-primary-name";
  const { subdomain, namespace, name } = decodeFQN(fullyQualifiedName);
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
    makeStandardNonFungiblePostCondition(
      currentOwner,
      NonFungibleConditionCode.DoesNotSend,
      createAssetInfo(
        getBnsContractAddress(network),
        BnsContractName,
        "BNS-V2"
      ),
      tupleCV({
        name: bufferCVFromString(name),
        namespace: bufferCVFromString(namespace),
      })
    ),
  ];
  return bnsV2ContractCall({
    functionName: bnsFunctionName,
    functionArgs: [uintCV(Number(id))],
    address: senderAddress,
    network,
    postConditions,
    onFinish,
    onCancel,
  });
}
export async function buildFreezeManagerTx({
  namespace,
  senderAddress,
  network,
  onFinish,
  onCancel,
}: FreezeManagerOptions): Promise<void> {
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
  return bnsV2ContractCall({
    functionName: bnsFunctionName,
    functionArgs: [bufferCVFromString(namespace)],
    address: senderAddress,
    network,
    onFinish,
    onCancel,
  });
}

export async function buildPreorderNamespaceTx({
  namespace,
  salt,
  stxToBurn,
  senderAddress,
  network,
  onFinish,
  onCancel,
}: PreorderNamespaceOptions): Promise<void> {
  const bnsFunctionName = "namespace-preorder";
  const saltedNamespaceBytes = utf8ToBytes(`${namespace}.${salt}`);
  const hashedSaltedNamespace = hash160(saltedNamespaceBytes);
  const burnSTXPostCondition = createSTXPostCondition(
    senderAddress,
    FungibleConditionCode.Equal,
    stxToBurn
  );
  return bnsV2ContractCall({
    functionName: bnsFunctionName,
    functionArgs: [bufferCV(hashedSaltedNamespace), uintCV(stxToBurn)],
    address: senderAddress,
    network,
    postConditions: [burnSTXPostCondition],
    onFinish,
    onCancel,
  });
}

export async function buildRevealNamespaceTx({
  namespace,
  salt,
  priceFunction = defaultPriceFunction,
  lifetime = 0,
  namespaceImportAddress,
  namespaceManagerAddress,
  canUpdatePrice,
  managerTransfer = false,
  managerFrozen = true,
  senderAddress,
  network,
  onFinish,
  onCancel,
}: RevealNamespaceOptions): Promise<void> {
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
  return bnsV2ContractCall({
    functionName: bnsFunctionName,
    functionArgs: [
      bufferCVFromString(namespace),
      bufferCVFromString(salt),
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
      uintCV(lifetime),
      standardPrincipalCV(namespaceImportAddress),
      managerAddressCV,
      boolCV(canUpdatePrice),
      boolCV(managerTransfer),
      boolCV(managerFrozen),
    ],
    address: senderAddress,
    network,
    onFinish,
    onCancel,
  });
}

export async function buildLaunchNamespaceTx({
  namespace,
  senderAddress,
  network,
  onFinish,
  onCancel,
}: LaunchNamespaceOptions): Promise<void> {
  const bnsFunctionName = "namespace-launch";
  return bnsV2ContractCall({
    functionName: bnsFunctionName,
    functionArgs: [bufferCVFromString(namespace)],
    address: senderAddress,
    network,
    onFinish,
    onCancel,
  });
}

export async function buildTurnOffManagerTransfersTx({
  namespace,
  senderAddress,
  network,
  onFinish,
  onCancel,
}: TurnOffManagerTransfersOptions): Promise<void> {
  const bnsFunctionName = "turn-off-manager-transfers";

  return bnsV2ContractCall({
    functionName: bnsFunctionName,
    functionArgs: [bufferCVFromString(namespace)],
    address: senderAddress,
    network,
    onFinish,
    onCancel,
  });
}

export async function buildImportNameTx({
  namespace,
  name,
  beneficiary,
  senderAddress,
  network,
  onFinish,
  onCancel,
}: ImportNameOptions): Promise<void> {
  const bnsFunctionName = "name-import";

  return bnsV2ContractCall({
    functionName: bnsFunctionName,
    functionArgs: [
      bufferCVFromString(namespace),
      bufferCVFromString(name),
      standardPrincipalCV(beneficiary),
    ],
    address: senderAddress,
    network,
    onFinish,
    onCancel,
  });
}

export async function buildNamespaceUpdatePriceTx({
  namespace,
  priceFunction,
  senderAddress,
  network,
  onFinish,
  onCancel,
}: NamespaceUpdatePriceOptions): Promise<void> {
  const bnsFunctionName = "namespace-update-price";

  return bnsV2ContractCall({
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
    address: senderAddress,
    network,
    onFinish,
    onCancel,
  });
}

export async function buildNamespaceFreezePriceTx({
  namespace,
  senderAddress,
  network,
  onFinish,
  onCancel,
}: NamespaceFreezePriceOptions): Promise<void> {
  const bnsFunctionName = "namespace-freeze-price";

  return bnsV2ContractCall({
    functionName: bnsFunctionName,
    functionArgs: [bufferCVFromString(namespace)],
    address: senderAddress,
    network,
    onFinish,
    onCancel,
  });
}

export async function buildNameClaimFastTx({
  fullyQualifiedName,
  stxToBurn,
  sendTo,
  senderAddress,
  network,
  onFinish,
  onCancel,
}: NameFastClaimOptions): Promise<void> {
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
    const burnSTXPostCondition = createSTXPostCondition(
      senderAddress,
      FungibleConditionCode.Equal,
      stxToBurn
    );
    postConditions.push(burnSTXPostCondition);
  }

  return bnsV2ContractCall({
    functionName: bnsFunctionName,
    functionArgs: [
      bufferCV(Buffer.from(name)),
      bufferCV(Buffer.from(namespace)),
      principalCV,
    ],
    network,
    address: senderAddress,
    postConditions,
    onFinish,
    onCancel,
  });
}

export async function buildPreorderNameTx({
  fullyQualifiedName,
  salt,
  stxToBurn,
  senderAddress,
  network,
  onFinish,
  onCancel,
}: PreorderNameOptions): Promise<void> {
  const bnsFunctionName = "name-preorder";
  const { subdomain } = decodeFQN(fullyQualifiedName);
  if (subdomain) {
    throw new Error("Cannot preorder a subdomain using preorderName()");
  }
  const saltedNamesBytes = Buffer.from(`${fullyQualifiedName}${salt}`);
  const hashedSaltedName = hash160(saltedNamesBytes);

  let postConditions = [];
  if (stxToBurn > 0) {
    const burnSTXPostCondition = createSTXPostCondition(
      senderAddress,
      FungibleConditionCode.Equal,
      stxToBurn
    );
    postConditions.push(burnSTXPostCondition);
  }

  return bnsV2ContractCall({
    functionName: bnsFunctionName,
    functionArgs: [bufferCV(hashedSaltedName), uintCV(stxToBurn)],
    address: senderAddress,
    network,
    postConditions,
    onFinish,
    onCancel,
  });
}

export async function buildRegisterNameTx({
  fullyQualifiedName,
  salt,
  stxToBurn,
  senderAddress,
  network,
  onFinish,
  onCancel,
}: RegisterNameOptions): Promise<void> {
  const bnsFunctionName = "name-register";
  const { subdomain, namespace, name } = decodeFQN(fullyQualifiedName);
  if (subdomain) {
    throw new Error("Cannot register a subdomain using registerName()");
  }

  let postConditions = [];
  if (stxToBurn > 0) {
    const burnSTXPostCondition = makeContractSTXPostCondition(
      getBnsContractAddress(network),
      BnsContractName,
      FungibleConditionCode.Equal,
      stxToBurn
    );
    postConditions.push(burnSTXPostCondition);
  }

  return bnsV2ContractCall({
    functionName: bnsFunctionName,
    functionArgs: [
      bufferCV(Buffer.from(namespace)),
      bufferCV(Buffer.from(name)),
      bufferCV(Buffer.from(salt)),
    ],
    network,
    postConditions,
    address: senderAddress,
    onFinish,
    onCancel,
  });
}

export async function buildPreviousRegisterNameTx({
  fullyQualifiedName,
  salt,
  stxToBurn,
  senderAddress,
  network,
  onFinish,
  onCancel,
}: RegisterNameOptions): Promise<void> {
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
    const burnSTXPostCondition = makeContractSTXPostCondition(
      getBnsContractAddress(network),
      BnsContractName,
      FungibleConditionCode.Equal,
      stxToBurn
    );
    postConditions.push(burnSTXPostCondition);
  }

  const transferNFTPostCondition = makeStandardNonFungiblePostCondition(
    currentOwner,
    NonFungibleConditionCode.Sends,
    createAssetInfo(getBnsContractAddress(network), BnsContractName, "BNS-V2"),
    uintCV(nameId)
  );
  postConditions.push(transferNFTPostCondition);

  return bnsV2ContractCall({
    functionName: bnsFunctionName,
    functionArgs: [
      bufferCV(Buffer.from(namespace)),
      bufferCV(Buffer.from(name)),
      bufferCV(Buffer.from(salt)),
    ],
    network,
    postConditions,
    address: senderAddress,
    onFinish,
    onCancel,
  });
}

export async function buildClaimPreorderTx({
  fullyQualifiedName,
  salt,
  stxToClaim,
  senderAddress,
  network,
  onFinish,
  onCancel,
}: ClaimPreorderOptions): Promise<void> {
  const bnsFunctionName = "claim-preorder";
  const { subdomain } = decodeFQN(fullyQualifiedName);
  if (subdomain) {
    throw new Error("Cannot claim a subdomain using claim-preorder()");
  }
  const saltedNamesBytes = utf8ToBytes(`${fullyQualifiedName}${salt}`);
  const hashedSaltedName = hash160(saltedNamesBytes);

  const returnSTXPostCondition = makeContractSTXPostCondition(
    getBnsContractAddress(network),
    BnsContractName,
    FungibleConditionCode.Equal,
    stxToClaim
  );

  return bnsV2ContractCall({
    functionName: bnsFunctionName,
    functionArgs: [bufferCV(hashedSaltedName)],
    address: senderAddress,
    network,
    postConditions: [returnSTXPostCondition],
    onFinish,
    onCancel,
  });
}

export async function buildRenewNameTx({
  fullyQualifiedName,
  stxToBurn,
  senderAddress,
  network,
  onFinish,
  onCancel,
}: RenewNameOptions): Promise<void> {
  const bnsFunctionName = "name-renewal";
  const { subdomain, namespace, name } = decodeFQN(fullyQualifiedName);
  if (subdomain) {
    throw new Error("Cannot renew a subdomain using renewName()");
  }
  const functionArgs = [
    bufferCVFromString(namespace),
    bufferCVFromString(name),
  ];
  const burnSTXPostCondition = createSTXPostCondition(
    senderAddress,
    FungibleConditionCode.Equal,
    stxToBurn
  );
  return bnsV2ContractCall({
    functionName: bnsFunctionName,
    functionArgs,
    address: senderAddress,
    network,
    postConditions: [burnSTXPostCondition],
    onFinish,
    onCancel,
  });
}

export async function buildUpdateZonefileTx({
  fullyQualifiedName,
  zonefileInputs,
  senderAddress,
  network,
  onFinish,
  onCancel,
}: UpdateZonefileOptions): Promise<void> {
  const zonefileFunctionName = "update-zonefile";
  const { name, namespace } = decodeFQN(fullyQualifiedName);

  let zonefileCV;
  if (zonefileInputs) {
    const zonefileData = createZonefileData(zonefileInputs);
    const zonefileString = stringifyZonefile(zonefileData);
    zonefileCV = someCV(bufferCVFromString(zonefileString));
  } else {
    zonefileCV = noneCV();
  }

  const functionArgs = [
    bufferCVFromString(name),
    bufferCVFromString(namespace),
    zonefileCV,
  ];

  return zonefileContractCall({
    functionName: zonefileFunctionName,
    functionArgs,
    address: senderAddress,
    network,
    onFinish,
    onCancel,
  });
}
