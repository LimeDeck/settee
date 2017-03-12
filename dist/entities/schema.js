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
const index_1 = require("../index");
const validator_1 = require("../services/validator");
class Schema {
    /**
     * Schema constructor.
     *
     * @param {string} name
     * @param {Layout} layout
     */
    constructor(name, layout) {
        /**
         * List of registered indexes for the schema.
         *
         * @type {SchemaIndexes}
         */
        this.indexes = {};
        this.validator = new validator_1.default();
        this.name = name;
        // add the default fields to the schema layout
        this.layout = index_1.Type.object(Object.assign(layout, {
            docId: index_1.Type.string(),
            docType: index_1.Type.string()
        }));
        this.validator.checkSchema(this.layout);
    }
    /**
     * Sets the active storage for the schema.
     *
     * @param storage
     */
    useStorage(storage) {
        this.storage = storage;
    }
    /**
     * Provides the active storage.
     *
     * @return {Storage}
     */
    getActiveStorage() {
        return this.storage;
    }
    /**
     * Provides the validator instance.
     *
     * @return {Validator}
     */
    getValidator() {
        return this.validator;
    }
    /**
     * Adds indexes to the list.
     *
     * @param {SchemaIndex} indexes
     * @return {Schema}
     */
    addIndexes(indexes) {
        this.indexes = indexes;
        return this;
    }
    /**
     * Verifies if the index is present in the database.
     *
     * @param {string} name
     * @param {string} type
     * @return {Promise<boolean>}
     */
    seeIndex(name, type = 'gsi') {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                let options = {
                    consistency: index_1.settee.consistency.REQUEST_PLUS
                };
                this.getActiveStorage().getIndexes(options)
                    .then((results) => {
                    results.forEach(index => {
                        /* istanbul ignore else */
                        if (index.name === name && index.using === type) {
                            resolve(true);
                        }
                    });
                    resolve(false);
                })
                    .catch(err => reject(err));
            });
        });
    }
    /**
     * Drops index by name.
     *
     * @param {string} name
     * @param {Object} options
     * @return {Promise<boolean>}
     */
    dropIndex(name, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.getActiveStorage().dropIndex(name, options)
                    .then((result) => resolve(result))
                    .catch(err => reject(err));
            });
        });
    }
}
exports.default = Schema;
