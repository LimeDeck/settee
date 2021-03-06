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
const lodash_1 = require("lodash");
class Instance {
    /**
     * Instance constructor.
     *
     * @param {string} key
     * @param {Object} data
     * @param {CAS} cas
     * @param {Model} model
     * @param {Object} options
     */
    constructor(key, data, cas, model, options = {}) {
        this.storage = model.getStorage();
        this.validateData = model.validateData.bind(model);
        this.modelInstance = {
            key,
            cas,
            data,
            id: data.docId,
            type: data.docType,
            dirty: false,
            monitoredProperties: new Set(),
            referencedModels: []
        };
        this.applyData();
        this.applyMethods(options.instanceMethods || {});
    }
    /**
     * Provides instance id.
     *
     * @return {string}
     */
    getId() {
        return this.modelInstance.id;
    }
    /**
     * Provides instance type.
     *
     * @return {string}
     */
    getType() {
        return this.modelInstance.type;
    }
    /**
     * Provides instance key.
     *
     * @return {string}
     */
    getKey() {
        return this.modelInstance.key;
    }
    /**
     * Provides instance cas.
     *
     * @return {CAS}
     */
    getCas() {
        return this.modelInstance.cas;
    }
    /**
     * Provides referenced models of the instance.
     *
     * @return {ReferencedModels}
     */
    getReferencedModels() {
        return this.modelInstance.referencedModels;
    }
    /**
     * Sets the cas for the instance.
     *
     * @param {CAS} cas
     * @return {Instance}
     */
    setCas(cas) {
        this.modelInstance.cas = cas;
        return this;
    }
    /**
     * Checks if the instance has been changed.
     *
     * @return {boolean}
     */
    isDirty() {
        return this.modelInstance.dirty;
    }
    /**
     * Saves the changed instance.
     * @return {Promise<boolean>}
     */
    save() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                try {
                    this.validateData(this.getData());
                }
                catch (err) {
                    return reject(err);
                }
                if (!this.isDirty()) {
                    resolve(true);
                }
                this.storage.replace(this.getKey(), this.getDataForStorage(), { cas: this.getCas() })
                    .then(response => resolve(true))
                    .catch(err => reject(err));
            });
        });
    }
    /**
     * Deletes the instance.
     *
     * @return {Promise<boolean>}
     */
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.storage.remove(this.getKey(), { cas: this.getCas() })
                    .then(() => __awaiter(this, void 0, void 0, function* () {
                    let referencedKeysToDelete = new Set();
                    try {
                        yield Promise.all(this.getReferencedModels()
                            .reduce((carry, referenced) => {
                            let key = `${referenced.model}::${referenced.data.getId()}`;
                            if (!referencedKeysToDelete.has(key)) {
                                referencedKeysToDelete.add(key);
                                carry.push(this.storage.remove(key));
                            }
                            return carry;
                        }, []));
                    }
                    catch (err) {
                        return reject(err);
                    }
                    resolve(true);
                }))
                    .catch(err => reject(err));
            });
        });
    }
    /**
     * Provides the latest data of the instance.
     *
     * @return {Object}
     */
    getData() {
        return this.modelInstance.data;
    }
    /**
     * Provides the latest data of the instance for storing purposes.
     *
     * @return {Object}
     */
    getDataForStorage() {
        let storageData = Object.assign({}, this.modelInstance.data);
        this.modelInstance.referencedModels.forEach(reference => {
            lodash_1.set(storageData, reference.pathToModel, {
                $type: 'reference',
                docType: reference.model,
                docId: reference.data.getId()
            });
        });
        return storageData;
    }
    /**
     * Applies the data to the instance.
     *
     * @return {void}
     */
    applyData() {
        this.findReferences(this.getData());
        for (let name in this.getData()) {
            Object.defineProperty(this, name, {
                enumerable: true,
                configurable: true,
                get() {
                    return this.modelInstance.data[name];
                },
                set(value) {
                    this.modelInstance.dirty = true;
                    this.modelInstance.data[name] = value;
                }
            });
            this.modelInstance.monitoredProperties.add(name);
        }
    }
    /**
     * Finds
     *
     * @return {void}
     */
    findReferences(object, prev = null, currentDepth = 1) {
        Object.keys(object).forEach(key => {
            let value = object[key];
            let isArray = Array.isArray(value);
            let type = Object.prototype.toString.call(value);
            let isObject = (type === '[object Object]' ||
                type === '[object Array]');
            let newKey = prev ? `${prev}.${key}` : key;
            if (isArray) {
                value.forEach(entry => {
                    return this.findReferences(entry, newKey, currentDepth + 1);
                });
            }
            if (!isArray && isObject && Object.keys(value).length) {
                if (value instanceof Instance) {
                    this.modelInstance.referencedModels.push({
                        data: value,
                        model: value.getType(),
                        pathToModel: newKey
                    });
                }
                else {
                    return this.findReferences(value, newKey, currentDepth + 1);
                }
            }
        });
        return true;
    }
    /**
     * Adds methods to the instance.
     *
     * @param {Methods} methods
     * @return {Instance}
     */
    applyMethods(methods) {
        for (let name in methods) {
            this[name] = methods[name].bind(this);
        }
        return this;
    }
}
exports.default = Instance;
