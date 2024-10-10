"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildUpdateZonefileTx = exports.buildRenewNameTx = exports.buildClaimPreorderTx = exports.buildPreviousRegisterNameTx = exports.buildRegisterNameTx = exports.buildPreorderNameTx = exports.buildNameClaimFastTx = exports.buildNamespaceFreezePriceTx = exports.buildNamespaceUpdatePriceTx = exports.buildImportNameTx = exports.buildTurnOffManagerTransfersTx = exports.buildLaunchNamespaceTx = exports.buildRevealNamespaceTx = exports.buildPreorderNamespaceTx = exports.buildFreezeManagerTx = exports.buildSetPrimaryNameTx = exports.buildBuyInUstxTx = exports.buildUnlistInUstxTx = exports.buildListInUstxTx = exports.buildTransferNameTx = exports.resolveNameZonefile = exports.fetchUserOwnedNames = exports.resolveName = exports.getPrimaryName = exports.getBnsFromId = exports.getNameInfo = exports.getNamespaceProperties = exports.canNamespaceBeRegistered = exports.getNamePrice = exports.getNamespacePrice = exports.getOwnerById = exports.getOwner = exports.canResolveName = exports.getRenewalHeight = exports.getLastTokenId = exports.canRegisterName = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Read-only functions
var readOnlyCalls_1 = require("./readOnlyCalls");
Object.defineProperty(exports, "canRegisterName", { enumerable: true, get: function () { return readOnlyCalls_1.canRegisterName; } });
Object.defineProperty(exports, "getLastTokenId", { enumerable: true, get: function () { return readOnlyCalls_1.getLastTokenId; } });
Object.defineProperty(exports, "getRenewalHeight", { enumerable: true, get: function () { return readOnlyCalls_1.getRenewalHeight; } });
Object.defineProperty(exports, "canResolveName", { enumerable: true, get: function () { return readOnlyCalls_1.canResolveName; } });
Object.defineProperty(exports, "getOwner", { enumerable: true, get: function () { return readOnlyCalls_1.getOwner; } });
Object.defineProperty(exports, "getOwnerById", { enumerable: true, get: function () { return readOnlyCalls_1.getOwnerById; } });
Object.defineProperty(exports, "getNamespacePrice", { enumerable: true, get: function () { return readOnlyCalls_1.getNamespacePrice; } });
Object.defineProperty(exports, "getNamePrice", { enumerable: true, get: function () { return readOnlyCalls_1.getNamePrice; } });
Object.defineProperty(exports, "canNamespaceBeRegistered", { enumerable: true, get: function () { return readOnlyCalls_1.canNamespaceBeRegistered; } });
Object.defineProperty(exports, "getNamespaceProperties", { enumerable: true, get: function () { return readOnlyCalls_1.getNamespaceProperties; } });
Object.defineProperty(exports, "getNameInfo", { enumerable: true, get: function () { return readOnlyCalls_1.getNameInfo; } });
Object.defineProperty(exports, "getBnsFromId", { enumerable: true, get: function () { return readOnlyCalls_1.getBnsFromId; } });
Object.defineProperty(exports, "getPrimaryName", { enumerable: true, get: function () { return readOnlyCalls_1.getPrimaryName; } });
Object.defineProperty(exports, "resolveName", { enumerable: true, get: function () { return readOnlyCalls_1.resolveName; } });
Object.defineProperty(exports, "fetchUserOwnedNames", { enumerable: true, get: function () { return readOnlyCalls_1.fetchUserOwnedNames; } });
Object.defineProperty(exports, "resolveNameZonefile", { enumerable: true, get: function () { return readOnlyCalls_1.resolveNameZonefile; } });
// Contract interaction functions
var contractCalls_1 = require("./contractCalls");
Object.defineProperty(exports, "buildTransferNameTx", { enumerable: true, get: function () { return contractCalls_1.buildTransferNameTx; } });
Object.defineProperty(exports, "buildListInUstxTx", { enumerable: true, get: function () { return contractCalls_1.buildListInUstxTx; } });
Object.defineProperty(exports, "buildUnlistInUstxTx", { enumerable: true, get: function () { return contractCalls_1.buildUnlistInUstxTx; } });
Object.defineProperty(exports, "buildBuyInUstxTx", { enumerable: true, get: function () { return contractCalls_1.buildBuyInUstxTx; } });
Object.defineProperty(exports, "buildSetPrimaryNameTx", { enumerable: true, get: function () { return contractCalls_1.buildSetPrimaryNameTx; } });
Object.defineProperty(exports, "buildFreezeManagerTx", { enumerable: true, get: function () { return contractCalls_1.buildFreezeManagerTx; } });
Object.defineProperty(exports, "buildPreorderNamespaceTx", { enumerable: true, get: function () { return contractCalls_1.buildPreorderNamespaceTx; } });
Object.defineProperty(exports, "buildRevealNamespaceTx", { enumerable: true, get: function () { return contractCalls_1.buildRevealNamespaceTx; } });
Object.defineProperty(exports, "buildLaunchNamespaceTx", { enumerable: true, get: function () { return contractCalls_1.buildLaunchNamespaceTx; } });
Object.defineProperty(exports, "buildTurnOffManagerTransfersTx", { enumerable: true, get: function () { return contractCalls_1.buildTurnOffManagerTransfersTx; } });
Object.defineProperty(exports, "buildImportNameTx", { enumerable: true, get: function () { return contractCalls_1.buildImportNameTx; } });
Object.defineProperty(exports, "buildNamespaceUpdatePriceTx", { enumerable: true, get: function () { return contractCalls_1.buildNamespaceUpdatePriceTx; } });
Object.defineProperty(exports, "buildNamespaceFreezePriceTx", { enumerable: true, get: function () { return contractCalls_1.buildNamespaceFreezePriceTx; } });
Object.defineProperty(exports, "buildNameClaimFastTx", { enumerable: true, get: function () { return contractCalls_1.buildNameClaimFastTx; } });
Object.defineProperty(exports, "buildPreorderNameTx", { enumerable: true, get: function () { return contractCalls_1.buildPreorderNameTx; } });
Object.defineProperty(exports, "buildRegisterNameTx", { enumerable: true, get: function () { return contractCalls_1.buildRegisterNameTx; } });
Object.defineProperty(exports, "buildPreviousRegisterNameTx", { enumerable: true, get: function () { return contractCalls_1.buildPreviousRegisterNameTx; } });
Object.defineProperty(exports, "buildClaimPreorderTx", { enumerable: true, get: function () { return contractCalls_1.buildClaimPreorderTx; } });
Object.defineProperty(exports, "buildRenewNameTx", { enumerable: true, get: function () { return contractCalls_1.buildRenewNameTx; } });
Object.defineProperty(exports, "buildUpdateZonefileTx", { enumerable: true, get: function () { return contractCalls_1.buildUpdateZonefileTx; } });
