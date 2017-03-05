"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const queryBuilder_1 = require("../services/queryBuilder");
const errors_1 = require("../errors");
class Indexer {
    /**
     * Indexer constructor.
     *
     * @param {Storage} storage
     */
    constructor(storage) {
        /**
         * Map of N1QL indexes to be managed.
         *
         * @type {Map<string, IndexData>}
         */
        this.indexes = new Map();
        this.storage = storage;
    }
    /**
     * Validates and adds indexes to the pool.
     *
     * @param {Schema} schema
     */
    addIndexes(schema) {
        // register the main docType index for convenience
        this.indexes.set('Settee#docType', {
            schemaName: schema.name,
            indexName: 'findByDocType',
            index: { by: 'docType' }
        });
        for (let indexName in schema.indexes) {
            let index = schema.indexes[indexName];
            if (!this.validateIndex(index)) {
                throw new errors_1.SetteeError(`Index '${indexName}' has invalid format.`);
            }
            let schemaName = schema.name;
            let indexKey = `${schemaName}#${indexName}`;
            let indexData = { schemaName, indexName, index };
            this.indexes.set(indexKey, indexData);
        }
    }
    /**
     * Registers indexes.
     *
     * @return {Promise<boolean>}
     */
    registerIndexes() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield Promise.all(Array.from(this.indexes).map(([indexKey, indexData]) => {
                    return this.addN1qlIndex(indexKey, indexData);
                }));
            }
            catch (err) {
                throw new errors_1.SetteeError('Unable to register the indexes.');
            }
            return this.storage.buildDeferredIndexes();
        });
    }
    /**
     * Validates that index has the necessary properties.
     *
     * @param {Index} index
     * @return {boolean}
     */
    validateIndex(index) {
        return index.hasOwnProperty('by')
            && typeof index.by === 'string' || Array.isArray(index.by);
    }
    /**
     * Adds N1QL indexes to the bucket.
     *
     * @param {string} name
     * @param {IndexData} indexData
     * @return {Promise<boolean>}
     */
    addN1qlIndex(name, indexData) {
        return __awaiter(this, void 0, void 0, function* () {
            let indexFields = Array.isArray(indexData.index.by)
                ? indexData.index.by
                : [indexData.index.by];
            return new Promise((resolve, reject) => {
                this.newQuery(indexData.schemaName)
                    .createIndex(name, indexFields)
                    .then((result) => resolve(result))
                    .catch((err) => {
                    if (err.message.includes('already exists')) {
                        return resolve(true);
                    }
                    return reject(err);
                });
            });
        });
    }
    /**
     * Provides a new Query Builder instance.
     *
     * @param {string} schemaName
     * @return {QueryBuilder}
     */
    newQuery(schemaName) {
        return new queryBuilder_1.default(this.storage, schemaName);
    }
}
exports.default = Indexer;
