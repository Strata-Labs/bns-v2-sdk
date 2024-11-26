"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLastTokenId = getLastTokenId;
exports.getRenewalHeight = getRenewalHeight;
exports.canResolveName = canResolveName;
exports.getOwner = getOwner;
exports.getOwnerById = getOwnerById;
exports.getIdFromBns = getIdFromBns;
exports.getBnsFromId = getBnsFromId;
exports.canRegisterName = canRegisterName;
exports.getNamespacePrice = getNamespacePrice;
exports.getNamePrice = getNamePrice;
exports.canNamespaceBeRegistered = canNamespaceBeRegistered;
exports.getNamespaceProperties = getNamespaceProperties;
exports.getNameInfo = getNameInfo;
exports.getPrimaryName = getPrimaryName;
exports.fetchUserOwnedNames = fetchUserOwnedNames;
exports.resolveNameZonefile = resolveNameZonefile;
const transactions_1 = require("@stacks/transactions");
const axios_1 = __importDefault(require("axios"));
const utils_1 = require("./utils");
const config_1 = require("./config");
const callersHelper_1 = require("./callersHelper");
const debug_1 = require("./debug");
const API_BASE_URL = "https://api.bnsv2.com";
// Helper function to determine if we should use API
const shouldUseApi = (network) => network === "mainnet";
// Helper function for API calls with network support
const callApi = async (endpoint, network) => {
    try {
        const networkPrefix = network === "testnet" ? "/testnet" : "";
        const url = `${API_BASE_URL}${networkPrefix}${endpoint}`;
        debug_1.debug.log("Making API call to:", url);
        const response = await axios_1.default.get(url);
        return response.data;
    }
    catch (error) {
        debug_1.debug.error("API call failed:", error);
        throw error;
    }
};
async function getLastTokenId({ network, }) {
    try {
        const response = await callApi("/token/last-id", network);
        return BigInt(response.last_token_id);
    }
    catch (error) {
        debug_1.debug.error("API call failed, falling back to contract call:", error);
        const randomAddress = (0, utils_1.generateRandomAddress)();
        const responseCV = await (0, callersHelper_1.bnsV2ReadOnlyCall)({
            functionName: "get-last-token-id",
            senderAddress: randomAddress,
            functionArgs: [],
            network,
        });
        if (responseCV.type === transactions_1.ClarityType.ResponseOk) {
            if (responseCV.value.type === transactions_1.ClarityType.UInt) {
                return responseCV.value.value;
            }
            throw new Error("Response did not contain a UInt");
        }
        if (responseCV.type === transactions_1.ClarityType.ResponseErr) {
            throw new Error((0, transactions_1.cvToString)(responseCV.value));
        }
        throw new Error(`Unexpected Clarity Value type: ${(0, transactions_1.getCVTypeString)(responseCV)}`);
    }
}
async function getRenewalHeight({ fullyQualifiedName, network, }) {
    try {
        const response = await callApi(`/names/${fullyQualifiedName}/renewal`, network);
        return BigInt(response.renewal_height);
    }
    catch (error) {
        debug_1.debug.error("API call failed, falling back to contract call:", error);
        const { subdomain } = (0, utils_1.decodeFQN)(fullyQualifiedName);
        if (subdomain) {
            throw new Error("Cannot get renewal height for a subdomain");
        }
        const randomAddress = (0, utils_1.generateRandomAddress)();
        const nameId = await getIdFromBns({ fullyQualifiedName, network });
        const responseCV = await (0, callersHelper_1.bnsV2ReadOnlyCall)({
            functionName: "get-renewal-height",
            senderAddress: randomAddress,
            functionArgs: [(0, transactions_1.uintCV)(nameId)],
            network,
        });
        if (responseCV.type === transactions_1.ClarityType.ResponseOk) {
            if (responseCV.value.type === transactions_1.ClarityType.UInt) {
                return responseCV.value.value;
            }
            throw new Error("Response did not contain a UInt");
        }
        if (responseCV.type === transactions_1.ClarityType.ResponseErr) {
            throw new Error((0, transactions_1.cvToString)(responseCV.value));
        }
        throw new Error(`Unexpected Clarity Value type: ${(0, transactions_1.getCVTypeString)(responseCV)}`);
    }
}
async function canResolveName({ fullyQualifiedName, network, }) {
    try {
        const response = await callApi(`/names/${fullyQualifiedName}/can-resolve`, network);
        return {
            renewal: BigInt(response.renewal_height),
            owner: response.owner,
        };
    }
    catch (error) {
        debug_1.debug.error("API call failed, falling back to contract call:", error);
        const { subdomain, namespace, name } = (0, utils_1.decodeFQN)(fullyQualifiedName);
        if (subdomain) {
            throw new Error("Cannot check resolution for a subdomain");
        }
        const randomAddress = (0, utils_1.generateRandomAddress)();
        const responseCV = await (0, callersHelper_1.bnsV2ReadOnlyCall)({
            functionName: "can-resolve-name",
            senderAddress: randomAddress,
            functionArgs: [(0, transactions_1.bufferCVFromString)(namespace), (0, transactions_1.bufferCVFromString)(name)],
            network,
        });
        if (responseCV.type === transactions_1.ClarityType.ResponseOk &&
            responseCV.value.type === transactions_1.ClarityType.Tuple) {
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
            throw new Error("Unexpected data types in response tuple");
        }
        throw new Error("Invalid response from contract");
    }
}
async function getOwner({ fullyQualifiedName, network, }) {
    try {
        const response = await callApi(`/names/${fullyQualifiedName}/owner`, network);
        return response.owner;
    }
    catch (error) {
        debug_1.debug.error("API call failed, falling back to contract call:", error);
        const { subdomain, namespace, name } = (0, utils_1.decodeFQN)(fullyQualifiedName);
        if (subdomain) {
            throw new Error("Cannot check resolution for a subdomain");
        }
        const randomAddress = (0, utils_1.generateRandomAddress)();
        const responseCV = await (0, callersHelper_1.bnsV2ReadOnlyCall)({
            functionName: "get-owner-name",
            senderAddress: randomAddress,
            functionArgs: [(0, transactions_1.bufferCVFromString)(name), (0, transactions_1.bufferCVFromString)(namespace)],
            network,
        });
        if (responseCV.type === transactions_1.ClarityType.ResponseOk) {
            if (responseCV.value.type === transactions_1.ClarityType.OptionalSome) {
                if (responseCV.value.value.type === transactions_1.ClarityType.PrincipalStandard ||
                    responseCV.value.value.type === transactions_1.ClarityType.PrincipalContract) {
                    return (0, transactions_1.cvToString)(responseCV.value.value);
                }
                throw new Error("Owner is not a principal");
            }
            if (responseCV.value.type === transactions_1.ClarityType.OptionalNone) {
                return null;
            }
        }
        throw new Error("Invalid response from contract");
    }
}
async function getOwnerById({ id, network, }) {
    try {
        const response = await callApi(`/tokens/${id}/owner`, network);
        return response.owner;
    }
    catch (error) {
        debug_1.debug.error("API call failed, falling back to contract call:", error);
        const randomAddress = (0, utils_1.generateRandomAddress)();
        const responseCV = await (0, callersHelper_1.bnsV2ReadOnlyCall)({
            functionName: "get-owner",
            senderAddress: randomAddress,
            functionArgs: [(0, transactions_1.uintCV)(id)],
            network,
        });
        if (responseCV.type === transactions_1.ClarityType.ResponseOk) {
            if (responseCV.value.type === transactions_1.ClarityType.OptionalSome) {
                if (responseCV.value.value.type === transactions_1.ClarityType.PrincipalStandard ||
                    responseCV.value.value.type === transactions_1.ClarityType.PrincipalContract) {
                    return (0, transactions_1.cvToString)(responseCV.value.value);
                }
                throw new Error("Owner is not a principal");
            }
            if (responseCV.value.type === transactions_1.ClarityType.OptionalNone) {
                return null;
            }
        }
        throw new Error("Invalid response from contract");
    }
}
async function getIdFromBns({ fullyQualifiedName, network, }) {
    try {
        const response = await callApi(`/names/${fullyQualifiedName}/id`, network);
        return BigInt(response.id);
    }
    catch (error) {
        debug_1.debug.error("API call failed, falling back to contract call:", error);
        const { subdomain, namespace, name } = (0, utils_1.decodeFQN)(fullyQualifiedName);
        if (subdomain) {
            throw new Error("Cannot get info for a subdomain");
        }
        const randomAddress = (0, utils_1.generateRandomAddress)();
        const responseCV = await (0, callersHelper_1.bnsV2ReadOnlyCall)({
            functionName: "get-id-from-bns",
            senderAddress: randomAddress,
            functionArgs: [(0, transactions_1.bufferCVFromString)(name), (0, transactions_1.bufferCVFromString)(namespace)],
            network,
        });
        if (responseCV.type === transactions_1.ClarityType.OptionalSome) {
            if (responseCV.value.type === transactions_1.ClarityType.UInt) {
                return responseCV.value.value;
            }
            throw new Error("Response did not contain a UInt");
        }
        if (responseCV.type === transactions_1.ClarityType.OptionalNone) {
            throw new Error("Name not found");
        }
        throw new Error(`Unexpected Clarity Value type: ${(0, transactions_1.getCVTypeString)(responseCV)}`);
    }
}
async function getBnsFromId({ id, network, }) {
    try {
        const response = await callApi(`/tokens/${id}/name`, network);
        return {
            name: response.name,
            namespace: response.namespace,
        };
    }
    catch (error) {
        debug_1.debug.error("API call failed, falling back to contract call:", error);
        const randomAddress = (0, utils_1.generateRandomAddress)();
        const responseCV = await (0, callersHelper_1.bnsV2ReadOnlyCall)({
            functionName: "get-bns-from-id",
            senderAddress: randomAddress,
            functionArgs: [(0, transactions_1.uintCV)(id)],
            network,
        });
        if (responseCV.type === transactions_1.ClarityType.OptionalSome) {
            if (responseCV.value.type === transactions_1.ClarityType.Tuple) {
                const nameCV = responseCV.value.data["name"];
                const namespaceCV = responseCV.value.data["namespace"];
                return {
                    name: (0, transactions_1.bufferCV)(nameCV.buffer).buffer.toString(),
                    namespace: (0, transactions_1.bufferCV)(namespaceCV.buffer).buffer.toString(),
                };
            }
            throw new Error("Response did not contain a Tuple");
        }
        if (responseCV.type === transactions_1.ClarityType.OptionalNone) {
            return null;
        }
        throw new Error(`Unexpected Clarity Value type: ${(0, transactions_1.getCVTypeString)(responseCV)}`);
    }
}
async function canRegisterName({ fullyQualifiedName, network, }) {
    const { subdomain, namespace, name } = (0, utils_1.decodeFQN)(fullyQualifiedName);
    if (subdomain) {
        throw new Error("Cannot register a subdomain using registerName");
    }
    try {
        const response = await callApi(`/names/${namespace}/${name}/can-register`, network);
        return response.can_register;
    }
    catch (error) {
        debug_1.debug.error("API call failed, falling back to contract call:", error);
        return fallbackContractCall(name, namespace, network);
    }
}
async function fallbackContractCall(name, namespace, network) {
    const randomAddress = (0, utils_1.generateRandomAddress)();
    debug_1.debug.log("Falling back to contract call:", { name, namespace, network });
    return (0, callersHelper_1.bnsV2ReadOnlyCall)({
        functionName: "get-bns-info",
        senderAddress: randomAddress,
        functionArgs: [(0, transactions_1.bufferCVFromString)(name), (0, transactions_1.bufferCVFromString)(namespace)],
        network,
    }).then((responseCV) => {
        if (responseCV.type === transactions_1.ClarityType.OptionalSome) {
            debug_1.debug.log("Name exists in contract");
            return false;
        }
        else if (responseCV.type === transactions_1.ClarityType.OptionalNone) {
            debug_1.debug.log("Name available in contract");
            return true;
        }
        else {
            throw new Error(`Unexpected response type: ${responseCV.type}`);
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
                    nonAlphaDiscount: BigInt(namespaceData.price_function_nonalpha_discount),
                    noVowelDiscount: BigInt(namespaceData.price_function_no_vowel_discount),
                },
            },
        };
    }
    catch (error) {
        debug_1.debug.error("API call failed, falling back to contract call:", error);
        const randomAddress = (0, utils_1.generateRandomAddress)();
        const responseCV = await (0, callersHelper_1.bnsV2ReadOnlyCall)({
            functionName: "get-namespace-properties",
            senderAddress: randomAddress,
            functionArgs: [(0, transactions_1.bufferCVFromString)(namespace)],
            network,
        });
        if (responseCV.type === transactions_1.ClarityType.ResponseOk &&
            responseCV.value.type === transactions_1.ClarityType.Tuple) {
            const namespaceCV = responseCV.value.data["namespace"];
            const propertiesCV = responseCV.value.data["properties"];
            const properties = propertiesCV.data;
            return {
                namespace: (0, transactions_1.bufferCV)(namespaceCV.buffer).buffer.toString(),
                properties: {
                    "namespace-manager": properties["namespace-manager"].type === transactions_1.ClarityType.OptionalNone
                        ? null
                        : (0, transactions_1.cvToString)(properties["namespace-manager"].value),
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
        throw new Error("Invalid response from contract");
    }
}
async function getNameInfo({ fullyQualifiedName, network, }) {
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
    }
    catch (error) {
        debug_1.debug.error("API call failed, falling back to contract call:", error);
        const { subdomain, namespace, name } = (0, utils_1.decodeFQN)(fullyQualifiedName);
        if (subdomain) {
            throw new Error("Cannot get info for a subdomain");
        }
        const randomAddress = (0, utils_1.generateRandomAddress)();
        const responseCV = await (0, callersHelper_1.bnsV2ReadOnlyCall)({
            functionName: "get-bns-info",
            senderAddress: randomAddress,
            functionArgs: [(0, transactions_1.bufferCVFromString)(name), (0, transactions_1.bufferCVFromString)(namespace)],
            network,
        });
        if (responseCV.type === transactions_1.ClarityType.OptionalSome &&
            responseCV.value.type === transactions_1.ClarityType.Tuple) {
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
        throw new Error("Invalid response from contract");
    }
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
async function fetchUserOwnedNames({ senderAddress, network, }) {
    try {
        let allNames = [];
        let offset = 0;
        const limit = 50;
        while (true) {
            const response = await callApi(`/names/address/${senderAddress}/valid?limit=${limit}&offset=${offset}`, network);
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
    }
    catch (error) {
        debug_1.debug.error("API call failed, falling back to contract call:", error);
        const contractAddress = (0, config_1.getBnsContractAddress)(network);
        const assetIdentifier = `${contractAddress}.${config_1.BnsContractName}::BNS-V2`;
        const apiUrl = network === "mainnet"
            ? "https://api.hiro.so"
            : "https://api.testnet.hiro.so";
        let allAssets = [];
        let offset = 0;
        const limit = 50;
        while (true) {
            const response = await axios_1.default.get(`${apiUrl}/extended/v1/tokens/nft/holdings?principal=${senderAddress}&asset_identifiers=${assetIdentifier}&limit=${limit}&offset=${offset}`);
            const assets = response.data.results.map((asset) => parseInt(asset.value.repr.slice(1)));
            allAssets = allAssets.concat(assets);
            if (response.data.total <= offset + limit) {
                break;
            }
            offset += limit;
        }
        const bnsPromises = allAssets.map((id) => getBnsFromId({ id: BigInt(id), network }));
        const bnsResults = await Promise.all(bnsPromises);
        return bnsResults
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
    }
}
async function resolveNameZonefile({ fullyQualifiedName, network, }) {
    try {
        const response = await callApi(`/resolve-name/${fullyQualifiedName}`, network);
        return response.zonefile || null;
    }
    catch (error) {
        if (axios_1.default.isAxiosError(error) && error.response?.status === 404) {
            return null;
        }
        debug_1.debug.error("API call failed, falling back to contract call:", error);
        const { subdomain, namespace, name } = (0, utils_1.decodeFQN)(fullyQualifiedName);
        if (subdomain) {
            throw new Error("Cannot resolve a subdomain");
        }
        const randomAddress = (0, utils_1.generateRandomAddress)();
        const responseCV = await (0, callersHelper_1.zonefileReadOnlyCall)({
            functionName: "resolve-name",
            senderAddress: randomAddress,
            functionArgs: [(0, transactions_1.bufferCVFromString)(name), (0, transactions_1.bufferCVFromString)(namespace)],
            network,
        });
        if (responseCV.type === transactions_1.ClarityType.ResponseOk) {
            if (responseCV.value.type === transactions_1.ClarityType.OptionalSome &&
                responseCV.value.value.type === transactions_1.ClarityType.Buffer) {
                const zonefileString = Buffer.from(responseCV.value.value.buffer).toString("utf8");
                return (0, utils_1.parseZonefile)(zonefileString);
            }
            if (responseCV.value.type === transactions_1.ClarityType.OptionalNone) {
                return null;
            }
        }
        throw new Error("Invalid response from contract");
    }
}
