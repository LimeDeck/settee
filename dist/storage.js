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
const couchbase_1 = require("couchbase");
const errors_1 = require("./errors");
class Storage {
    /**
     * Storage constructor.
     *
     * @param {Bucket} bucket
     */
    constructor(bucket) {
        this.bucket = bucket;
    }
    /**
     * Provides the bucket manager instance.
     *
     * @return {BucketManager}
     */
    getManager() {
        return this.bucket.manager();
    }
    /**
     * Provides a bucket name.
     *
     * @return {string}
     */
    getBucketName() {
        return this.bucket._name;
    }
    /**
     * Disconnects the connection to the bucket.
     */
    disconnect() {
        return this.bucket.disconnect();
    }
    /**
     * Gets the entry by the key.
     *
     * @param key
     * @param options
     * @return {Promise<CbGetResult>}
     */
    get(key, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.bucket.get(key.toString(), options, (err, result) => {
                    this.storageCallback(err, result, resolve, reject);
                });
            });
        });
    }
    /**
     * Gets entries by multiple keys.
     *
     * @param {string[]} keys
     * @param {Object} options
     * @return {Promise<CbMultiGetResult>}
     */
    getMulti(keys, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.bucket.getMulti(keys, options, (err, results) => {
                    /* istanbul ignore next */
                    if (err && typeof err !== 'number') {
                        return reject(new errors_1.StorageError('Unable to get results.', null));
                    }
                    return resolve(results);
                });
            });
        });
    }
    /**
     * Gets and updates the expiration of an entry by key.
     *
     * @param {string} key
     * @param {integer} expiry
     * @param {Object} options
     * @return {Promise<CbGetResult>}
     */
    getAndTouch(key, expiry, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                return this.bucket.getAndTouch(key.toString(), expiry, options, (err, result) => {
                    this.storageCallback(err, result, resolve, reject);
                });
            });
        });
    }
    /**
     * Gets by key and locks the entry.
     *
     * @param {string} key
     * @param {Object} options
     * @return {Promise<CbGetResult>}
     */
    getAndLock(key, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                return this.bucket.getAndLock(key.toString(), options, (err, result) => {
                    this.storageCallback(err, result, resolve, reject);
                });
            });
        });
    }
    /**
     * Inserts a new entry to the database.
     *
     * @param {string} key
     * @param {Object} data
     * @param {Object} options
     * @return {Promise<CbResult>}
     */
    insert(key, data, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                return this.bucket.insert(key.toString(), data, options, (err, result) => {
                    this.storageCallback(err, result, resolve, reject);
                });
            });
        });
    }
    /**
     * Appends a string to a string only entry.
     *
     * @param {string} key
     * @param {string} value
     * @param {Object} options
     * @return {Promise<CbGetResult>}
     */
    append(key, value, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                return this.bucket.append(key.toString(), value, options, (err, result) => {
                    this.storageCallback(err, result, resolve, reject);
                });
            });
        });
    }
    /**
     * Prepends a string to a string only entry.
     *
     * @param {string} key
     * @param {string} value
     * @param {Object} options
     * @return {Promise<CbGetResult>}
     */
    prepend(key, value, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                return this.bucket.prepend(key.toString(), value, options, (err, result) => {
                    this.storageCallback(err, result, resolve, reject);
                });
            });
        });
    }
    /**
     * Adds a number to a number only entry.
     *
     * @param {string} key
     * @param {number} value
     * @param {Object} options
     * @return {Promise<CbGetResult>}
     */
    counter(key, value = 1, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                return this.bucket.counter(key.toString(), value, options, (err, result) => {
                    this.storageCallback(err, result, resolve, reject);
                });
            });
        });
    }
    /**
     * Executes a N1QL or View query and returns a raw result
     *
     * @param {N1qlQuery|ViewQuery} query
     * @param {Object} bindings
     * @return {Promise<any[]>}
     */
    query(query, bindings = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                return this.bucket.query(query, bindings, (err, response) => {
                    if (err) {
                        return reject(new errors_1.StorageError(err.message, err.code));
                    }
                    return resolve(response);
                });
            });
        });
    }
    /**
     * Executes a string N1QL query and returns sanitized results.
     *
     * @param {string} query
     * @param {Object} bindings
     * @param {Object} options
     * @return {Promise<any[]>}
     */
    executeQuery(query, bindings, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                let n1ql = couchbase_1.N1qlQuery.fromString(query);
                if (options.consistency) {
                    n1ql.consistency(options.consistency);
                }
                this.query(n1ql, bindings)
                    .then((results) => {
                    resolve(results.map(result => {
                        return result[this.getBucketName()] || result;
                    }));
                })
                    .catch(err => reject(new errors_1.StorageError(err.message, err.code)));
            });
        });
    }
    /**
     * Removes the entry from the database.
     *
     * @param {string} key
     * @param {Object} options
     * @return {Promise<CbResult>}
     */
    remove(key, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                return this.bucket.remove(key.toString(), options, (err, result) => {
                    this.storageCallback(err, result, resolve, reject);
                });
            });
        });
    }
    /**
     * Replaces the entry by another value.
     *
     * @param {string} key
     * @param {any} value
     * @param {Object} options
     * @return {Promise<CbGetResult>}
     */
    replace(key, value, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                return this.bucket.replace(key.toString(), value, options, (err, result) => {
                    this.storageCallback(err, result, resolve, reject);
                });
            });
        });
    }
    /**
     * Replaces or creates the entry.
     *
     * @param {string} key
     * @param {any} value
     * @param {Object} options
     * @return {Promise<CbGetResult>}
     */
    upsert(key, value, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                return this.bucket.upsert(key.toString(), value, options, (err, result) => {
                    this.storageCallback(err, result, resolve, reject);
                });
            });
        });
    }
    /**
     * Sets the expiration for the entry.
     *
     * @param {string} key
     * @param {number} expiry
     * @param {Object} options
     * @return {Promise<CbGetResult>}
     */
    touch(key, expiry, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                return this.bucket.touch(key.toString(), expiry, options, (err, result) => {
                    this.storageCallback(err, result, resolve, reject);
                });
            });
        });
    }
    /**
     * It unlocks the entry by key with the correct CAS.
     *
     * @param {string} key
     * @param {CAS} cas
     * @param {Object} options
     * @return {Promise<CbGetResult>}
     */
    unlock(key, cas, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                return this.bucket.unlock(key.toString(), cas, options, (err, result) => {
                    /* istanbul ignore if */
                    if (err) {
                        return reject(new errors_1.StorageError(err.message, err.code));
                    }
                    return resolve(true);
                });
            });
        });
    }
    /**
     * Verifies if the key exists in the cluster.
     *
     * @param key
     * @return {Promise<boolean>}
     */
    exists(key) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.insert(key, true, { expiry: 1 })
                    .then(() => resolve(false))
                    .catch((err) => {
                    /* istanbul ignore else */
                    if (err.code === couchbase_1.errors.keyAlreadyExists) {
                        return resolve(true);
                    }
                    /* istanbul ignore next */
                    return reject(new errors_1.StorageError(err.message, err.code));
                });
            });
        });
    }
    /**
     * Creates an index.
     *
     * @param {string} name
     * @param {string[]} indexFields
     * @param {Object} options
     * @return {Promise<boolean>}
     */
    createIndex(name, indexFields, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.getManager().createIndex(name, indexFields, options, (err) => {
                    if (err) {
                        return reject(new errors_1.StorageError(err.message, err.code));
                    }
                    resolve(true);
                });
            });
        });
    }
    /**
     * Drops an index.
     *
     * @param {string} name
     * @param {Object} options
     * @return {Promise<boolean>}
     */
    dropIndex(name, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.getManager().dropIndex(name, options, (err) => {
                    if (err) {
                        return reject(new errors_1.StorageError(err.message, err.code));
                    }
                    resolve(true);
                });
            });
        });
    }
    /**
     * Provides an array of present indexes.
     *
     * @param {Object} options
     * @return {Promise<Array<{}>>}
     */
    getIndexes(options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                let query = 'SELECT `indexes`.* FROM system:indexes';
                let n1ql = couchbase_1.N1qlQuery.fromString(query);
                if (options.consistency) {
                    n1ql.consistency(options.consistency);
                }
                this.query(n1ql, {})
                    .then(results => resolve(results))
                    .catch(err => reject(new errors_1.StorageError(err.message, err.code)));
            });
        });
    }
    /**
     * Builds deferred indexes.
     *
     * @return {Promise<boolean>}
     */
    buildDeferredIndexes() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.getIndexes()
                    .then((indexes) => __awaiter(this, void 0, void 0, function* () {
                    let deferredList = indexes.reduce((carry, index) => {
                        if (['deferred', 'pending'].includes(index.state)) {
                            carry.push('`' + index.name + '`');
                        }
                        return carry;
                    }, []);
                    if (deferredList.length === 0) {
                        resolve(true);
                    }
                    let query = 'BUILD INDEX ON ' +
                        '`' + this.bucket._name + '` ' +
                        '(' + deferredList.join(', ') + ')';
                    yield this.executeQuery(query, {});
                    resolve(true);
                }))
                    .catch(err => reject(new errors_1.StorageError(err.message, err.code)));
            });
        });
    }
    /**
     * General Couchbase callback.
     *
     * @param {CouchbaseError} err
     * @param {CbGetResult} result
     * @param {Promise.resolve} resolve
     * @param {Promise.reject} reject
     * @return {any}
     */
    storageCallback(err, result, resolve, reject) {
        if (err) {
            return reject(new errors_1.StorageError(err.message, err.code));
        }
        return resolve(result);
    }
}
exports.default = Storage;
