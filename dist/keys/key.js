"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
const errors_1 = require("../errors");
/**
 * Abstract class for generating document keys.
 */
class Key {
    /**
     * Key constructor.
     */
    constructor(schemaName, options = {}) {
        if (this.constructor === Key) {
            throw new errors_1.KeyError('Can not construct abstract class `Key`.');
        }
        if (!schemaName) {
            throw new errors_1.KeyError('Schema name is required for key generation.');
        }
        this.id = null;
        this.key = null;
        this.schemaName = schemaName;
        this.options = options;
        this.generate();
    }
    /**
     * Provides id part of the key.
     */
    getId() {
        return this.id;
    }
    /**
     * Sets the id value and builds the key.
     *
     * @param {string} id
     */
    setId(id) {
        this.id = id;
        this.key = utils_1.buildKey(this.schemaName, id);
        return this;
    }
    /**
     * Provides the generated key.
     */
    getKey() {
        return this.key;
    }
    /**
     * Generates a key for the schema.
     *
     * @throws {KeyError}
     */
    generate() {
        throw new errors_1.KeyError('Do not call abstract method generate from child.');
    }
}
exports.default = Key;
