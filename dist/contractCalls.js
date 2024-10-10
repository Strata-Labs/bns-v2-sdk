"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTransferNameTx = buildTransferNameTx;
exports.buildListInUstxTx = buildListInUstxTx;
exports.buildUnlistInUstxTx = buildUnlistInUstxTx;
exports.buildBuyInUstxTx = buildBuyInUstxTx;
exports.buildSetPrimaryNameTx = buildSetPrimaryNameTx;
exports.buildFreezeManagerTx = buildFreezeManagerTx;
exports.buildPreorderNamespaceTx = buildPreorderNamespaceTx;
exports.buildRevealNamespaceTx = buildRevealNamespaceTx;
exports.buildLaunchNamespaceTx = buildLaunchNamespaceTx;
exports.buildTurnOffManagerTransfersTx = buildTurnOffManagerTransfersTx;
exports.buildImportNameTx = buildImportNameTx;
exports.buildNamespaceUpdatePriceTx = buildNamespaceUpdatePriceTx;
exports.buildNamespaceFreezePriceTx = buildNamespaceFreezePriceTx;
exports.buildNameClaimFastTx = buildNameClaimFastTx;
exports.buildPreorderNameTx = buildPreorderNameTx;
exports.buildRegisterNameTx = buildRegisterNameTx;
exports.buildPreviousRegisterNameTx = buildPreviousRegisterNameTx;
exports.buildClaimPreorderTx = buildClaimPreorderTx;
exports.buildRenewNameTx = buildRenewNameTx;
exports.buildUpdateZonefileTx = buildUpdateZonefileTx;
const common_1 = require("@stacks/common");
const transactions_1 = require("@stacks/transactions");
const utils_1 = require("./utils");
const config_1 = require("./config");
const callersHelper_1 = require("./callersHelper");
const readOnlyCalls_1 = require("./readOnlyCalls");
async function buildTransferNameTx({ fullyQualifiedName, newOwnerAddress, senderAddress, network, onFinish, onCancel, }) {
    const bnsFunctionName = "transfer";
    const { subdomain, namespace, name } = (0, utils_1.decodeFQN)(fullyQualifiedName);
    if (subdomain) {
        throw new Error("Cannot transfer a subdomain using transferName()");
    }
    // Fetch the id from BNS
    const id = await (0, readOnlyCalls_1.getIdFromBns)({
        fullyQualifiedName,
        network,
    });
    const functionArgs = [
        (0, transactions_1.uintCV)(id),
        (0, transactions_1.standardPrincipalCV)(senderAddress),
        (0, transactions_1.standardPrincipalCV)(newOwnerAddress),
    ];
    const assetInfo = (0, transactions_1.parseAssetInfoString)(`${(0, config_1.getBnsContractAddress)(network)}.${config_1.BnsContractName}::BNS-V2`);
    const postConditionSender = (0, transactions_1.createNonFungiblePostCondition)(senderAddress, transactions_1.NonFungibleConditionCode.Sends, assetInfo, (0, transactions_1.uintCV)(id));
    const postConditionReceiver = (0, transactions_1.createNonFungiblePostCondition)(newOwnerAddress, transactions_1.NonFungibleConditionCode.DoesNotSend, assetInfo, (0, transactions_1.uintCV)(id));
    return (0, callersHelper_1.bnsV2ContractCall)({
        functionName: bnsFunctionName,
        functionArgs,
        address: senderAddress,
        network,
        postConditions: [postConditionSender, postConditionReceiver],
        onFinish,
        onCancel,
    });
}
async function buildListInUstxTx({ id, price, commissionTraitAddress, commissionTraitName, senderAddress, network, onFinish, onCancel, }) {
    const bnsFunctionName = "list-in-ustx";
    return (0, callersHelper_1.bnsV2ContractCall)({
        functionName: bnsFunctionName,
        functionArgs: [
            (0, transactions_1.uintCV)(id),
            (0, transactions_1.uintCV)(price),
            (0, transactions_1.contractPrincipalCV)(commissionTraitAddress, commissionTraitName),
        ],
        address: senderAddress,
        network,
        onFinish,
        onCancel,
    });
}
async function buildUnlistInUstxTx({ id, senderAddress, network, onFinish, onCancel, }) {
    const bnsFunctionName = "unlist-in-ustx";
    return (0, callersHelper_1.bnsV2ContractCall)({
        functionName: bnsFunctionName,
        functionArgs: [(0, transactions_1.uintCV)(id)],
        address: senderAddress,
        network,
        onFinish,
        onCancel,
    });
}
async function buildBuyInUstxTx({ id, expectedPrice, commissionTraitAddress, commissionTraitName, senderAddress, network, onFinish, onCancel, }) {
    const bnsFunctionName = "buy-in-ustx";
    const currentOwner = await (0, readOnlyCalls_1.getOwnerById)({ id, network });
    if (!currentOwner) {
        throw new Error("Failed to fetch current owner of the name");
    }
    const postConditions = [
        (0, transactions_1.makeStandardSTXPostCondition)(senderAddress, transactions_1.FungibleConditionCode.LessEqual, expectedPrice),
        (0, transactions_1.makeStandardNonFungiblePostCondition)(currentOwner, transactions_1.NonFungibleConditionCode.Sends, (0, transactions_1.createAssetInfo)((0, config_1.getBnsContractAddress)(network), config_1.BnsContractName, "BNS-V2"), (0, transactions_1.uintCV)(id)),
    ];
    return (0, callersHelper_1.bnsV2ContractCall)({
        functionName: bnsFunctionName,
        functionArgs: [
            (0, transactions_1.uintCV)(id),
            (0, transactions_1.contractPrincipalCV)(commissionTraitAddress, commissionTraitName),
        ],
        address: senderAddress,
        network,
        postConditions,
        onFinish,
        onCancel,
    });
}
async function buildSetPrimaryNameTx({ fullyQualifiedName, senderAddress, network, onFinish, onCancel, }) {
    const bnsFunctionName = "set-primary-name";
    const { subdomain, namespace, name } = (0, utils_1.decodeFQN)(fullyQualifiedName);
    if (subdomain) {
        throw new Error("Cannot set a subdomain as primary name");
    }
    const id = await (0, readOnlyCalls_1.getIdFromBns)({
        fullyQualifiedName,
        network,
    });
    const currentOwner = await (0, readOnlyCalls_1.getOwner)({
        fullyQualifiedName,
        network,
    });
    if (!currentOwner) {
        throw new Error("Failed to fetch current owner of the name");
    }
    const postConditions = [
        (0, transactions_1.makeStandardNonFungiblePostCondition)(currentOwner, transactions_1.NonFungibleConditionCode.DoesNotSend, (0, transactions_1.createAssetInfo)((0, config_1.getBnsContractAddress)(network), config_1.BnsContractName, "BNS-V2"), (0, transactions_1.tupleCV)({
            name: (0, transactions_1.bufferCVFromString)(name),
            namespace: (0, transactions_1.bufferCVFromString)(namespace),
        })),
    ];
    return (0, callersHelper_1.bnsV2ContractCall)({
        functionName: bnsFunctionName,
        functionArgs: [(0, transactions_1.uintCV)(Number(id))],
        address: senderAddress,
        network,
        postConditions,
        onFinish,
        onCancel,
    });
}
async function buildFreezeManagerTx({ namespace, senderAddress, network, onFinish, onCancel, }) {
    const bnsFunctionName = "freeze-manager";
    const namespaceProperties = await (0, readOnlyCalls_1.getNamespaceProperties)({
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
    return (0, callersHelper_1.bnsV2ContractCall)({
        functionName: bnsFunctionName,
        functionArgs: [(0, transactions_1.bufferCVFromString)(namespace)],
        address: senderAddress,
        network,
        onFinish,
        onCancel,
    });
}
async function buildPreorderNamespaceTx({ namespace, salt, stxToBurn, senderAddress, network, onFinish, onCancel, }) {
    const bnsFunctionName = "namespace-preorder";
    const saltedNamespaceBytes = (0, common_1.utf8ToBytes)(`${namespace}.${salt}`);
    const hashedSaltedNamespace = (0, transactions_1.hash160)(saltedNamespaceBytes);
    const burnSTXPostCondition = (0, transactions_1.createSTXPostCondition)(senderAddress, transactions_1.FungibleConditionCode.Equal, stxToBurn);
    return (0, callersHelper_1.bnsV2ContractCall)({
        functionName: bnsFunctionName,
        functionArgs: [(0, transactions_1.bufferCV)(hashedSaltedNamespace), (0, transactions_1.uintCV)(stxToBurn)],
        address: senderAddress,
        network,
        postConditions: [burnSTXPostCondition],
        onFinish,
        onCancel,
    });
}
async function buildRevealNamespaceTx({ namespace, salt, priceFunction = utils_1.defaultPriceFunction, lifetime = 0, namespaceImportAddress, namespaceManagerAddress, canUpdatePrice, managerTransfer = false, managerFrozen = true, senderAddress, network, onFinish, onCancel, }) {
    const bnsFunctionName = "namespace-reveal";
    let managerAddressCV;
    if (namespaceManagerAddress) {
        if (namespaceManagerAddress.includes(".")) {
            const [contractAddress, contractName] = namespaceManagerAddress.split(".");
            managerAddressCV = (0, transactions_1.someCV)((0, transactions_1.contractPrincipalCV)(contractAddress, contractName));
        }
        else {
            managerAddressCV = (0, transactions_1.someCV)((0, transactions_1.standardPrincipalCV)(namespaceManagerAddress));
        }
    }
    else {
        managerAddressCV = (0, transactions_1.noneCV)();
    }
    return (0, callersHelper_1.bnsV2ContractCall)({
        functionName: bnsFunctionName,
        functionArgs: [
            (0, transactions_1.bufferCVFromString)(namespace),
            (0, transactions_1.bufferCVFromString)(salt),
            (0, transactions_1.uintCV)(priceFunction.base),
            (0, transactions_1.uintCV)(priceFunction.coefficient),
            (0, transactions_1.uintCV)(priceFunction.b1),
            (0, transactions_1.uintCV)(priceFunction.b2),
            (0, transactions_1.uintCV)(priceFunction.b3),
            (0, transactions_1.uintCV)(priceFunction.b4),
            (0, transactions_1.uintCV)(priceFunction.b5),
            (0, transactions_1.uintCV)(priceFunction.b6),
            (0, transactions_1.uintCV)(priceFunction.b7),
            (0, transactions_1.uintCV)(priceFunction.b8),
            (0, transactions_1.uintCV)(priceFunction.b9),
            (0, transactions_1.uintCV)(priceFunction.b10),
            (0, transactions_1.uintCV)(priceFunction.b11),
            (0, transactions_1.uintCV)(priceFunction.b12),
            (0, transactions_1.uintCV)(priceFunction.b13),
            (0, transactions_1.uintCV)(priceFunction.b14),
            (0, transactions_1.uintCV)(priceFunction.b15),
            (0, transactions_1.uintCV)(priceFunction.b16),
            (0, transactions_1.uintCV)(priceFunction.nonAlphaDiscount),
            (0, transactions_1.uintCV)(priceFunction.noVowelDiscount),
            (0, transactions_1.uintCV)(lifetime),
            (0, transactions_1.standardPrincipalCV)(namespaceImportAddress),
            managerAddressCV,
            (0, transactions_1.boolCV)(canUpdatePrice),
            (0, transactions_1.boolCV)(managerTransfer),
            (0, transactions_1.boolCV)(managerFrozen),
        ],
        address: senderAddress,
        network,
        onFinish,
        onCancel,
    });
}
async function buildLaunchNamespaceTx({ namespace, senderAddress, network, onFinish, onCancel, }) {
    const bnsFunctionName = "namespace-launch";
    return (0, callersHelper_1.bnsV2ContractCall)({
        functionName: bnsFunctionName,
        functionArgs: [(0, transactions_1.bufferCVFromString)(namespace)],
        address: senderAddress,
        network,
        onFinish,
        onCancel,
    });
}
async function buildTurnOffManagerTransfersTx({ namespace, senderAddress, network, onFinish, onCancel, }) {
    const bnsFunctionName = "turn-off-manager-transfers";
    return (0, callersHelper_1.bnsV2ContractCall)({
        functionName: bnsFunctionName,
        functionArgs: [(0, transactions_1.bufferCVFromString)(namespace)],
        address: senderAddress,
        network,
        onFinish,
        onCancel,
    });
}
async function buildImportNameTx({ namespace, name, beneficiary, senderAddress, network, onFinish, onCancel, }) {
    const bnsFunctionName = "name-import";
    return (0, callersHelper_1.bnsV2ContractCall)({
        functionName: bnsFunctionName,
        functionArgs: [
            (0, transactions_1.bufferCVFromString)(namespace),
            (0, transactions_1.bufferCVFromString)(name),
            (0, transactions_1.standardPrincipalCV)(beneficiary),
        ],
        address: senderAddress,
        network,
        onFinish,
        onCancel,
    });
}
async function buildNamespaceUpdatePriceTx({ namespace, priceFunction, senderAddress, network, onFinish, onCancel, }) {
    const bnsFunctionName = "namespace-update-price";
    return (0, callersHelper_1.bnsV2ContractCall)({
        functionName: bnsFunctionName,
        functionArgs: [
            (0, transactions_1.bufferCVFromString)(namespace),
            (0, transactions_1.uintCV)(priceFunction.base),
            (0, transactions_1.uintCV)(priceFunction.coefficient),
            (0, transactions_1.uintCV)(priceFunction.b1),
            (0, transactions_1.uintCV)(priceFunction.b2),
            (0, transactions_1.uintCV)(priceFunction.b3),
            (0, transactions_1.uintCV)(priceFunction.b4),
            (0, transactions_1.uintCV)(priceFunction.b5),
            (0, transactions_1.uintCV)(priceFunction.b6),
            (0, transactions_1.uintCV)(priceFunction.b7),
            (0, transactions_1.uintCV)(priceFunction.b8),
            (0, transactions_1.uintCV)(priceFunction.b9),
            (0, transactions_1.uintCV)(priceFunction.b10),
            (0, transactions_1.uintCV)(priceFunction.b11),
            (0, transactions_1.uintCV)(priceFunction.b12),
            (0, transactions_1.uintCV)(priceFunction.b13),
            (0, transactions_1.uintCV)(priceFunction.b14),
            (0, transactions_1.uintCV)(priceFunction.b15),
            (0, transactions_1.uintCV)(priceFunction.b16),
            (0, transactions_1.uintCV)(priceFunction.nonAlphaDiscount),
            (0, transactions_1.uintCV)(priceFunction.noVowelDiscount),
        ],
        address: senderAddress,
        network,
        onFinish,
        onCancel,
    });
}
async function buildNamespaceFreezePriceTx({ namespace, senderAddress, network, onFinish, onCancel, }) {
    const bnsFunctionName = "namespace-freeze-price";
    return (0, callersHelper_1.bnsV2ContractCall)({
        functionName: bnsFunctionName,
        functionArgs: [(0, transactions_1.bufferCVFromString)(namespace)],
        address: senderAddress,
        network,
        onFinish,
        onCancel,
    });
}
async function buildNameClaimFastTx({ fullyQualifiedName, stxToBurn, sendTo, senderAddress, network, onFinish, onCancel, }) {
    const bnsFunctionName = "name-claim-fast";
    const { namespace, name, subdomain } = (0, utils_1.decodeFQN)(fullyQualifiedName);
    if (subdomain) {
        throw new Error("Cannot register a subdomain using registerName()");
    }
    const principalCV = sendTo.includes(".")
        ? (0, transactions_1.contractPrincipalCV)(sendTo.split(".")[0], sendTo.split(".")[1])
        : (0, transactions_1.standardPrincipalCV)(sendTo);
    const burnSTXPostCondition = (0, transactions_1.createSTXPostCondition)(senderAddress, transactions_1.FungibleConditionCode.Equal, stxToBurn);
    return (0, callersHelper_1.bnsV2ContractCall)({
        functionName: bnsFunctionName,
        functionArgs: [
            (0, transactions_1.bufferCVFromString)(name),
            (0, transactions_1.bufferCVFromString)(namespace),
            principalCV,
        ],
        network,
        address: senderAddress,
        postConditions: [burnSTXPostCondition],
        onFinish,
        onCancel,
    });
}
async function buildPreorderNameTx({ fullyQualifiedName, salt, stxToBurn, senderAddress, network, onFinish, onCancel, }) {
    const bnsFunctionName = "name-preorder";
    const { subdomain } = (0, utils_1.decodeFQN)(fullyQualifiedName);
    if (subdomain) {
        throw new Error("Cannot preorder a subdomain using preorderName()");
    }
    const saltedNamesBytes = (0, common_1.utf8ToBytes)(`${fullyQualifiedName}${salt}`);
    const hashedSaltedName = (0, transactions_1.hash160)(saltedNamesBytes);
    const burnSTXPostCondition = (0, transactions_1.createSTXPostCondition)(senderAddress, transactions_1.FungibleConditionCode.Equal, stxToBurn);
    return (0, callersHelper_1.bnsV2ContractCall)({
        functionName: bnsFunctionName,
        functionArgs: [(0, transactions_1.bufferCV)(hashedSaltedName), (0, transactions_1.uintCV)(stxToBurn)],
        address: senderAddress,
        network,
        postConditions: [burnSTXPostCondition],
        onFinish,
        onCancel,
    });
}
async function buildRegisterNameTx({ fullyQualifiedName, salt, stxToBurn, senderAddress, network, onFinish, onCancel, }) {
    const bnsFunctionName = "name-register";
    const { subdomain, namespace, name } = (0, utils_1.decodeFQN)(fullyQualifiedName);
    if (subdomain) {
        throw new Error("Cannot register a subdomain using registerName()");
    }
    const burnSTXPostCondition = (0, transactions_1.makeContractSTXPostCondition)((0, config_1.getBnsContractAddress)(network), config_1.BnsContractName, transactions_1.FungibleConditionCode.Equal, stxToBurn);
    return (0, callersHelper_1.bnsV2ContractCall)({
        functionName: bnsFunctionName,
        functionArgs: [
            (0, transactions_1.bufferCVFromString)(namespace),
            (0, transactions_1.bufferCVFromString)(name),
            (0, transactions_1.bufferCVFromString)(salt),
        ],
        network,
        postConditions: [burnSTXPostCondition],
        address: senderAddress,
        onFinish,
        onCancel,
    });
}
async function buildPreviousRegisterNameTx({ fullyQualifiedName, salt, stxToBurn, senderAddress, network, onFinish, onCancel, }) {
    const bnsFunctionName = "name-register";
    const { subdomain, namespace, name } = (0, utils_1.decodeFQN)(fullyQualifiedName);
    if (subdomain) {
        throw new Error("Cannot register a subdomain using registerName()");
    }
    // Get the ID for the name
    const nameId = await (0, readOnlyCalls_1.getIdFromBns)({
        fullyQualifiedName,
        network,
    });
    // Get the current owner of the name
    const currentOwner = await (0, readOnlyCalls_1.getOwner)({ fullyQualifiedName, network });
    if (!currentOwner) {
        throw new Error("Failed to fetch current owner of the name");
    }
    const burnSTXPostCondition = (0, transactions_1.makeContractSTXPostCondition)((0, config_1.getBnsContractAddress)(network), config_1.BnsContractName, transactions_1.FungibleConditionCode.Equal, stxToBurn);
    const transferNFTPostCondition = (0, transactions_1.makeStandardNonFungiblePostCondition)(currentOwner, transactions_1.NonFungibleConditionCode.Sends, (0, transactions_1.createAssetInfo)((0, config_1.getBnsContractAddress)(network), config_1.BnsContractName, "BNS-V2"), (0, transactions_1.uintCV)(nameId));
    return (0, callersHelper_1.bnsV2ContractCall)({
        functionName: bnsFunctionName,
        functionArgs: [
            (0, transactions_1.bufferCVFromString)(namespace),
            (0, transactions_1.bufferCVFromString)(name),
            (0, transactions_1.bufferCVFromString)(salt),
        ],
        network,
        postConditions: [burnSTXPostCondition, transferNFTPostCondition],
        address: senderAddress,
        onFinish,
        onCancel,
    });
}
async function buildClaimPreorderTx({ fullyQualifiedName, salt, stxToClaim, senderAddress, network, onFinish, onCancel, }) {
    const bnsFunctionName = "claim-preorder";
    const { subdomain } = (0, utils_1.decodeFQN)(fullyQualifiedName);
    if (subdomain) {
        throw new Error("Cannot claim a subdomain using claim-preorder()");
    }
    const saltedNamesBytes = (0, common_1.utf8ToBytes)(`${fullyQualifiedName}${salt}`);
    const hashedSaltedName = (0, transactions_1.hash160)(saltedNamesBytes);
    const returnSTXPostCondition = (0, transactions_1.makeContractSTXPostCondition)((0, config_1.getBnsContractAddress)(network), config_1.BnsContractName, transactions_1.FungibleConditionCode.Equal, stxToClaim);
    return (0, callersHelper_1.bnsV2ContractCall)({
        functionName: bnsFunctionName,
        functionArgs: [(0, transactions_1.bufferCV)(hashedSaltedName)],
        address: senderAddress,
        network,
        postConditions: [returnSTXPostCondition],
        onFinish,
        onCancel,
    });
}
async function buildRenewNameTx({ fullyQualifiedName, stxToBurn, senderAddress, network, onFinish, onCancel, }) {
    const bnsFunctionName = "name-renewal";
    const { subdomain, namespace, name } = (0, utils_1.decodeFQN)(fullyQualifiedName);
    if (subdomain) {
        throw new Error("Cannot renew a subdomain using renewName()");
    }
    const functionArgs = [
        (0, transactions_1.bufferCVFromString)(namespace),
        (0, transactions_1.bufferCVFromString)(name),
    ];
    const burnSTXPostCondition = (0, transactions_1.createSTXPostCondition)(senderAddress, transactions_1.FungibleConditionCode.Equal, stxToBurn);
    return (0, callersHelper_1.bnsV2ContractCall)({
        functionName: bnsFunctionName,
        functionArgs,
        address: senderAddress,
        network,
        postConditions: [burnSTXPostCondition],
        onFinish,
        onCancel,
    });
}
async function buildUpdateZonefileTx({ fullyQualifiedName, zonefileInputs, senderAddress, network, onFinish, onCancel, }) {
    const zonefileFunctionName = "update-zonefile";
    const { name, namespace } = (0, utils_1.decodeFQN)(fullyQualifiedName);
    let zonefileCV;
    if (zonefileInputs) {
        const zonefileData = (0, utils_1.createZonefileData)(zonefileInputs);
        const zonefileString = (0, utils_1.stringifyZonefile)(zonefileData);
        zonefileCV = (0, transactions_1.someCV)((0, transactions_1.bufferCVFromString)(zonefileString));
    }
    else {
        zonefileCV = (0, transactions_1.noneCV)();
    }
    const functionArgs = [
        (0, transactions_1.bufferCVFromString)(name),
        (0, transactions_1.bufferCVFromString)(namespace),
        zonefileCV,
    ];
    return (0, callersHelper_1.zonefileContractCall)({
        functionName: zonefileFunctionName,
        functionArgs,
        address: senderAddress,
        network,
        onFinish,
        onCancel,
    });
}
