"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bnsV2ReadOnlyCall = bnsV2ReadOnlyCall;
exports.zonefileReadOnlyCall = zonefileReadOnlyCall;
exports.bnsV2ContractCall = bnsV2ContractCall;
exports.zonefileContractCall = zonefileContractCall;
const transactions_1 = require("@stacks/transactions");
const connect_1 = require("@stacks/connect");
const config_1 = require("./config");
const utils_1 = require("./utils");
const network_1 = require("@stacks/network");
async function executeReadOnlyCall(options, contractAddress, contractName, network) {
    const fallbackUrl = (0, utils_1.getFallbackUrl)();
    async function attemptCall(url) {
        const currentNetwork = new network_1.StacksMainnet({ url });
        try {
            return await (0, transactions_1.callReadOnlyFunction)({
                contractAddress,
                contractName,
                functionName: options.functionName,
                functionArgs: options.functionArgs,
                senderAddress: options.senderAddress,
                network: currentNetwork,
            });
        }
        catch (error) {
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
        else {
            throw error;
        }
    }
}
async function bnsV2ReadOnlyCall(options) {
    const network = (0, utils_1.getNetwork)(options.network);
    const contractAddress = (0, config_1.getBnsContractAddress)(options.network);
    if (options.network === "mainnet" && network instanceof network_1.StacksMainnet) {
        return executeReadOnlyCall(options, contractAddress, config_1.BnsContractName, network);
    }
    return (0, transactions_1.callReadOnlyFunction)({
        contractAddress,
        contractName: config_1.BnsContractName,
        functionName: options.functionName,
        functionArgs: options.functionArgs,
        senderAddress: options.senderAddress,
        network,
    });
}
async function zonefileReadOnlyCall(options) {
    const network = (0, utils_1.getNetwork)(options.network);
    const contractAddress = (0, config_1.getZonefileContractAddress)(options.network);
    if (options.network === "mainnet" && network instanceof network_1.StacksMainnet) {
        return executeReadOnlyCall(options, contractAddress, config_1.ZonefileContractName, network);
    }
    return (0, transactions_1.callReadOnlyFunction)({
        contractAddress,
        contractName: config_1.ZonefileContractName,
        functionName: options.functionName,
        functionArgs: options.functionArgs,
        senderAddress: options.senderAddress,
        network,
    });
}
async function bnsV2ContractCall(options) {
    const network = (0, utils_1.getNetwork)(options.network);
    const txOptions = {
        contractAddress: (0, config_1.getBnsContractAddress)(options.network),
        contractName: config_1.BnsContractName,
        functionName: options.functionName,
        functionArgs: options.functionArgs,
        address: options.address,
        validateWithAbi: true,
        network: network,
        anchorMode: transactions_1.AnchorMode.Any,
        postConditions: options.postConditions,
        onFinish: options.onFinish,
        onCancel: options.onCancel,
    };
    return (0, connect_1.openContractCall)(txOptions);
}
async function zonefileContractCall(options) {
    const network = (0, utils_1.getNetwork)(options.network);
    const txOptions = {
        contractAddress: (0, config_1.getZonefileContractAddress)(options.network),
        contractName: config_1.ZonefileContractName,
        functionName: options.functionName,
        functionArgs: options.functionArgs,
        address: options.address,
        validateWithAbi: true,
        network,
        anchorMode: transactions_1.AnchorMode.Any,
        postConditions: options.postConditions,
        onFinish: options.onFinish,
        onCancel: options.onCancel,
    };
    return (0, connect_1.openContractCall)(txOptions);
}
