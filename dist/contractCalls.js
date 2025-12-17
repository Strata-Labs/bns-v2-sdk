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
exports.buildUpdateZonefileFlexibleTx = buildUpdateZonefileFlexibleTx;
exports.buildUpdateZonefileFormattedTx = buildUpdateZonefileFormattedTx;
const common_1 = require("@stacks/common");
const transactions_1 = require("@stacks/transactions");
const config_1 = require("./config");
const utils_1 = require("./utils");
const readOnlyCalls_1 = require("./readOnlyCalls");
async function buildTransferNameTx({ fullyQualifiedName, newOwnerAddress, senderAddress, network, }) {
    const bnsFunctionName = "transfer";
    const { subdomain, namespace, name } = (0, utils_1.decodeFQN)(fullyQualifiedName);
    if (subdomain) {
        throw new Error("Cannot transfer a subdomain using transferName()");
    }
    const id = await (0, readOnlyCalls_1.getIdFromBns)({
        fullyQualifiedName,
        network,
    });
    const functionArgs = [
        (0, transactions_1.uintCV)(id),
        (0, transactions_1.standardPrincipalCV)(senderAddress),
        (0, transactions_1.standardPrincipalCV)(newOwnerAddress),
    ];
    const postConditionSender = transactions_1.Pc.principal(senderAddress)
        .willSendAsset()
        .nft(`${(0, config_1.getBnsContractAddress)(network)}.${config_1.BnsContractName}::BNS-V2`, (0, transactions_1.uintCV)(id));
    const postConditionReceiver = transactions_1.Pc.principal(newOwnerAddress)
        .willNotSendAsset()
        .nft(`${(0, config_1.getBnsContractAddress)(network)}.${config_1.BnsContractName}::BNS-V2`, (0, transactions_1.uintCV)(id));
    return {
        contractAddress: (0, config_1.getBnsContractAddress)(network),
        contractName: config_1.BnsContractName,
        functionName: bnsFunctionName,
        functionArgs,
        postConditions: [postConditionSender, postConditionReceiver],
        network,
    };
}
async function buildListInUstxTx({ id, price, commissionTraitAddress, commissionTraitName, senderAddress, network, }) {
    const bnsFunctionName = "list-in-ustx";
    // Check if name can be traded
    const nameInfo = await (0, readOnlyCalls_1.getBnsFromId)({ id: BigInt(id), network });
    if (!nameInfo) {
        throw new Error("Name not found");
    }
    const fullyQualifiedName = `${nameInfo.name}.${nameInfo.namespace}`;
    const tradingStatus = await (0, readOnlyCalls_1.getNameTradingStatus)({
        fullyQualifiedName,
        network,
    });
    if (!tradingStatus.canTrade) {
        throw new Error(`Name ${fullyQualifiedName} ${tradingStatus.reason || "cannot be traded"}`);
    }
    return {
        contractAddress: (0, config_1.getBnsContractAddress)(network),
        contractName: config_1.BnsContractName,
        functionName: bnsFunctionName,
        functionArgs: [
            (0, transactions_1.uintCV)(id),
            (0, transactions_1.uintCV)(price),
            (0, transactions_1.contractPrincipalCV)(commissionTraitAddress, commissionTraitName),
        ],
        postConditions: [],
        network,
    };
}
async function buildUnlistInUstxTx({ id, senderAddress, network, }) {
    const bnsFunctionName = "unlist-in-ustx";
    return {
        contractAddress: (0, config_1.getBnsContractAddress)(network),
        contractName: config_1.BnsContractName,
        functionName: bnsFunctionName,
        functionArgs: [(0, transactions_1.uintCV)(id)],
        postConditions: [],
        network,
    };
}
async function buildBuyInUstxTx({ id, expectedPrice, commissionTraitAddress, commissionTraitName, senderAddress, network, }) {
    const bnsFunctionName = "buy-in-ustx";
    // Check if name can be traded
    const nameInfo = await (0, readOnlyCalls_1.getBnsFromId)({ id: BigInt(id), network });
    if (!nameInfo) {
        throw new Error("Name not found");
    }
    const fullyQualifiedName = `${nameInfo.name}.${nameInfo.namespace}`;
    const tradingStatus = await (0, readOnlyCalls_1.getNameTradingStatus)({
        fullyQualifiedName,
        network,
    });
    if (!tradingStatus.canTrade) {
        throw new Error(`Name ${fullyQualifiedName} ${tradingStatus.reason || "cannot be traded"}`);
    }
    const currentOwner = await (0, readOnlyCalls_1.getOwnerById)({ id, network });
    if (!currentOwner) {
        throw new Error("Failed to fetch current owner of the name");
    }
    const senderPostCondition = transactions_1.Pc.principal(senderAddress)
        .willSendLte(expectedPrice)
        .ustx();
    const ownerPostCondition = transactions_1.Pc.principal(currentOwner)
        .willSendAsset()
        .nft(`${(0, config_1.getBnsContractAddress)(network)}.${config_1.BnsContractName}::BNS-V2`, (0, transactions_1.uintCV)(id));
    const postConditions = [senderPostCondition, ownerPostCondition];
    return {
        contractAddress: (0, config_1.getBnsContractAddress)(network),
        contractName: config_1.BnsContractName,
        functionName: bnsFunctionName,
        functionArgs: [
            (0, transactions_1.uintCV)(id),
            (0, transactions_1.contractPrincipalCV)(commissionTraitAddress, commissionTraitName),
        ],
        postConditions,
        network,
    };
}
async function buildSetPrimaryNameTx({ fullyQualifiedName, senderAddress, network, }) {
    const bnsFunctionName = "set-primary-name";
    const { subdomain } = (0, utils_1.decodeFQN)(fullyQualifiedName);
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
        transactions_1.Pc.principal(currentOwner)
            .willNotSendAsset()
            .nft(`${(0, config_1.getBnsContractAddress)(network)}.${config_1.BnsContractName}::BNS-V2`, (0, transactions_1.uintCV)(id)),
    ];
    return {
        contractAddress: (0, config_1.getBnsContractAddress)(network),
        contractName: config_1.BnsContractName,
        functionName: bnsFunctionName,
        functionArgs: [(0, transactions_1.uintCV)(id)],
        postConditions,
        network,
    };
}
async function buildFreezeManagerTx({ namespace, senderAddress, network, }) {
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
    return {
        contractAddress: (0, config_1.getBnsContractAddress)(network),
        contractName: config_1.BnsContractName,
        functionName: bnsFunctionName,
        functionArgs: [(0, transactions_1.bufferCVFromString)(namespace)],
        postConditions: [],
        network,
    };
}
async function buildPreorderNamespaceTx({ namespace, salt, stxToBurn, senderAddress, network, }) {
    const bnsFunctionName = "namespace-preorder";
    const saltedNamespaceBytes = (0, common_1.utf8ToBytes)(`${namespace}.${salt}`);
    const hashedSaltedNamespace = (0, transactions_1.hash160)(saltedNamespaceBytes);
    const burnSTXPostCondition = transactions_1.Pc.principal(senderAddress)
        .willSendEq(stxToBurn)
        .ustx();
    return {
        contractAddress: (0, config_1.getBnsContractAddress)(network),
        contractName: config_1.BnsContractName,
        functionName: bnsFunctionName,
        functionArgs: [(0, transactions_1.bufferCV)(hashedSaltedNamespace), (0, transactions_1.uintCV)(stxToBurn)],
        postConditions: [burnSTXPostCondition],
        network,
    };
}
async function buildRevealNamespaceTx({ namespace, salt, priceFunction, lifetime = 0n, namespaceImportAddress, namespaceManagerAddress, canUpdatePrice, managerTransfer = false, managerFrozen = true, senderAddress, network, }) {
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
    const pf = priceFunction || defaultPriceFunction;
    return {
        contractAddress: (0, config_1.getBnsContractAddress)(network),
        contractName: config_1.BnsContractName,
        functionName: bnsFunctionName,
        functionArgs: [
            (0, transactions_1.bufferCVFromString)(namespace),
            (0, transactions_1.bufferCVFromString)(salt),
            (0, transactions_1.uintCV)(pf.base),
            (0, transactions_1.uintCV)(pf.coefficient),
            (0, transactions_1.uintCV)(pf.b1),
            (0, transactions_1.uintCV)(pf.b2),
            (0, transactions_1.uintCV)(pf.b3),
            (0, transactions_1.uintCV)(pf.b4),
            (0, transactions_1.uintCV)(pf.b5),
            (0, transactions_1.uintCV)(pf.b6),
            (0, transactions_1.uintCV)(pf.b7),
            (0, transactions_1.uintCV)(pf.b8),
            (0, transactions_1.uintCV)(pf.b9),
            (0, transactions_1.uintCV)(pf.b10),
            (0, transactions_1.uintCV)(pf.b11),
            (0, transactions_1.uintCV)(pf.b12),
            (0, transactions_1.uintCV)(pf.b13),
            (0, transactions_1.uintCV)(pf.b14),
            (0, transactions_1.uintCV)(pf.b15),
            (0, transactions_1.uintCV)(pf.b16),
            (0, transactions_1.uintCV)(pf.nonAlphaDiscount),
            (0, transactions_1.uintCV)(pf.noVowelDiscount),
            (0, transactions_1.uintCV)(lifetime),
            (0, transactions_1.standardPrincipalCV)(namespaceImportAddress),
            managerAddressCV,
            (0, transactions_1.boolCV)(canUpdatePrice),
            (0, transactions_1.boolCV)(managerTransfer),
            (0, transactions_1.boolCV)(managerFrozen),
        ],
        postConditions: [],
        network,
    };
}
async function buildLaunchNamespaceTx({ namespace, senderAddress, network, }) {
    const bnsFunctionName = "namespace-launch";
    return {
        contractAddress: (0, config_1.getBnsContractAddress)(network),
        contractName: config_1.BnsContractName,
        functionName: bnsFunctionName,
        functionArgs: [(0, transactions_1.bufferCVFromString)(namespace)],
        postConditions: [],
        network,
    };
}
async function buildTurnOffManagerTransfersTx({ namespace, senderAddress, network, }) {
    const bnsFunctionName = "turn-off-manager-transfers";
    return {
        contractAddress: (0, config_1.getBnsContractAddress)(network),
        contractName: config_1.BnsContractName,
        functionName: bnsFunctionName,
        functionArgs: [(0, transactions_1.bufferCVFromString)(namespace)],
        postConditions: [],
        network,
    };
}
async function buildImportNameTx({ namespace, name, beneficiary, senderAddress, network, }) {
    const bnsFunctionName = "name-import";
    return {
        contractAddress: (0, config_1.getBnsContractAddress)(network),
        contractName: config_1.BnsContractName,
        functionName: bnsFunctionName,
        functionArgs: [
            (0, transactions_1.bufferCVFromString)(namespace),
            (0, transactions_1.bufferCVFromString)(name),
            (0, transactions_1.standardPrincipalCV)(beneficiary),
        ],
        postConditions: [],
        network,
    };
}
async function buildNamespaceUpdatePriceTx({ namespace, priceFunction, senderAddress, network, }) {
    const bnsFunctionName = "namespace-update-price";
    return {
        contractAddress: (0, config_1.getBnsContractAddress)(network),
        contractName: config_1.BnsContractName,
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
        postConditions: [],
        network,
    };
}
async function buildNamespaceFreezePriceTx({ namespace, senderAddress, network, }) {
    const bnsFunctionName = "namespace-freeze-price";
    return {
        contractAddress: (0, config_1.getBnsContractAddress)(network),
        contractName: config_1.BnsContractName,
        functionName: bnsFunctionName,
        functionArgs: [(0, transactions_1.bufferCVFromString)(namespace)],
        postConditions: [],
        network,
    };
}
async function buildNameClaimFastTx({ fullyQualifiedName, stxToBurn, sendTo, senderAddress, network, }) {
    const bnsFunctionName = "name-claim-fast";
    const { namespace, name, subdomain } = (0, utils_1.decodeFQN)(fullyQualifiedName);
    if (subdomain) {
        throw new Error("Cannot register a subdomain using registerName()");
    }
    const principalCV = sendTo.includes(".")
        ? (0, transactions_1.contractPrincipalCV)(sendTo.split(".")[0], sendTo.split(".")[1])
        : (0, transactions_1.standardPrincipalCV)(sendTo);
    let postConditions = [];
    if (stxToBurn > 0) {
        const burnSTXPostCondition = transactions_1.Pc.principal(senderAddress)
            .willSendEq(stxToBurn)
            .ustx();
        postConditions.push(burnSTXPostCondition);
    }
    return {
        contractAddress: (0, config_1.getBnsContractAddress)(network),
        contractName: config_1.BnsContractName,
        functionName: bnsFunctionName,
        functionArgs: [
            (0, transactions_1.bufferCV)(Buffer.from(name)),
            (0, transactions_1.bufferCV)(Buffer.from(namespace)),
            principalCV,
        ],
        postConditions,
        network,
    };
}
async function buildPreorderNameTx({ fullyQualifiedName, salt, stxToBurn, senderAddress, network, }) {
    const bnsFunctionName = "name-preorder";
    const { subdomain } = (0, utils_1.decodeFQN)(fullyQualifiedName);
    if (subdomain) {
        throw new Error("Cannot preorder a subdomain using preorderName()");
    }
    const saltedNamesBytes = Buffer.from(`${fullyQualifiedName}${salt}`);
    const hashedSaltedName = (0, transactions_1.hash160)(saltedNamesBytes);
    let postConditions = [];
    if (stxToBurn > 0) {
        const burnSTXPostCondition = transactions_1.Pc.principal(senderAddress)
            .willSendEq(stxToBurn)
            .ustx();
        postConditions.push(burnSTXPostCondition);
    }
    return {
        contractAddress: (0, config_1.getBnsContractAddress)(network),
        contractName: config_1.BnsContractName,
        functionName: bnsFunctionName,
        functionArgs: [(0, transactions_1.bufferCV)(hashedSaltedName), (0, transactions_1.uintCV)(stxToBurn)],
        postConditions,
        network,
    };
}
async function buildRegisterNameTx({ fullyQualifiedName, salt, stxToBurn, senderAddress, network, }) {
    const bnsFunctionName = "name-register";
    const { subdomain, namespace, name } = (0, utils_1.decodeFQN)(fullyQualifiedName);
    if (subdomain) {
        throw new Error("Cannot register a subdomain using registerName()");
    }
    let postConditions = [];
    if (stxToBurn > 0) {
        const burnSTXPostCondition = transactions_1.Pc.principal(`${(0, config_1.getBnsContractAddress)(network)}.${config_1.BnsContractName}`)
            .willSendEq(stxToBurn)
            .ustx();
        postConditions.push(burnSTXPostCondition);
    }
    return {
        contractAddress: (0, config_1.getBnsContractAddress)(network),
        contractName: config_1.BnsContractName,
        functionName: bnsFunctionName,
        functionArgs: [
            (0, transactions_1.bufferCV)(Buffer.from(namespace)),
            (0, transactions_1.bufferCV)(Buffer.from(name)),
            (0, transactions_1.bufferCV)(Buffer.from(salt)),
        ],
        postConditions,
        network,
    };
}
async function buildPreviousRegisterNameTx({ fullyQualifiedName, salt, stxToBurn, senderAddress, network, }) {
    const bnsFunctionName = "name-register";
    const { subdomain, namespace, name } = (0, utils_1.decodeFQN)(fullyQualifiedName);
    if (subdomain) {
        throw new Error("Cannot register a subdomain using registerName()");
    }
    const nameId = await (0, readOnlyCalls_1.getIdFromBns)({
        fullyQualifiedName,
        network,
    });
    const currentOwner = await (0, readOnlyCalls_1.getOwner)({ fullyQualifiedName, network });
    if (!currentOwner) {
        throw new Error("Failed to fetch current owner of the name");
    }
    let postConditions = [];
    if (stxToBurn > 0) {
        const burnSTXPostCondition = transactions_1.Pc.principal(`${(0, config_1.getBnsContractAddress)(network)}.${config_1.BnsContractName}`)
            .willSendEq(stxToBurn)
            .ustx();
        postConditions.push(burnSTXPostCondition);
    }
    const transferNFTPostCondition = transactions_1.Pc.principal(currentOwner)
        .willSendAsset()
        .nft(`${(0, config_1.getBnsContractAddress)(network)}.${config_1.BnsContractName}::BNS-V2`, (0, transactions_1.uintCV)(nameId));
    postConditions.push(transferNFTPostCondition);
    return {
        contractAddress: (0, config_1.getBnsContractAddress)(network),
        contractName: config_1.BnsContractName,
        functionName: bnsFunctionName,
        functionArgs: [
            (0, transactions_1.bufferCV)(Buffer.from(namespace)),
            (0, transactions_1.bufferCV)(Buffer.from(name)),
            (0, transactions_1.bufferCV)(Buffer.from(salt)),
        ],
        postConditions,
        network,
    };
}
async function buildClaimPreorderTx({ fullyQualifiedName, salt, stxToClaim, senderAddress, network, }) {
    const bnsFunctionName = "claim-preorder";
    const { subdomain } = (0, utils_1.decodeFQN)(fullyQualifiedName);
    if (subdomain) {
        throw new Error("Cannot claim a subdomain using claim-preorder()");
    }
    const saltedNamesBytes = (0, common_1.utf8ToBytes)(`${fullyQualifiedName}${salt}`);
    const hashedSaltedName = (0, transactions_1.hash160)(saltedNamesBytes);
    const returnSTXPostCondition = transactions_1.Pc.principal(`${(0, config_1.getBnsContractAddress)(network)}.${config_1.BnsContractName}`)
        .willSendEq(stxToClaim)
        .ustx();
    return {
        contractAddress: (0, config_1.getBnsContractAddress)(network),
        contractName: config_1.BnsContractName,
        functionName: bnsFunctionName,
        functionArgs: [(0, transactions_1.bufferCV)(hashedSaltedName)],
        postConditions: [returnSTXPostCondition],
        network,
    };
}
async function buildRenewNameTx({ fullyQualifiedName, stxToBurn, senderAddress, network, includeNftTransferCondition = false, currentOwner, }) {
    const bnsFunctionName = "name-renewal";
    const { subdomain, namespace, name } = (0, utils_1.decodeFQN)(fullyQualifiedName);
    if (subdomain) {
        throw new Error("Cannot renew a subdomain using renewName()");
    }
    const burnSTXPostCondition = transactions_1.Pc.principal(senderAddress)
        .willSendEq(stxToBurn)
        .ustx();
    const postConditions = [burnSTXPostCondition];
    if (includeNftTransferCondition) {
        if (!currentOwner) {
            throw new Error("currentOwner is required when includeNftTransferCondition is true");
        }
        const id = await (0, readOnlyCalls_1.getIdFromBns)({
            fullyQualifiedName,
            network,
        });
        const postConditionSender = transactions_1.Pc.principal(currentOwner)
            .willSendAsset()
            .nft(`${(0, config_1.getBnsContractAddress)(network)}.${config_1.BnsContractName}::BNS-V2`, (0, transactions_1.uintCV)(id));
        const postConditionReceiver = transactions_1.Pc.principal(senderAddress)
            .willNotSendAsset()
            .nft(`${(0, config_1.getBnsContractAddress)(network)}.${config_1.BnsContractName}::BNS-V2`, (0, transactions_1.uintCV)(id));
        postConditions.push(postConditionSender, postConditionReceiver);
    }
    return {
        contractAddress: (0, config_1.getBnsContractAddress)(network),
        contractName: config_1.BnsContractName,
        functionName: bnsFunctionName,
        functionArgs: [(0, transactions_1.bufferCVFromString)(namespace), (0, transactions_1.bufferCVFromString)(name)],
        postConditions,
        network,
    };
}
async function buildUpdateZonefileTx({ fullyQualifiedName, zonefileInputs, senderAddress, network, }) {
    const bnsFunctionName = "update-zonefile";
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
    return {
        contractAddress: (0, config_1.getZonefileContractAddress)(network),
        contractName: config_1.ZonefileContractName,
        functionName: bnsFunctionName,
        functionArgs: [
            (0, transactions_1.bufferCVFromString)(name),
            (0, transactions_1.bufferCVFromString)(namespace),
            zonefileCV,
        ],
        postConditions: [],
        network,
    };
}
const defaultPriceFunction = {
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
async function buildUpdateZonefileFlexibleTx({ fullyQualifiedName, zonefileData, senderAddress, network, }) {
    const bnsFunctionName = "update-zonefile";
    const { name, namespace } = (0, utils_1.decodeFQN)(fullyQualifiedName);
    let zonefileCV;
    if (zonefileData) {
        const zonefileString = JSON.stringify(zonefileData);
        zonefileCV = (0, transactions_1.someCV)((0, transactions_1.bufferCVFromString)(zonefileString));
    }
    else {
        zonefileCV = (0, transactions_1.noneCV)();
    }
    return {
        contractAddress: (0, config_1.getZonefileContractAddress)(network),
        contractName: config_1.ZonefileContractName,
        functionName: bnsFunctionName,
        functionArgs: [
            (0, transactions_1.bufferCVFromString)(name),
            (0, transactions_1.bufferCVFromString)(namespace),
            zonefileCV,
        ],
        postConditions: [],
        network,
    };
}
async function buildUpdateZonefileFormattedTx({ fullyQualifiedName, zonefileData, senderAddress, network, }) {
    const bnsFunctionName = "update-zonefile";
    const { name, namespace } = (0, utils_1.decodeFQN)(fullyQualifiedName);
    const formattedZonefileData = (0, utils_1.createFormattedZonefileData)(zonefileData);
    let zonefileCV;
    if (formattedZonefileData) {
        const zonefileString = JSON.stringify(formattedZonefileData);
        zonefileCV = (0, transactions_1.someCV)((0, transactions_1.bufferCVFromString)(zonefileString));
    }
    else {
        zonefileCV = (0, transactions_1.noneCV)();
    }
    return {
        contractAddress: (0, config_1.getZonefileContractAddress)(network),
        contractName: config_1.ZonefileContractName,
        functionName: bnsFunctionName,
        functionArgs: [
            (0, transactions_1.bufferCVFromString)(name),
            (0, transactions_1.bufferCVFromString)(namespace),
            zonefileCV,
        ],
        postConditions: [],
        network,
    };
}
