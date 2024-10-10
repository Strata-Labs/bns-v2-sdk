"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZonefileContractName = exports.BnsContractAddress = exports.BnsContractName = void 0;
exports.getBnsContractAddress = getBnsContractAddress;
exports.getZonefileContractAddress = getZonefileContractAddress;
exports.BnsContractName = "BNS-V2";
var BnsContractAddress;
(function (BnsContractAddress) {
    BnsContractAddress["Mainnet"] = "SP2QEZ06AGJ3RKJPBV14SY1V5BBFNAW33D96YPGZF";
    BnsContractAddress["Testnet"] = "ST2QEZ06AGJ3RKJPBV14SY1V5BBFNAW33D9SZJQ0M";
})(BnsContractAddress || (exports.BnsContractAddress = BnsContractAddress = {}));
function getBnsContractAddress(network) {
    return network === "mainnet"
        ? BnsContractAddress.Mainnet
        : BnsContractAddress.Testnet;
}
exports.ZonefileContractName = "zonefile-resolver";
function getZonefileContractAddress(network) {
    return network === "mainnet"
        ? "SP2QEZ06AGJ3RKJPBV14SY1V5BBFNAW33D96YPGZF" /* ZonefileContractAddress.mainnet */
        : "ST2QEZ06AGJ3RKJPBV14SY1V5BBFNAW33D9SZJQ0M" /* ZonefileContractAddress.testnet */;
}
