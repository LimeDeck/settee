"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const setteeError_1 = require("./setteeError");
/**
 * Storage Error class related couchbase communication.
 */
class StorageError extends setteeError_1.default {
    /**
     * KeyError constructor
     */
    constructor(message, code, document) {
        super(message);
        this.name = 'StorageError';
        this.code = code;
        this.document = document || null;
        this.index = null;
    }
}
exports.default = StorageError;
