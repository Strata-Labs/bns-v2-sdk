"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.canRegisterName = canRegisterName;
exports.getLastTokenId = getLastTokenId;
exports.getRenewalHeight = getRenewalHeight;
exports.canResolveName = canResolveName;
exports.getOwner = getOwner;
exports.getOwnerById = getOwnerById;
exports.getNamespacePrice = getNamespacePrice;
exports.getNamePrice = getNamePrice;
exports.canNamespaceBeRegistered = canNamespaceBeRegistered;
exports.getNamespaceProperties = getNamespaceProperties;
exports.getNameInfo = getNameInfo;
exports.getIdFromBns = getIdFromBns;
exports.getBnsFromId = getBnsFromId;
exports.getPrimaryName = getPrimaryName;
exports.resolveName = resolveName;
exports.fetchUserOwnedNames = fetchUserOwnedNames;
exports.resolveNameZonefile = resolveNameZonefile;
const transactions_1 = require("@stacks/transactions");
const axios_1 = __importDefault(require("axios"));
const utils_1 = require("./utils");
const config_1 = require("./config");
const callersHelper_1 = require("./callersHelper");
async function canRegisterName({ fullyQualifiedName, network, }) {
    const bnsFunctionName = "get-bns-info";
    const { subdomain, namespace, name } = (0, utils_1.decodeFQN)(fullyQualifiedName);
    if (subdomain) {
        throw new Error("Cannot register a subdomain using registerName");
    }
    const randomAddress = (0, utils_1.generateRandomAddress)();
    return (0, callersHelper_1.bnsV2ReadOnlyCall)({
        functionName: bnsFunctionName,
        senderAddress: randomAddress,
        functionArgs: [(0, transactions_1.bufferCVFromString)(name), (0, transactions_1.bufferCVFromString)(namespace)],
        network,
    }).then((responseCV) => {
        if (responseCV.type === transactions_1.ClarityType.OptionalSome) {
            return false;
        }
        else if (responseCV.type === transactions_1.ClarityType.OptionalNone) {
            return true;
        }
        else {
            throw new Error(`Unexpected response type: ${responseCV.type}`);
        }
    });
}
async function getLastTokenId({ network, }) {
    const bnsFunctionName = "get-last-token-id";
    const randomAddress = (0, utils_1.generateRandomAddress)();
    return (0, callersHelper_1.bnsV2ReadOnlyCall)({
        functionName: bnsFunctionName,
        senderAddress: randomAddress,
        functionArgs: [],
        network,
    }).then((responseCV) => {
        if (responseCV.type === transactions_1.ClarityType.ResponseOk) {
            if (responseCV.value.type === transactions_1.ClarityType.UInt) {
                return responseCV.value.value;
            }
            else {
                throw new Error("Response did not contain a UInt");
            }
        }
        else if (responseCV.type === transactions_1.ClarityType.ResponseErr) {
            throw new Error((0, transactions_1.cvToString)(responseCV.value));
        }
        else {
            throw new Error(`Unexpected Clarity Value type: ${(0, transactions_1.getCVTypeString)(responseCV)}`);
        }
    });
}
async function getRenewalHeight({ fullyQualifiedName, network, }) {
    const bnsFunctionName = "get-renewal-height";
    const { subdomain, namespace, name } = (0, utils_1.decodeFQN)(fullyQualifiedName);
    if (subdomain) {
        throw new Error("Cannot get renewal height for a subdomain");
    }
    const randomAddress = (0, utils_1.generateRandomAddress)();
    const nameId = await getIdFromBns({
        fullyQualifiedName,
        network,
    });
    return (0, callersHelper_1.bnsV2ReadOnlyCall)({
        functionName: bnsFunctionName,
        senderAddress: randomAddress,
        functionArgs: [(0, transactions_1.uintCV)(nameId)],
        network,
    }).then((responseCV) => {
        if (responseCV.type === transactions_1.ClarityType.ResponseOk) {
            if (responseCV.value.type === transactions_1.ClarityType.UInt) {
                return responseCV.value.value;
            }
            else {
                throw new Error("Response did not contain a UInt");
            }
        }
        else if (responseCV.type === transactions_1.ClarityType.ResponseErr) {
            throw new Error((0, transactions_1.cvToString)(responseCV.value));
        }
        else {
            throw new Error(`Unexpected Clarity Value type: ${(0, transactions_1.getCVTypeString)(responseCV)}`);
        }
    });
}
async function canResolveName({ fullyQualifiedName, network, }) {
    const bnsFunctionName = "can-resolve-name";
    const { subdomain, namespace, name } = (0, utils_1.decodeFQN)(fullyQualifiedName);
    if (subdomain) {
        throw new Error("Cannot check resolution for a subdomain");
    }
    const randomAddress = (0, utils_1.generateRandomAddress)();
    return (0, callersHelper_1.bnsV2ReadOnlyCall)({
        functionName: bnsFunctionName,
        senderAddress: randomAddress,
        functionArgs: [(0, transactions_1.bufferCVFromString)(namespace), (0, transactions_1.bufferCVFromString)(name)],
        network,
    }).then((responseCV) => {
        if (responseCV.type === transactions_1.ClarityType.ResponseOk) {
            if (responseCV.value.type === transactions_1.ClarityType.Tuple) {
                const renewalCV = responseCV.value.data["renewal"];
                const ownerCV = responseCV.value.data["owner"];
                if (renewalCV.type === transactions_1.ClarityType.UInt &&
                    (ownerCV.type === transactions_1.ClarityType.PrincipalStandard ||
                        ownerCV.type === transactions_1.ClarityType.PrincipalContract)) {
                    return {
                        renewal: renewalCV.value,
                        owner: (0, transactions_1.cvToString)(ownerCV),
                    };
                }
                else {
                    throw new Error("Unexpected data types in response tuple");
                }
            }
            else {
                throw new Error("Response did not contain a Tuple");
            }
        }
        else if (responseCV.type === transactions_1.ClarityType.ResponseErr) {
            throw new Error((0, transactions_1.cvToString)(responseCV.value));
        }
        else {
            throw new Error(`Unexpected Clarity Value type: ${(0, transactions_1.getCVTypeString)(responseCV)}`);
        }
    });
}
async function getOwner({ fullyQualifiedName, network, }) {
    const bnsFunctionName = "get-owner-name";
    const { subdomain, namespace, name } = (0, utils_1.decodeFQN)(fullyQualifiedName);
    if (subdomain) {
        throw new Error("Cannot check resolution for a subdomain");
    }
    const randomAddress = (0, utils_1.generateRandomAddress)();
    return (0, callersHelper_1.bnsV2ReadOnlyCall)({
        functionName: bnsFunctionName,
        senderAddress: randomAddress,
        functionArgs: [(0, transactions_1.bufferCVFromString)(name), (0, transactions_1.bufferCVFromString)(namespace)],
        network,
    }).then((responseCV) => {
        if (responseCV.type === transactions_1.ClarityType.ResponseOk) {
            if (responseCV.value.type === transactions_1.ClarityType.OptionalSome) {
                if (responseCV.value.value.type === transactions_1.ClarityType.PrincipalStandard ||
                    responseCV.value.value.type === transactions_1.ClarityType.PrincipalContract) {
                    return (0, transactions_1.cvToString)(responseCV.value.value);
                }
                else {
                    throw new Error("Owner is not a principal");
                }
            }
            else if (responseCV.value.type === transactions_1.ClarityType.OptionalNone) {
                return null;
            }
            else {
                throw new Error("Unexpected Optional type in response");
            }
        }
        else if (responseCV.type === transactions_1.ClarityType.ResponseErr) {
            throw new Error((0, transactions_1.cvToString)(responseCV.value));
        }
        else {
            throw new Error(`Unexpected Clarity Value type: ${(0, transactions_1.getCVTypeString)(responseCV)}`);
        }
    });
}
async function getOwnerById({ id, network, }) {
    const bnsFunctionName = "get-owner";
    const randomAddress = (0, utils_1.generateRandomAddress)();
    return (0, callersHelper_1.bnsV2ReadOnlyCall)({
        functionName: bnsFunctionName,
        senderAddress: randomAddress,
        functionArgs: [(0, transactions_1.uintCV)(id)],
        network,
    }).then((responseCV) => {
        if (responseCV.type === transactions_1.ClarityType.ResponseOk) {
            if (responseCV.value.type === transactions_1.ClarityType.OptionalSome) {
                if (responseCV.value.value.type === transactions_1.ClarityType.PrincipalStandard ||
                    responseCV.value.value.type === transactions_1.ClarityType.PrincipalContract) {
                    return (0, transactions_1.cvToString)(responseCV.value.value);
                }
                else {
                    throw new Error("Owner is not a principal");
                }
            }
            else if (responseCV.value.type === transactions_1.ClarityType.OptionalNone) {
                return null;
            }
            else {
                throw new Error("Unexpected Optional type in response");
            }
        }
        else if (responseCV.type === transactions_1.ClarityType.ResponseErr) {
            throw new Error((0, transactions_1.cvToString)(responseCV.value));
        }
        else {
            throw new Error(`Unexpected Clarity Value type: ${(0, transactions_1.getCVTypeString)(responseCV)}`);
        }
    });
}
async function getNamespacePrice({ namespace, network, }) {
    const bnsFunctionName = "get-namespace-price";
    const randomAddress = (0, utils_1.generateRandomAddress)();
    return (0, callersHelper_1.bnsV2ReadOnlyCall)({
        functionName: bnsFunctionName,
        senderAddress: randomAddress,
        functionArgs: [(0, transactions_1.bufferCVFromString)(namespace)],
        network,
    }).then((responseCV) => {
        if (responseCV.type === transactions_1.ClarityType.ResponseOk) {
            if (responseCV.value.type === transactions_1.ClarityType.Int ||
                responseCV.value.type === transactions_1.ClarityType.UInt) {
                return responseCV.value.value;
            }
            else {
                throw new Error("Response did not contain a number");
            }
        }
        else if (responseCV.type === transactions_1.ClarityType.ResponseErr) {
            throw new Error((0, transactions_1.cvToString)(responseCV.value));
        }
        else {
            throw new Error(`Unexpected Clarity Value type: ${(0, transactions_1.getCVTypeString)(responseCV)}`);
        }
    });
}
async function getNamePrice({ fullyQualifiedName, network, }) {
    const bnsFunctionName = "get-name-price";
    const { subdomain, namespace, name } = (0, utils_1.decodeFQN)(fullyQualifiedName);
    if (subdomain) {
        throw new Error("Cannot get subdomain price");
    }
    const randomAddress = (0, utils_1.generateRandomAddress)();
    return (0, callersHelper_1.bnsV2ReadOnlyCall)({
        functionName: bnsFunctionName,
        senderAddress: randomAddress,
        functionArgs: [(0, transactions_1.bufferCVFromString)(namespace), (0, transactions_1.bufferCVFromString)(name)],
        network,
    })
        .then((responseCV) => {
        if (responseCV.type === transactions_1.ClarityType.ResponseOk) {
            const responseOkValue = responseCV.value;
            if (responseOkValue.type === transactions_1.ClarityType.ResponseOk) {
                const nestedResponseOkValue = responseOkValue.value;
                if (nestedResponseOkValue.type === transactions_1.ClarityType.Int ||
                    nestedResponseOkValue.type === transactions_1.ClarityType.UInt) {
                    return nestedResponseOkValue.value;
                }
                else {
                    throw new Error("Nested response did not contain a number");
                }
            }
            else if (responseOkValue.type === transactions_1.ClarityType.Int ||
                responseOkValue.type === transactions_1.ClarityType.UInt) {
                return responseOkValue.value;
            }
            else {
                throw new Error("Response did not contain a number");
            }
        }
        else {
            const errorResponse = responseCV;
            throw new Error((0, transactions_1.cvToString)(errorResponse.value));
        }
    })
        .catch((error) => {
        console.error("Error processing the response:", error);
        throw error;
    });
}
async function canNamespaceBeRegistered({ namespace, network, }) {
    const bnsFunctionName = "can-namespace-be-registered";
    const randomAddress = (0, utils_1.generateRandomAddress)();
    return (0, callersHelper_1.bnsV2ReadOnlyCall)({
        functionName: bnsFunctionName,
        senderAddress: randomAddress,
        functionArgs: [(0, transactions_1.bufferCVFromString)(namespace)],
        network,
    }).then((responseCV) => {
        if (responseCV.type === transactions_1.ClarityType.ResponseOk) {
            if (responseCV.value.type === transactions_1.ClarityType.BoolTrue) {
                return true;
            }
            else if (responseCV.value.type === transactions_1.ClarityType.BoolFalse) {
                return false;
            }
            else {
                throw new Error("Response did not contain a boolean");
            }
        }
        else if (responseCV.type === transactions_1.ClarityType.ResponseErr) {
            throw new Error((0, transactions_1.cvToString)(responseCV.value));
        }
        else {
            throw new Error(`Unexpected Clarity Value type: ${(0, transactions_1.getCVTypeString)(responseCV)}`);
        }
    });
}
async function getNamespaceProperties({ namespace, network, }) {
    const bnsFunctionName = "get-namespace-properties";
    const randomAddress = (0, utils_1.generateRandomAddress)();
    return (0, callersHelper_1.bnsV2ReadOnlyCall)({
        functionName: bnsFunctionName,
        senderAddress: randomAddress,
        functionArgs: [(0, transactions_1.bufferCVFromString)(namespace)],
        network,
    }).then((responseCV) => {
        if (responseCV.type === transactions_1.ClarityType.ResponseOk) {
            if (responseCV.value.type === transactions_1.ClarityType.Tuple) {
                const namespaceCV = responseCV.value.data["namespace"];
                const propertiesCV = responseCV.value.data["properties"];
                const properties = propertiesCV.data;
                return {
                    namespace: (0, transactions_1.bufferCV)(namespaceCV.buffer).buffer.toString(),
                    properties: {
                        "namespace-manager": properties["namespace-manager"].type === transactions_1.ClarityType.OptionalNone
                            ? null
                            : (0, transactions_1.cvToString)(properties["namespace-manager"]
                                .value),
                        "manager-transferable": properties["manager-transferable"].type ===
                            transactions_1.ClarityType.BoolTrue,
                        "manager-frozen": properties["manager-frozen"].type ===
                            transactions_1.ClarityType.BoolTrue,
                        "namespace-import": (0, transactions_1.cvToString)(properties["namespace-import"]),
                        "revealed-at": properties["revealed-at"].value,
                        "launched-at": properties["launched-at"].type === transactions_1.ClarityType.OptionalNone
                            ? null
                            : properties["launched-at"].value.value,
                        lifetime: properties["lifetime"].value,
                        "can-update-price-function": properties["can-update-price-function"].type ===
                            transactions_1.ClarityType.BoolTrue,
                        "price-function": (0, utils_1.parsePriceFunction)(properties["price-function"].data),
                    },
                };
            }
            else {
                throw new Error("Response did not contain a Tuple");
            }
        }
        else if (responseCV.type === transactions_1.ClarityType.ResponseErr) {
            throw new Error((0, transactions_1.cvToString)(responseCV.value));
        }
        else {
            throw new Error(`Unexpected Clarity Value type: ${(0, transactions_1.getCVTypeString)(responseCV)}`);
        }
    });
}
async function getNameInfo({ fullyQualifiedName, network, }) {
    const bnsFunctionName = "get-bns-info";
    const { subdomain, namespace, name } = (0, utils_1.decodeFQN)(fullyQualifiedName);
    if (subdomain) {
        throw new Error("Cannot get info for a subdomain");
    }
    const randomAddress = (0, utils_1.generateRandomAddress)();
    return (0, callersHelper_1.bnsV2ReadOnlyCall)({
        functionName: bnsFunctionName,
        senderAddress: randomAddress,
        functionArgs: [(0, transactions_1.bufferCVFromString)(name), (0, transactions_1.bufferCVFromString)(namespace)],
        network,
    }).then((responseCV) => {
        if (responseCV.type === transactions_1.ClarityType.OptionalSome) {
            if (responseCV.value.type === transactions_1.ClarityType.Tuple) {
                const tupleCV = responseCV.value;
                const properties = tupleCV.data;
                return {
                    owner: (0, transactions_1.cvToString)(properties.owner),
                    registeredAt: properties["registered-at"].type === transactions_1.ClarityType.OptionalNone
                        ? null
                        : properties["registered-at"].value.value,
                    renewalHeight: properties["renewal-height"].value,
                    stxBurn: properties["stx-burn"].value,
                    importedAt: properties["imported-at"].type === transactions_1.ClarityType.OptionalNone
                        ? null
                        : properties["imported-at"].value.value,
                    preorderedBy: properties["preordered-by"].type === transactions_1.ClarityType.OptionalNone
                        ? null
                        : (0, transactions_1.cvToString)(properties["preordered-by"].value),
                    hashedSaltedFqnPreorder: properties["hashed-salted-fqn-preorder"].type ===
                        transactions_1.ClarityType.OptionalNone
                        ? null
                        : properties["hashed-salted-fqn-preorder"].value.buffer.toString(),
                };
            }
            else {
                throw new Error("Response did not contain a Tuple");
            }
        }
        else if (responseCV.type === transactions_1.ClarityType.OptionalNone) {
            throw new Error("Name not found");
        }
        else {
            throw new Error(`Unexpected Clarity Value type: ${(0, transactions_1.getCVTypeString)(responseCV)}`);
        }
    });
}
async function getIdFromBns({ fullyQualifiedName, network, }) {
    const bnsFunctionName = "get-id-from-bns";
    const { subdomain, namespace, name } = (0, utils_1.decodeFQN)(fullyQualifiedName);
    if (subdomain) {
        throw new Error("Cannot get info for a subdomain");
    }
    const randomAddress = (0, utils_1.generateRandomAddress)();
    return (0, callersHelper_1.bnsV2ReadOnlyCall)({
        functionName: bnsFunctionName,
        senderAddress: randomAddress,
        functionArgs: [(0, transactions_1.bufferCVFromString)(name), (0, transactions_1.bufferCVFromString)(namespace)],
        network,
    }).then((responseCV) => {
        if (responseCV.type === transactions_1.ClarityType.OptionalSome) {
            if (responseCV.value.type === transactions_1.ClarityType.UInt) {
                return responseCV.value.value;
            }
            else {
                throw new Error("Response did not contain a UInt");
            }
        }
        else if (responseCV.type === transactions_1.ClarityType.OptionalNone) {
            throw new Error("Name not found");
        }
        else {
            throw new Error(`Unexpected Clarity Value type: ${(0, transactions_1.getCVTypeString)(responseCV)}`);
        }
    });
}
async function getBnsFromId({ id, network, }) {
    const bnsFunctionName = "get-bns-from-id";
    const randomAddress = (0, utils_1.generateRandomAddress)();
    return (0, callersHelper_1.bnsV2ReadOnlyCall)({
        functionName: bnsFunctionName,
        senderAddress: randomAddress,
        functionArgs: [(0, transactions_1.uintCV)(id)],
        network,
    }).then((responseCV) => {
        if (responseCV.type === transactions_1.ClarityType.OptionalSome) {
            if (responseCV.value.type === transactions_1.ClarityType.Tuple) {
                const nameCV = responseCV.value.data["name"];
                const namespaceCV = responseCV.value.data["namespace"];
                return {
                    name: (0, transactions_1.bufferCV)(nameCV.buffer).buffer.toString(),
                    namespace: (0, transactions_1.bufferCV)(namespaceCV.buffer).buffer.toString(),
                };
            }
            else {
                throw new Error("Response did not contain a Tuple");
            }
        }
        else if (responseCV.type === transactions_1.ClarityType.OptionalNone) {
            return null;
        }
        else {
            throw new Error(`Unexpected Clarity Value type: ${(0, transactions_1.getCVTypeString)(responseCV)}`);
        }
    });
}
async function getPrimaryName({ address, network, }) {
    const bnsFunctionName = "get-primary";
    const randomAddress = (0, utils_1.generateRandomAddress)();
    return (0, callersHelper_1.bnsV2ReadOnlyCall)({
        functionName: bnsFunctionName,
        senderAddress: randomAddress,
        functionArgs: [(0, transactions_1.standardPrincipalCV)(address)],
        network,
    }).then((responseCV) => {
        if (responseCV.type === transactions_1.ClarityType.ResponseOk) {
            if (responseCV.value.type === transactions_1.ClarityType.Tuple) {
                const nameCV = responseCV.value.data["name"];
                const namespaceCV = responseCV.value.data["namespace"];
                return {
                    name: Buffer.from(nameCV.buffer).toString(),
                    namespace: Buffer.from(namespaceCV.buffer).toString(),
                };
            }
            else if (responseCV.value.type === transactions_1.ClarityType.OptionalSome) {
                const innerValue = responseCV.value.value;
                if (innerValue.type === transactions_1.ClarityType.Tuple) {
                    const nameCV = innerValue.data["name"];
                    const namespaceCV = innerValue.data["namespace"];
                    return {
                        name: Buffer.from(nameCV.buffer).toString(),
                        namespace: Buffer.from(namespaceCV.buffer).toString(),
                    };
                }
            }
            throw new Error("Unexpected response structure");
        }
        else if (responseCV.type === transactions_1.ClarityType.ResponseErr) {
            if ((0, transactions_1.cvToString)(responseCV.value) === "u131") {
                return null;
            }
            throw new Error((0, transactions_1.cvToString)(responseCV.value));
        }
        else {
            throw new Error(`Unexpected Clarity Value type: ${(0, transactions_1.getCVTypeString)(responseCV)}`);
        }
    });
}
async function resolveName({ fullyQualifiedName, network, }) {
    const zonefileFunctionName = "resolve-name";
    const { subdomain, namespace, name } = (0, utils_1.decodeFQN)(fullyQualifiedName);
    if (subdomain) {
        throw new Error("Cannot resolve a subdomain");
    }
    const randomAddress = (0, utils_1.generateRandomAddress)();
    return (0, callersHelper_1.zonefileReadOnlyCall)({
        functionName: zonefileFunctionName,
        senderAddress: randomAddress,
        functionArgs: [(0, transactions_1.bufferCVFromString)(name), (0, transactions_1.bufferCVFromString)(namespace)],
        network,
    }).then((responseCV) => {
        if (responseCV.type === transactions_1.ClarityType.ResponseOk) {
            if (responseCV.value.type === transactions_1.ClarityType.OptionalSome) {
                if (responseCV.value.value.type === transactions_1.ClarityType.Buffer) {
                    return responseCV.value.value.buffer.toString();
                }
                else {
                    throw new Error("Unexpected type in response, expected Buffer");
                }
            }
            else if (responseCV.value.type === transactions_1.ClarityType.OptionalNone) {
                return null;
            }
            else {
                throw new Error("Unexpected Optional type in response");
            }
        }
        else if (responseCV.type === transactions_1.ClarityType.ResponseErr) {
            throw new Error((0, transactions_1.cvToString)(responseCV.value));
        }
        else {
            throw new Error(`Unexpected Clarity Value type: ${(0, transactions_1.getCVTypeString)(responseCV)}`);
        }
    });
}
async function fetchUserOwnedNames({ senderAddress, network, }) {
    const apiUrl = network === "mainnet"
        ? "https://leather.granite.world"
        : "https://api.testnet.hiro.so";
    const contractAddress = (0, config_1.getBnsContractAddress)(network);
    const contractName = config_1.BnsContractName;
    const assetIdentifier = `${contractAddress}.${contractName}::BNS-V2`;
    const limit = 50;
    let offset = 0;
    let allAssets = [];
    while (true) {
        try {
            const response = await axios_1.default.get(`${apiUrl}/extended/v1/tokens/nft/holdings?principal=${senderAddress}&asset_identifiers=${assetIdentifier}&limit=${limit}&offset=${offset}`);
            const assets = response.data.results.map((asset) => parseInt(asset.value.repr.slice(1)));
            allAssets = allAssets.concat(assets);
            if (response.data.total > offset + limit) {
                offset += limit;
            }
            else {
                break;
            }
        }
        catch (error) {
            console.error("Error fetching user assets:", error);
            throw error;
        }
    }
    const bnsPromises = allAssets.map((id) => getBnsFromId({ id: BigInt(id), network }));
    const bnsResults = await Promise.all(bnsPromises);
    const sortedNames = bnsResults
        .filter((result) => result !== null)
        .map((result) => ({
        name: (0, utils_1.asciiToUtf8)(result.name),
        namespace: (0, utils_1.asciiToUtf8)(result.namespace),
    }))
        .sort((a, b) => {
        if (a.namespace !== b.namespace) {
            return a.namespace.localeCompare(b.namespace);
        }
        return a.name.localeCompare(b.name);
    });
    return sortedNames;
}
async function resolveNameZonefile({ fullyQualifiedName, network, }) {
    const zonefileFunctionName = "resolve-name";
    const { subdomain, namespace, name } = (0, utils_1.decodeFQN)(fullyQualifiedName);
    if (subdomain) {
        throw new Error("Cannot resolve a subdomain");
    }
    const randomAddress = (0, utils_1.generateRandomAddress)();
    try {
        const responseCV = await (0, callersHelper_1.zonefileReadOnlyCall)({
            functionName: zonefileFunctionName,
            senderAddress: randomAddress,
            functionArgs: [(0, transactions_1.bufferCVFromString)(name), (0, transactions_1.bufferCVFromString)(namespace)],
            network,
        });
        if (responseCV.type === transactions_1.ClarityType.ResponseOk &&
            responseCV.value.type === transactions_1.ClarityType.OptionalSome &&
            responseCV.value.value.type === transactions_1.ClarityType.Buffer) {
            const zonefileString = Buffer.from(responseCV.value.value.buffer).toString("utf8");
            return (0, utils_1.parseZonefile)(zonefileString);
        }
        else if (responseCV.type === transactions_1.ClarityType.ResponseOk &&
            responseCV.value.type === transactions_1.ClarityType.OptionalNone) {
            return null;
        }
        throw new Error("No Zonefile Found");
    }
    catch (error) {
        console.error("Error resolving name zonefile:", error);
        throw error;
    }
}
