import { BaseZonefileData, PriceFunction, ZonefileData } from "./interfaces";
import { ClarityValue, UIntCV, ListCV } from "@stacks/transactions";
import {
  makeRandomPrivKey,
  getAddressFromPrivateKey,
} from "@stacks/transactions";
import { CallbackFunction } from "./config";
import { debug } from "./debug";

// Define constants for reuse
const DEFAULT_ZONEFILE_DATA: ZonefileData = {
  owner: "",
  general: "",
  twitter: "",
  url: "",
  nostr: "",
  lightning: "",
  btc: "",
  subdomains: {},
};

// Buffer optimization helpers
export function stringToBuffer(str: string): Buffer {
  return Buffer.from(str);
}

export function bufferToString(
  buffer: Buffer,
  encoding: BufferEncoding = "utf8"
): string {
  return buffer.toString(encoding);
}

function hasNoQueryOrFragment(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return !url.search && !url.hash;
  } catch {
    return false;
  }
}

function noUserInfo(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return !url.username && !url.password;
  } catch {
    return false;
  }
}

function isAllowedS3Domain(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    const s3DomainPattern =
      /^[a-z0-9.-]+\.s3([.-][a-z0-9-]+)*\.amazonaws\.com$/i;
    return s3DomainPattern.test(url.hostname);
  } catch {
    return false;
  }
}

function isValidHttpsUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function hasJsonExtension(urlString: string): boolean {
  try {
    const pathname = new URL(urlString).pathname.toLowerCase();
    return pathname.endsWith(".json");
  } catch {
    return false;
  }
}

function isSafeDomain(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    const forbiddenPatterns = [/^localhost$/, /^127\.0\.0\.1$/];
    return !forbiddenPatterns.some((pattern) => pattern.test(url.hostname));
  } catch {
    return false;
  }
}

export function decodeFQN(fqdn: string): {
  name: string;
  namespace: string;
  subdomain?: string;
} {
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

export function parsePriceFunction(data: {
  [key: string]: ClarityValue;
}): PriceFunction {
  const buckets = (data["buckets"] as ListCV<UIntCV>).value;
  return {
    base: (data["base"] as UIntCV).value,
    coefficient: (data["coeff"] as UIntCV).value,
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
    nonAlphaDiscount: (data["nonalpha-discount"] as UIntCV).value,
    noVowelDiscount: (data["no-vowel-discount"] as UIntCV).value,
  };
}

export function asciiToUtf8(asciiCodes: string): string {
  // Cache for frequently used ASCII codes
  const codeCache: Record<string, string> = {};

  return asciiCodes
    .split(",")
    .map((code) => {
      const trimmedCode = code.trim();
      // Check cache first
      if (!codeCache[trimmedCode]) {
        codeCache[trimmedCode] = String.fromCharCode(parseInt(trimmedCode));
      }
      return codeCache[trimmedCode];
    })
    .join("");
}

// Generate a random Stacks address for read-only calls
let cachedRandomAddress: string | null = null;

export function generateRandomAddress(): string {
  // Reuse the same random address for better performance
  if (cachedRandomAddress) {
    return cachedRandomAddress;
  }

  const randomPrivateKey = makeRandomPrivKey();
  const randomAddress = getAddressFromPrivateKey(randomPrivateKey);
  cachedRandomAddress = randomAddress;

  return randomAddress;
}

export function parseZonefile(zonefileString: string): ZonefileData {
  const endTimer = debug.startTimer("parseZonefile");

  try {
    // Only parse once
    const parsed = JSON.parse(zonefileString);

    // Destructure with defaults for efficiency
    const {
      owner = "",
      general = "",
      twitter = "",
      url = "",
      nostr = "",
      lightning = "",
      btc = "",
    } = parsed;

    const baseData: BaseZonefileData = {
      owner,
      general,
      twitter,
      url,
      nostr,
      lightning,
      btc,
    };

    const result = parsed.externalSubdomainFile
      ? ({
          ...baseData,
          externalSubdomainFile: parsed.externalSubdomainFile,
        } as ZonefileData)
      : ({ ...baseData, subdomains: parsed.subdomains || {} } as ZonefileData);

    endTimer();
    return result;
  } catch (error) {
    endTimer();
    debug.error("Error parsing zonefile:", error);
    return { ...DEFAULT_ZONEFILE_DATA };
  }
}

export function createZonefileData(params: ZonefileData): ZonefileData {
  const endTimer = debug.startTimer("createZonefileData");

  const baseData: BaseZonefileData = {
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

    // Validate URL in a single pass
    const isValidUrl =
      isValidHttpsUrl(fileUrl) &&
      hasJsonExtension(fileUrl) &&
      isSafeDomain(fileUrl) &&
      isAllowedS3Domain(fileUrl) &&
      hasNoQueryOrFragment(fileUrl) &&
      noUserInfo(fileUrl);

    if (!isValidUrl) {
      endTimer();
      throw new Error("Invalid externalSubdomainFile URL");
    }

    const result = {
      ...baseData,
      externalSubdomainFile: fileUrl,
    } as ZonefileData;

    endTimer();
    return result;
  }

  const result = {
    ...baseData,
    subdomains: "subdomains" in params ? params.subdomains : {},
  } as ZonefileData;

  endTimer();
  return result;
}

export function stringifyZonefile(zonefileData: ZonefileData): string {
  return JSON.stringify(zonefileData);
}

export function addCallbacks<T>(
  options: T,
  onFinish?: CallbackFunction,
  onCancel?: CallbackFunction
): T & { onFinish?: CallbackFunction; onCancel?: CallbackFunction } {
  return { ...options, onFinish, onCancel };
}

// Memoize simple string operations
type MemoizeFunc<T extends (...args: any[]) => any> = (
  ...args: Parameters<T>
) => ReturnType<T>;

export function memoize<T extends (...args: any[]) => any>(
  fn: T
): MemoizeFunc<T> {
  const cache = new Map<string, ReturnType<T>>();

  return (...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}
