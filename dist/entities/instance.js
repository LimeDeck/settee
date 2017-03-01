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
const errors_1 = require("../errors");
const type_1 = require("./type");
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
            data: Object.assign({}, model.layout),
            id: data.docId,
            type: data.docType,
            dirty: false,
            monitoredProperties: new Set(),
            referencedModels: []
        };
        this.applyData(data);
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
                    this.validateData(this.modelInstance.data);
                }
                catch (err) {
                    return reject(err);
                }
                if (!this.isDirty()) {
                    resolve(true);
                }
                let updatedData = this.modelInstance.data;
                this.storage.replace(this.getKey(), updatedData, { cas: this.getCas() })
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
                    .then((result) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        for (let referenced of this.getReferencedModels()) {
                            let referencedModel = index_1.settee.registeredSchemas.getModel(referenced.model);
                            let id = lodash_1.get(this.getData(), `${referenced.pathToModel}.docId`);
                            /* istanbul ignore else */
                            if (typeof id === 'string') {
                                yield referencedModel.deleteById(id);
                            }
                            else {
                                throw new errors_1.SetteeError('Unable to get the id of the referenced model.');
                            }
                        }
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
     * Applies the data to the instance.
     *
     * @param {Object} data
     * @return {void}
     */
    applyData(data) {
        for (let name in this.getData()) {
            this.modelInstance.data[name] = this.assignData(name, data);
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
     * Assigns data to the model instance.
     *
     * @param {string} path
     * @param {Object} data
     * @return {Object}
     */
    assignData(path, data) {
        let layoutEntry = lodash_1.get(this.modelInstance.data, path);
        let value = lodash_1.get(data, path);
        if (layoutEntry instanceof type_1.default) {
            if (value === undefined) {
                return layoutEntry.getDefaultValue();
            }
            if (layoutEntry.getType() === 'reference') {
                this.modelInstance.referencedModels.push({
                    data: value,
                    model: layoutEntry.getDefaultValue().docType,
                    pathToModel: path
                });
                /* istanbul ignore else */
                if (value instanceof Instance) {
                    return value;
                }
                else {
                    return layoutEntry.getDefaultValue();
                }
            }
            return value;
        }
        /* istanbul ignore else */
        if (typeof layoutEntry === 'object') {
            for (let prop in layoutEntry) {
                let subPath = `${path}.${prop}`;
                layoutEntry[prop] = this.assignData(subPath, data);
            }
        }
        return layoutEntry;
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
