"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Builds up an entry key.
 *
 * @param {string} schemaName
 * @param {string} id
 * @return {string}
 */
function buildKey(schemaName, id) {
    return `${schemaName}::${id}`;
}
exports.buildKey = buildKey;
