"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureNetwork = configureNetwork;
exports.getNetwork = getNetwork;
exports.getFallbackUrl = getFallbackUrl;
const network_1 = require("@stacks/network");
const debug_1 = require("./debug");
let testnetFallbackUrl;
function configureNetwork(config) {
    testnetFallbackUrl = config.testnetFallbackUrl;
    debug_1.debug.log("Network configuration updated - testnet fallback URL:", testnetFallbackUrl);
}
function getNetwork(networkType) {
    debug_1.debug.log("Getting network for type:", networkType);
    if (networkType === "mainnet") {
        const network = new network_1.StacksMainnet();
        debug_1.debug.log("Created mainnet network:", {
            apiUrl: network.coreApiUrl,
        });
        return network;
    }
    else {
        const network = new network_1.StacksTestnet();
        debug_1.debug.log("Created testnet network:", {
            apiUrl: network.coreApiUrl,
        });
        return network;
    }
}
function getFallbackUrl(networkType) {
    debug_1.debug.log("Getting fallback URL for network type:", networkType);
    if (networkType === "testnet" && testnetFallbackUrl) {
        debug_1.debug.log("Using testnet fallback URL:", testnetFallbackUrl);
        return testnetFallbackUrl;
    }
    debug_1.debug.log("No fallback URL available");
    return "";
}
