"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const setteeError_1 = require("./setteeError");
/**
 * Key Error class related to key management.
 */
class KeyError extends setteeError_1.default {
    /**
     * KeyError constructor
     */
    constructor(message) {
        super(message);
        this.name = 'KeyError';
    }
}
exports.default = KeyError;
