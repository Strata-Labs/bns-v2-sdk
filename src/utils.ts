import { PriceFunction, ZonefileData } from "./interfaces";
import { ClarityValue, UIntCV, ListCV } from "@stacks/transactions";
import {
  makeRandomPrivKey,
  getAddressFromPrivateKey,
  privateKeyToString,
} from "@stacks/transactions";
import { CallbackFunction } from "./config";

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
  const buckets = (data["buckets"] as ListCV<UIntCV>).list;
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
  return asciiCodes
    .split(",")
    .map((code) => String.fromCharCode(parseInt(code.trim())))
    .join("");
}

export function generateRandomAddress() {
  const randomPrivateKey = makeRandomPrivKey();
  const privateKeyString = privateKeyToString(randomPrivateKey);
  const randomAddress = getAddressFromPrivateKey(privateKeyString);

  return randomAddress;
}

export function parseZonefile(zonefileString: string): ZonefileData {
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
  } catch (error) {
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

export function stringifyZonefile(zonefileData: ZonefileData): string {
  return JSON.stringify(zonefileData);
}

export function createZonefileData(params: ZonefileData): ZonefileData {
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

export function addCallbacks<T>(
  options: T,
  onFinish?: CallbackFunction,
  onCancel?: CallbackFunction
): T & { onFinish?: CallbackFunction; onCancel?: CallbackFunction } {
  return { ...options, onFinish, onCancel };
}
