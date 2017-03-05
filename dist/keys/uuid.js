"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
const key_1 = require("./key");
/**
 * Uuid class for generating UUID v4 keys.
 */
class Uuid extends key_1.default {
    /**
     * Generates a key for the schema.
     *
     * @throws {KeyError}
     */
    generate() {
        this.setId(uuid_1.v4());
    }
}
exports.default = Uuid;
