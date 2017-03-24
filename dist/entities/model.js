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
const utils_1 = require("../utils");
const uuid_1 = require("../keys/uuid");
const instance_1 = require("./instance");
const queryBuilder_1 = require("../services/queryBuilder");
const errors_1 = require("../errors");
class Model {
    /**
     * Model constructor.
     *
     * @param {Schema} schema
     * @param {Object} options
     */
    constructor(schema, options = {}) {
        /**
         * List of reserved model methods.
         *
         * @type {Set<string>}
         */
        this.originalMethods = new Set(['addMethods', 'create', 'findRawByKey', 'findById']);
        /**
         * List of reserved instance methods.
         * @type {Set<string>}
         */
        this.originalInstanceMethods = new Set(['save', 'delete']);
        this.name = schema.name;
        this.layout = schema.layout;
        this.storage = schema.getActiveStorage();
        this.validator = schema.getValidator();
        this.options = options;
        this.originalMethods = new Set(['addMethods', 'create', 'findRawByKey', 'findById']);
        // TODO: add more methods
        this.originalInstanceMethods = new Set(['save', 'delete']);
        this.instanceMethods = {};
    }
    /**
     * Creates a new model from schema.
     *
     * @param {Schema} schema
     * @return {Model}
     */
    static fromSchema(schema) {
        return new Model(schema);
    }
    /**
     * Provides the active storage instance.
     *
     * @return {Storage}
     */
    getStorage() {
        return this.storage;
    }
    /**
     * Adds custom methods to the model.
     *
     * @param {Methods} methods
     * @return {Model}
     */
    addMethods(methods) {
        for (let name in methods) {
            this.guardOverwriteOfOriginal(name);
            this[name] = methods[name].bind(this);
        }
        return this;
    }
    /**
     * Adds custom methods to the instance.
     *
     * @param {Methods} methods
     * @return {Model}
     */
    addInstanceMethods(methods) {
        for (let name in methods) {
            this.guardOverwriteOfInstanceOriginal(name);
        }
        this.instanceMethods = methods;
        return this;
    }
    /**
     * Creates a new model instance.
     *
     * @param {Object} data
     * @return {Promise<Instance>}
     */
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                try {
                    data = this.validateData(data);
                }
                catch (err) {
                    return reject(err);
                }
                let uuid = new uuid_1.default(this.name);
                // store docId and docType in database as well
                data.docId = uuid.getId();
                data.docType = this.name;
                let instance = this.buildInstance(uuid.getKey(), data);
                this.storage.insert(instance.getKey(), instance.getDataForStorage())
                    .then(({ cas }) => __awaiter(this, void 0, void 0, function* () {
                    instance.setCas(cas);
                    resolve(instance);
                }))
                    .catch(err => reject(err));
            }));
        });
    }
    /**
     * Creates a new query builder instance.
     *
     * @param {Object} options
     * @return {QueryBuilder}
     */
    query(options = {}) {
        options = Object.assign(options, {
            model: this
        });
        return new queryBuilder_1.default(this.getStorage(), this.name, options);
    }
    /**
     * Shorthand for creating a new QB instance.
     *
     * @param {Object} options
     * @return {QueryBuilder}
     */
    q(options = {}) {
        return this.query(options);
    }
    /**
     * Executes a raw query.
     *
     * @param {string} query
     * @param {Object} params
     * @param {Object} options
     * @return {Promise<Array<{}>>}
     */
    rawQuery(query, params, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.storage.executeQuery(query, params, options)
                    .then((results) => {
                    let entries = [];
                    results.forEach(result => {
                        let key = this.buildKey(result.docId);
                        entries.push(this.buildInstance(key, result));
                    });
                    resolve(entries);
                })
                    .catch(err => reject(err));
            });
        });
    }
    /**
     * Provides a single Couchbase entry by its key.
     *
     * @param {string} key
     * @return {Promise<ModelObject>}
     */
    findRawByKey(key) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.storage.get(key)
                    .then((result) => {
                    resolve({ data: result.value, cas: result.cas });
                })
                    .catch(err => reject(err));
            });
        });
    }
    /**
     * Finds model instance by id.
     *
     * @param {string} id
     * @return {Promise<Instance>}
     */
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            let key = this.buildKey(id);
            return new Promise((resolve, reject) => {
                this.findRawByKey(key)
                    .then(result => {
                    resolve(this.buildInstance(key, result.data, result.cas));
                })
                    .catch(err => reject(err));
            });
        });
    }
    /**
     * Provides multiple Couchbase entries by their keys.
     *
     * @param {string[]} keys
     * @return {Promise<ModelObject[]>}
     */
    findMatchingKeys(keys) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.storage.getMulti(keys)
                    .then(results => {
                    let resources = [];
                    for (let key in results) {
                        /* istanbul ignore else */
                        if (results.hasOwnProperty(key)) {
                            if (results[key].error) {
                                return reject(new errors_1.SetteeError(`Entry '${keys[key]}' is not available.`));
                            }
                            resources.push({
                                key: keys[key],
                                data: results[key].value,
                                cas: results[key].cas
                            });
                        }
                    }
                    resolve(resources);
                })
                    .catch(err => reject(err));
            });
        });
    }
    /**
     * Finds model instances by their ids.
     *
     * @param {string[]} ids
     * @return {Promise<Instance[]>}
     */
    findMatchingIds(ids) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                let keys = ids.map((id) => this.buildKey(id));
                this.findMatchingKeys(keys)
                    .then(resources => {
                    resolve(resources.map(resource => {
                        return this.buildInstance(resource.key, resource.data, resource.cas);
                    }));
                })
                    .catch(err => reject(err));
            });
        });
    }
    /**
     * Deletes a Couchbase entry by id.
     *
     * @param {string} id
     * @return {Promise<boolean>}
     */
    deleteById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            let key = this.buildKey(id);
            return new Promise((resolve, reject) => {
                this.storage.remove(key)
                    .then(result => resolve(true))
                    .catch(err => reject(err));
            });
        });
    }
    /**
     * Checks if the provided data matches the model schema.
     *
     * @param {Object} data
     * @return {boolean}
     */
    validateData(data) {
        return this.validator.checkAgainstSchema(data, this.layout);
    }
    /**
     * Builds the Couchbase key from id.
     *
     * @param {string} id
     * @return {string}
     */
    buildKey(id) {
        return utils_1.buildKey(this.name, id);
    }
    /**
     * Builds a model instance from the data.
     *
     * @param {string} key
     * @param {Object} data
     * @param {CAS} cas
     * @return {Instance}
     */
    buildInstance(key, data, cas = null) {
        return new instance_1.default(key, data, cas, this, {
            instanceMethods: this.instanceMethods
        });
    }
    /**
     * Disallows the overwrite of model methods.
     *
     * @param {string} name
     */
    guardOverwriteOfOriginal(name) {
        if (this.originalMethods.has(name)) {
            throw new errors_1.SetteeError(`Method '${name}' cannot be overwritten.`);
        }
    }
    /**
     * Disallows the overwrite of model instance methods.
     *
     * @param {string} name
     */
    guardOverwriteOfInstanceOriginal(name) {
        if (this.originalInstanceMethods.has(name)) {
            throw new errors_1.SetteeError(`Method '${name}' cannot be overwritten on the model instance.`);
        }
    }
}
exports.default = Model;
