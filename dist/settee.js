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
const consistencies = couchbase_1.N1qlQuery.Consistency;
const errors_1 = require("./errors");
const storage_1 = require("./storage");
const indexer_1 = require("./indexes/indexer");
const model_1 = require("./entities/model");
const schemaContainer_1 = require("./services/schemaContainer");
class Settee {
    /**
     * Settee constructor.
     */
    constructor() {
        this.registeredSchemas = new schemaContainer_1.default();
        this.consistency = {
            NOT_BOUND: consistencies.NOT_BOUND,
            REQUEST_PLUS: consistencies.REQUEST_PLUS,
            STATEMENT_PLUS: consistencies.STATEMENT_PLUS
        };
    }
    /**
     * Sets the active bucket.
     *
     * @param {Bucket} bucket
     */
    useBucket(bucket) {
        if (!this.isValidBucket(bucket)) {
            throw new errors_1.SetteeError('Provided bucket object is not a proper Bucket|MockBucket type.');
        }
        this.bucket = bucket;
        this.storage = new storage_1.default(bucket);
        this.indexer = new indexer_1.default(this.getStorage());
    }
    /**
     * Provides the bucket instance.
     *
     * @return {Bucket}
     */
    getBucket() {
        return this.bucket;
    }
    /**
     * Provides the storage instance.
     *
     * @return {Storage}
     */
    getStorage() {
        return this.storage;
    }
    /**
     * Registers a new schema.
     *
     * @param {Schema} schema
     * @return {Model}
     */
    registerSchema(schema) {
        if (!this.getStorage()) {
            throw new errors_1.SetteeError(`You must call 'settee.useBucket(bucket)' before registering a schema.`);
        }
        schema.useStorage(this.getStorage());
        this.indexer.addIndexes(schema);
        let model = model_1.default.fromSchema(schema);
        this.registeredSchemas.add(schema, model);
        return model;
    }
    /**
     * Builds deferred indexes.
     *
     * @return {Promise<boolean>}
     */
    buildIndexes() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.indexer.registerIndexes();
        });
    }
    /**
     * Terminates the connection to the bucket.
     *
     * @return {Promise<void>}
     */
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.getBucket() && !this.getStorage()) {
                throw new errors_1.SetteeError('Unable to disconnect since you are not connected to a bucket.');
            }
            yield this.getStorage().disconnect();
            this.bucket = null;
            this.storage = null;
            this.registeredSchemas = new schemaContainer_1.default();
        });
    }
    /**
     * Verifies if the bucket is valid.
     *
     * @param {any} bucket
     * @return {boolean}
     */
    isValidBucket(bucket) {
        return bucket.constructor && ['Bucket', 'MockBucket'].includes(bucket.constructor.name);
    }
}
exports.Settee = Settee;
exports.settee = new Settee();