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
exports.createFormattedZonefileData = createFormattedZonefileData;
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
function isValidImageUrl(url) {
    try {
        const validExtensions = [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"];
        const urlObj = new URL(url);
        const pathname = urlObj.pathname.toLowerCase();
        return validExtensions.some((ext) => pathname.endsWith(ext));
    }
    catch {
        return false;
    }
}
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
}
function validateSocialEntry(social) {
    return (typeof social.platform === "string" &&
        typeof social.username === "string" &&
        social.platform.trim() !== "" &&
        social.username.trim() !== "");
}
function validateAddressEntry(address) {
    return (typeof address.network === "string" &&
        typeof address.address === "string" &&
        typeof address.type === "string" &&
        address.network.trim() !== "" &&
        address.address.trim() !== "" &&
        address.type.trim() !== "");
}
function validateMetaEntry(meta) {
    return (typeof meta.name === "string" &&
        typeof meta.value === "string" &&
        meta.name.trim() !== "");
}
function validateSubdomainEntry(subdomain) {
    // Owner is required
    if (!subdomain.owner ||
        typeof subdomain.owner !== "string" ||
        subdomain.owner.trim() === "") {
        return false;
    }
    // Validate optional fields
    if (subdomain.pfp &&
        (!isValidUrl(subdomain.pfp) || !isValidImageUrl(subdomain.pfp))) {
        return false;
    }
    if (subdomain.website && !isValidUrl(subdomain.website)) {
        return false;
    }
    if (subdomain.social && !Array.isArray(subdomain.social)) {
        return false;
    }
    if (subdomain.social) {
        for (const social of subdomain.social) {
            if (!validateSocialEntry(social)) {
                return false;
            }
        }
    }
    if (subdomain.addresses && !Array.isArray(subdomain.addresses)) {
        return false;
    }
    if (subdomain.addresses) {
        for (const address of subdomain.addresses) {
            if (!validateAddressEntry(address)) {
                return false;
            }
        }
    }
    return true;
}
function createFormattedZonefileData(params) {
    if (!params.owner ||
        typeof params.owner !== "string" ||
        params.owner.trim() === "") {
        throw new Error("Owner field is required and must be a non-empty string");
    }
    if (params.pfp && (!isValidUrl(params.pfp) || !isValidImageUrl(params.pfp))) {
        throw new Error("pfp must be a valid image URL with supported format (.png, .jpg, .jpeg, .gif, .svg, .webp)");
    }
    if (params.website && !isValidUrl(params.website)) {
        throw new Error("website must be a valid URL");
    }
    if (params.social) {
        if (!Array.isArray(params.social)) {
            throw new Error("social must be an array");
        }
        for (const social of params.social) {
            if (!validateSocialEntry(social)) {
                throw new Error("Invalid social entry: platform and username are required");
            }
        }
    }
    if (params.addresses) {
        if (!Array.isArray(params.addresses)) {
            throw new Error("addresses must be an array");
        }
        for (const address of params.addresses) {
            if (!validateAddressEntry(address)) {
                throw new Error("Invalid address entry: network, address, and type are required");
            }
        }
    }
    if (params.meta) {
        if (!Array.isArray(params.meta)) {
            throw new Error("meta must be an array");
        }
        for (const meta of params.meta) {
            if (!validateMetaEntry(meta)) {
                throw new Error("Invalid meta entry: name and value are required");
            }
        }
    }
    if (params.subdomains) {
        if (!Array.isArray(params.subdomains)) {
            throw new Error("subdomains must be an array");
        }
        for (const subdomainMap of params.subdomains) {
            if (typeof subdomainMap !== "object" || subdomainMap === null) {
                throw new Error("Each subdomain entry must be an object");
            }
            for (const [subdomainName, subdomainData] of Object.entries(subdomainMap)) {
                if (!validateSubdomainEntry(subdomainData)) {
                    throw new Error(`Invalid subdomain entry for ${subdomainName}`);
                }
            }
        }
    }
    if (params.externalSubdomainsFile) {
        const fileUrl = params.externalSubdomainsFile;
        if (!isValidHttpsUrl(fileUrl) ||
            !hasJsonExtension(fileUrl) ||
            !isSafeDomain(fileUrl) ||
            !hasNoQueryOrFragment(fileUrl) ||
            !noUserInfo(fileUrl)) {
            throw new Error("Invalid externalSubdomainsFile URL");
        }
    }
    const formattedData = {
        owner: params.owner,
    };
    if (params.btc)
        formattedData.btc = params.btc;
    if (params.bio)
        formattedData.bio = params.bio;
    if (params.website)
        formattedData.website = params.website;
    if (params.pfp)
        formattedData.pfp = params.pfp;
    if (params.name)
        formattedData.name = params.name;
    if (params.location)
        formattedData.location = params.location;
    if (params.social && params.social.length > 0)
        formattedData.social = params.social;
    if (params.addresses && params.addresses.length > 0)
        formattedData.addresses = params.addresses;
    if (params.meta && params.meta.length > 0)
        formattedData.meta = params.meta;
    if (params.subdomains && params.subdomains.length > 0)
        formattedData.subdomains = params.subdomains;
    if (params.externalSubdomainsFile)
        formattedData.externalSubdomainsFile = params.externalSubdomainsFile;
    return formattedData;
}
