import { PriceFunction, ZonefileData } from "./interfaces";
import { ClarityValue } from "@stacks/transactions";
import { CallbackFunction } from "./config";
export declare function decodeFQN(fqdn: string): {
    name: string;
    namespace: string;
    subdomain?: string;
};
export declare function parsePriceFunction(data: {
    [key: string]: ClarityValue;
}): PriceFunction;
export declare function asciiToUtf8(asciiCodes: string): string;
export declare function generateRandomAddress(): string;
export declare function parseZonefile(zonefileString: string): ZonefileData;
export declare function createZonefileData(params: ZonefileData): ZonefileData;
export declare function stringifyZonefile(zonefileData: ZonefileData): string;
export declare function addCallbacks<T>(options: T, onFinish?: CallbackFunction, onCancel?: CallbackFunction): T & {
    onFinish?: CallbackFunction;
    onCancel?: CallbackFunction;
};
