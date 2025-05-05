"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeFQN = decodeFQN;
exports.parsePriceFunction = parsePriceFunction;
exports.asciiToUtf8 = asciiToUtf8;
exports.generateRandomAddress = generateRandomAddress;
exports.parseZonefile = parseZonefile;
exports.createZonefileData = createZonefileData;
exports.stringifyZonefile = stringifyZonefile;
exports.addCallbacks = addCallbacks;
const transactions_1 = require("@stacks/transactions");
function hasNoQueryOrFragment(urlString) {
    const url = new URL(urlString);
    return !url.search && !url.hash;
}
function noUserInfo(urlString) {
    const url = new URL(urlString);
    return !url.username && !url.password;
}
function isAllowedS3Domain(urlString) {
    try {
        const url = new URL(urlString);
        const s3DomainPattern = /^[a-z0-9.-]+\.s3([.-][a-z0-9-]+)*\.amazonaws\.com$/i;
        return s3DomainPattern.test(url.hostname);
    }
    catch {
        return false;
    }
}
function isValidHttpsUrl(urlString) {
    try {
        const url = new URL(urlString);
        return url.protocol === "https:";
    }
    catch {
        return false;
    }
}
function hasJsonExtension(urlString) {
    const pathname = new URL(urlString).pathname.toLowerCase();
    return pathname.endsWith(".json");
}
function isSafeDomain(urlString) {
    const url = new URL(urlString);
    const forbiddenPatterns = [/^localhost$/, /^127\.0\.0\.1$/];
    return !forbiddenPatterns.some((pattern) => pattern.test(url.hostname));
}
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
    const buckets = data["buckets"].value;
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
function asciiToUtf8(asciiCodes) {
    return asciiCodes
        .split(",")
        .map((code) => String.fromCharCode(parseInt(code.trim())))
        .join("");
}
function generateRandomAddress() {
    const randomPrivateKey = (0, transactions_1.makeRandomPrivKey)();
    const privateKeyString = randomPrivateKey;
    const randomAddress = (0, transactions_1.getAddressFromPrivateKey)(privateKeyString);
    return randomAddress;
}
function parseZonefile(zonefileString) {
    try {
        const parsed = JSON.parse(zonefileString);
        const baseData = {
            owner: parsed.owner || "",
            general: parsed.general || "",
            twitter: parsed.twitter || "",
            url: parsed.url || "",
            nostr: parsed.nostr || "",
            lightning: parsed.lightning || "",
            btc: parsed.btc || "",
        };
        if (parsed.externalSubdomainFile) {
            return {
                ...baseData,
                externalSubdomainFile: parsed.externalSubdomainFile,
            };
        }
        return {
            ...baseData,
            subdomains: parsed.subdomains || {},
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
            subdomains: {},
        };
    }
}
function createZonefileData(params) {
    const baseData = {
        owner: params.owner,
        general: params.general || "",
        twitter: params.twitter || "",
        url: params.url || "",
        nostr: params.nostr || "",
        lightning: params.lightning || "",
        btc: params.btc || "",
    };
    if ("externalSubdomainFile" in params && params.externalSubdomainFile) {
        const fileUrl = params.externalSubdomainFile;
        if (!isValidHttpsUrl(fileUrl) ||
            !hasJsonExtension(fileUrl) ||
            !isSafeDomain(fileUrl) ||
            !isAllowedS3Domain(fileUrl) ||
            !hasNoQueryOrFragment(fileUrl) ||
            !noUserInfo(fileUrl)) {
            throw new Error("Invalid externalSubdomainFile URL");
        }
        return {
            ...baseData,
            externalSubdomainFile: fileUrl,
        };
    }
    return {
        ...baseData,
        subdomains: "subdomains" in params ? params.subdomains : {},
    };
}
function stringifyZonefile(zonefileData) {
    return JSON.stringify(zonefileData);
}
function addCallbacks(options, onFinish, onCancel) {
    return { ...options, onFinish, onCancel };
}
