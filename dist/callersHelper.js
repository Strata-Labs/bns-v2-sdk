"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bnsV2ReadOnlyCall = bnsV2ReadOnlyCall;
exports.zonefileReadOnlyCall = zonefileReadOnlyCall;
const transactions_1 = require("@stacks/transactions");
const config_1 = require("./config");
const network_1 = require("@stacks/network");
const network_2 = require("./network");
const debug_1 = require("./debug");
async function executeReadOnlyCall(options, contractAddress, contractName, network, isZonefile = false) {
    const networkType = network instanceof network_1.StacksMainnet ? "mainnet" : "testnet";
    const fallbackUrl = (0, network_2.getFallbackUrl)(networkType);
    debug_1.debug.log("executeReadOnlyCall initiated:", {
        networkType,
        contractAddress,
        contractName,
        functionName: options.functionName,
        coreApiUrl: network.coreApiUrl,
        fallbackUrl,
        isZonefile,
    });
    async function attemptCall(url) {
        const currentNetwork = networkType === "mainnet"
            ? new network_1.StacksMainnet({ url })
            : new network_1.StacksTestnet({ url });
        try {
            const response = await (0, transactions_1.callReadOnlyFunction)({
                contractAddress,
                contractName,
                functionName: options.functionName,
                functionArgs: options.functionArgs,
                senderAddress: options.senderAddress,
                network: currentNetwork,
            });
            if (response.error) {
                throw new Error(response.error);
            }
            return response;
        }
        catch (error) {
            debug_1.debug.error("Call failed:", { error: error.message, url, networkType });
            throw error;
        }
    }
    try {
        return await attemptCall(network.coreApiUrl);
    }
    catch (error) {
        if (fallbackUrl && fallbackUrl !== network.coreApiUrl) {
            return await attemptCall(fallbackUrl);
        }
        throw error;
    }
}
async function bnsV2ReadOnlyCall(options) {
    const network = (0, network_2.getNetwork)(options.network);
    const contractAddress = (0, config_1.getBnsContractAddress)(options.network);
    return executeReadOnlyCall(options, contractAddress, config_1.BnsContractName, network, false);
}
async function zonefileReadOnlyCall(options) {
    const network = (0, network_2.getNetwork)(options.network);
    const contractAddress = (0, config_1.getZonefileContractAddress)(options.network);
    return executeReadOnlyCall(options, contractAddress, config_1.ZonefileContractName, network, true);
}
