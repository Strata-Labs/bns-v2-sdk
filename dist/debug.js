"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debug = void 0;
let isDebugEnabled = false;
exports.debug = {
    enable: () => {
        isDebugEnabled = true;
    },
    disable: () => {
        isDebugEnabled = false;
    },
    log: (...args) => {
        if (isDebugEnabled) {
            console.log("[BNS-V2-SDK]:", ...args);
        }
    },
    error: (...args) => {
        if (isDebugEnabled) {
            console.error("[BNS-V2-SDK]:", ...args);
        }
    },
};
