"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultPriceFunction = void 0;
exports.decodeFQN = decodeFQN;
exports.parsePriceFunction = parsePriceFunction;
exports.asciiToUtf8 = asciiToUtf8;
exports.generateRandomAddress = generateRandomAddress;
exports.parseZonefile = parseZonefile;
exports.stringifyZonefile = stringifyZonefile;
exports.createZonefileData = createZonefileData;
exports.getNetwork = getNetwork;
exports.getFallbackUrl = getFallbackUrl;
exports.addCallbacks = addCallbacks;
const transactions_1 = require("@stacks/transactions");
const network_1 = require("@stacks/network");
function decodeFQN(fqdn) {
    const nameParts = fqdn.split(".");
    if (nameParts.length > 2) {
        return {
            subdomain: nameParts[0],
            name: nameParts[1],
            namespace: nameParts[2],
        };
    }
    return {
        name: nameParts[0],
        namespace: nameParts[1],
    };
}
function parsePriceFunction(data) {
    const buckets = data["buckets"].list;
    return {
        base: data["base"].value,
        coefficient: data["coeff"].value,
        b1: buckets[0].value,
        b2: buckets[1].value,
        b3: buckets[2].value,
        b4: buckets[3].value,
        b5: buckets[4].value,
        b6: buckets[5].value,
        b7: buckets[6].value,
        b8: buckets[7].value,
        b9: buckets[8].value,
        b10: buckets[9].value,
        b11: buckets[10].value,
        b12: buckets[11].value,
        b13: buckets[12].value,
        b14: buckets[13].value,
        b15: buckets[14].value,
        b16: buckets[15].value,
        nonAlphaDiscount: data["nonalpha-discount"].value,
        noVowelDiscount: data["no-vowel-discount"].value,
    };
}
exports.defaultPriceFunction = {
    base: 1,
    coefficient: 1,
    b1: 1,
    b2: 1,
    b3: 1,
    b4: 1,
    b5: 1,
    b6: 1,
    b7: 1,
    b8: 1,
    b9: 1,
    b10: 1,
    b11: 1,
    b12: 1,
    b13: 1,
    b14: 1,
    b15: 1,
    b16: 1,
    nonAlphaDiscount: 1,
    noVowelDiscount: 1,
};
function asciiToUtf8(asciiCodes) {
    return asciiCodes
        .split(",")
        .map((code) => String.fromCharCode(parseInt(code.trim())))
        .join("");
}
function generateRandomAddress() {
    const randomPrivateKey = (0, transactions_1.makeRandomPrivKey)();
    const privateKeyString = (0, transactions_1.privateKeyToString)(randomPrivateKey);
    const randomAddress = (0, transactions_1.getAddressFromPrivateKey)(privateKeyString);
    return randomAddress;
}
function parseZonefile(zonefileString) {
    try {
        const parsed = JSON.parse(zonefileString);
        return {
            owner: parsed.owner || "",
            general: parsed.general || "",
            twitter: parsed.twitter || "",
            url: parsed.url || "",
            nostr: parsed.nostr || "",
            lightning: parsed.lightning || "",
            btc: parsed.btc || "",
            subdomains: Array.isArray(parsed.subdomains) ? parsed.subdomains : [],
        };
    }
    catch (error) {
        console.error("Error parsing zonefile:", error);
        return {
            owner: "",
            general: "",
            twitter: "",
            url: "",
            nostr: "",
            lightning: "",
            btc: "",
            subdomains: [],
        };
    }
}
function stringifyZonefile(zonefileData) {
    return JSON.stringify(zonefileData);
}
function createZonefileData(params) {
    return {
        owner: params.owner,
        general: params.general || "",
        twitter: params.twitter || "",
        url: params.url || "",
        nostr: params.nostr || "",
        lightning: params.lightning || "",
        btc: params.btc || "",
        subdomains: params.subdomains || [],
    };
}
function getNetwork(networkType) {
    return networkType === "mainnet" ? new network_1.StacksMainnet() : new network_1.StacksTestnet();
}
function getFallbackUrl() {
    const fallbackUrl = process.env.NEXT_PUBLIC_BNS_FALLBACK_URL;
    if (!fallbackUrl) {
        return "";
    }
    return fallbackUrl;
}
function addCallbacks(options, onFinish, onCancel) {
    return { ...options, onFinish, onCancel };
}
